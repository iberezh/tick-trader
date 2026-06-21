import { useEffect, useState } from 'react';
import type { Candle } from '@/lib/api';

export const SIM_SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'];
export const SIM_INITIAL_EQUITY = 100_000;
export const SIM_POSITION_MULT = 2.4;
export const TF_GROUP: Record<string, number> = { '1m': 1, '5m': 3, '15m': 6, '1h': 12 };

const META: Record<string, { p: number; vol: number }> = {
  BTCUSDT: { p: 64000, vol: 150 },
  ETHUSDT: { p: 3402, vol: 11 },
  SOLUSDT: { p: 142.6, vol: 0.95 },
};
const N = 80;
const BUCKET = 15000;

function step(prevClose: number, vol: number, t: number): Candle {
  const o = prevClose;
  const c = o + (Math.random() - 0.475) * vol * 2;
  return {
    t,
    open: o,
    high: Math.max(o, c) + Math.random() * vol,
    low: Math.min(o, c) - Math.random() * vol,
    close: c,
  };
}

function seed(sym: string): Candle[] {
  const m = META[sym] ?? { p: 100, vol: 1 };
  const base = Date.now() - N * BUCKET;
  const out: Candle[] = [];
  let p = m.p;
  for (let i = 0; i < N; i++) {
    const c = step(p, m.vol, base + i * BUCKET);
    out.push(c);
    p = c.close;
  }
  return out;
}

// Roll up 1-minute candles into a higher timeframe (group K candles into one OHLC).
export function aggregate(candles: Candle[], group: number): Candle[] {
  if (group <= 1) return candles;
  const out: Candle[] = [];
  for (let i = 0; i < candles.length; i += group) {
    const slice = candles.slice(i, i + group);
    const first = slice[0];
    const last = slice[slice.length - 1];
    if (!first || !last) continue;
    out.push({
      t: last.t,
      open: first.open,
      close: last.close,
      high: Math.max(...slice.map((c) => c.high)),
      low: Math.min(...slice.map((c) => c.low)),
    });
  }
  return out;
}

type Series = Record<string, Candle[]>;

// Self-contained random-walk candles so the marketing landing looks alive with no backend.
export function useSimSeries(): Series {
  const [data, setData] = useState<Series>(() =>
    Object.fromEntries(SIM_SYMBOLS.map((s) => [s, seed(s)])),
  );
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) return;
    const id = window.setInterval(() => {
      setData((prev) => {
        const next: Series = {};
        for (const s of SIM_SYMBOLS) {
          const arr = prev[s] ?? [];
          const last = arr[arr.length - 1];
          const m = META[s] ?? { p: 100, vol: 1 };
          next[s] = [...arr.slice(1), step(last ? last.close : m.p, m.vol, Date.now())];
        }
        return next;
      });
    }, 1300);
    const stopIfReduced = () => {
      if (mq.matches) window.clearInterval(id);
    };
    mq.addEventListener('change', stopIfReduced);
    return () => {
      window.clearInterval(id);
      mq.removeEventListener('change', stopIfReduced);
    };
  }, []);
  return data;
}
