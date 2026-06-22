import { useMemo } from 'react';
import { usePortfolioSnapshot } from '@/hooks/use-analytics-data';
import { allocationOption } from '@/lib/analytics-charts';
import { ChartSkeleton } from '../../app/chart-skeleton';
import { EChart } from '../../app/echart';

export function AllocationWidget() {
  const { data: portfolio, loading } = usePortfolioSnapshot();
  const option = useMemo(() => allocationOption(portfolio?.positions ?? []), [portfolio]);
  return loading ? <ChartSkeleton height="100%" /> : <EChart option={option} height="100%" />;
}
