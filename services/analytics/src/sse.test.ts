import assert from 'node:assert/strict';
import { test } from 'node:test';
import { SseHub } from './sse.js';

test('SseHub broadcasts to all clients and stops after remove', () => {
  const hub = new SseHub();
  const a: unknown[] = [];
  const b: unknown[] = [];
  const clientA = (e: unknown) => a.push(e);
  const clientB = (e: unknown) => b.push(e);
  hub.add(clientA);
  hub.add(clientB);
  hub.broadcast({ type: 'price', symbol: 'BTCUSDT' });
  assert.equal(hub.size, 2);
  hub.remove(clientB);
  hub.broadcast({ type: 'trade' });
  assert.equal(a.length, 2);
  assert.equal(b.length, 1);
});
