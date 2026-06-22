import { useMemo } from 'react';
import { useMetrics } from '@/hooks/use-analytics-data';
import { pnlOption } from '@/lib/analytics-charts';
import { ChartSkeleton } from '../../app/chart-skeleton';
import { EChart } from '../../app/echart';

export function PnlWidget() {
  const { data: points, loading } = useMetrics();
  const option = useMemo(() => {
    const labels = points.map((p) =>
      new Date(p.t).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    );
    return pnlOption(labels, points);
  }, [points]);
  return loading ? <ChartSkeleton height="100%" /> : <EChart option={option} height="100%" />;
}
