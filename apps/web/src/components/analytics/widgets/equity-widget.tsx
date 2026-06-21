import { useMemo } from 'react';
import { useMetrics } from '@/hooks/use-analytics-data';
import { equityOption } from '@/lib/chart-theme';
import { EChart } from '../../app/echart';

export function EquityWidget() {
  const points = useMetrics();
  const option = useMemo(() => equityOption(points), [points]);
  return <EChart option={option} height="100%" />;
}
