import assert from 'node:assert/strict';
import { test } from 'node:test';
import { SimulatedFeed } from './simulated-feed.js';

test('SimulatedFeed emits a valid tick for each symbol', async () => {
  const seen: string[] = [];
  const feed = new SimulatedFeed(['BTCUSDT', 'ETHUSDT'], 5, () => 0.5);
  await feed.start((tick) => {
    assert.ok(tick.price > 0);
    assert.equal(typeof tick.ts, 'number');
    if (!seen.includes(tick.symbol)) seen.push(tick.symbol);
  });
  await new Promise((r) => setTimeout(r, 40));
  await feed.stop();
  assert.deepEqual(seen.sort(), ['BTCUSDT', 'ETHUSDT']);
});
