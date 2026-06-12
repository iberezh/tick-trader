import type { Side, TradeExecuted } from './events.js';

export interface Position {
  symbol: string;
  qty: number;
  avgCost: number;
}

export interface Account {
  cash: number;
  realizedPnl: number;
  positions: Position[];
}

export interface Portfolio {
  asOf: string;
  cash: number;
  equity: number;
  positions: Position[];
  realizedPnl: number;
  unrealizedPnl: number;
}

interface MutableAcc {
  cash: number;
  realizedPnl: number;
  bySymbol: Map<string, { qty: number; avgCost: number }>;
}

// Dispatch on side instead of an if/else chain — one reducer per trade direction.
const reducers: Record<Side, (acc: MutableAcc, t: TradeExecuted) => void> = {
  buy: (acc, t) => {
    const pos = acc.bySymbol.get(t.symbol) ?? { qty: 0, avgCost: 0 };
    const newQty = pos.qty + t.qty;
    pos.avgCost = newQty === 0 ? 0 : (pos.qty * pos.avgCost + t.qty * t.price) / newQty;
    pos.qty = newQty;
    acc.bySymbol.set(t.symbol, pos);
    acc.cash -= t.qty * t.price;
  },
  sell: (acc, t) => {
    const pos = acc.bySymbol.get(t.symbol) ?? { qty: 0, avgCost: 0 };
    acc.realizedPnl += t.qty * (t.price - pos.avgCost);
    pos.qty -= t.qty;
    if (pos.qty === 0) pos.avgCost = 0;
    acc.bySymbol.set(t.symbol, pos);
    acc.cash += t.qty * t.price;
  },
};

export function foldAccount(trades: TradeExecuted[], startingCash: number): Account {
  const acc: MutableAcc = { cash: startingCash, realizedPnl: 0, bySymbol: new Map() };
  for (const t of trades) reducers[t.side](acc, t);
  const positions = [...acc.bySymbol.entries()]
    .filter(([, p]) => p.qty !== 0)
    .map(([symbol, p]) => ({ symbol, qty: p.qty, avgCost: p.avgCost }));
  return { cash: acc.cash, realizedPnl: acc.realizedPnl, positions };
}

export function marketValue(positions: Position[], priceBySymbol: Record<string, number>): number {
  return positions.reduce((sum, p) => sum + p.qty * (priceBySymbol[p.symbol] ?? p.avgCost), 0);
}

export function unrealizedPnl(
  positions: Position[],
  priceBySymbol: Record<string, number>,
): number {
  return positions.reduce(
    (sum, p) => sum + p.qty * ((priceBySymbol[p.symbol] ?? p.avgCost) - p.avgCost),
    0,
  );
}

export function equity(
  cash: number,
  positions: Position[],
  priceBySymbol: Record<string, number>,
): number {
  return cash + marketValue(positions, priceBySymbol);
}

export function buildPortfolio(
  trades: TradeExecuted[],
  startingCash: number,
  priceBySymbol: Record<string, number>,
  asOf: string,
): Portfolio {
  const acc = foldAccount(trades, startingCash);
  return {
    asOf,
    cash: acc.cash,
    equity: equity(acc.cash, acc.positions, priceBySymbol),
    positions: acc.positions,
    realizedPnl: acc.realizedPnl,
    unrealizedPnl: unrealizedPnl(acc.positions, priceBySymbol),
  };
}
