export const SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'] as const;
export type Symbol = (typeof SYMBOLS)[number];

// Notional starting cash for the single anonymous paper account. Cash is always
// DERIVED by folding trades from this constant — never stored as a mutable balance.
export const STARTING_CASH = 100_000;
