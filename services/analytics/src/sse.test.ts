import assert from 'node:assert/strict';
import { test } from 'node:test';
import { SseHub } from './sse.js';

test('prices reach all clients; trades only reach the matching account', () => {
  const hub = new SseHub();
  const a: unknown[] = [];
  const b: unknown[] = [];
  const entryA = hub.add((e) => a.push(e), 'acc-a');
  hub.add((e) => b.push(e), 'acc-b');

  hub.broadcastPrice({ type: 'price', symbol: 'BTCUSDT' });
  hub.broadcastToAccount('acc-a', { type: 'trade' });
  assert.equal(hub.size, 2);
  assert.equal(a.length, 2); // price + own trade
  assert.equal(b.length, 1); // price only

  hub.remove(entryA);
  hub.broadcastPrice({ type: 'price' });
  assert.equal(a.length, 2); // removed → no further events
  assert.equal(b.length, 2);
});
