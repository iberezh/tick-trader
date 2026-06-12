import type { PriceTick } from '@tick-trader/contracts';

export interface MarketFeed {
  start(onTick: (tick: PriceTick) => void): Promise<void>;
  stop(): Promise<void>;
}
