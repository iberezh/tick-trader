import type { Portfolio, TradeExecuted } from '@tick-trader/contracts';
import { useAtomValue } from 'jotai';
import { useEffect, useState } from 'react';
import { asOfAtom } from '@/lib/analytics-atoms';
import {
  type Candle,
  type EquityPoint,
  getCandles,
  getEvents,
  getMetrics,
  getPortfolio,
  getPortfolioAt,
} from '@/lib/api';
import { useStore } from '@/lib/store';

export interface Loadable<T> {
  data: T;
  loading: boolean;
}

// Fetch into state, re-running whenever `key` (an encoding of the trigger inputs) changes.
// Only the FIRST settle counts as `loading`, so widgets show a skeleton on initial load but
// keep stale data (no flash) on later refetches such as time-travel scrubs.
function useLoadable<T>(fetcher: () => Promise<T>, fallback: T, key: string): Loadable<T> {
  const [data, setData] = useState<T>(fallback);
  const [loaded, setLoaded] = useState(false);
  // biome-ignore lint/correctness/useExhaustiveDependencies: `key` encodes the inputs; fetcher/fallback are intentionally excluded
  useEffect(() => {
    let alive = true;
    fetcher()
      .then((d) => {
        if (alive) setData(d);
      })
      .catch(() => {
        if (alive) setData(fallback);
      })
      .finally(() => {
        if (alive) setLoaded(true);
      });
    return () => {
      alive = false;
    };
  }, [key]);
  return { data, loading: !loaded };
}

// One key that changes when fresh data should be pulled: each new trade, plus a slow tick
// while live. Frozen (constant) when time-travelling so the view holds still.
function useRefetchKey(): number {
  const asOf = useAtomValue(asOfAtom);
  const trades = useStore((s) => s.trades.length);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (asOf !== null) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 5000);
    return () => window.clearInterval(id);
  }, [asOf]);
  return asOf !== null ? 0 : trades + tick;
}

export function useMetrics(): Loadable<EquityPoint[]> {
  const asOf = useAtomValue(asOfAtom);
  const key = useRefetchKey();
  return useLoadable<EquityPoint[]>(() => getMetrics(60, asOf ?? undefined), [], `${asOf}:${key}`);
}

export function useCandles(symbol: string, bucket = 15): Loadable<Candle[]> {
  const asOf = useAtomValue(asOfAtom);
  const key = useRefetchKey();
  return useLoadable<Candle[]>(
    () => getCandles(symbol, bucket, asOf ?? undefined),
    [],
    `${symbol}:${bucket}:${asOf}:${key}`,
  );
}

export function useManyCandles(symbols: string[]): Loadable<Record<string, Candle[]>> {
  const asOf = useAtomValue(asOfAtom);
  const key = useRefetchKey();
  const joined = symbols.join(',');
  return useLoadable<Record<string, Candle[]>>(
    () =>
      Promise.all(
        symbols.map((s) =>
          getCandles(s, 60, asOf ?? undefined)
            .then((c) => [s, c] as const)
            .catch(() => [s, [] as Candle[]] as const),
        ),
      ).then((entries) => Object.fromEntries(entries)),
    {},
    `${joined}:${asOf}:${key}`,
  );
}

export function usePortfolioAt(ts: number | null): Loadable<Portfolio | null> {
  const key = useRefetchKey();
  return useLoadable<Portfolio | null>(
    () => (ts ? getPortfolioAt(new Date(ts).toISOString()) : getPortfolio()),
    null,
    `${ts}:${key}`,
  );
}

export function usePortfolioSnapshot(): Loadable<Portfolio | null> {
  return usePortfolioAt(useAtomValue(asOfAtom));
}

export function useTradeLog(): TradeExecuted[] {
  const asOf = useAtomValue(asOfAtom);
  const key = useRefetchKey();
  // asOf filters client-side, so trades arriving during time-travel stay hidden until live.
  const { data } = useLoadable<TradeExecuted[]>(
    () => getEvents().then((r) => r.trades),
    [],
    `${key}`,
  );
  return asOf !== null ? data.filter((t) => t.executedAt <= asOf) : data;
}
