CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  certificate_number TEXT,
  home_airport CHAR(4),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS flight_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  departure CHAR(4) NOT NULL,
  destination CHAR(4) NOT NULL,
  aircraft_type TEXT NOT NULL,
  aircraft_reg TEXT NOT NULL,
  total_time NUMERIC(5,1) NOT NULL,
  pic_time NUMERIC(5,1) DEFAULT 0,
  night_time NUMERIC(5,1) DEFAULT 0,
  actual_instrument NUMERIC(5,1) DEFAULT 0,
  simulated_instrument NUMERIC(5,1) DEFAULT 0,
  day_landings INT DEFAULT 0,
  night_landings INT DEFAULT 0,
  instrument_approaches INT DEFAULT 0,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_flight_logs_user_date ON flight_logs(user_id, date DESC);

CREATE TABLE IF NOT EXISTS search_history (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id    TEXT NOT NULL,
  icao         TEXT NOT NULL,
  search_type  TEXT NOT NULL,
  searched_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_search_history_device
  ON search_history (device_id, search_type, searched_at DESC);

CREATE TABLE IF NOT EXISTS aircraft (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  registration TEXT NOT NULL,
  make_model TEXT NOT NULL,
  empty_weight NUMERIC(8,2) NOT NULL,
  empty_cg NUMERIC(6,2) NOT NULL,
  max_gross NUMERIC(8,2) NOT NULL,
  stations JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
