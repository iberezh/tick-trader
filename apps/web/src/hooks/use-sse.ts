import type { TradeExecuted } from '@tick-trader/contracts';
import { useEffect } from 'react';
import { ENDPOINTS } from '../lib/api';
import { store } from '../lib/store';

type PriceEvent = { type: 'price'; symbol: string; price: number; ts: number };
type TradeEvent = { type: 'trade' } & TradeExecuted;
type StreamEvent = PriceEvent | TradeEvent;

const handlers: Record<StreamEvent['type'], (event: StreamEvent) => void> = {
  price: (event) => {
    if (event.type !== 'price') return;
    store.applyPrice(event.symbol, event.price);
  },
  trade: (event) => {
    if (event.type !== 'trade') return;
    store.addTrade(event);
  },
};

export function useSse(): void {
  useEffect(() => {
    const source = new EventSource(ENDPOINTS.stream);
    source.onopen = () => store.setConnected(true);
    source.onerror = () => store.setConnected(false);
    source.onmessage = (message) => {
      try {
        const event = JSON.parse(message.data) as StreamEvent;
        handlers[event.type]?.(event);
      } catch {
        // ignore malformed frames
      }
    };
    return () => source.close();
  }, []);
}
