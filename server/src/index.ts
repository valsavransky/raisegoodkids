import express from 'express';
import cors from 'cors';
import { pool, runMigrations } from './db';
import { authRouter, requireAuth, AuthedRequest } from './auth';

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

app.get('/', (_req, res) => {
  res.json({ status: 'ok', service: 'merit-server' });
});

app.use('/auth', authRouter);

// The app's entire local data blob (see PersistedAppData in
// AppDataContext.tsx), stored as one JSONB column per account — mirrors
// how the client already treats it as a single unit, just synced instead
// of only on-device.
app.get('/data', requireAuth, async (req: AuthedRequest, res) => {
  const result = await pool.query('SELECT data FROM app_data WHERE user_id = $1', [req.userId]);
  res.json({ data: result.rows[0]?.data ?? null });
});

app.put('/data', requireAuth, async (req: AuthedRequest, res) => {
  const { data } = req.body ?? {};
  if (data === undefined) {
    res.status(400).json({ error: 'Missing data' });
    return;
  }
  await pool.query(
    `INSERT INTO app_data (user_id, data, updated_at)
     VALUES ($1, $2, now())
     ON CONFLICT (user_id) DO UPDATE SET data = $2, updated_at = now()`,
    [req.userId, data]
  );
  res.json({ ok: true });
});

const port = Number(process.env.PORT) || 3000;

runMigrations()
  .then(() => {
    app.listen(port, () => console.log(`merit-server listening on ${port}`));
  })
  .catch((err) => {
    console.error('Failed to run migrations', err);
    process.exit(1);
  });
