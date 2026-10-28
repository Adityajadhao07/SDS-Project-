import pg from 'pg';
import { env } from '../config/env.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
});

export async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (process.env.DEBUG_SQL === 'true') {
    console.log('Executed query', { text, duration, rows: res.rowCount });
  }
  return res;
}

export async function checkDbConnection() {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT NOW() as current_time, current_database() as db_name'
    );
    return result.rows[0];
  } finally {
    client.release();
  }
}

export async function closePool() {
  await pool.end();
}
