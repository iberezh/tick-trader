import { useMemo } from 'react';
import { useCandles } from '@/hooks/use-analytics-data';
import { candleOption } from '@/lib/chart-theme';
import { ChartSkeleton } from '../../app/chart-skeleton';
import { EChart } from '../../app/echart';

export function PriceWidget({ symbol = 'BTCUSDT' }: { symbol?: string }) {
  const { data: candles, loading } = useCandles(symbol);
  const option = useMemo(() => candleOption(candles), [candles]);
  return loading ? <ChartSkeleton height="100%" /> : <EChart option={option} height="100%" />;
}
