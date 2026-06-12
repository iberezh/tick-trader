import { EVENT_TYPES, type TradeExecuted } from '@tick-trader/contracts';
import { type Generated, Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import { config } from './config.js';

interface EventRow {
  seq: Generated<number>;
  stream_id: string;
  type: string;
  payload: unknown;
  occurred_at: Generated<Date>;
}
interface DB {
  events: EventRow;
}

export type EventInput = { streamId: string; type: string; payload: unknown };

const db = new Kysely<DB>({
  dialect: new PostgresDialect({ pool: new Pool({ connectionString: config.databaseUrl }) }),
}).withSchema('trading');

export async function appendEvents(events: EventInput[]): Promise<void> {
  if (events.length === 0) return;
  await db
    .insertInto('events')
    .values(
      events.map((e) => ({
        stream_id: e.streamId,
        type: e.type,
        payload: JSON.stringify(e.payload),
      })),
    )
    .execute();
}

export async function listAccountTrades(): Promise<TradeExecuted[]> {
  const rows = await db
    .selectFrom('events')
    .select('payload')
    .where('type', '=', EVENT_TYPES.tradeExecuted)
    .orderBy('seq')
    .execute();
  // pg parses jsonb into objects; rows of this type carry TradeExecuted payloads by construction.
  return rows.map((r) => r.payload as TradeExecuted);
}

export async function listOrderEvents(
  orderId: string,
): Promise<{ type: string; payload: unknown }[]> {
  return db
    .selectFrom('events')
    .select(['type', 'payload'])
    .where('stream_id', '=', `order:${orderId}`)
    .orderBy('seq')
    .execute();
}

export { db };
