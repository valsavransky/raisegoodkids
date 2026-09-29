// A small private page for you (not the families) showing adoption from the
// anonymous events the app sends (see events.ts). Open
//   https://<your-server>/admin?key=<ADMIN_KEY>
// where ADMIN_KEY is a long random value you set as an environment variable
// on the server. With no ADMIN_KEY set, the page doesn't exist. Everything is
// counted per install (one app install ≈ one family) and dates are UTC.
import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { pool } from './db';

export const adminRouter = Router();

function keyMatches(provided: unknown, expected: string): boolean {
  if (typeof provided !== 'string') return false;
  const a = crypto.createHash('sha256').update(provided).digest();
  const b = crypto.createHash('sha256').update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

function esc(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}

const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 100) : 0);

// Friendly names for the events the app sends; anything else shows as-is.
const EVENT_LABELS: Record<string, string> = {
  app_opened: 'Opened the app',
  onboarding_step: 'Viewed a setup screen',
  signed_in: 'Signed in / signed up',
  setup_completed: 'Finished setup',
  expected_checked: 'Checked off an Expected activity',
  gig_completed: 'Completed a gig',
  goal_added: 'Added a goal',
  goal_achieved: 'Reached a goal',
  badge_earned: 'Earned a badge',
  week_view_opened: 'Opened This Week',
  reminder_enabled: 'Turned on the daily reminder',
  reminder_disabled: 'Turned off the daily reminder',
  future_fund_set: 'Set the Future Fund',
  calendar_imported: 'Imported calendar events',
  reset_all_data: 'Used Reset all data',
};

interface FunnelStep {
  label: string;
  where: string;
}

const FUNNEL: FunnelStep[] = [
  { label: 'Opened the app', where: `name = 'app_opened'` },
  { label: 'Saw the sign-in screen', where: `name = 'onboarding_step' AND props->>'step' = 'sign_in'` },
  { label: 'Signed in / signed up', where: `name = 'signed_in'` },
  { label: 'Reached Add a child', where: `name = 'onboarding_step' AND props->>'step' = 'child_profile'` },
  { label: 'Reached Expected setup', where: `name = 'onboarding_step' AND props->>'step' = 'expected'` },
  { label: 'Reached Gigs setup', where: `name = 'onboarding_step' AND props->>'step' = 'gigs'` },
  { label: 'Finished setup', where: `name = 'setup_completed'` },
  { label: 'Checked off an activity', where: `name = 'expected_checked'` },
  { label: 'Completed a gig', where: `name = 'gig_completed'` },
  { label: 'Added a goal', where: `name = 'goal_added'` },
];

async function breakdown(eventName: string, prop: string): Promise<{ key: string; installs: number }[]> {
  const r = await pool.query(
    `SELECT COALESCE(props->>$2, '(none)') AS key, COUNT(DISTINCT install_id)::int AS installs
     FROM events WHERE name = $1 GROUP BY 1 ORDER BY 2 DESC LIMIT 12`,
    [eventName, prop]
  );
  return r.rows;
}

adminRouter.get('/', async (req: Request, res: Response) => {
  const expected = process.env.ADMIN_KEY;
  if (!expected) {
    res.status(404).send('Not found');
    return;
  }
  if (!keyMatches(req.query.key, expected)) {
    res.status(401).send('Unauthorized');
    return;
  }
  try {
    const [totals, dau, funnel, retention, features, recent, methods, grades, fundPct] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(DISTINCT install_id)::int AS installs,
          COUNT(DISTINCT install_id) FILTER (WHERE name = 'app_opened' AND received_at > now() - interval '1 day')::int AS active_1d,
          COUNT(DISTINCT install_id) FILTER (WHERE name = 'app_opened' AND received_at > now() - interval '7 days')::int AS active_7d,
          COUNT(DISTINCT install_id) FILTER (WHERE name = 'app_opened' AND received_at > now() - interval '30 days')::int AS active_30d,
          COUNT(DISTINCT install_id) FILTER (WHERE name = 'setup_completed')::int AS set_up,
          COUNT(*)::int AS total_events,
          MAX(received_at) AS last_event
        FROM events`),
      pool.query(`
        SELECT to_char(d, 'Mon DD') AS label, COALESCE(c.n, 0)::int AS n
        FROM generate_series((now() AT TIME ZONE 'UTC')::date - 13, (now() AT TIME ZONE 'UTC')::date, interval '1 day') AS d
        LEFT JOIN (
          SELECT (received_at AT TIME ZONE 'UTC')::date AS day, COUNT(DISTINCT install_id) AS n
          FROM events WHERE name = 'app_opened' GROUP BY 1
        ) c ON c.day = d::date
        ORDER BY d`),
      pool.query(
        `SELECT ${FUNNEL.map((s, i) => `COUNT(DISTINCT install_id) FILTER (WHERE ${s.where})::int AS s${i}`).join(', ')} FROM events`
      ),
      pool.query(`
        WITH days AS (
          SELECT DISTINCT install_id, (received_at AT TIME ZONE 'UTC')::date AS d FROM events WHERE name = 'app_opened'
        ), firsts AS (SELECT install_id, MIN(d) AS d0 FROM days GROUP BY 1),
        today AS (SELECT (now() AT TIME ZONE 'UTC')::date AS t)
        SELECT
          COUNT(*) FILTER (WHERE f.d0 <= t.t - 1)::int AS d1_base,
          COUNT(*) FILTER (WHERE f.d0 <= t.t - 1 AND EXISTS (SELECT 1 FROM days x WHERE x.install_id = f.install_id AND x.d = f.d0 + 1))::int AS d1_ret,
          COUNT(*) FILTER (WHERE f.d0 <= t.t - 7)::int AS d7_base,
          COUNT(*) FILTER (WHERE f.d0 <= t.t - 7 AND EXISTS (SELECT 1 FROM days x WHERE x.install_id = f.install_id AND x.d = f.d0 + 7))::int AS d7_ret,
          COUNT(*) FILTER (WHERE f.d0 <= t.t - 30)::int AS d30_base,
          COUNT(*) FILTER (WHERE f.d0 <= t.t - 30 AND EXISTS (SELECT 1 FROM days x WHERE x.install_id = f.install_id AND x.d = f.d0 + 30))::int AS d30_ret
        FROM firsts f, today t`),
      pool.query(`
        SELECT name, COUNT(*)::int AS events, COUNT(DISTINCT install_id)::int AS installs
        FROM events GROUP BY name ORDER BY installs DESC, events DESC`),
      pool.query(`
        SELECT name, props, LEFT(install_id, 6) AS who, to_char(received_at AT TIME ZONE 'UTC', 'Mon DD HH24:MI') AS at
        FROM events ORDER BY id DESC LIMIT 40`),
      breakdown('signed_in', 'method'),
      breakdown('setup_completed', 'grade'),
      breakdown('future_fund_set', 'percent'),
    ]);

    const t = totals.rows[0];
    const f = funnel.rows[0];
    const r = retention.rows[0];
    const dauMax = Math.max(1, ...dau.rows.map((x) => x.n));
    const funnelTop = Math.max(1, f.s0);

    const tile = (label: string, value: string | number, note = '') =>
      `<div class="tile"><div class="tv">${esc(value)}</div><div class="tl">${esc(label)}</div>${note ? `<div class="tn">${esc(note)}</div>` : ''}</div>`;

    const retentionCell = (label: string, ret: number, base: number) =>
      `<div class="tile">${
        base > 0
          ? `<div class="tv">${pct(ret, base)}%</div><div class="tl">${esc(label)}</div><div class="tn">${ret} of ${base} installs</div>`
          : `<div class="tv">–</div><div class="tl">${esc(label)}</div><div class="tn">not enough history yet</div>`
      }</div>`;

    const table = (rows: { key: string; installs: number }[]) =>
      rows.length === 0
        ? '<p class="muted">No data yet.</p>'
        : `<table>${rows.map((x) => `<tr><td>${esc(x.key)}</td><td class="num">${x.installs}</td></tr>`).join('')}</table>`;

    const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Adoption</title>
<style>
:root{--bg:#F6F7F9;--card:#fff;--fg:#1C1E21;--mu:#5F6672;--line:#DDE1E6;--acc:#0F9B8E;--soft:#E4F7F5}
@media (prefers-color-scheme:dark){:root{--bg:#14171A;--card:#1C2024;--fg:#ECEFF1;--mu:#A0A8B1;--line:#2B3036;--acc:#3FCDB8;--soft:#123B34;color-scheme:dark}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:14px/1.5 system-ui,-apple-system,sans-serif;padding:24px 16px 64px}
.page{max-width:960px;margin:0 auto}h1{font-size:24px;margin:0 0 4px}h2{font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:var(--mu);margin:32px 0 10px}
.muted{color:var(--mu);font-size:13px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px}
.tile{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:14px}.tv{font-size:26px;font-weight:800;font-variant-numeric:tabular-nums}.tl{color:var(--mu);font-size:12.5px}.tn{color:var(--mu);font-size:11.5px;margin-top:2px}
.panel{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:14px}
.row{display:grid;grid-template-columns:minmax(120px,220px) 1fr 90px;gap:10px;align-items:center;padding:5px 0}.bar{height:14px;background:var(--soft);border-radius:7px;overflow:hidden}.bar i{display:block;height:100%;background:var(--acc);border-radius:7px}.num{text-align:right;font-variant-numeric:tabular-nums}
.cols{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px}
table{width:100%;border-collapse:collapse}td,th{padding:6px 4px;border-bottom:1px solid var(--line);text-align:left;font-size:13px;vertical-align:top}th{color:var(--mu);font-weight:600}td.num,th.num{text-align:right}
.spark{display:flex;align-items:flex-end;gap:4px;height:110px}.spark div{flex:1;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;height:100%;font-size:10px;color:var(--mu)}.spark i{display:block;width:100%;background:var(--acc);border-radius:4px 4px 0 0;min-height:2px}
.scroll{overflow-x:auto}code{font-size:12px}
</style></head><body><div class="page">
<h1>Adoption</h1><p class="muted">Each install counts once (about one family). Dates are UTC. Includes your own test installs. Last event: ${esc(t.last_event ? new Date(t.last_event).toISOString().replace('T', ' ').slice(0, 16) + ' UTC' : 'none yet')}.</p>

<h2>Right now</h2><div class="grid">
${tile('Installs seen', t.installs)}${tile('Finished setup', t.set_up, t.installs ? `${pct(t.set_up, t.installs)}% of installs` : '')}
${tile('Active today', t.active_1d, 'last 24 hours')}${tile('Active this week', t.active_7d, 'last 7 days')}${tile('Active this month', t.active_30d, 'last 30 days')}${tile('Events', t.total_events)}
</div>

<h2>Active installs per day (last 14 days)</h2><div class="panel"><div class="spark">${dau.rows
      .map((x) => `<div title="${esc(x.label)}: ${x.n}"><span>${x.n || ''}</span><i style="height:${Math.round((x.n / dauMax) * 80)}px"></i></div>`)
      .join('')}</div><div class="muted" style="margin-top:6px">${esc(dau.rows[0]?.label ?? '')} → ${esc(dau.rows[dau.rows.length - 1]?.label ?? '')}</div></div>

<h2>Setup and first-use funnel</h2><div class="panel">${FUNNEL.map((s, i) => {
      const n = f[`s${i}`] as number;
      return `<div class="row"><div>${esc(s.label)}</div><div class="bar"><i style="width:${pct(n, funnelTop)}%"></i></div><div class="num">${n} · ${pct(n, funnelTop)}%</div></div>`;
    }).join('')}<p class="muted" style="margin:8px 0 0">Percent of installs that opened the app. Steps aren't strictly ordered: someone can skip ahead.</p></div>

<h2>Coming back</h2><div class="grid">
${retentionCell('Day 1 return', r.d1_ret, r.d1_base)}${retentionCell('Day 7 return', r.d7_ret, r.d7_base)}${retentionCell('Day 30 return', r.d30_ret, r.d30_base)}
</div><p class="muted">Share of installs that opened the app exactly 1, 7 or 30 days after their first day.</p>

<h2>What gets used</h2><div class="panel scroll"><table><tr><th>Event</th><th class="num">Installs</th><th class="num">% of installs</th><th class="num">Times</th></tr>${features.rows
      .map((x) => `<tr><td>${esc(EVENT_LABELS[x.name] ?? x.name)}</td><td class="num">${x.installs}</td><td class="num">${pct(x.installs, t.installs)}%</td><td class="num">${x.events}</td></tr>`)
      .join('')}</table></div>

<h2>Breakdowns</h2><div class="cols">
<div class="panel"><strong>How they signed in</strong>${table(methods)}</div>
<div class="panel"><strong>Grade</strong>${table(grades)}</div>
<div class="panel"><strong>Future Fund %</strong>${table(fundPct)}</div>
</div>

<h2>Latest events</h2><div class="panel scroll"><table><tr><th>When (UTC)</th><th>Install</th><th>Event</th><th>Details</th></tr>${recent.rows
      .map((x) => `<tr><td>${esc(x.at)}</td><td><code>${esc(x.who)}</code></td><td>${esc(x.name)}</td><td class="muted">${esc(Object.entries(x.props ?? {}).map(([k, v]) => `${k}=${v}`).join(' '))}</td></tr>`)
      .join('')}</table></div>
</div></body></html>`;
    res.set('Cache-Control', 'no-store').type('html').send(html);
  } catch (err) {
    console.error('GET /admin failed', err);
    res.status(500).send('Could not load the dashboard');
  }
});
