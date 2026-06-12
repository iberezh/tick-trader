import type { PriceTick } from '@tick-trader/contracts';
import WebSocket from 'ws';
import type { MarketFeed } from './feed.js';

interface BinanceTrade {
  data?: { s?: string; p?: string; T?: number };
}

export function parseBinanceTrade(raw: string): PriceTick | null {
  const msg = JSON.parse(raw) as BinanceTrade;
  const d = msg.data;
  if (!d?.s || !d.p || typeof d.T !== 'number') return null;
  return { symbol: d.s, price: Number(d.p), ts: d.T };
}

export class BinanceFeed implements MarketFeed {
  private ws: WebSocket | undefined;
  private closed = false;

  constructor(private readonly symbols: string[]) {}

  start(onTick: (tick: PriceTick) => void): Promise<void> {
    const streams = this.symbols.map((s) => `${s.toLowerCase()}@trade`).join('/');
    this.connect(`wss://stream.binance.com:9443/stream?streams=${streams}`, onTick);
    return Promise.resolve();
  }

  private connect(url: string, onTick: (tick: PriceTick) => void): void {
    const ws = new WebSocket(url);
    this.ws = ws;
    ws.on('message', (data) => {
      const tick = parseBinanceTrade(data.toString());
      if (tick) onTick(tick);
    });
    ws.on('close', () => {
      if (!this.closed) setTimeout(() => this.connect(url, onTick), 1000);
    });
    ws.on('error', () => ws.close());
  }

  stop(): Promise<void> {
    this.closed = true;
    this.ws?.close();
    return Promise.resolve();
  }
}
