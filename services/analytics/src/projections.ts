import { buildPortfolio, type TradeExecuted } from '@tick-trader/contracts';

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

export function toCandles(ticks: { price: number; ts: number }[], bucketMs: number): Candle[] {
  const byBucket = new Map<number, Candle>();
  for (const tick of ticks) {
    const t = Math.floor(tick.ts / bucketMs) * bucketMs;
    const candle = byBucket.get(t);
    if (!candle) {
      byBucket.set(t, {
        t,
        open: tick.price,
        high: tick.price,
        low: tick.price,
        close: tick.price,
      });
      continue;
    }
    candle.high = Math.max(candle.high, tick.price);
    candle.low = Math.min(candle.low, tick.price);
    candle.close = tick.price;
  }
  return [...byBucket.values()].sort((a, b) => a.t - b.t);
}

// Mark-to-market equity at each bucket boundary: fold trades <= t, value at the latest
// tick price <= t per symbol. `ticks` must be sorted ascending by ts.
export function sampleEquityCurve(
  trades: TradeExecuted[],
  ticks: { symbol: string; price: number; ts: number }[],
  fromMs: number,
  toMs: number,
  bucketMs: number,
  startingCash: number,
): EquityPoint[] {
  const points: EquityPoint[] = [];
  for (let t = fromMs; t <= toMs; t += bucketMs) {
    const priceBySymbol: Record<string, number> = {};
    for (const tick of ticks) {
      if (tick.ts > t) break;
      priceBySymbol[tick.symbol] = tick.price;
    }
    const tradesUpTo = trades.filter((tr) => tr.executedAt <= t);
    const p = buildPortfolio(tradesUpTo, startingCash, priceBySymbol, new Date(t).toISOString());
    points.push({
      t,
      equity: p.equity,
      cash: p.cash,
      realizedPnl: p.realizedPnl,
      unrealizedPnl: p.unrealizedPnl,
    });
  }
  return points;
}
