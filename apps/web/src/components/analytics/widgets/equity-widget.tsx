import { useMemo } from 'react';
import { useMetrics } from '@/hooks/use-analytics-data';
import { equityOption } from '@/lib/chart-theme';
import { ChartSkeleton } from '../../app/chart-skeleton';
import { EChart } from '../../app/echart';

export function EquityWidget() {
  const { data: points, loading } = useMetrics();
  const option = useMemo(() => equityOption(points), [points]);
  return loading ? <ChartSkeleton height="100%" /> : <EChart option={option} height="100%" />;
}
