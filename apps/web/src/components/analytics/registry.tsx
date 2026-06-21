import type { ReactElement } from 'react';
import type { WidgetConfig, WidgetType } from '@/lib/analytics-atoms';
import { AllocationWidget } from './widgets/allocation-widget';
import { EquityWidget } from './widgets/equity-widget';
import { EventsWidget } from './widgets/events-widget';
import { PnlWidget } from './widgets/pnl-widget';
import { PositionsWidget } from './widgets/positions-widget';
import { PriceWidget } from './widgets/price-widget';
import { SymbolsWidget } from './widgets/symbols-widget';

// Widget registry: type -> renderer. Adding a chart type is one entry here.
const RENDERERS: Record<WidgetType, (config: WidgetConfig) => ReactElement> = {
  symbols: () => <SymbolsWidget />,
  price: (c) => <PriceWidget symbol={c.symbol ?? 'BTCUSDT'} />,
  equity: () => <EquityWidget />,
  pnl: () => <PnlWidget />,
  allocation: () => <AllocationWidget />,
  positions: () => <PositionsWidget />,
  events: () => <EventsWidget />,
};

export const renderWidget = (config: WidgetConfig): ReactElement => RENDERERS[config.type](config);
