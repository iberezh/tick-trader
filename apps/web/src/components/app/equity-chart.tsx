import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type EquityPoint, getMetrics } from '@/lib/api';
import { equityOption } from '@/lib/chart-theme';
import { useStore } from '@/lib/store';
import { EChart } from './echart';

export function EquityChart() {
  const tradeCount = useStore((s) => s.trades.length);
  const mode = useStore((s) => s.mode);
  const asOf = useStore((s) => s.asOf);
  const [points, setPoints] = useState<EquityPoint[]>([]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: refetch the curve whenever a new trade lands
  useEffect(() => {
    const to = mode === 'historical' && asOf ? asOf : undefined;
    getMetrics(60, to)
      .then(setPoints)
      .catch(() => {});
  }, [tradeCount, mode, asOf]);

  const option = useMemo(() => equityOption(points), [points]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Equity curve</CardTitle>
      </CardHeader>
      <CardContent>
        <EChart option={option} height={200} />
      </CardContent>
    </Card>
  );
}
