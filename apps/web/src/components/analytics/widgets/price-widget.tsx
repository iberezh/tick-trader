import { useMemo } from 'react';
import { useCandles } from '@/hooks/use-analytics-data';
import { candleOption } from '@/lib/chart-theme';
import { EChart } from '../../app/echart';

export function PriceWidget({ symbol = 'BTCUSDT' }: { symbol?: string }) {
  const candles = useCandles(symbol);
  const option = useMemo(() => candleOption(candles), [candles]);
  return <EChart option={option} height="100%" />;
}
