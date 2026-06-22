import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type EquityPoint, getMetrics } from '@/lib/api';
import { equityOption } from '@/lib/chart-theme';
import { useStore } from '@/lib/store';
import { ChartSkeleton } from './chart-skeleton';
import { EChart } from './echart';

const CHART_HEIGHT = 200;

export function EquityChart() {
  const tradeCount = useStore((s) => s.trades.length);
  const mode = useStore((s) => s.mode);
  const asOf = useStore((s) => s.asOf);
  const [points, setPoints] = useState<EquityPoint[]>([]);
  const [loaded, setLoaded] = useState(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: refetch the curve whenever a new trade lands
  useEffect(() => {
    let alive = true;
    const to = mode === 'historical' && asOf ? asOf : undefined;
    getMetrics(60, to)
      .then((p) => alive && setPoints(p))
      .catch(() => alive && setPoints([]))
      .finally(() => alive && setLoaded(true));
    return () => {
      alive = false;
    };
  }, [tradeCount, mode, asOf]);

  const option = useMemo(() => equityOption(points), [points]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Equity curve</CardTitle>
      </CardHeader>
      <CardContent>
        {loaded ? (
          <EChart option={option} height={CHART_HEIGHT} />
        ) : (
          <ChartSkeleton height={CHART_HEIGHT} />
        )}
      </CardContent>
    </Card>
  );
}
