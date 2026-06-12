import {
  createChart,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from 'lightweight-charts';
import { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getMetrics } from '@/lib/api';
import { chartOptions, LINE } from '@/lib/chart-theme';
import { useStore } from '@/lib/store';

export function EquityChart() {
  const tradeCount = useStore((s) => s.trades.length);
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Line'> | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const chart = createChart(el, { ...chartOptions(200), width: el.clientWidth });
    chartRef.current = chart;
    seriesRef.current = chart.addLineSeries({ color: LINE, lineWidth: 2 });
    const onResize = () => chart.applyOptions({ width: el.clientWidth });
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: refetch the curve whenever a new trade lands
  useEffect(() => {
    getMetrics(60)
      .then((points) => {
        seriesRef.current?.setData(
          points.map((p) => ({ time: (p.t / 1000) as UTCTimestamp, value: p.equity })),
        );
        chartRef.current?.timeScale().fitContent();
      })
      .catch(() => {});
  }, [tradeCount]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Equity curve</CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={containerRef} />
      </CardContent>
    </Card>
  );
}
