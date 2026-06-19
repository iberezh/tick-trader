export const money = (n: number): string =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });

export const num = (n: number, digits = 4): string =>
  n.toLocaleString('en-US', { maximumFractionDigits: digits });

export const signed = (n: number): string => `${n >= 0 ? '+' : ''}${money(n)}`;

// Split an exchange pair into base/quote for display: BTCUSDT -> BTC/USDT.
export const formatSymbol = (symbol: string): string =>
  symbol.endsWith('USDT') ? `${symbol.slice(0, -4)}/USDT` : symbol;
