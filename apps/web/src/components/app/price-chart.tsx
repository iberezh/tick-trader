import {
  type CandlestickData,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from 'lightweight-charts';
import { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getCandles } from '@/lib/api';
import { chartOptions, DOWN, UP } from '@/lib/chart-theme';
import { formatSymbol } from '@/lib/format';
import { store, useStore } from '@/lib/store';

const BUCKET_SEC = 15;
const bucketOf = (ms: number): UTCTimestamp =>
  (Math.floor(ms / 1000 / BUCKET_SEC) * BUCKET_SEC) as UTCTimestamp;

export function PriceChart() {
  const symbol = useStore((s) => s.selectedSymbol);
  const mode = useStore((s) => s.mode);
  const asOf = useStore((s) => s.asOf);
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const currentRef = useRef<CandlestickData | null>(null);

  // Build the chart once per symbol; live ticks fold into the last candle (live mode only).
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const chart = createChart(el, { ...chartOptions(320), width: el.clientWidth });
    chartRef.current = chart;
    seriesRef.current = chart.addCandlestickSeries({
      upColor: UP,
      downColor: DOWN,
      wickUpColor: UP,
      wickDownColor: DOWN,
      borderVisible: false,
    });

    const unsubscribe = store.subscribe(() => {
      if (store.get().mode !== 'live') return; // frozen while time-travelling
      const price = store.get().prices[symbol];
      if (price === undefined) return;
      const time = bucketOf(Date.now());
      const cur = currentRef.current;
      currentRef.current =
        !cur || cur.time !== time
          ? { time, open: price, high: price, low: price, close: price }
          : {
              ...cur,
              high: Math.max(cur.high, price),
              low: Math.min(cur.low, price),
              close: price,
            };
      seriesRef.current?.update(currentRef.current);
    });

    const onResize = () => chart.applyOptions({ width: el.clientWidth });
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      unsubscribe();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [symbol]);

  // (Re)load history when the symbol or the as-of point changes — historical scrubs end at asOf.
  useEffect(() => {
    const to = mode === 'historical' && asOf ? asOf : undefined;
    getCandles(symbol, BUCKET_SEC, to)
      .then((candles) => {
        seriesRef.current?.setData(
          candles.map((c) => ({
            time: (c.t / 1000) as UTCTimestamp,
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
          })),
        );
        currentRef.current = candles.length
          ? ({ ...seriesRef.current?.dataByIndex(candles.length - 1) } as CandlestickData)
          : null;
        chartRef.current?.timeScale().fitContent();
      })
      .catch(() => {});
  }, [symbol, mode, asOf]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{formatSymbol(symbol)} · price</CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={containerRef} />
      </CardContent>
    </Card>
  );
}
