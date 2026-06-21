import 'react-grid-layout/css/styles.css';
import { useAtom } from 'jotai';
import { useMemo } from 'react';
import { type Layout, Responsive, WidthProvider } from 'react-grid-layout/legacy';
import { layoutAtom, WIDGET_TITLES, widgetsAtom } from '@/lib/analytics-atoms';
import { CompareBar } from './compare-bar';
import { renderWidget } from './registry';
import { AnalyticsToolbar } from './toolbar';
import { WidgetFrame } from './widget-frame';

const Grid = WidthProvider(Responsive);

// A single `lg` breakpoint at width 0 keeps the board a fixed 4-column grid at any width.
export function AnalyticsPage() {
  const [layout, setLayout] = useAtom(layoutAtom);
  const [widgets, setWidgets] = useAtom(widgetsAtom);
  const layouts = useMemo(() => ({ lg: layout }), [layout]);

  const removeWidget = (id: string): void => {
    setWidgets(widgets.filter((w) => w.id !== id));
    setLayout(layout.filter((l) => l.i !== id));
  };

  return (
    <div className="mx-auto max-w-[1400px] p-4">
      <AnalyticsToolbar />
      <CompareBar />
      <Grid
        className="mt-4"
        layouts={layouts}
        breakpoints={{ lg: 0 }}
        cols={{ lg: 4 }}
        rowHeight={48}
        margin={[16, 16]}
        containerPadding={[0, 0]}
        measureBeforeMount
        isDraggable
        isResizable
        draggableHandle=".drag-handle"
        resizeHandles={['se']}
        onLayoutChange={(current: Layout) => {
          // Ignore degenerate/partial layouts so a bad frame can't be persisted.
          if (current.length > 0 && current.every((l) => l.w > 0 && l.h > 0)) setLayout(current);
        }}
      >
        {widgets.map((w) => (
          <div key={w.id}>
            <WidgetFrame title={WIDGET_TITLES[w.type]} onRemove={() => removeWidget(w.id)}>
              {renderWidget(w)}
            </WidgetFrame>
          </div>
        ))}
      </Grid>
    </div>
  );
}
