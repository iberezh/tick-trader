import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseBinanceTrade } from './binance-feed.js';

test('parseBinanceTrade maps a combined-stream trade message to a PriceTick', () => {
  const raw = JSON.stringify({
    stream: 'btcusdt@trade',
    data: { s: 'BTCUSDT', p: '65123.45', T: 1718000000000 },
  });
  assert.deepEqual(parseBinanceTrade(raw), {
    symbol: 'BTCUSDT',
    price: 65123.45,
    ts: 1718000000000,
  });
});

test('parseBinanceTrade returns null for non-trade payloads', () => {
  assert.equal(parseBinanceTrade(JSON.stringify({ result: null, id: 1 })), null);
});
