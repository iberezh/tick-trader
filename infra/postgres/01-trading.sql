CREATE SCHEMA IF NOT EXISTS trading;

-- Append-only event store: the system of record. Never updated, never deleted.
CREATE TABLE IF NOT EXISTS trading.events (
  seq         BIGSERIAL PRIMARY KEY,
  stream_id   TEXT        NOT NULL,
  type        TEXT        NOT NULL,
  payload     JSONB       NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS events_occurred_at_idx ON trading.events (occurred_at);
CREATE INDEX IF NOT EXISTS events_type_seq_idx     ON trading.events (type, seq);
CREATE INDEX IF NOT EXISTS events_stream_idx       ON trading.events (stream_id, seq);
