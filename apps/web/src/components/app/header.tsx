import { usePortfolio } from '@/hooks/use-portfolio';
import { money, signed } from '@/lib/format';
import { useStore } from '@/lib/store';
import { cn } from '@/lib/utils';

function Stat({ label, value, accent }: { label: string; value: string; accent?: 'up' | 'down' }) {
  return (
    <div className="text-right">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div
        className={cn(
          'text-lg font-semibold tabular-nums',
          accent === 'up' && 'text-up',
          accent === 'down' && 'text-down',
        )}
      >
        {value}
      </div>
    </div>
  );
}

export function Header() {
  const portfolio = usePortfolio();
  const connected = useStore((s) => s.connected);
  const mode = useStore((s) => s.mode);
  const asOf = useStore((s) => s.asOf);
  const totalPnl = portfolio.realizedPnl + portfolio.unrealizedPnl;

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 rounded-lg border bg-card p-4">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold tracking-tight">tick-trader</h1>
        <span
          className={cn(
            'flex items-center gap-1.5 text-xs',
            connected ? 'text-up' : 'text-muted-foreground',
          )}
        >
          <span
            className={cn('h-2 w-2 rounded-full', connected ? 'bg-up' : 'bg-muted-foreground')}
          />
          {connected ? 'live' : 'offline'}
        </span>
        {mode === 'historical' && asOf ? (
          <span className="rounded bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
            as of {new Date(asOf).toLocaleTimeString()}
          </span>
        ) : null}
      </div>
      <div className="flex gap-6">
        <Stat label="Equity" value={money(portfolio.equity)} />
        <Stat label="Cash" value={money(portfolio.cash)} />
        <Stat label="P&L" value={signed(totalPnl)} accent={totalPnl >= 0 ? 'up' : 'down'} />
      </div>
    </header>
  );
}
