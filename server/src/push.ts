// Push notifications. The phones register an Expo push token; this file decides who gets what, when.
//
//  - Things a child sends are held for a minute so a burst of taps becomes one push.
//  - Answers to a child work the same way; a sent-back item with a note is its own push.
//  - A badge or goal reached goes out straight away.
//  - Nothing is sent during quiet hours: it waits and goes out together in the morning.
//  - A daily reminder goes out at the set time, but only if nothing was done or sent that day.
//  - If something has been waiting for a parent for two hours, one reminder.
import { Router, Response } from 'express';
import { pool } from './db';
import { requireAuth, AuthedRequest } from './auth';

const EXPO_PUSH_URL = process.env.EXPO_PUSH_URL || 'https://exp.host/--/api/v2/push/send';
const BATCH_SECONDS = Number(process.env.PUSH_BATCH_SECONDS ?? 60);
// A child usually has their phone in hand right after a parent approves, so answers go out sooner.
const ANSWER_BATCH_SECONDS = Number(process.env.PUSH_ANSWER_BATCH_SECONDS ?? 15);
const WORKER_MS = Number(process.env.PUSH_WORKER_MS ?? 15000);
const WAITING_HOURS = 2;

export interface NotificationSettings {
  parent: { requests: boolean; goals: boolean; daily: boolean; dailyTime: string };
  family: { answers: boolean; daily: boolean; dailyTime: string };
  quiet: { on: boolean; from: string; until: string };
  /** The parent phone's time zone, used for quiet hours and the daily reminders. */
  tz: string;
}

export const DEFAULT_SETTINGS: NotificationSettings = {
  parent: { requests: true, goals: true, daily: true, dailyTime: '18:00' },
  family: { answers: true, daily: true, dailyTime: '16:30' },
  quiet: { on: true, from: '21:00', until: '07:00' },
  tz: 'America/New_York',
};

const isTime = (v: unknown): v is string => typeof v === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(v);

/** Fills in anything missing and ignores anything that isn't the right shape. */
export function mergeSettings(stored: any, incoming?: any): NotificationSettings {
  const pick = (a: any, b: any, key: string, kind: 'bool' | 'time' | 'tz', fallback: any) => {
    for (const src of [b, a]) {
      const v = src?.[key];
      if (kind === 'bool' && typeof v === 'boolean') return v;
      if (kind === 'time' && isTime(v)) return v;
      if (kind === 'tz' && typeof v === 'string' && v.length < 60) return v;
    }
    return fallback;
  };
  const d = DEFAULT_SETTINGS;
  return {
    parent: {
      requests: pick(stored?.parent, incoming?.parent, 'requests', 'bool', d.parent.requests),
      goals: pick(stored?.parent, incoming?.parent, 'goals', 'bool', d.parent.goals),
      daily: pick(stored?.parent, incoming?.parent, 'daily', 'bool', d.parent.daily),
      dailyTime: pick(stored?.parent, incoming?.parent, 'dailyTime', 'time', d.parent.dailyTime),
    },
    family: {
      answers: pick(stored?.family, incoming?.family, 'answers', 'bool', d.family.answers),
      daily: pick(stored?.family, incoming?.family, 'daily', 'bool', d.family.daily),
      dailyTime: pick(stored?.family, incoming?.family, 'dailyTime', 'time', d.family.dailyTime),
    },
    quiet: {
      on: pick(stored?.quiet, incoming?.quiet, 'on', 'bool', d.quiet.on),
      from: pick(stored?.quiet, incoming?.quiet, 'from', 'time', d.quiet.from),
      until: pick(stored?.quiet, incoming?.quiet, 'until', 'time', d.quiet.until),
    },
    tz: pick(stored, incoming, 'tz', 'tz', d.tz),
  };
}

export async function loadSettings(userId: number): Promise<NotificationSettings> {
  const r = await pool.query('SELECT settings FROM notification_settings WHERE user_id = $1', [userId]);
  return mergeSettings(r.rows[0]?.settings);
}

async function saveSettings(userId: number, settings: NotificationSettings) {
  await pool.query(
    `INSERT INTO notification_settings (user_id, settings, updated_at) VALUES ($1, $2, now())
     ON CONFLICT (user_id) DO UPDATE SET settings = $2, updated_at = now()`,
    [userId, settings]
  );
}

// ---- Time helpers (in the parent's time zone) ----------------------------------------------

export function localParts(date: Date, tz: string): { day: string; minutes: number; hhmm: string } {
  let parts: Record<string, string> = {};
  try {
    const f = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
    parts = Object.fromEntries(f.formatToParts(date).map((p) => [p.type, p.value]));
  } catch {
    return localParts(date, DEFAULT_SETTINGS.tz);
  }
  const hh = Number(parts.hour);
  const mm = Number(parts.minute);
  return { day: `${parts.year}-${parts.month}-${parts.day}`, minutes: hh * 60 + mm, hhmm: `${parts.hour}:${parts.minute}` };
}

const toMinutes = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));

export function inQuietHours(s: NotificationSettings, now = new Date()): boolean {
  if (!s.quiet.on) return false;
  const m = localParts(now, s.tz).minutes;
  const from = toMinutes(s.quiet.from);
  const until = toMinutes(s.quiet.until);
  if (from === until) return false;
  return from < until ? m >= from && m < until : m >= from || m < until;
}

function format12h(hhmm: string): string {
  const h = Number(hhmm.slice(0, 2));
  const m = hhmm.slice(3, 5);
  return `${((h + 11) % 12) + 1}:${m} ${h >= 12 ? 'PM' : 'AM'}`;
}

// ---- Sending ----------------------------------------------------------------------------------

interface PushMessage {
  to: string;
  title?: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default';
  channelId?: string;
}

/** Sends through Expo's push service and forgets any token Expo says is dead. */
export async function sendPush(messages: PushMessage[]): Promise<void> {
  for (let i = 0; i < messages.length; i += 100) {
    const chunk = messages.slice(i, i + 100).map((m) => ({ sound: 'default' as const, channelId: 'default', title: 'Trekker', ...m }));
    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(chunk),
      });
      const json: any = await res.json().catch(() => null);
      const tickets: any[] = Array.isArray(json?.data) ? json.data : [];
      const dead = tickets
        .map((t, idx) => (t?.status === 'error' && t?.details?.error === 'DeviceNotRegistered' ? chunk[idx].to : null))
        .filter((t): t is string => !!t);
      if (dead.length) await pool.query('DELETE FROM push_tokens WHERE token = ANY($1)', [dead]);
    } catch (err) {
      console.error('Push send failed', err);
    }
  }
}

async function parentTokens(userId: number, exceptToken?: string): Promise<string[]> {
  const r = await pool.query('SELECT token FROM push_tokens WHERE user_id = $1 AND device_id IS NULL', [userId]);
  return r.rows.map((x) => x.token as string).filter((t) => t !== exceptToken);
}

async function childTokens(userId: number, childId: string): Promise<string[]> {
  const r = await pool.query(
    `SELECT t.token FROM push_tokens t JOIN family_devices d ON d.id = t.device_id
     WHERE t.user_id = $1 AND t.child_id = $2 AND d.revoked_at IS NULL`,
    [userId, childId]
  );
  return r.rows.map((x) => x.token as string);
}

// ---- Queueing ---------------------------------------------------------------------------------

async function nameOf(userId: number, list: 'expectedItems' | 'gigs' | 'goals', id: string): Promise<string> {
  const r = await pool.query('SELECT data FROM app_data WHERE user_id = $1', [userId]);
  const items = r.rows[0]?.data?.[list];
  return (Array.isArray(items) ? items.find((i: any) => i?.id === id)?.name : undefined) ?? 'something';
}

async function childName(userId: number, childId: string): Promise<string> {
  const r = await pool.query('SELECT data FROM app_data WHERE user_id = $1', [userId]);
  const kids = r.rows[0]?.data?.childProfiles;
  const name = Array.isArray(kids) ? kids.find((c: any) => c?.id === childId)?.name : undefined;
  return typeof name === 'string' && name.trim() ? name.trim().split(/\s+/)[0] : 'Your child';
}

async function enqueue(userId: number, audience: 'parent' | 'child', childId: string | null, kind: string, payload: object, delaySeconds: number) {
  await pool.query(
    `INSERT INTO push_queue (user_id, audience, child_id, kind, payload, send_after)
     VALUES ($1, $2, $3, $4, $5, now() + ($6 || ' seconds')::interval)`,
    [userId, audience, childId, kind, payload, String(delaySeconds)]
  );
}

/** A child sent something: the parent hears about it a minute later, along with anything else that arrives. */
export async function queueRequest(userId: number, childId: string, kind: string, itemId: string, payloadName?: string) {
  try {
    const title =
      kind === 'expected' ? await nameOf(userId, 'expectedItems', itemId)
      : kind === 'gig' ? await nameOf(userId, 'gigs', itemId)
      : kind === 'goal_add' ? payloadName ?? 'a new goal'
      : await nameOf(userId, 'goals', itemId);
    const name = await childName(userId, childId);
    await enqueue(userId, 'parent', childId, 'request', { child: name, childId, title }, BATCH_SECONDS);
  } catch (err) {
    console.error('queueRequest failed', err);
  }
}

/** A parent answered: approved ones are batched, a sent-back one goes by itself with its note. */
export async function queueAnswer(userId: number, sub: { childId: string; kind: string; itemId: string; payload?: any }, decision: 'approved' | 'declined', note?: string | null) {
  try {
    if (decision === 'approved') {
      await enqueue(userId, 'child', sub.childId, 'approved', {}, ANSWER_BATCH_SECONDS);
      return;
    }
    const title =
      sub.kind === 'expected' ? await nameOf(userId, 'expectedItems', sub.itemId)
      : sub.kind === 'gig' ? await nameOf(userId, 'gigs', sub.itemId)
      : sub.kind === 'goal_add' ? sub.payload?.name ?? 'your goal idea'
      : await nameOf(userId, 'goals', sub.itemId);
    await enqueue(userId, 'child', sub.childId, 'sent_back', { title, note: note ?? null }, 0);
  } catch (err) {
    console.error('queueAnswer failed', err);
  }
}

// ---- The worker -------------------------------------------------------------------------------

function requestBody(rows: { payload: any }[]): string {
  const total = rows.length;
  if (total === 1) return `${rows[0].payload.child} sent “${rows[0].payload.title}”. Tap to review.`;
  const names = [...new Set(rows.map((r) => r.payload.child as string))];
  const who = names.length === 1 ? names[0] : names.length === 2 ? `${names[0]} and ${names[1]}` : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
  return `${who} sent ${total} things. Tap to review.`;
}

async function processQueue() {
  const due = await pool.query(
    `SELECT * FROM push_queue WHERE sent_at IS NULL AND send_after <= now() ORDER BY id LIMIT 500`
  );
  if (!due.rowCount) return;
  const byUser = new Map<number, any[]>();
  for (const row of due.rows) byUser.set(row.user_id, [...(byUser.get(row.user_id) ?? []), row]);

  for (const [userId, rows] of byUser) {
    const settings = await loadSettings(userId);
    // Quiet hours: leave them in the queue. They are all due by morning and go out together.
    if (inQuietHours(settings)) continue;
    const messages: PushMessage[] = [];

    const requests = rows.filter((r) => r.kind === 'request');
    if (requests.length && settings.parent.requests) {
      // If everything came from one child, tapping the push also switches to that child.
      const kidIds = [...new Set(requests.map((r) => r.payload.childId as string | undefined).filter(Boolean))];
      const data: Record<string, unknown> = { screen: 'Approvals' };
      if (kidIds.length === 1) data.childId = kidIds[0];
      for (const to of await parentTokens(userId)) {
        messages.push({ to, body: requestBody(requests), data });
      }
    }
    const goalsForParents = rows.filter((r) => r.kind === 'goal_parent');
    if (goalsForParents.length && settings.parent.goals) {
      for (const g of goalsForParents) {
        for (const to of await parentTokens(userId, g.payload.exceptToken)) {
          messages.push({ to, body: `🏆 ${g.payload.child} reached ${g.payload.goal}! Tap to mark it fulfilled.`, data: { screen: 'Approvals' } });
        }
      }
    }
    if (settings.family.answers) {
      const approvedByChild = new Map<string, number>();
      for (const r of rows.filter((r) => r.kind === 'approved')) approvedByChild.set(r.child_id, (approvedByChild.get(r.child_id) ?? 0) + 1);
      for (const [childId, count] of approvedByChild) {
        const body = count === 1 ? '🎉 A parent approved something! Look at your trail.' : `🎉 ${count} approved! Look at your trail.`;
        for (const to of await childTokens(userId, childId)) messages.push({ to, body });
      }
      for (const r of rows.filter((r) => r.kind === 'sent_back')) {
        const body = `Back on your list: ${r.payload.title}.${r.payload.note ? ` “${r.payload.note}”` : ''}`;
        for (const to of await childTokens(userId, r.child_id)) messages.push({ to, body });
      }
      // A goal reached already says it all; its badge just goes on the shelf.
      const goalKids = new Set(rows.filter((r) => r.kind === 'goal_child').map((r) => r.child_id));
      for (const r of rows.filter((r) => r.kind === 'goal_child' || (r.kind === 'badge' && !goalKids.has(r.child_id)))) {
        const body = r.kind === 'badge' ? '🏅 You earned a badge!' : '🏆 You reached your goal!';
        for (const to of await childTokens(userId, r.child_id)) messages.push({ to, body });
      }
    }
    await sendPush(messages);
    await pool.query('UPDATE push_queue SET sent_at = now() WHERE id = ANY($1)', [rows.map((r) => r.id)]);
  }
}

/** Anything done or sent today for this child? A request still waiting for a parent counts. */
async function childHadActivity(userId: number, data: any, childId: string, day: string, tz: string): Promise<boolean> {
  const sameDay = (iso: string) => !!iso && localParts(new Date(iso), tz).day === day;
  if ((data?.expectedCompletions ?? []).some((c: any) => c?.childProfileId === childId && c?.date === day)) return true;
  if ((data?.gigCompletions ?? []).some((c: any) => c?.childProfileId === childId && sameDay(c?.markedDoneAt))) return true;
  const sent = await pool.query('SELECT 1 FROM submissions WHERE user_id = $1 AND child_id = $2 AND day = $3 LIMIT 1', [userId, childId, day]);
  return !!sent.rowCount;
}

function skipToday(data: any, childId: string, day: string): boolean {
  const kid = (data?.childProfiles ?? []).find((c: any) => c?.id === childId);
  if (!kid) return true;
  if ((data?.dailyExcuses ?? []).some((e: any) => e?.childProfileId === childId && e?.date === day)) return true;
  if (typeof kid.birthday === 'string' && kid.birthday.slice(5, 10) === day.slice(5, 10)) return true;
  // Nothing to nudge about without a daily Expected activity.
  return !(data?.expectedItems ?? []).some((i: any) => i?.childProfileId === childId && i?.active !== false && i?.frequency === 'daily');
}

async function processDailyReminders() {
  const users = await pool.query(`SELECT user_id, settings FROM notification_settings`);
  for (const u of users.rows) {
    const userId = u.user_id as number;
    const settings = mergeSettings(u.settings);
    const now = new Date();
    const { day, minutes } = localParts(now, settings.tz);
    const state = (await pool.query('SELECT * FROM push_state WHERE user_id = $1', [userId])).rows[0];
    const lastParent = state?.last_daily_parent as string | undefined;
    const lastChild: Record<string, string> = state?.last_daily_child ?? {};
    const dataRow = await pool.query('SELECT data FROM app_data WHERE user_id = $1', [userId]);
    const data = dataRow.rows[0]?.data;
    if (!data) continue;
    const quiet = inQuietHours(settings, now);
    const messages: PushMessage[] = [];
    let nextChild = { ...lastChild };
    let nextParent = lastParent;

    // Parent: at the set time (and for up to 3 hours after, in case the server was restarting).
    const parentAt = toMinutes(settings.parent.dailyTime);
    if (settings.parent.daily && lastParent !== day && minutes >= parentAt && minutes < parentAt + 180) {
      nextParent = day;
      if (!quiet) {
        const quietKids: string[] = [];
        for (const kid of data.childProfiles ?? []) {
          if (skipToday(data, kid.id, day)) continue;
          if (!(await childHadActivity(userId, data, kid.id, day, settings.tz))) quietKids.push(String(kid.name).trim().split(/\s+/)[0]);
        }
        if (quietKids.length) {
          const who = quietKids.length === 1 ? quietKids[0] : quietKids.length === 2 ? `${quietKids[0]} and ${quietKids[1]}` : `${quietKids.slice(0, -1).join(', ')} and ${quietKids[quietKids.length - 1]}`;
          const body = `Nothing checked off for ${who} today. A quick nudge?`;
          for (const to of await parentTokens(userId)) messages.push({ to, body });
        }
      }
    }

    // Each child's family device: at the family reminder time.
    const childAt = toMinutes(settings.family.dailyTime);
    if (settings.family.daily && minutes >= childAt && minutes < childAt + 180) {
      const kids = await pool.query(`SELECT DISTINCT child_id FROM push_tokens WHERE user_id = $1 AND device_id IS NOT NULL AND child_id IS NOT NULL`, [userId]);
      for (const k of kids.rows) {
        const childId = k.child_id as string;
        if (lastChild[childId] === day) continue;
        nextChild[childId] = day;
        if (quiet || skipToday(data, childId, day)) continue;
        if (await childHadActivity(userId, data, childId, day, settings.tz)) continue;
        for (const to of await childTokens(userId, childId)) {
          messages.push({ to, body: 'Your trail is waiting! 🌟 Ready to check off your day?' });
        }
      }
    }

    if (messages.length) await sendPush(messages);
    if (nextParent !== lastParent || JSON.stringify(nextChild) !== JSON.stringify(lastChild)) {
      await pool.query(
        `INSERT INTO push_state (user_id, last_daily_parent, last_daily_child) VALUES ($1, $2, $3)
         ON CONFLICT (user_id) DO UPDATE SET last_daily_parent = $2, last_daily_child = $3`,
        [userId, nextParent ?? null, nextChild]
      );
    }
  }
}

/** Something has been waiting for a parent for two hours: one reminder, then not again for another two. */
async function processWaitingReminders() {
  const waiting = await pool.query(
    `SELECT user_id, count(*)::int AS n, min(submitted_at) AS since
       FROM submissions WHERE status = 'pending' GROUP BY user_id
      HAVING min(submitted_at) < now() - ($1 || ' hours')::interval`,
    [String(WAITING_HOURS)]
  );
  for (const w of waiting.rows) {
    const userId = w.user_id as number;
    const settings = await loadSettings(userId);
    if (!settings.parent.requests || inQuietHours(settings)) continue;
    const state = (await pool.query('SELECT last_waiting_at FROM push_state WHERE user_id = $1', [userId])).rows[0];
    if (state?.last_waiting_at && Date.now() - new Date(state.last_waiting_at).getTime() < WAITING_HOURS * 3600 * 1000) continue;
    const since = format12h(localParts(new Date(w.since), settings.tz).hhmm);
    const body = w.n === 1 ? `1 thing has been waiting since ${since}.` : `${w.n} things have been waiting since ${since}.`;
    await sendPush((await parentTokens(userId)).map((to) => ({ to, body, data: { screen: 'Approvals' } })));
    await pool.query(
      `INSERT INTO push_state (user_id, last_waiting_at) VALUES ($1, now())
       ON CONFLICT (user_id) DO UPDATE SET last_waiting_at = now()`,
      [userId]
    );
  }
}

let started = false;
export function startPushWorker() {
  if (started) return;
  started = true;
  const run = async () => {
    try {
      await processQueue();
      await processDailyReminders();
      await processWaitingReminders();
    } catch (err) {
      console.error('Push worker failed', err);
    }
  };
  setInterval(run, WORKER_MS);
}

/** Exposed for tests. */
export const __test = { processQueue, processDailyReminders, processWaitingReminders };

// ---- Routes (a parent's phone) -------------------------------------------------------------

export const pushRouter = Router();

pushRouter.put('/push/token', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const { token, platform, tz } = req.body ?? {};
    if (typeof token !== 'string' || !/^(Expo|Exponent)PushToken\[.+\]$/.test(token)) {
      res.status(400).json({ error: 'That is not a push token' });
      return;
    }
    await upsertToken(req.userId!, token, null, null, typeof platform === 'string' ? platform : null);
    if (typeof tz === 'string') {
      const current = await loadSettings(req.userId!);
      await saveSettings(req.userId!, { ...current, tz });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('PUT /push/token failed', err);
    res.status(500).json({ error: 'Could not save the token' });
  }
});

pushRouter.get('/notification-settings', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    res.json({ settings: await loadSettings(req.userId!) });
  } catch (err) {
    console.error('GET /notification-settings failed', err);
    res.status(500).json({ error: 'Could not load settings' });
  }
});

pushRouter.put('/notification-settings', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const current = await loadSettings(req.userId!);
    const merged = mergeSettings(current, req.body?.settings);
    await saveSettings(req.userId!, merged);
    res.json({ settings: merged });
  } catch (err) {
    console.error('PUT /notification-settings failed', err);
    res.status(500).json({ error: 'Could not save settings' });
  }
});

pushRouter.post('/push/test', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const tokens = await parentTokens(req.userId!);
    await sendPush(tokens.map((to) => ({ to, body: 'This is a test from Trekker. Notifications are working. 🎉' })));
    res.json({ sent: tokens.length });
  } catch (err) {
    console.error('POST /push/test failed', err);
    res.status(500).json({ error: 'Could not send a test' });
  }
});

/** A parent's phone says a child earned a badge or reached a goal (it is the one that works that out). */
pushRouter.post('/push/event', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const { kind, childId, goal, exceptToken } = req.body ?? {};
    if ((kind !== 'badge' && kind !== 'goal') || typeof childId !== 'string') {
      res.status(400).json({ error: 'Unknown event' });
      return;
    }
    await enqueue(req.userId!, 'child', childId, kind === 'badge' ? 'badge' : 'goal_child', {}, 0);
    if (kind === 'goal' && typeof goal === 'string') {
      await enqueue(req.userId!, 'parent', childId, 'goal_parent', { child: await childName(req.userId!, childId), goal, exceptToken: typeof exceptToken === 'string' ? exceptToken : null }, 0);
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('POST /push/event failed', err);
    res.status(500).json({ error: 'Could not record that' });
  }
});

export async function upsertToken(userId: number, token: string, deviceId: number | null, childId: string | null, platform: string | null) {
  await pool.query(
    `INSERT INTO push_tokens (token, user_id, device_id, child_id, platform, updated_at) VALUES ($1, $2, $3, $4, $5, now())
     ON CONFLICT (token) DO UPDATE SET user_id = $2, device_id = $3, child_id = $4, platform = $5, updated_at = now()`,
    [token, userId, deviceId, childId, platform]
  );
}
