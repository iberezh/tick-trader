import { type CandlestickData, createChart, type UTCTimestamp } from 'lightweight-charts';
import { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getCandles } from '@/lib/api';
import { chartOptions, DOWN, UP } from '@/lib/chart-theme';
import { store, useStore } from '@/lib/store';

const BUCKET_SEC = 15;
const bucketOf = (ms: number): UTCTimestamp =>
  (Math.floor(ms / 1000 / BUCKET_SEC) * BUCKET_SEC) as UTCTimestamp;

export function PriceChart() {
  const symbol = useStore((s) => s.selectedSymbol);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const chart = createChart(el, { ...chartOptions(320), width: el.clientWidth });
    const series = chart.addCandlestickSeries({
      upColor: UP,
      downColor: DOWN,
      wickUpColor: UP,
      wickDownColor: DOWN,
      borderVisible: false,
    });
    let current: CandlestickData | null = null;

    getCandles(symbol, BUCKET_SEC)
      .then((candles) => {
        series.setData(
          candles.map((c) => ({
            time: (c.t / 1000) as UTCTimestamp,
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
          })),
        );
        current = candles.length
          ? ({ ...series.dataByIndex(candles.length - 1) } as CandlestickData)
          : null;
      })
      .catch(() => {});

    const unsubscribe = store.subscribe(() => {
      const price = store.get().prices[symbol];
      if (price === undefined) return;
      const time = bucketOf(Date.now());
      current =
        !current || current.time !== time
          ? { time, open: price, high: price, low: price, close: price }
          : {
              ...current,
              high: Math.max(current.high, price),
              low: Math.min(current.low, price),
              close: price,
            };
      series.update(current);
    });

    const onResize = () => chart.applyOptions({ width: el.clientWidth });
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      unsubscribe();
      chart.remove();
    };
  }, [symbol]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{symbol} · price</CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={containerRef} />
      </CardContent>
    </Card>
  );
}
