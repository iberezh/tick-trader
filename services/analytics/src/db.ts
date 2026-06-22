import type { Side, TradeExecuted } from '@tick-trader/contracts';
import { type Generated, Kysely, PostgresDialect, sql } from 'kysely';
import { Pool } from 'pg';
import { config } from './config.js';

interface PriceTickRow {
  seq: Generated<number>;
  symbol: string;
  price: number;
  ts: Date;
}
interface TradeLogRow {
  seq: Generated<number>;
  account_id: string;
  order_id: string;
  symbol: string;
  side: string;
  qty: number;
  price: number;
  executed_at: Date;
}
interface DB {
  price_ticks: PriceTickRow;
  trade_log: TradeLogRow;
}

const db = new Kysely<DB>({
  dialect: new PostgresDialect({ pool: new Pool({ connectionString: config.databaseUrl }) }),
}).withSchema('analytics');

// Service owns its read models; create them idempotently on boot.
export async function ensureSchema(): Promise<void> {
  await sql`CREATE TABLE IF NOT EXISTS analytics.price_ticks (
    seq BIGSERIAL PRIMARY KEY, symbol TEXT NOT NULL, price DOUBLE PRECISION NOT NULL, ts TIMESTAMPTZ NOT NULL
  )`.execute(db);
  await sql`CREATE INDEX IF NOT EXISTS price_ticks_symbol_ts_idx ON analytics.price_ticks (symbol, ts)`.execute(
    db,
  );
  await sql`CREATE TABLE IF NOT EXISTS analytics.trade_log (
    seq BIGSERIAL PRIMARY KEY, account_id TEXT NOT NULL DEFAULT '', order_id TEXT NOT NULL,
    symbol TEXT NOT NULL, side TEXT NOT NULL, qty DOUBLE PRECISION NOT NULL,
    price DOUBLE PRECISION NOT NULL, executed_at TIMESTAMPTZ NOT NULL
  )`.execute(db);
  await sql`ALTER TABLE analytics.trade_log ADD COLUMN IF NOT EXISTS account_id TEXT NOT NULL DEFAULT ''`.execute(
    db,
  );
  await sql`CREATE INDEX IF NOT EXISTS trade_log_account_idx ON analytics.trade_log (account_id, executed_at)`.execute(
    db,
  );
}

export async function insertTick(tick: {
  symbol: string;
  price: number;
  ts: number;
}): Promise<void> {
  await db
    .insertInto('price_ticks')
    .values({ symbol: tick.symbol, price: tick.price, ts: new Date(tick.ts) })
    .execute();
}

export async function insertTrade(t: TradeExecuted): Promise<void> {
  await db
    .insertInto('trade_log')
    .values({
      account_id: t.accountId,
      order_id: t.orderId,
      symbol: t.symbol,
      side: t.side,
      qty: t.qty,
      price: t.price,
      executed_at: new Date(t.executedAt),
    })
    .execute();
}

export async function listTradesUpTo(accountId: string, atMs?: number): Promise<TradeExecuted[]> {
  let query = db
    .selectFrom('trade_log')
    .select(['account_id', 'order_id', 'symbol', 'side', 'qty', 'price', 'executed_at'])
    .where('account_id', '=', accountId)
    .orderBy('seq');
  if (atMs !== undefined) query = query.where('executed_at', '<=', new Date(atMs));
  const rows = await query.execute();
  return rows.map((r) => ({
    accountId: r.account_id,
    orderId: r.order_id,
    symbol: r.symbol,
    side: r.side as Side,
    qty: r.qty,
    price: r.price,
    executedAt: r.executed_at.getTime(),
  }));
}

export async function latestPricesAsOf(atMs: number): Promise<Record<string, number>> {
  const rows = await db
    .selectFrom('price_ticks')
    .select(['symbol', 'price'])
    .where('ts', '<=', new Date(atMs))
    .distinctOn('symbol')
    .orderBy('symbol')
    .orderBy('ts', 'desc')
    .execute();
  return Object.fromEntries(rows.map((r) => [r.symbol, r.price]));
}

export async function ticksInRangeAllSymbols(
  fromMs: number,
  toMs: number,
): Promise<{ symbol: string; price: number; ts: number }[]> {
  const rows = await db
    .selectFrom('price_ticks')
    .select(['symbol', 'price', 'ts'])
    .where('ts', '>=', new Date(fromMs))
    .where('ts', '<=', new Date(toMs))
    .orderBy('ts')
    .execute();
  return rows.map((r) => ({ symbol: r.symbol, price: r.price, ts: r.ts.getTime() }));
}

export async function ticksInRange(
  symbol: string,
  fromMs: number,
  toMs: number,
): Promise<{ price: number; ts: number }[]> {
  const rows = await db
    .selectFrom('price_ticks')
    .select(['price', 'ts'])
    .where('symbol', '=', symbol)
    .where('ts', '>=', new Date(fromMs))
    .where('ts', '<=', new Date(toMs))
    .orderBy('ts')
    .execute();
  return rows.map((r) => ({ price: r.price, ts: r.ts.getTime() }));
}

export { db };
