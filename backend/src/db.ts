import { Pool } from "pg";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS devices (
  id TEXT PRIMARY KEY,
  imei TEXT NOT NULL UNIQUE,
  serial_number TEXT UNIQUE,
  status TEXT NOT NULL,
  manufacturer TEXT,
  model TEXT,
  device_name TEXT,
  registered_by_partner_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS device_search_logs (
  id TEXT PRIMARY KEY,
  query_imei TEXT,
  query_serial TEXT,
  found BOOLEAN NOT NULL,
  result_status TEXT NOT NULL,
  display_level TEXT NOT NULL,
  result_message TEXT,
  device_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_device_search_logs_created ON device_search_logs(created_at);

CREATE TABLE IF NOT EXISTS lookup_result_shares (
  id TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_lookup_result_shares_expires ON lookup_result_shares(expires_at);
`;

export function createDbPool(connectionString: string): Pool {
  return new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
}

export async function initDb(pool: Pool): Promise<void> {
  await pool.query(SCHEMA);
}
