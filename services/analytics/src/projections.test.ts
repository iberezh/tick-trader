import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { TradeExecuted } from '@tick-trader/contracts';
import { sampleEquityCurve, toCandles } from './projections.js';

test('toCandles buckets ticks into OHLC', () => {
  const candles = toCandles(
    [
      { price: 100, ts: 0 },
      { price: 110, ts: 200 },
      { price: 90, ts: 400 },
      { price: 105, ts: 1200 },
    ],
    1000,
  );
  assert.equal(candles.length, 2);
  assert.deepEqual(candles[0], { t: 0, open: 100, high: 110, low: 90, close: 90 });
  assert.deepEqual(candles[1], { t: 1000, open: 105, high: 105, low: 105, close: 105 });
});

test('toCandles guards against a non-positive bucket', () => {
  assert.deepEqual(toCandles([{ price: 100, ts: 0 }], 0), []);
});

test('sampleEquityCurve marks the portfolio to market at each bucket', () => {
  const trades: TradeExecuted[] = [
    { orderId: 'o', symbol: 'BTCUSDT', side: 'buy', qty: 2, price: 100, executedAt: 500 },
  ];
  const ticks = [
    { symbol: 'BTCUSDT', price: 100, ts: 0 },
    { symbol: 'BTCUSDT', price: 130, ts: 1000 },
  ];
  const curve = sampleEquityCurve(trades, ticks, 0, 1000, 1000, 1000);
  assert.equal(curve[0]?.equity, 1000); // t=0: no trade yet → all cash
  assert.equal(curve[1]?.cash, 800); // bought 2@100
  assert.equal(curve[1]?.equity, 1060); // 800 + 2*130
  assert.equal(curve[1]?.unrealizedPnl, 60);
});

test('sampleEquityCurve guards against a non-positive bucket', () => {
  assert.deepEqual(sampleEquityCurve([], [], 0, 1000, 0, 1000), []);
});
