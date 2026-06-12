import type { PriceTick } from '@tick-trader/contracts';
import type { MarketFeed } from './feed.js';

const SEED_PRICES: Record<string, number> = { BTCUSDT: 65_000, ETHUSDT: 3_500, SOLUSDT: 150 };

export class SimulatedFeed implements MarketFeed {
  private timer: NodeJS.Timeout | undefined;
  private readonly prices: Map<string, number>;

  constructor(
    private readonly symbols: string[],
    private readonly intervalMs = 500,
    private readonly rng: () => number = Math.random,
  ) {
    this.prices = new Map(symbols.map((s) => [s, SEED_PRICES[s] ?? 100]));
  }

  start(onTick: (tick: PriceTick) => void): Promise<void> {
    this.timer = setInterval(() => {
      for (const symbol of this.symbols) {
        const prev = this.prices.get(symbol) ?? 100;
        const next = Math.max(0.01, prev * (1 + (this.rng() - 0.5) * 0.002));
        this.prices.set(symbol, next);
        onTick({ symbol, price: Number(next.toFixed(2)), ts: Date.now() });
      }
    }, this.intervalMs);
    return Promise.resolve();
  }

  stop(): Promise<void> {
    if (this.timer) clearInterval(this.timer);
    return Promise.resolve();
  }
}
