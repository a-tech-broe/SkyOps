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

    CREATE TABLE IF NOT EXISTS tracked_airports (
      icao     TEXT PRIMARY KEY,
      added_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS obs_snapshots (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      icao         TEXT NOT NULL,
      captured_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      flight_rules TEXT NOT NULL,
      raw_metar    TEXT,
      wdir         TEXT,
      wspd         SMALLINT,
      wgst         SMALLINT,
      visib        TEXT,
      temp         NUMERIC(5,1),
      altim        NUMERIC(6,2)
    );
    CREATE INDEX IF NOT EXISTS obs_snapshots_icao_time
      ON obs_snapshots (icao, captured_at DESC);
  `);
}
