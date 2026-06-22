import { EVENT_TYPES, type TradeExecuted } from '@tick-trader/contracts';
import { type Generated, Kysely, PostgresDialect, sql } from 'kysely';
import { Pool } from 'pg';
import { config } from './config.js';

interface EventRow {
  seq: Generated<number>;
  stream_id: string;
  account_id: string;
  type: string;
  payload: unknown;
  occurred_at: Generated<Date>;
}
interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  created_at: Generated<Date>;
}
interface DB {
  events: EventRow;
  users: UserRow;
}

export type EventInput = { streamId: string; type: string; payload: unknown };
export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
}

const db = new Kysely<DB>({
  dialect: new PostgresDialect({ pool: new Pool({ connectionString: config.databaseUrl }) }),
}).withSchema('trading');

// Idempotent on boot: the users table + the per-account column on the event store.
export async function ensureSchema(): Promise<void> {
  await sql`CREATE TABLE IF NOT EXISTS trading.users (
    id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`.execute(db);
  await sql`ALTER TABLE trading.events ADD COLUMN IF NOT EXISTS account_id TEXT NOT NULL DEFAULT ''`.execute(
    db,
  );
  await sql`CREATE INDEX IF NOT EXISTS events_account_idx ON trading.events (account_id, type, seq)`.execute(
    db,
  );
}

export async function createUser(user: UserRecord): Promise<void> {
  await db
    .insertInto('users')
    .values({ id: user.id, email: user.email, password_hash: user.passwordHash })
    .execute();
}

export async function findUserByEmail(email: string): Promise<UserRecord | undefined> {
  const row = await db
    .selectFrom('users')
    .select(['id', 'email', 'password_hash'])
    .where('email', '=', email)
    .executeTakeFirst();
  return row ? { id: row.id, email: row.email, passwordHash: row.password_hash } : undefined;
}

export async function appendEvents(accountId: string, events: EventInput[]): Promise<void> {
  if (events.length === 0) return;
  await db
    .insertInto('events')
    .values(
      events.map((e) => ({
        stream_id: e.streamId,
        account_id: accountId,
        type: e.type,
        payload: JSON.stringify(e.payload),
      })),
    )
    .execute();
}

export async function listAccountTrades(accountId: string): Promise<TradeExecuted[]> {
  const rows = await db
    .selectFrom('events')
    .select('payload')
    .where('type', '=', EVENT_TYPES.tradeExecuted)
    .where('account_id', '=', accountId)
    .orderBy('seq')
    .execute();
  return rows.map((r) => r.payload as TradeExecuted);
}

export async function listOrderEvents(
  orderId: string,
  accountId: string,
): Promise<{ type: string; payload: unknown }[]> {
  return db
    .selectFrom('events')
    .select(['type', 'payload'])
    .where('stream_id', '=', `order:${orderId}`)
    .where('account_id', '=', accountId)
    .orderBy('seq')
    .execute();
}

export { db };
