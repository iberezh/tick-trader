import type { Portfolio, TradeExecuted } from '@tick-trader/contracts';
import { useSyncExternalStore } from 'react';

export type Mode = 'live' | 'historical';

interface State {
  selectedSymbol: string;
  prices: Record<string, number>;
  trades: TradeExecuted[];
  mode: Mode;
  asOf: number | null;
  historical: Portfolio | null;
  connected: boolean;
}

let state: State = {
  selectedSymbol: 'BTCUSDT',
  prices: {},
  trades: [],
  mode: 'live',
  asOf: null,
  historical: null,
  connected: false,
};

const listeners = new Set<() => void>();
const emit = (): void => {
  for (const listener of listeners) listener();
};
const set = (patch: Partial<State>): void => {
  state = { ...state, ...patch };
  emit();
};

export const store = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  get: (): State => state,
  setSymbol: (selectedSymbol: string) => set({ selectedSymbol }),
  applyPrice: (symbol: string, price: number) =>
    set({ prices: { ...state.prices, [symbol]: price } }),
  addTrade: (trade: TradeExecuted) => set({ trades: [...state.trades, trade] }),
  seedTrades: (trades: TradeExecuted[]) => set({ trades }),
  setConnected: (connected: boolean) => set({ connected }),
  goHistorical: (asOf: number, historical: Portfolio) =>
    set({ mode: 'historical', asOf, historical }),
  goLive: () => set({ mode: 'live', asOf: null, historical: null }),
};

// Selectors must return stable slices; derive the portfolio with useMemo in components.
export function useStore<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(
    store.subscribe,
    () => selector(state),
    () => selector(state),
  );
}
