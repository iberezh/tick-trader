CREATE SCHEMA IF NOT EXISTS trading;

-- Append-only event store: the system of record. Never updated, never deleted.
CREATE TABLE IF NOT EXISTS trading.events (
  seq         BIGSERIAL PRIMARY KEY,
  stream_id   TEXT        NOT NULL,
  account_id  TEXT        NOT NULL DEFAULT '',
  type        TEXT        NOT NULL,
  payload     JSONB       NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS events_occurred_at_idx ON trading.events (occurred_at);
CREATE INDEX IF NOT EXISTS events_type_seq_idx     ON trading.events (type, seq);
CREATE INDEX IF NOT EXISTS events_stream_idx       ON trading.events (stream_id, seq);
CREATE INDEX IF NOT EXISTS events_account_idx      ON trading.events (account_id, type, seq);

-- One row per registered user; the user id doubles as their paper-account id.
CREATE TABLE IF NOT EXISTS trading.users (
  id            TEXT        PRIMARY KEY,
  email         TEXT        UNIQUE NOT NULL,
  password_hash TEXT        NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
