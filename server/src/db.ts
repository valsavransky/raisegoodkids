import { Pool } from 'pg';

// Railway's internal network (service-to-service, via the private
// `postgres.railway.internal` host) doesn't need or support SSL. Only the
// public proxy host does. Detect that rather than hardcoding one way.
const isPublicHost = /proxy\.rlwy\.net|railway\.app/.test(process.env.DATABASE_URL ?? '');

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isPublicHost ? { rejectUnauthorized: false } : undefined,
});

export async function runMigrations(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS app_data (
      user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      data JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}
