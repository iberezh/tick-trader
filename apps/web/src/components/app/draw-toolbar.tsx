import type { Drawing } from '@/hooks/use-drawing';
import { cn } from '@/lib/utils';

type Props = Pick<
  Drawing,
  'enabled' | 'color' | 'palette' | 'toggle' | 'setColor' | 'undo' | 'clear'
> & { hasLines: boolean };

export function DrawToolbar({
  enabled,
  color,
  palette,
  hasLines,
  toggle,
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
