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
    -- Free-text feedback families send from Settings. Unlike events this IS
    -- typed content, so it's only what the parent chose to write (plus an
    -- optional contact line) tied to the random install id, nothing else.
    CREATE TABLE IF NOT EXISTS feedback (
      id BIGSERIAL PRIMARY KEY,
      install_id TEXT,
      message TEXT NOT NULL,
      contact TEXT,
      app_version TEXT,
      platform TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    -- Family devices (see family.ts): a tablet or old phone a child uses. It is
    -- linked once with a short-lived code and can only do child things.
    CREATE TABLE IF NOT EXISTS family_devices (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      last_seen_at TIMESTAMPTZ,
      revoked_at TIMESTAMPTZ
    );
    -- A goal's photo, uploaded by the parent's phone so a family device can show it too.
    CREATE TABLE IF NOT EXISTS goal_photos (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      goal_id TEXT NOT NULL,
      content_type TEXT NOT NULL,
      data BYTEA NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (user_id, goal_id)
    );
    CREATE TABLE IF NOT EXISTS pairing_codes (
      code_hash TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TIMESTAMPTZ NOT NULL,
      used_at TIMESTAMPTZ
    );
    -- What a child tapped on a family device, waiting for a parent. Once a
    -- parent decides, their own phone turns an approval into a real completion.
    CREATE TABLE IF NOT EXISTS submissions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      device_id INTEGER REFERENCES family_devices(id) ON DELETE SET NULL,
      child_id TEXT NOT NULL,
      kind TEXT NOT NULL CHECK (kind IN ('expected', 'gig', 'goal_add', 'goal_rename', 'goal_switch')),
      item_id TEXT NOT NULL,
      day TEXT NOT NULL,
      submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
      decided_at TIMESTAMPTZ,
      note TEXT,
      -- goal_add / goal_rename: { name }. Empty for the other kinds.
      payload JSONB NOT NULL DEFAULT '{}'
    );
    CREATE UNIQUE INDEX IF NOT EXISTS submissions_one_pending_idx
      ON submissions (user_id, kind, item_id, day) WHERE status = 'pending';
    CREATE INDEX IF NOT EXISTS submissions_user_status_idx ON submissions (user_id, status);
    CREATE INDEX IF NOT EXISTS events_name_received_idx ON events (name, received_at);
    CREATE INDEX IF NOT EXISTS events_install_received_idx ON events (install_id, received_at);
  `);
}
