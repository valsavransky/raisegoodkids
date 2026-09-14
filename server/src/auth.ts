import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from './db';

const JWT_SECRET = process.env.JWT_SECRET;

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
