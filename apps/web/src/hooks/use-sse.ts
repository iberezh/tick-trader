import type { TradeExecuted } from '@tick-trader/contracts';
import { useEffect } from 'react';
import { ENDPOINTS } from '../lib/api';
import { store } from '../lib/store';

type PriceEvent = { type: 'price'; symbol: string; price: number; ts: number };
type TradeEvent = { type: 'trade' } & TradeExecuted;
type StreamEvent = PriceEvent | TradeEvent;

const handlers: Record<StreamEvent['type'], (event: StreamEvent) => void> = {
  price: (event) => {
    const e = event as PriceEvent;
    store.applyPrice(e.symbol, e.price);
  },
  trade: (event) => store.addTrade(event as TradeEvent),
};

export function useSse(): void {
  useEffect(() => {
    const source = new EventSource(ENDPOINTS.stream);
    source.onopen = () => store.setConnected(true);
    source.onerror = () => store.setConnected(false);
    source.onmessage = (message) => {
      const event = JSON.parse(message.data) as StreamEvent;
      handlers[event.type]?.(event);
    };
    return () => source.close();
  }, []);
}
