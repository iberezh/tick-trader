import { useMemo } from 'react';
import { useManyCandles } from '@/hooks/use-analytics-data';
import { SERIES_COLORS, type SymbolSeries, symbolsOption } from '@/lib/analytics-charts';
import { EChart } from '../../app/echart';

const SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'];

export function SymbolsWidget() {
  const candles = useManyCandles(SYMBOLS);
  const option = useMemo(() => {
    const series: SymbolSeries[] = SYMBOLS.map((sym, i) => {
      const cs = candles[sym] ?? [];
      const base = cs[0]?.close ?? 0;
      return {
        symbol: sym.replace('USDT', ''),
        color: SERIES_COLORS[i % SERIES_COLORS.length] ?? '#00e08f',
        data: base ? cs.map((c) => (c.close / base - 1) * 100) : [],
      };
    });
    const ref = candles[SYMBOLS[0] ?? ''] ?? [];
    const labels = ref.map((c) =>
      new Date(c.t).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    );
    return symbolsOption(labels, series);
  }, [candles]);
  return <EChart option={option} height="100%" />;
}
