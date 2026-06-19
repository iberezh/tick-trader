import { useMemo } from 'react';
import { usePortfolioSnapshot } from '@/hooks/use-analytics-data';
import { allocationOption } from '@/lib/analytics-charts';
import { EChart } from '../../app/echart';

export function AllocationWidget() {
  const portfolio = usePortfolioSnapshot();
  const option = useMemo(() => allocationOption(portfolio?.positions ?? []), [portfolio]);
  return <EChart option={option} height="100%" />;
}
