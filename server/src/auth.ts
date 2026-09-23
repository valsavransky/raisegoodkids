import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { pool } from './db';

const JWT_SECRET = process.env.JWT_SECRET;

// Same OAuth client IDs the app already uses for Google Calendar access
// (see app.json's extra.googleCalendar) — one Google Cloud client, reused
// for both purposes, so this needs no new Google Cloud setup. Verifying the
// ID token's audience against these confirms it was actually issued to our
// app, not lifted from somewhere else.
const GOOGLE_IOS_CLIENT_ID = process.env.GOOGLE_IOS_CLIENT_ID;
const GOOGLE_ANDROID_CLIENT_ID = process.env.GOOGLE_ANDROID_CLIENT_ID;
const googleClient = new OAuth2Client();

export interface AuthedRequest extends Request {
  userId?: number;
}

function signToken(userId: number): string {
  if (!JWT_SECRET) throw new Error('JWT_SECRET is not set');
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '365d' });
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.header('authorization');
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : null;
  if (!token || !JWT_SECRET) {
    res.status(401).json({ error: 'Missing or invalid token' });
    return;
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: number };
    req.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ error: 'Missing or invalid token' });
  }
}

export const authRouter = Router();

authRouter.post('/signup', async (req: Request, res: Response) => {
  const { email, password } = req.body ?? {};
  if (typeof email !== 'string' || typeof password !== 'string' || password.length < 8) {
    res.status(400).json({ error: 'Email and a password of at least 8 characters are required' });
    return;
  }
  const normalizedEmail = email.trim().toLowerCase();
  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
  if (existing.rowCount) {
    res.status(409).json({ error: 'An account with that email already exists' });
    return;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const result = await pool.query(
    'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id',
    [normalizedEmail, passwordHash]
  );
  const userId: number = result.rows[0].id;
  res.status(201).json({ token: signToken(userId) });
});

authRouter.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body ?? {};
  if (typeof email !== 'string' || typeof password !== 'string') {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }
  const normalizedEmail = email.trim().toLowerCase();
  const result = await pool.query('SELECT id, password_hash FROM users WHERE email = $1', [normalizedEmail]);
  const user = result.rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    res.status(401).json({ error: 'Incorrect email or password' });
    return;
  }
  res.json({ token: signToken(user.id) });
});

// "Sign in with Google" — verifies the ID token the client got from Google,
// then finds-or-creates an account by that verified email. Logging in this
// way behaves like /auth/login (switching to a possibly-different, already-
// existing account, adopting its server data) — see the client's
// AuthContext.loginWithGoogle, only ever offered before a local child
// profile exists, same as the typed-email Login screen.
authRouter.post('/google', async (req: Request, res: Response) => {
  const { idToken } = req.body ?? {};
  if (typeof idToken !== 'string' || !idToken) {
    res.status(400).json({ error: 'Missing Google ID token' });
    return;
  }
  const audience = [GOOGLE_IOS_CLIENT_ID, GOOGLE_ANDROID_CLIENT_ID].filter(
    (id): id is string => typeof id === 'string' && id.length > 0
  );
  if (audience.length === 0) {
    res.status(500).json({ error: 'Google sign-in is not configured on the server' });
    return;
  }

  let email: string | undefined;
  try {
    const ticket = await googleClient.verifyIdToken({ idToken, audience });
    const payload = ticket.getPayload();
    if (payload?.email && payload.email_verified) email = payload.email;
  } catch {
    // Falls through to the generic 401 below — an invalid/expired/forged
    // token all look the same to the caller.
  }
  if (!email) {
    res.status(401).json({ error: 'Could not verify that Google sign-in' });
    return;
  }
  const normalizedEmail = email.trim().toLowerCase();

  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
  if (existing.rowCount) {
    res.json({ token: signToken(existing.rows[0].id), email: normalizedEmail });
    return;
  }

  // A brand-new account, created straight from Google sign-in — the
  // password is random and genuinely unusable (there's no password-based
  // login for an account created this way), the same pattern already used
  // for the client's silent auto-account.
  const passwordHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);
  const result = await pool.query('INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id', [
    normalizedEmail,
    passwordHash,
  ]);
  res.status(201).json({ token: signToken(result.rows[0].id), email: normalizedEmail });
});

// Lets an already-authenticated account (including one auto-created with a
// throwaway random email/password on first app launch — see the client's
// AuthContext) replace its credentials with a real email/password the
// parent chose, so the same account can be logged into on a second device.
authRouter.patch('/credentials', requireAuth, async (req: AuthedRequest, res: Response) => {
  const { email, password } = req.body ?? {};
  if (typeof email !== 'string' || typeof password !== 'string' || password.length < 8) {
    res.status(400).json({ error: 'Email and a password of at least 8 characters are required' });
    return;
  }
  const normalizedEmail = email.trim().toLowerCase();
  const existing = await pool.query('SELECT id FROM users WHERE email = $1 AND id != $2', [normalizedEmail, req.userId]);
  if (existing.rowCount) {
    res.status(409).json({ error: 'An account with that email already exists' });
    return;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  await pool.query('UPDATE users SET email = $1, password_hash = $2 WHERE id = $3', [
    normalizedEmail,
    passwordHash,
    req.userId,
  ]);
  res.json({ ok: true });
});
