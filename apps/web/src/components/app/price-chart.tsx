import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type Candle, getCandles } from '@/lib/api';
import { candleOption } from '@/lib/chart-theme';
import { formatSymbol } from '@/lib/format';
import { store, useStore } from '@/lib/store';
import { EChart } from './echart';

const BUCKET_SEC = 15;
const bucketMs = (ms: number): number => Math.floor(ms / 1000 / BUCKET_SEC) * BUCKET_SEC * 1000;

export function PriceChart() {
  const symbol = useStore((s) => s.selectedSymbol);
  const mode = useStore((s) => s.mode);
  const asOf = useStore((s) => s.asOf);
  const [candles, setCandles] = useState<Candle[]>([]);

  // (Re)load history when the symbol or the as-of point changes — historical scrubs end at asOf.
  useEffect(() => {
    const to = mode === 'historical' && asOf ? asOf : undefined;
    getCandles(symbol, BUCKET_SEC, to)
      .then(setCandles)
      .catch(() => {});
  }, [symbol, mode, asOf]);

  // Live ticks fold into the last candle (live mode only).
  useEffect(() => {
    if (mode !== 'live') return;
    return store.subscribe(() => {
      const price = store.get().prices[symbol];
      if (price === undefined) return;
      const t = bucketMs(Date.now());
      setCandles((prev) => {
        const last = prev[prev.length - 1];
        if (last && last.t === t) {
          const merged: Candle = {
            ...last,
            high: Math.max(last.high, price),
            low: Math.min(last.low, price),
            close: price,
          };
          return [...prev.slice(0, -1), merged];
        }
        return [...prev, { t, open: price, high: price, low: price, close: price }];
      });
    });
  }, [symbol, mode]);

  const option = useMemo(() => candleOption(candles), [candles]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{formatSymbol(symbol)} · price</CardTitle>
      </CardHeader>
      <CardContent>
        <EChart option={option} height={320} />
      </CardContent>
    </Card>
  );
}
