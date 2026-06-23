import type { Drawing } from '@/hooks/use-drawing';
import { cn } from '@/lib/utils';

type Props = Pick<
  Drawing,
  'enabled' | 'mode' | 'color' | 'palette' | 'toggle' | 'setMode' | 'setColor' | 'undo' | 'clear'
> & { hasLines: boolean };

const MODES = ['line', 'free'] as const;

export function DrawToolbar({
  enabled,
  mode,
  color,
  palette,
  hasLines,
  toggle,
  setMode,
  setColor,
  undo,
  clear,
}: Props) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={toggle}
        className={cn(
          'rounded border px-2 py-0.5 font-mono text-xs transition-colors',
          enabled
            ? 'border-up text-up'
            : 'border-border text-muted-foreground hover:text-foreground',
        )}
      >
        ✎ draw
      </button>
      {enabled ? (
        <>
          <div className="flex items-center gap-1 font-mono text-xs">
            {MODES.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={cn(
                  'rounded px-1.5 py-0.5 transition-colors',
                  mode === m
                    ? 'bg-secondary text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {m}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            {palette.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`line colour ${c}`}
                onClick={() => setColor(c)}
                className={cn(
                  'h-4 w-4 rounded-full border',
                  color === c ? 'border-foreground' : 'border-transparent',
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={undo}
            disabled={!hasLines}
            className="font-mono text-xs text-muted-foreground hover:text-foreground disabled:opacity-40"
          >
            undo
          </button>
          <button
            type="button"
            onClick={clear}
            disabled={!hasLines}
            className="font-mono text-xs text-muted-foreground hover:text-down disabled:opacity-40"
          >
            clear
          </button>
        </>
      ) : null}
    </div>
  );
}
