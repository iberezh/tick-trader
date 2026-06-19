import type { Portfolio, Side, TradeExecuted } from '@tick-trader/contracts';

const TRADING = import.meta.env.VITE_TRADING_URL ?? 'http://localhost:4001/api/v1';
const ANALYTICS = import.meta.env.VITE_ANALYTICS_URL ?? 'http://localhost:4003/api/v1';

// Every REST path the client knows about lives here — single source of truth.
export const ENDPOINTS = {
  orders: `${TRADING}/orders`,
  portfolio: `${ANALYTICS}/portfolio`,
  portfolioAt: (iso: string) => `${ANALYTICS}/portfolio?at=${encodeURIComponent(iso)}`,
  prices: (symbol: string, bucket: number, to?: number) =>
    `${ANALYTICS}/prices?symbol=${symbol}&bucket=${bucket}${to ? `&to=${to}` : ''}`,
  metrics: (bucket: number, to?: number) =>
    `${ANALYTICS}/metrics?bucket=${bucket}${to ? `&to=${to}` : ''}`,
  events: `${ANALYTICS}/events`,
  stream: `${ANALYTICS}/stream`,
} as const;

export interface Candle {
  t: number;
  open: number;
  high: number;
  low: number;
  close: number;
}
export interface EquityPoint {
  t: number;
  equity: number;
  cash: number;
  realizedPnl: number;
  unrealizedPnl: number;
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
  return res.json() as Promise<T>;
}

export const getEvents = () => getJson<{ trades: TradeExecuted[] }>(ENDPOINTS.events);
export const getPortfolioAt = (iso: string) => getJson<Portfolio>(ENDPOINTS.portfolioAt(iso));
export const getCandles = (symbol: string, bucket = 15, to?: number) =>
  getJson<Candle[]>(ENDPOINTS.prices(symbol, bucket, to));
export const getMetrics = (bucket = 60, to?: number) =>
  getJson<EquityPoint[]>(ENDPOINTS.metrics(bucket, to));

export interface OrderInput {
  symbol: string;
  side: Side;
  qty: number;
}

export async function placeOrder(input: OrderInput): Promise<{ ok: boolean; message?: string }> {
  const res = await fetch(ENDPOINTS.orders, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (res.ok) return { ok: true };
  const body = (await res.json().catch(() => ({}))) as { reason?: string; message?: string };
  return { ok: false, message: body.reason ?? body.message ?? `error ${res.status}` };
}
