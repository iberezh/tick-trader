import { SYMBOLS } from '@tick-trader/contracts';
import { BinanceFeed } from './binance-feed.js';
import type { MarketFeed } from './feed.js';
import { SimulatedFeed } from './simulated-feed.js';

const factories: Record<'binance' | 'sim', () => MarketFeed> = {
  binance: () => new BinanceFeed([...SYMBOLS]),
  sim: () => new SimulatedFeed([...SYMBOLS]),
};

export function createFeed(kind: 'binance' | 'sim'): MarketFeed {
  return factories[kind]();
}
