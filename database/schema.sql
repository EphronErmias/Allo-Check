-- Reference SQLite DDL (the API also creates these on startup; keep in sync with backend/src/db.ts).

CREATE TABLE IF NOT EXISTS devices (
  id TEXT PRIMARY KEY,
  imei TEXT NOT NULL UNIQUE,
  serial_number TEXT UNIQUE,
  status TEXT NOT NULL,
  manufacturer TEXT,
  model TEXT,
  device_name TEXT,
  registered_by_partner_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS device_search_logs (
  id TEXT PRIMARY KEY,
  query_imei TEXT,
  query_serial TEXT,
  found INTEGER NOT NULL,
  result_status TEXT NOT NULL,
  display_level TEXT NOT NULL,
  result_message TEXT,
  device_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_device_search_logs_created ON device_search_logs(created_at);
