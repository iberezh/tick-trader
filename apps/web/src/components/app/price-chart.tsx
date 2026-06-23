import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { useDrawing } from '@/hooks/use-drawing';
import { type Candle, getCandles } from '@/lib/api';
import { candleTimeOption } from '@/lib/chart-theme';
import { drawOverlay } from '@/lib/draw';
import type { EChartInstance } from '@/lib/echarts';
import { formatSymbol } from '@/lib/format';
import { store, useStore } from '@/lib/store';
import { ChartSkeleton } from './chart-skeleton';
import { DrawToolbar } from './draw-toolbar';
import { EChart } from './echart';

const CHART_HEIGHT = 320;

const BUCKET_SEC = 15;
const bucketMs = (ms: number): number => Math.floor(ms / 1000 / BUCKET_SEC) * BUCKET_SEC * 1000;

export function PriceChart() {
  const symbol = useStore((s) => s.selectedSymbol);
  const mode = useStore((s) => s.mode);
  const asOf = useStore((s) => s.asOf);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [chart, setChart] = useState<EChartInstance | null>(null);
  const onReady = useCallback((c: EChartInstance | null) => setChart(c), []);

  const { account } = useAuth();
  // v2: drawings now store [timestamp, price]; the old v1 (candle-index) shapes are incompatible.
  const storageKey = account ? `tt:draw:v2:${account.id}:${symbol}` : null;
  const draw = useDrawing(chart, storageKey);

  // (Re)load history when the symbol or the as-of point changes — historical scrubs end at asOf.
  useEffect(() => {
    let alive = true;
    const to = mode === 'historical' && asOf ? asOf : undefined;
    getCandles(symbol, BUCKET_SEC, to)
      .then((c) => alive && setCandles(c))
      .catch(() => alive && setCandles([]))
      .finally(() => alive && setLoaded(true));
    return () => {
      alive = false;
    };
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

  const option = useMemo(() => {
    const lines = draw.preview ? [...draw.segments, draw.preview] : draw.segments;
    const overlay = lines.length ? drawOverlay(lines) : undefined;
    // Furthest drawn timestamp keeps future-projected shapes on-screen even after the pen is off.
    const drawnMaxT = lines.reduce((m, s) => s.points.reduce((mm, [t]) => Math.max(mm, t), m), 0);
    return candleTimeOption(candles, {
      overlay,
      lockZoom: draw.enabled,
      future: draw.enabled,
      drawnMaxT,
    });
  }, [candles, draw.segments, draw.preview, draw.enabled]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>{formatSymbol(symbol)} · price</CardTitle>
          <DrawToolbar
            enabled={draw.enabled}
            mode={draw.mode}
            color={draw.color}
            palette={draw.palette}
            hasLines={draw.segments.length > 0}
            toggle={draw.toggle}
            setMode={draw.setMode}
            setColor={draw.setColor}
            undo={draw.undo}
            clear={draw.clear}
          />
        </div>
      </CardHeader>
      <CardContent>
        {loaded ? (
          <EChart option={option} height={CHART_HEIGHT} onReady={onReady} />
        ) : (
          <ChartSkeleton height={CHART_HEIGHT} />
        )}
      </CardContent>
    </Card>
  );
}
