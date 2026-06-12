import { buildPortfolio, type Portfolio, STARTING_CASH } from '@tick-trader/contracts';
import { useMemo } from 'react';
import { useStore } from '../lib/store';

// Live portfolio derived from the trade log + live prices with the SAME fold the
// server uses; falls back to the historical snapshot when time-travelling.
export function usePortfolio(): Portfolio {
  const trades = useStore((s) => s.trades);
  const prices = useStore((s) => s.prices);
  const mode = useStore((s) => s.mode);
  const historical = useStore((s) => s.historical);

  const live = useMemo(
    () => buildPortfolio(trades, STARTING_CASH, prices, new Date().toISOString()),
    [trades, prices],
  );

  return mode === 'historical' && historical ? historical : live;
}
