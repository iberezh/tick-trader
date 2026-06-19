import { useEffect } from 'react';
import { getEvents } from '../lib/api';
import { store } from '../lib/store';

// Seed the trade list from the analytics event history so the portfolio is correct
// before the first live trade arrives over SSE.
export function useBootstrap(): void {
  useEffect(() => {
    getEvents()
      .then((res) => store.seedTrades(res.trades))
      .catch(() => store.seedTrades([]));
  }, []);
}
