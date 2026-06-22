import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { TradeExecuted } from '@tick-trader/contracts';
import { type OrderContext, placeOrder } from './place-order.js';

const ctx = (over: Partial<OrderContext> = {}): OrderContext => ({
  lastPrice: { BTCUSDT: 100 },
  trades: [],
  now: 1_000,
  orderId: 'order-1',
  accountId: 'acc',
  ...over,
});

test('a valid buy yields OrderPlaced + TradeExecuted at the last price', () => {
  const result = placeOrder({ symbol: 'BTCUSDT', side: 'buy', qty: 2 }, ctx());
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.executed.price, 100);
  assert.equal(result.value.executed.qty, 2);
  assert.equal(result.value.placed.orderId, 'order-1');
});

test('an unknown symbol is rejected', () => {
  const result = placeOrder({ symbol: 'DOGEUSDT', side: 'buy', qty: 1 }, ctx());
  assert.equal(result.ok, false);
});

test('a non-positive quantity is rejected', () => {
  const result = placeOrder({ symbol: 'BTCUSDT', side: 'buy', qty: 0 }, ctx());
  assert.equal(result.ok, false);
});

test('a symbol with no price yet is rejected', () => {
  const result = placeOrder({ symbol: 'BTCUSDT', side: 'buy', qty: 1 }, ctx({ lastPrice: {} }));
  assert.equal(result.ok, false);
});

test('selling more than held is rejected', () => {
  const result = placeOrder({ symbol: 'BTCUSDT', side: 'sell', qty: 5 }, ctx());
  assert.equal(result.ok, false);
});

test('selling within holdings is allowed', () => {
  const trades: TradeExecuted[] = [
    {
      orderId: 'o0',
      accountId: 'acc',
      symbol: 'BTCUSDT',
      side: 'buy',
      qty: 3,
      price: 90,
      executedAt: 1,
    },
  ];
  const result = placeOrder({ symbol: 'BTCUSDT', side: 'sell', qty: 2 }, ctx({ trades }));
  assert.equal(result.ok, true);
});
