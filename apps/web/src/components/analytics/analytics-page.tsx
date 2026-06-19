import 'react-grid-layout/css/styles.css';
import { useAtom } from 'jotai';
import { useMemo } from 'react';
import { type Layout, Responsive, WidthProvider } from 'react-grid-layout/legacy';
import { layoutAtom, WIDGET_TITLES, widgetsAtom } from '@/lib/analytics-atoms';
import { renderWidget } from './registry';
import { AnalyticsToolbar } from './toolbar';
import { WidgetFrame } from './widget-frame';

const ResponsiveGrid = WidthProvider(Responsive);

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
      <ResponsiveGrid
        className="mt-4"
        layouts={layouts}
        breakpoints={{ lg: 1100, md: 760, sm: 0 }}
        cols={{ lg: 4, md: 2, sm: 1 }}
        rowHeight={48}
        margin={[16, 16]}
        draggableHandle=".drag-handle"
        onLayoutChange={(current: Layout) => setLayout(current)}
      >
        {widgets.map((w) => (
          <div key={w.id}>
            <WidgetFrame title={WIDGET_TITLES[w.type]} onRemove={() => removeWidget(w.id)}>
              {renderWidget(w)}
            </WidgetFrame>
          </div>
        ))}
      </ResponsiveGrid>
    </div>
  );
}
