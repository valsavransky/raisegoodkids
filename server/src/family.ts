// Family devices and approvals.
//
// A parent makes a short code on their phone; a child's tablet types it once and
// gets a limited token that can only read the family's screens and send in what
// a child tapped. Those taps are "submissions", waiting here until a parent
// approves or declines them. Approving is applied by the parent's own phone (it
// turns the submission into a normal completion), so the one copy of the data
// that parents write is never touched by a child's device.
import express, { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { pool } from './db';
import { requireAuth, AuthedRequest } from './auth';

const JWT_SECRET = process.env.JWT_SECRET;

// No 0/O, 1/I/L: easy to read out and type.
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;
const CODE_MINUTES = 10;
/** How long a decided submission stays visible, so a child's device can show the result. */
const DECIDED_VISIBLE_DAYS = 7;
const MAX_PAIR_ATTEMPTS = 10;
const PAIR_WINDOW_MS = 10 * 60 * 1000;

function hashCode(code: string): string {
  return crypto.createHash('sha256').update(code.toUpperCase()).digest('hex');
}

function newCode(): string {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i += 1) code += CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)];
  return code;
}

function signDeviceToken(userId: number, deviceId: number): string {
  if (!JWT_SECRET) throw new Error('JWT_SECRET is not set');
  return jwt.sign({ userId, deviceId, role: 'child' }, JWT_SECRET, { expiresIn: '365d' });
}

// A few wrong guesses in a row from one address, and it has to wait. In memory
// only: fine for one server, and resets on restart.
const attempts = new Map<string, { count: number; resetAt: number }>();
function tooManyAttempts(key: string): boolean {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + PAIR_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_PAIR_ATTEMPTS;
}

export interface DeviceRequest extends Request {
  userId?: number;
  deviceId?: number;
}

/** Accepts only a family device's token, for a device that has not been removed. */
async function requireDevice(req: DeviceRequest, res: Response, next: NextFunction) {
  try {
    const header = req.header('authorization');
    const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : null;
    if (!token || !JWT_SECRET) {
      res.status(401).json({ error: 'Missing or invalid token' });
      return;
    }
    let payload: { userId: number; deviceId: number; role?: string };
    try {
      payload = jwt.verify(token, JWT_SECRET) as typeof payload;
    } catch {
      res.status(401).json({ error: 'Missing or invalid token' });
      return;
    }
    if (payload.role !== 'child' || !payload.deviceId) {
      res.status(401).json({ error: 'Missing or invalid token' });
      return;
    }
    const device = await pool.query(
      'UPDATE family_devices SET last_seen_at = now() WHERE id = $1 AND user_id = $2 AND revoked_at IS NULL RETURNING id',
      [payload.deviceId, payload.userId]
    );
    if (!device.rowCount) {
      // The parent removed this device: it has to start over.
      res.status(401).json({ error: 'This device was removed', removed: true });
      return;
    }
    req.userId = payload.userId;
    req.deviceId = payload.deviceId;
    next();
  } catch (err) {
    console.error('requireDevice failed', err);
    res.status(500).json({ error: 'Something went wrong' });
  }
}

/** What a child's device may see of the family's data: no money, no parent name. */
export function dataForChild(data: Record<string, unknown> | null): Record<string, unknown> | null {
  if (!data) return null;
  const copy: Record<string, unknown> = { ...data };
  delete copy.futureFund;
  delete copy.futureFunds;
  delete copy.gigEffortValues;
  delete copy.parentName;
  // A goal's photo file lives on the parent's phone; the device gets it from /goal-photos instead.
  if (Array.isArray(copy.goals)) {
    copy.goals = (copy.goals as Record<string, unknown>[]).map((g) => {
      const { photoUri, ...rest } = g;
      void photoUri;
      return rest;
    });
  }
  return copy;
}

function isDay(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

type SubmissionKind = 'expected' | 'gig' | 'goal_add' | 'goal_rename' | 'goal_switch';
const KINDS: SubmissionKind[] = ['expected', 'gig', 'goal_add', 'goal_rename', 'goal_switch'];

/** True when the family's data has this activity, gig or goal for this child.
 * A new goal has nothing to find yet, so it only needs a child. */
function hasItem(data: any, kind: SubmissionKind, childId: string, itemId: string): boolean {
  if (kind === 'goal_add') {
    return Array.isArray(data?.childProfiles) && data.childProfiles.some((c: any) => c?.id === childId);
  }
  const list = kind === 'expected' ? data?.expectedItems : kind === 'gig' ? data?.gigs : data?.goals;
  return Array.isArray(list) && list.some((i: any) => i?.id === itemId && i?.childProfileId === childId);
}

const submissionRow = (r: any) => ({
  id: r.id,
  childId: r.child_id,
  kind: r.kind,
  itemId: r.item_id,
  day: r.day,
  status: r.status,
  payload: r.payload ?? {},
  note: r.note ?? undefined,
  submittedAt: r.submitted_at,
  decidedAt: r.decided_at ?? undefined,
});

export const familyRouter = Router();

// ---- Parent side (signed in as the parent) ---------------------------------

familyRouter.post('/family/codes', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    await pool.query('DELETE FROM pairing_codes WHERE user_id = $1 AND used_at IS NULL', [req.userId]);
    const code = newCode();
    const expiresAt = new Date(Date.now() + CODE_MINUTES * 60 * 1000);
    await pool.query('INSERT INTO pairing_codes (code_hash, user_id, expires_at) VALUES ($1, $2, $3)', [
      hashCode(code),
      req.userId,
      expiresAt,
    ]);
    res.json({ code, expiresAt });
  } catch (err) {
    console.error('POST /family/codes failed', err);
    res.status(500).json({ error: 'Could not make a code right now' });
  }
});

familyRouter.get('/family/devices', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT id, name, created_at, last_seen_at FROM family_devices
       WHERE user_id = $1 AND revoked_at IS NULL ORDER BY created_at`,
      [req.userId]
    );
    res.json({
      devices: result.rows.map((r) => ({ id: r.id, name: r.name, createdAt: r.created_at, lastSeenAt: r.last_seen_at })),
    });
  } catch (err) {
    console.error('GET /family/devices failed', err);
    res.status(500).json({ error: 'Could not load devices' });
  }
});

familyRouter.delete('/family/devices/:id', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    await pool.query('UPDATE family_devices SET revoked_at = now() WHERE id = $1 AND user_id = $2', [
      Number(req.params.id),
      req.userId,
    ]);
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /family/devices failed', err);
    res.status(500).json({ error: 'Could not remove the device' });
  }
});

/** Pending items waiting for the parent, plus recently decided ones (so a second parent phone stays in step). */
familyRouter.get('/family/submissions', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT * FROM submissions WHERE user_id = $1
         AND (status = 'pending' OR decided_at > now() - ($2 || ' days')::interval)
       ORDER BY submitted_at`,
      [req.userId, String(DECIDED_VISIBLE_DAYS)]
    );
    res.json({ submissions: result.rows.map(submissionRow) });
  } catch (err) {
    console.error('GET /family/submissions failed', err);
    res.status(500).json({ error: 'Could not load submissions' });
  }
});

familyRouter.post('/family/submissions/:id/decide', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const { decision, note, price } = req.body ?? {};
    if (decision !== 'approved' && decision !== 'declined') {
      res.status(400).json({ error: 'decision must be approved or declined' });
      return;
    }
    const cleanNote = typeof note === 'string' && note.trim() ? note.trim().slice(0, 300) : null;
    // Approving a new goal (or a renamed one) carries the price the parent chose.
    const cleanPrice = typeof price === 'number' && Number.isFinite(price) && price >= 0 ? price : null;
    const result = await pool.query(
      `UPDATE submissions
         SET status = $1, decided_at = now(), note = $2,
             payload = CASE WHEN $5::numeric IS NULL THEN payload ELSE payload || jsonb_build_object('price', $5::numeric) END
       WHERE id = $3 AND user_id = $4 AND status = 'pending' RETURNING *`,
      [decision, cleanNote, req.params.id, req.userId, cleanPrice]
    );
    if (!result.rowCount) {
      // Already decided (say, from another parent phone) or taken back by the child: report what's there now.
      const current = await pool.query('SELECT * FROM submissions WHERE id = $1 AND user_id = $2', [
        req.params.id,
        req.userId,
      ]);
      res.status(current.rowCount ? 409 : 404).json({
        error: current.rowCount ? 'Already decided' : 'No longer waiting',
        submission: current.rows[0] ? submissionRow(current.rows[0]) : undefined,
      });
      return;
    }
    res.json({ submission: submissionRow(result.rows[0]) });
  } catch (err) {
    console.error('POST /family/submissions/:id/decide failed', err);
    res.status(500).json({ error: 'Could not save the decision' });
  }
});

// ---- Child device side ------------------------------------------------------

familyRouter.post('/family/pair', async (req: Request, res: Response) => {
  try {
    const key = req.ip ?? 'unknown';
    if (tooManyAttempts(key)) {
      res.status(429).json({ error: 'Too many tries. Wait a few minutes and ask for a new code.' });
      return;
    }
    const { code, deviceName } = req.body ?? {};
    if (typeof code !== 'string' || code.trim().length !== CODE_LENGTH) {
      res.status(400).json({ error: 'Enter the 6-character code from a parent\'s phone.' });
      return;
    }
    const name = typeof deviceName === 'string' && deviceName.trim() ? deviceName.trim().slice(0, 40) : 'Family device';
    const used = await pool.query(
      `UPDATE pairing_codes SET used_at = now()
       WHERE code_hash = $1 AND used_at IS NULL AND expires_at > now() RETURNING user_id`,
      [hashCode(code.trim())]
    );
    if (!used.rowCount) {
      res.status(400).json({ error: 'That code didn\'t work. Ask a parent for a new one.' });
      return;
    }
    const userId = used.rows[0].user_id as number;
    const device = await pool.query('INSERT INTO family_devices (user_id, name) VALUES ($1, $2) RETURNING id', [
      userId,
      name,
    ]);
    const deviceId = device.rows[0].id as number;
    res.json({ token: signDeviceToken(userId, deviceId), deviceId });
  } catch (err) {
    console.error('POST /family/pair failed', err);
    res.status(500).json({ error: 'Could not connect right now' });
  }
});

/** The family's data (without money) and the submissions a child's screen needs. */
familyRouter.get('/child/data', requireDevice, async (req: DeviceRequest, res: Response) => {
  try {
    const data = await pool.query('SELECT data FROM app_data WHERE user_id = $1', [req.userId]);
    const subs = await pool.query(
      `SELECT * FROM submissions WHERE user_id = $1
         AND (status = 'pending' OR decided_at > now() - ($2 || ' days')::interval)
       ORDER BY submitted_at`,
      [req.userId, String(DECIDED_VISIBLE_DAYS)]
    );
    res.json({ data: dataForChild(data.rows[0]?.data ?? null), submissions: subs.rows.map(submissionRow) });
  } catch (err) {
    console.error('GET /child/data failed', err);
    res.status(500).json({ error: 'Could not load data' });
  }
});

familyRouter.post('/child/submissions', requireDevice, async (req: DeviceRequest, res: Response) => {
  try {
    const { id, childId, kind, itemId, day, payload } = req.body ?? {};
    if (
      typeof id !== 'string' || !id || id.length > 80 ||
      typeof childId !== 'string' || typeof itemId !== 'string' ||
      !KINDS.includes(kind) || !isDay(day)
    ) {
      res.status(400).json({ error: 'Bad submission' });
      return;
    }
    // A goal request carries the name the child typed.
    let cleanPayload: Record<string, unknown> = {};
    if (kind === 'goal_add' || kind === 'goal_rename') {
      const name = typeof payload?.name === 'string' ? payload.name.trim().slice(0, 80) : '';
      if (!name) {
        res.status(400).json({ error: 'A goal needs a name' });
        return;
      }
      cleanPayload = { name };
    }
    const data = await pool.query('SELECT data FROM app_data WHERE user_id = $1', [req.userId]);
    if (!hasItem(data.rows[0]?.data, kind, childId, itemId)) {
      res.status(404).json({ error: 'That activity isn\'t on the list any more' });
      return;
    }
    // Sending the same tap twice (a retry) is fine: the id is the child's own, and an existing waiting one is kept.
    const inserted = await pool.query(
      `INSERT INTO submissions (id, user_id, device_id, child_id, kind, item_id, day, payload)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT DO NOTHING RETURNING *`,
      [id, req.userId, req.deviceId, childId, kind, itemId, day, cleanPayload]
    );
    if (inserted.rowCount) {
      res.json({ submission: submissionRow(inserted.rows[0]) });
      return;
    }
    const existing = await pool.query(
      `SELECT * FROM submissions WHERE user_id = $1 AND (id = $2 OR (kind = $3 AND item_id = $4 AND day = $5 AND status = 'pending'))
       ORDER BY submitted_at LIMIT 1`,
      [req.userId, id, kind, itemId, day]
    );
    res.json({ submission: existing.rows[0] ? submissionRow(existing.rows[0]) : undefined });
  } catch (err) {
    console.error('POST /child/submissions failed', err);
    res.status(500).json({ error: 'Could not send that right now' });
  }
});

/** A child takes back something that is still waiting. */
familyRouter.delete('/child/submissions/:id', requireDevice, async (req: DeviceRequest, res: Response) => {
  try {
    const result = await pool.query(
      `DELETE FROM submissions WHERE id = $1 AND user_id = $2 AND status = 'pending' RETURNING id`,
      [req.params.id, req.userId]
    );
    res.json({ ok: true, removed: !!result.rowCount });
  } catch (err) {
    console.error('DELETE /child/submissions failed', err);
    res.status(500).json({ error: 'Could not take that back right now' });
  }
});


// ---- Goal photos -------------------------------------------------------------
// The parent's phone uploads a goal's photo once; the parent's other phones and
// the family devices download it with their own token.

familyRouter.put(
  '/goal-photos/:goalId',
  requireAuth,
  express.raw({ type: 'image/*', limit: '8mb' }),
  async (req: AuthedRequest, res: Response) => {
    try {
      const goalId = String(req.params.goalId);
      if (!Buffer.isBuffer(req.body) || req.body.length === 0 || goalId.length > 80) {
        res.status(400).json({ error: 'Send the photo as an image' });
        return;
      }
      await pool.query(
        `INSERT INTO goal_photos (user_id, goal_id, content_type, data, updated_at)
         VALUES ($1, $2, $3, $4, now())
         ON CONFLICT (user_id, goal_id) DO UPDATE SET content_type = $3, data = $4, updated_at = now()`,
        [req.userId, goalId, req.header('content-type') ?? 'image/jpeg', req.body]
      );
      res.json({ ok: true });
    } catch (err) {
      console.error('PUT /goal-photos failed', err);
      res.status(500).json({ error: 'Could not save the photo' });
    }
  }
);

/** The signed-in parent, or a family device that has not been removed. */
async function accountFromAnyToken(req: Request): Promise<number | null> {
  const header = req.header('authorization');
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : null;
  if (!token || !JWT_SECRET) return null;
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: number; deviceId?: number; role?: string };
    if (payload.role === 'child') {
      const device = await pool.query(
        'SELECT id FROM family_devices WHERE id = $1 AND user_id = $2 AND revoked_at IS NULL',
        [payload.deviceId, payload.userId]
      );
      return device.rowCount ? payload.userId : null;
    }
    return payload.userId;
  } catch {
    return null;
  }
}

familyRouter.get('/goal-photos/:goalId', async (req: Request, res: Response) => {
  try {
    const userId = await accountFromAnyToken(req);
    if (!userId) {
      res.status(401).json({ error: 'Missing or invalid token' });
      return;
    }
    const result = await pool.query('SELECT content_type, data FROM goal_photos WHERE user_id = $1 AND goal_id = $2', [
      userId,
      req.params.goalId,
    ]);
    if (!result.rows[0]) {
      res.status(404).json({ error: 'No photo' });
      return;
    }
    res.setHeader('Content-Type', result.rows[0].content_type);
    res.setHeader('Cache-Control', 'private, max-age=86400');
    res.send(result.rows[0].data);
  } catch (err) {
    console.error('GET /goal-photos failed', err);
    res.status(500).json({ error: 'Could not load the photo' });
  }
});
