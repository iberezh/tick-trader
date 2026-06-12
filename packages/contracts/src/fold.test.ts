import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { TradeExecuted } from './events.js';
import { buildPortfolio, equity, foldAccount, unrealizedPnl } from './fold.js';

const trade = (over: Partial<TradeExecuted>): TradeExecuted => ({
  orderId: 'o',
  symbol: 'BTCUSDT',
  side: 'buy',
  qty: 1,
  price: 100,
  executedAt: 1,
  ...over,
});

test('foldAccount: a buy reduces cash and sets average cost', () => {
  const acc = foldAccount([trade({ side: 'buy', qty: 2, price: 100 })], 1000);
  assert.equal(acc.cash, 800);
  assert.deepEqual(acc.positions, [{ symbol: 'BTCUSDT', qty: 2, avgCost: 100 }]);
  assert.equal(acc.realizedPnl, 0);
});

test('foldAccount: two buys produce a weighted average cost', () => {
  const acc = foldAccount([trade({ qty: 2, price: 100 }), trade({ qty: 2, price: 200 })], 1000);
  assert.equal(acc.positions[0]?.avgCost, 150);
  assert.equal(acc.positions[0]?.qty, 4);
});

test('foldAccount: a sell realizes pnl and adds cash', () => {
  const acc = foldAccount(
    [trade({ side: 'buy', qty: 2, price: 100 }), trade({ side: 'sell', qty: 1, price: 150 })],
    1000,
  );
  assert.equal(acc.realizedPnl, 50); // 1 * (150 - 100)
  assert.equal(acc.cash, 950); // -200 + 150
  assert.equal(acc.positions[0]?.qty, 1);
});

test('foldAccount: fully closing a position drops it', () => {
  const acc = foldAccount(
    [trade({ side: 'buy', qty: 1, price: 100 }), trade({ side: 'sell', qty: 1, price: 120 })],
    1000,
  );
  assert.deepEqual(acc.positions, []);
});

test('unrealizedPnl uses the supplied price map', () => {
  const acc = foldAccount([trade({ qty: 2, price: 100 })], 1000);
  assert.equal(unrealizedPnl(acc.positions, { BTCUSDT: 130 }), 60); // 2 * (130-100)
  assert.equal(equity(acc.cash, acc.positions, { BTCUSDT: 130 }), 800 + 260);
});

test('buildPortfolio composes derived state', () => {
  const p = buildPortfolio(
    [trade({ qty: 2, price: 100 })],
    1000,
    { BTCUSDT: 130 },
    '2026-06-12T00:00:00Z',
  );
  assert.equal(p.cash, 800);
  assert.equal(p.unrealizedPnl, 60);
  assert.equal(p.equity, 1060);
  assert.equal(p.asOf, '2026-06-12T00:00:00Z');
});
