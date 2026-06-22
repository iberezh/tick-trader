import { useAtom, useSetAtom } from 'jotai';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
import {
  asOfAtom,
  compareAtom,
  DEFAULT_LAYOUT,
  DEFAULT_WIDGETS,
  layoutAtom,
  TIME_WINDOW_MS,
  WIDGET_TITLES,
  type WidgetConfig,
  type WidgetType,
  widgetsAtom,
} from '@/lib/analytics-atoms';

const TYPES: WidgetType[] = [
  'symbols',
  'price',
  'equity',
  'pnl',
  'allocation',
  'positions',
  'events',
];

export function AnalyticsToolbar() {
  const setAsOf = useSetAtom(asOfAtom);
  const [compare, setCompare] = useAtom(compareAtom);
  const setWidgets = useSetAtom(widgetsAtom);
  const setLayout = useSetAtom(layoutAtom);
  const [now] = useState(() => Date.now());
  const [sliderVal, setSliderVal] = useState(now);
  // Commit the scrub position to the shared atom only after the drag settles, so the whole
  // board refetches once per pause instead of on every pixel of movement.
  const commitAsOf = useDebouncedCallback((v: number) => setAsOf(v >= now ? null : v), 150);

  const addWidget = (type: WidgetType): void => {
    const id = `${type}-${Date.now()}`;
    const config: WidgetConfig = type === 'price' ? { id, type, symbol: 'BTCUSDT' } : { id, type };
    setWidgets((prev) => [...prev, config]);
    setLayout((prev) => [
      ...prev,
      { i: id, x: 0, y: prev.reduce((max, l) => Math.max(max, l.y + l.h), 0), w: 2, h: 6 },
    ]);
  };
  const reset = (): void => {
    setWidgets(DEFAULT_WIDGETS);
    setLayout(DEFAULT_LAYOUT);
    setSliderVal(now);
    setAsOf(null);
  };

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-card p-3">
      <span className="font-mono text-xs text-muted-foreground">⏮ time-travel</span>
      <div className="flex min-w-[220px] flex-1 items-center gap-3">
        <Slider
          min={now - TIME_WINDOW_MS}
          max={now}
          step={1000}
          value={[sliderVal]}
          onValueChange={(v) => {
            const next = v[0] ?? now;
            setSliderVal(next);
            commitAsOf(next);
          }}
        />
        <span className="w-20 text-right font-mono text-xs text-up">
          {sliderVal < now ? new Date(sliderVal).toLocaleTimeString() : 'now'}
        </span>
      </div>
      {sliderVal < now ? (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            setSliderVal(now);
            setAsOf(null);
          }}
        >
          Live
        </Button>
      ) : null}
      <label className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
        <input
          type="checkbox"
          checked={compare !== null}
          onChange={(e) => setCompare(e.target.checked ? now - 1_800_000 : null)}
          className="accent-[#f5b81a]"
        />
        compare
      </label>
      <select
        value=""
        aria-label="Add widget"
        onChange={(e) => {
          const t = TYPES.find((x) => x === e.target.value);
          if (t) addWidget(t);
        }}
        className="rounded-md border bg-background px-2 py-1 font-mono text-xs"
      >
        <option value="">+ add widget</option>
        {TYPES.map((t) => (
          <option key={t} value={t}>
            {WIDGET_TITLES[t]}
          </option>
        ))}
      </select>
      <Button size="sm" variant="secondary" onClick={reset}>
        Reset
      </Button>
    </div>
  );
}
