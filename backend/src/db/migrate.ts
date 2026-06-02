import { readFileSync } from 'fs';
import { join } from 'path';
import { pool } from './client';
import dotenv from 'dotenv';

dotenv.config();

async function migrate() {
  console.log('[migrate] Connecting to PostgreSQL...');
  const client = await pool.connect();

  try {
    for (const file of ['schema.sql', 'inflation-schema.sql', 'taka-sats-schema.sql']) {
      const schema = readFileSync(join(__dirname, file), 'utf-8');
      console.log(`[migrate] Running ${file}...`);
      await client.query(schema);
    }
    console.log('[migrate] Done.');
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error('[migrate] Failed:', err.message);
  process.exit(1);
});
