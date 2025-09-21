import express from 'express';
import dotenv from 'dotenv';
import pkg from 'pg';
const { Pool } = pkg;

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.static('public'));

const PORT = process.env.PORT || 8080;
const APP_NAME = process.env.APP_NAME || 'demo-web';
const DB_URL = process.env.DB_URL;

let pool = null;
if (DB_URL) {
  pool = new Pool({ connectionString: DB_URL, max: 5, idleTimeoutMillis: 10000 });
}

async function migrate() {
  if (!pool) return;
  await pool.query(`
    create table if not exists messages (
      id serial primary key,
      text varchar(500) not null,
      created_at timestamptz not null default now()
    )
  `);
}
migrate().catch(err => console.error('Migration failed:', err.message));

app.get('/healthz', (req, res) => res.type('text/plain').send(`${APP_NAME} is healthy`));

app.get('/healthz/db', async (req, res) => {
  if (!pool) return res.status(500).send('No DB configured');
  try {
    await pool.query('select 1 as ok');
    res.send('DB OK');
  } catch (e) {
    res.status(500).send('DB ERROR: ' + e.message);
  }
});

app.get('/api/messages', async (req, res) => {
  if (!pool) return res.json([]);
  const { rows } = await pool.query('select id, text, created_at from messages order by created_at desc limit 50');
  res.json(rows);
});

app.post('/api/messages', async (req, res) => {
  if (!pool) return res.status(500).json({ error: 'DB not configured' });
  const text = (req.body?.text || '').toString().trim().slice(0, 500);
  if (!text) return res.status(400).json({ error: 'text required' });
  await pool.query('insert into messages(text) values ($1)', [text]);
  res.status(201).json({ ok: true });
});

app.listen(PORT, () => console.log(`Server listening on :${PORT}`));
