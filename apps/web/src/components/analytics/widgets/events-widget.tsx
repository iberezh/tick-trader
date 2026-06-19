import { useTradeLog } from '@/hooks/use-analytics-data';
import { num } from '@/lib/format';

export function EventsWidget() {
  const trades = useTradeLog();
  const recent = trades.slice(-40).reverse();
  return (
    <div className="h-full overflow-auto font-mono text-xs">
      {recent.length === 0 ? (
        <div className="px-2 py-3 text-center text-muted-foreground">no trades yet</div>
      ) : (
        recent.map((t) => (
          <div
            key={t.orderId}
            className="border-border/40 flex items-center gap-2 border-t px-2 py-1"
          >
            <span className={t.side === 'buy' ? 'text-up' : 'text-down'}>
              {t.side === 'buy' ? 'buy ' : 'sell'}
            </span>
            <span className="text-muted-foreground">
              {num(t.qty, 4)} {t.symbol.replace('USDT', '')}
            </span>
            <span className="ml-auto">{num(t.price, 2)}</span>
          </div>
        ))
      )}
    </div>
  );
}
