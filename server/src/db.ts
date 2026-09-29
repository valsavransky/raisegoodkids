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

    -- Anonymous usage events (see events.ts). install_id is a random id the
    -- app generates for itself; nothing here links back to a user or child.
    CREATE TABLE IF NOT EXISTS events (
      id BIGSERIAL PRIMARY KEY,
      install_id TEXT NOT NULL,
      name TEXT NOT NULL,
      props JSONB NOT NULL DEFAULT '{}',
      client_ts TIMESTAMPTZ NOT NULL,
      received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      app_version TEXT,
      platform TEXT
    );
    CREATE INDEX IF NOT EXISTS events_name_received_idx ON events (name, received_at);
    CREATE INDEX IF NOT EXISTS events_install_received_idx ON events (install_id, received_at);
  `);
}
