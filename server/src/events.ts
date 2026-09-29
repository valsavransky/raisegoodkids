// Anonymous usage events for the adoption dashboard (see admin.ts). The app
// batches events and posts them here; only an app-generated random install id
// is stored — no user id, email, name, or free text. Requires the normal app
// session token purely so random strangers can't spam the table.
import { Router, Response } from 'express';
import { pool } from './db';
import { requireAuth, AuthedRequest } from './auth';

export const eventsRouter = Router();

const NAME_PATTERN = /^[a-z0-9_]{1,64}$/;
const MAX_BATCH = 100;
const MAX_PROPS = 12;

/** Keeps only short primitive values, so props can't carry anything freeform. */
function cleanProps(raw: unknown): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [key, value] of Object.entries(raw as Record<string, unknown>).slice(0, MAX_PROPS)) {
    if (!/^[a-z0-9_]{1,40}$/.test(key)) continue;
    if (typeof value === 'string') out[key] = value.slice(0, 60);
    else if (typeof value === 'number' && Number.isFinite(value)) out[key] = value;
    else if (typeof value === 'boolean') out[key] = value;
  }
  return out;
}

eventsRouter.post('/', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const { installId, appVersion, platform, events } = req.body ?? {};
    if (typeof installId !== 'string' || !/^[a-z0-9-]{8,64}$/.test(installId) || !Array.isArray(events)) {
      res.status(400).json({ error: 'Bad request' });
      return;
    }
    const names: string[] = [];
    const props: string[] = [];
    const times: string[] = [];
    for (const event of events.slice(0, MAX_BATCH)) {
      if (!event || typeof event.name !== 'string' || !NAME_PATTERN.test(event.name)) continue;
      const ts = new Date(event.ts);
      names.push(event.name);
      props.push(JSON.stringify(cleanProps(event.props)));
      // A phone with a wrong clock shouldn't be able to fake the future.
      times.push((Number.isNaN(ts.getTime()) || ts.getTime() > Date.now() + 60_000 ? new Date() : ts).toISOString());
    }
    if (names.length > 0) {
      await pool.query(
        `INSERT INTO events (install_id, name, props, client_ts, app_version, platform)
         SELECT $1, x.n, x.p::jsonb, x.t, $5, $6
         FROM unnest($2::text[], $3::text[], $4::timestamptz[]) AS x(n, p, t)`,
        [
          installId,
          names,
          props,
          times,
          typeof appVersion === 'string' ? appVersion.slice(0, 20) : null,
          typeof platform === 'string' ? platform.slice(0, 20) : null,
        ]
      );
    }
    res.json({ ok: true, accepted: names.length });
  } catch (err) {
    console.error('POST /events failed', err);
    res.status(500).json({ error: 'Could not save events' });
  }
});
