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

// One key that changes when fresh data should be pulled: on each new trade, plus a
// slow tick while live. Frozen (constant) when time-travelling so the view holds still.
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

export function useMetrics(): EquityPoint[] {
  const asOf = useAtomValue(asOfAtom);
  const key = useRefetchKey();
  const [data, setData] = useState<EquityPoint[]>([]);
  // biome-ignore lint/correctness/useExhaustiveDependencies: key re-triggers the live refetch
  useEffect(() => {
    let alive = true;
    getMetrics(60, asOf ?? undefined)
      .then((d) => {
        if (alive) setData(d);
      })
      .catch(() => {
        if (alive) setData([]);
      });
    return () => {
      alive = false;
    };
  }, [asOf, key]);
  return data;
}

export function useCandles(symbol: string, bucket = 15): Candle[] {
  const asOf = useAtomValue(asOfAtom);
  const key = useRefetchKey();
  const [data, setData] = useState<Candle[]>([]);
  // biome-ignore lint/correctness/useExhaustiveDependencies: key re-triggers the live refetch
  useEffect(() => {
    let alive = true;
    getCandles(symbol, bucket, asOf ?? undefined)
      .then((d) => {
        if (alive) setData(d);
      })
      .catch(() => {
        if (alive) setData([]);
      });
    return () => {
      alive = false;
    };
  }, [symbol, bucket, asOf, key]);
  return data;
}

export function useManyCandles(symbols: string[]): Record<string, Candle[]> {
  const asOf = useAtomValue(asOfAtom);
  const key = useRefetchKey();
  const [data, setData] = useState<Record<string, Candle[]>>({});
  const joined = symbols.join(',');
  // biome-ignore lint/correctness/useExhaustiveDependencies: `joined` tracks the stable symbol list
  useEffect(() => {
    let alive = true;
    Promise.all(
      symbols.map((s) =>
        getCandles(s, 60, asOf ?? undefined)
          .then((c) => [s, c] as const)
          .catch(() => [s, [] as Candle[]] as const),
      ),
    ).then((entries) => {
      if (alive) setData(Object.fromEntries(entries));
    });
    return () => {
      alive = false;
    };
  }, [joined, asOf, key]);
  return data;
}

export function usePortfolioAt(ts: number | null): Portfolio | null {
  const key = useRefetchKey();
  const [data, setData] = useState<Portfolio | null>(null);
  // biome-ignore lint/correctness/useExhaustiveDependencies: key re-triggers the live refetch
  useEffect(() => {
    let alive = true;
    const req = ts ? getPortfolioAt(new Date(ts).toISOString()) : getPortfolio();
    req
      .then((d) => {
        if (alive) setData(d);
      })
      .catch(() => {
        if (alive) setData(null);
      });
    return () => {
      alive = false;
    };
  }, [ts, key]);
  return data;
}

export function usePortfolioSnapshot(): Portfolio | null {
  return usePortfolioAt(useAtomValue(asOfAtom));
}

export function useTradeLog(): TradeExecuted[] {
  const asOf = useAtomValue(asOfAtom);
  const key = useRefetchKey();
  const [data, setData] = useState<TradeExecuted[]>([]);
  // biome-ignore lint/correctness/useExhaustiveDependencies: fetched once per live tick; asOf filters client-side, so trades arriving during time-travel stay hidden until live resumes
  useEffect(() => {
    let alive = true;
    getEvents()
      .then((r) => {
        if (alive) setData(r.trades);
      })
      .catch(() => {
        if (alive) setData([]);
      });
    return () => {
      alive = false;
    };
  }, [key]);
  return asOf !== null ? data.filter((t) => t.executedAt <= asOf) : data;
}
