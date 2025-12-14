import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import { nanoid } from 'nanoid';
import 'dotenv/config';

function readEnvFile(envPath) {
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, 'utf8');
  const lines = content.split(/\r?\n/);
  const env = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    let key = trimmed.slice(0, eq);
    let val = trimmed.slice(eq + 1);
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
  return env;
}

(async function main() {
  try {
    const repoRoot = path.resolve(new URL(import.meta.url).pathname, '..', '..');
    const env = readEnvFile(path.resolve(repoRoot, '.env'));
    const databaseUrl = process.env.DATABASE_URL || env.DATABASE_URL;

    if (!databaseUrl) {
      console.error('DATABASE_URL not found in environment or .env');
      process.exit(2);
    }

    const pool = new Pool({ connectionString: databaseUrl });
    const client = await pool.connect();
    try {
      // Create a test user (upsert style)
      const testId = `test-${nanoid(8)}`;
      const username = `test_user_${nanoid(6)}`;

      const insertSql = `
        insert into users (id, email, password, username, created_at, updated_at)
        values ($1, $2, $3, $4, now(), now())
        on conflict (id) do nothing
        returning id, username
      `;

      const res = await client.query(insertSql, [testId, `${username}@example.com`, 'password', username]);
      console.log('Created test user:', res.rows[0] || { id: testId, username });

      // Simulate linking by setting telegram_id
      const fakeChatId = (Math.floor(Math.random() * 900000000) + 100000000).toString();
      const updateSql = `update users set telegram_id = $1, telegram_username = $2, is_telegram_user = true, updated_at = now() where id = $3 returning id, username, telegram_id, telegram_username, is_telegram_user`;
      const upd = await client.query(updateSql, [fakeChatId, `tg_${username}`, testId]);

      console.log('Updated user with telegram info:', upd.rows[0]);

      // Verify via select
      const check = await client.query('select id, username, telegram_id, telegram_username, is_telegram_user from users where telegram_id = $1 limit 1', [fakeChatId]);
      console.log('Verification select result:', check.rows);
    } finally {
      client.release();
      await pool.end();
    }
  } catch (err) {
    console.error('Error simulating link:', err);
    process.exit(1);
  }
})();
