import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { getPortfolioAt } from '@/lib/api';
import { store, useStore } from '@/lib/store';

const WINDOW_MS = 3_600_000; // scrub across the last hour

export function TimeTravel() {
  const mode = useStore((s) => s.mode);
  const [now] = useState(() => Date.now());
  const [value, setValue] = useState(now);
  const timer = useRef<number | null>(null);

  const onChange = (next: number): void => {
    setValue(next);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      getPortfolioAt(new Date(next).toISOString())
        .then((portfolio) => store.goHistorical(next, portfolio))
        .catch(() => {});
    }, 200);
  };

  const resume = (): void => {
    setValue(now);
    store.goLive();
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Time travel</CardTitle>
        {mode === 'historical' ? (
          <Button size="sm" variant="secondary" onClick={resume}>
            Live
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <Slider
          min={now - WINDOW_MS}
          max={now}
          step={1000}
          value={[value]}
          onValueChange={(v) => onChange(v[0] ?? now)}
        />
        <p className="text-xs text-muted-foreground">{new Date(value).toLocaleTimeString()}</p>
      </CardContent>
    </Card>
  );
}
