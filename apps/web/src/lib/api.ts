import type { Portfolio, Side, TradeExecuted } from '@tick-trader/contracts';

const TRADING = import.meta.env.VITE_TRADING_URL ?? 'http://localhost:4001/api/v1';
const ANALYTICS = import.meta.env.VITE_ANALYTICS_URL ?? 'http://localhost:4003/api/v1';

// Every REST path the client knows about lives here — single source of truth.
export const ENDPOINTS = {
  auth: {
    register: `${TRADING}/auth/register`,
    login: `${TRADING}/auth/login`,
    logout: `${TRADING}/auth/logout`,
    me: `${TRADING}/auth/me`,
  },
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

// credentials: 'include' so the httpOnly auth cookie rides along cross-origin (web → API ports).
async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
  return res.json() as Promise<T>;
}

export const getEvents = () => getJson<{ trades: TradeExecuted[] }>(ENDPOINTS.events);
export const getPortfolio = () => getJson<Portfolio>(ENDPOINTS.portfolio);
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
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (res.ok) return { ok: true };
  const body = (await res.json().catch(() => ({}))) as { reason?: string; message?: string };
  return { ok: false, message: body.reason ?? body.message ?? `error ${res.status}` };
}

export interface Account {
  id: string;
  email: string;
}
export interface Credentials {
  email: string;
  password: string;
}
export type AuthResult = { ok: true; account: Account } | { ok: false; message: string };

async function postCredentials(url: string, creds: Credentials): Promise<AuthResult> {
  const res = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(creds),
  });
  const body = (await res.json().catch(() => ({}))) as Partial<Account> & { error?: string };
  if (res.ok && body.id && body.email)
    return { ok: true, account: { id: body.id, email: body.email } };
  return { ok: false, message: body.error ?? `error ${res.status}` };
}

export const register = (creds: Credentials) => postCredentials(ENDPOINTS.auth.register, creds);
export const login = (creds: Credentials) => postCredentials(ENDPOINTS.auth.login, creds);
export const logout = () =>
  fetch(ENDPOINTS.auth.logout, { method: 'POST', credentials: 'include' });

export async function getMe(): Promise<Account | null> {
  const res = await fetch(ENDPOINTS.auth.me, { credentials: 'include' });
  return res.ok ? (res.json() as Promise<Account>) : null;
}
