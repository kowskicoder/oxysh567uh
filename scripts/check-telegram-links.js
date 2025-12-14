import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

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
    // remove surrounding quotes
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
  return env;
}

(async function main() {
  try {
    // __dirname is not defined in ES modules; derive repo root from import.meta.url
    const repoRoot = path.resolve(new URL(import.meta.url).pathname, '..', '..');
    const envPath = path.resolve(repoRoot, '.env');
    const env = readEnvFile(envPath);
    const databaseUrl = process.env.DATABASE_URL || env.DATABASE_URL;

    if (!databaseUrl) {
      console.error('DATABASE_URL not found in environment or .env');
      process.exit(2);
    }

    const pool = new Pool({ connectionString: databaseUrl });
    const client = await pool.connect();
    try {
      const chatIdArg = process.argv[2];
      if (chatIdArg) {
        const res = await client.query('select id, username, telegram_id, telegram_username, is_telegram_user, updated_at from users where telegram_id = $1 limit 1', [chatIdArg]);
        console.log(res.rows);
      } else {
        const res = await client.query('select id, username, telegram_id, telegram_username, is_telegram_user, updated_at from users where telegram_id is not null order by updated_at desc limit 20');
        console.table(res.rows);
      }
    } finally {
      client.release();
      await pool.end();
    }
  } catch (err) {
    console.error('Error running DB check:', err);
    process.exit(1);
  }
})();
