import { useAtom, useAtomValue } from 'jotai';
import { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { usePortfolioAt } from '@/hooks/use-analytics-data';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
import { asOfAtom, compareAtom, TIME_WINDOW_MS } from '@/lib/analytics-atoms';
import { money } from '@/lib/format';

function Delta({ label, a, b }: { label: string; a: number; b: number }) {
  const d = a - b;
  return (
    <span className="font-mono text-xs text-muted-foreground">
      Δ {label}{' '}
      <b className={d >= 0 ? 'text-up' : 'text-down'}>
        {d >= 0 ? '+' : '−'}
        {money(Math.abs(d))}
      </b>
    </span>
  );
}

// Shown only when compare is on (compareAtom !== null): a T2 slider + a panel
// diffing the portfolio between T (asOf) and T2.
export function CompareBar() {
  const asOf = useAtomValue(asOfAtom);
  const [compare, setCompare] = useAtom(compareAtom);
  const [now] = useState(() => Date.now());
  const [sliderVal, setSliderVal] = useState(compare ?? now - 1_800_000);
  // Commit the dragged T2 to the atom only after the drag settles (see toolbar).
  const commitCompare = useDebouncedCallback((v: number) => setCompare(v), 150);
  const { data: atT } = usePortfolioAt(asOf);
  const { data: atT2 } = usePortfolioAt(compare);

  if (compare === null) return null;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-4 rounded-lg border border-l-2 border-l-[#f5b81a] bg-card p-3">
      <span className="font-mono text-xs text-[#f5b81a]">⇄ compare · T2</span>
      <div className="flex min-w-[200px] flex-1 items-center gap-3">
        <Slider
          min={now - TIME_WINDOW_MS}
          max={now}
          step={1000}
          value={[sliderVal]}
          onValueChange={(v) => {
            const next = v[0] ?? sliderVal;
            setSliderVal(next);
            commitCompare(next);
          }}
        />
        <span className="w-20 text-right font-mono text-xs text-[#f5b81a]">
          {new Date(sliderVal).toLocaleTimeString()}
        </span>
      </div>
      {atT && atT2 ? (
        <div className="flex flex-wrap items-center gap-4">
          <Delta label="equity" a={atT.equity} b={atT2.equity} />
          <Delta label="realized" a={atT.realizedPnl} b={atT2.realizedPnl} />
          <Delta label="unrealized" a={atT.unrealizedPnl} b={atT2.unrealizedPnl} />
          <Delta label="cash" a={atT.cash} b={atT2.cash} />
        </div>
      ) : (
        <span className="font-mono text-xs text-muted-foreground">loading…</span>
      )}
    </div>
  );
}
