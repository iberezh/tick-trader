import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import type { Layout } from 'react-grid-layout/legacy';

export type WidgetType =
  | 'symbols'
  | 'price'
  | 'equity'
  | 'pnl'
  | 'allocation'
  | 'positions'
  | 'events';

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  symbol?: string;
}

export const WIDGET_TITLES: Record<WidgetType, string> = {
  symbols: 'Symbol performance · %',
  price: 'Price · candles',
  equity: 'Equity curve',
  pnl: 'P&L · realized vs unrealized',
  allocation: 'Allocation · cost basis',
  positions: 'Positions',
  events: 'Event log',
};

export const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: 'symbols', type: 'symbols' },
  { id: 'price', type: 'price', symbol: 'BTCUSDT' },
  { id: 'equity', type: 'equity' },
  { id: 'pnl', type: 'pnl' },
  { id: 'allocation', type: 'allocation' },
  { id: 'positions', type: 'positions' },
  { id: 'events', type: 'events' },
];

export const DEFAULT_LAYOUT: Layout = [
  { i: 'symbols', x: 0, y: 0, w: 4, h: 6 },
  { i: 'price', x: 0, y: 6, w: 2, h: 7 },
  { i: 'equity', x: 2, y: 6, w: 2, h: 7 },
  { i: 'pnl', x: 0, y: 13, w: 2, h: 6 },
  { i: 'allocation', x: 2, y: 13, w: 2, h: 6 },
  { i: 'positions', x: 0, y: 19, w: 2, h: 6 },
  { i: 'events', x: 2, y: 19, w: 2, h: 6 },
];

// Persisted so a custom board survives reload (per-browser, like a drawing tool).
export const widgetsAtom = atomWithStorage<WidgetConfig[]>('tt.analytics.widgets', DEFAULT_WIDGETS);
export const layoutAtom = atomWithStorage<Layout>('tt.analytics.layout.3', DEFAULT_LAYOUT);

// Time-travel: T (null = live/now) and an optional compare marker T2.
export const asOfAtom = atom<number | null>(null);
export const compareAtom = atom<number | null>(null);

// The time-travel window the toolbar/compare sliders scrub over (last hour).
export const TIME_WINDOW_MS = 3_600_000;
