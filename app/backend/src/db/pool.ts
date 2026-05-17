import { Pool } from 'pg';

export const pool = new Pool({ connectionString: process.env.DB_URL });

export async function initDb(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email         TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at    TIMESTAMPTZ DEFAULT NOW(),
      last_login    TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS search_history (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      device_id    TEXT NOT NULL,
      icao         TEXT NOT NULL,
      search_type  TEXT NOT NULL,
      searched_at  TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_search_history_device
      ON search_history (device_id, search_type, searched_at DESC);
  `);
}
