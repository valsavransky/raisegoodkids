// Starts a fake Expo push endpoint, then checks batching, answers, quiet hours and daily reminders against a
// locally running server started with:
//   EXPO_PUSH_URL=http://localhost:4555 PUSH_BATCH_SECONDS=2 PUSH_WORKER_MS=1000 ... npx tsx src/index.ts
import http from 'node:http';
const B = process.env.BASE ?? 'http://localhost:3999';
const sent = [];
http
  .createServer((req, res) => {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      const msgs = JSON.parse(body);
      msgs.forEach((m) => sent.push(m));
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ data: msgs.map(() => ({ status: 'ok' })) }));
    });
  })
  .listen(4555);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const j = async (path, method, token, body) => {
  const r = await fetch(B + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  return r.json().catch(() => ({}));
};
let failures = 0;
const check = (name, ok, extra = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name} ${ok ? '' : extra}`);
  if (!ok) failures++;
};
const bodies = (to) => sent.filter((m) => m.to === to).map((m) => m.body);

const email = `push${Date.now()}@t.io`;
const { token: T } = await j('/auth/signup', 'POST', null, { email, password: 'password123' });
const day = new Date().toISOString().slice(0, 10);
await j('/data', 'PUT', T, {
  data: {
    childProfile: { id: 'c1' },
    childProfiles: [{ id: 'c1', name: 'Rayna', birthday: '2015-01-01' }, { id: 'c2', name: 'Simi', birthday: '2016-01-01' }],
    expectedItems: ['a', 'b', 'c'].map((x) => ({ id: x, childProfileId: 'c1', name: `Task ${x}`, frequency: 'daily', active: true })).concat([{ id: 'z', childProfileId: 'c2', name: 'Simi task', frequency: 'daily', active: true }]),
    gigs: [], goals: [], expectedCompletions: [], gigCompletions: [], dailyExcuses: [],
  },
});
const PT = 'ExponentPushToken[parent]';
const CT = 'ExponentPushToken[child1]';
const C2 = 'ExponentPushToken[child2]';
await j('/push/token', 'PUT', T, { token: PT, platform: 'android', tz: 'UTC' });
// The default quiet hours (9 PM to 7 AM) would hold everything if the test happens to run at night.
await j('/notification-settings', 'PUT', T, { settings: { quiet: { on: false } } });
const mk = async (name, childId, tok) => {
  const code = (await j('/family/codes', 'POST', T)).code;
  const dev = await j('/family/pair', 'POST', null, { code, deviceName: name });
  await j('/child/push-token', 'PUT', dev.token, { token: tok, platform: 'ios', childId });
  return dev.token;
};
const D1 = await mk('d1', 'c1', CT);
const D2 = await mk('d2', 'c2', C2);
// A device must not be able to push to the parent's token route
check('device cannot register as a parent', (await fetch(B + '/push/token', { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${D1}` }, body: JSON.stringify({ token: 'ExponentPushToken[x]' }) })).status === 403);

// 1. Batching: three taps become one push
for (const x of ['a', 'b', 'c']) await j('/child/submissions', 'POST', D1, { id: `s-${x}-${Date.now()}`, childId: 'c1', kind: 'expected', itemId: x, day });
await sleep(4500);
const p1 = bodies(PT);
check('three taps -> one push to the parent', p1.length === 1 && /Rayna sent 3 things/.test(p1[0]), JSON.stringify(p1));

// 2. Answers: approve two, send one back with a note
const subs = (await j('/family/submissions', 'GET', T)).submissions;
await j(`/family/submissions/${subs[0].id}/decide`, 'POST', T, { decision: 'approved' });
await j(`/family/submissions/${subs[1].id}/decide`, 'POST', T, { decision: 'approved' });
await j(`/family/submissions/${subs[2].id}/decide`, 'POST', T, { decision: 'declined', note: 'Not done yet' });
await sleep(4500);
const c1 = bodies(CT);
check('two approvals -> one "2 approved" push to the child', c1.some((b) => /2 approved/.test(b)), JSON.stringify(c1));
check('sent back item -> its own push with the note', c1.some((b) => /Back on your list: Task .*“Not done yet”/.test(b)), JSON.stringify(c1));
check('the other child gets nothing', bodies(C2).length === 0, JSON.stringify(bodies(C2)));

// 3. Quiet hours hold everything until they end
await j('/notification-settings', 'PUT', T, { settings: { quiet: { on: true, from: '00:00', until: '23:59' } } });
const before = sent.length;
await j('/child/submissions', 'POST', D1, { id: `q-${Date.now()}`, childId: 'c1', kind: 'expected', itemId: 'a', day: '2099-01-01' });
await sleep(4000);
check('nothing is sent during quiet hours', sent.length === before, JSON.stringify(sent.slice(before)));
await j('/notification-settings', 'PUT', T, { settings: { quiet: { on: false } } });
await sleep(3000);
check('held push goes out when quiet hours end', sent.length === before + 1 && /Rayna sent/.test(sent[before].body), JSON.stringify(sent.slice(before)));

// 4. Daily reminders: a set time a minute ago, nobody has done anything today
const hhmm = (offsetMin) => {
  const d = new Date(Date.now() + offsetMin * 60000);
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
};
const before2 = sent.length;
await j('/notification-settings', 'PUT', T, { settings: { parent: { dailyTime: hhmm(-1) }, family: { dailyTime: hhmm(-1) } } });
await sleep(3500);
const daily = sent.slice(before2).map((m) => `${m.to.slice(-8)}:${m.body}`);
check('parent reminder names only quiet children (Simi, who sent nothing)', sent.slice(before2).some((m) => m.to === PT && /Nothing checked off for Simi today/.test(m.body)), JSON.stringify(daily));
check('the child with activity gets no reminder', !sent.slice(before2).some((m) => m.to === CT && /trail is waiting/.test(m.body)), JSON.stringify(daily));
check('the quiet child does get a reminder on their device', sent.slice(before2).some((m) => m.to === C2 && /trail is waiting/.test(m.body)), JSON.stringify(daily));
await sleep(3000);
check('reminders are sent once a day', sent.slice(before2).filter((m) => m.to === PT && /Nothing checked off/.test(m.body)).length === 1);

// 5. Goal reached goes to the child
const before3 = sent.length;
await j('/push/event', 'POST', T, { kind: 'goal', childId: 'c1', goal: 'Lego', exceptToken: PT });
await sleep(3000);
check('goal reached -> push to the child, not back to the sending phone', sent.slice(before3).some((m) => m.to === CT && /reached your goal/.test(m.body)) && !sent.slice(before3).some((m) => m.to === PT), JSON.stringify(sent.slice(before3)));

console.log(failures ? `\n${failures} failed` : '\nAll passed');
process.exit(failures ? 1 : 0);
