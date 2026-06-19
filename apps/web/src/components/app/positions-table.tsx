import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePortfolio } from '@/hooks/use-portfolio';
import { formatSymbol, money, num, signed } from '@/lib/format';
import { useStore } from '@/lib/store';
import { cn } from '@/lib/utils';

export function PositionsTable() {
  const portfolio = usePortfolio();
  const prices = useStore((s) => s.prices);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Positions</CardTitle>
      </CardHeader>
      <CardContent>
        {portfolio.positions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No open positions.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground">
                <th className="text-left font-normal">Symbol</th>
                <th className="text-right font-normal">Qty</th>
                <th className="text-right font-normal">Avg</th>
                <th className="text-right font-normal">Last</th>
                <th className="text-right font-normal">P&amp;L</th>
              </tr>
            </thead>
            <tbody>
              {portfolio.positions.map((p) => {
                const last = prices[p.symbol] ?? p.avgCost;
                const pnl = p.qty * (last - p.avgCost);
                return (
                  <tr key={p.symbol} className="border-t">
                    <td className="py-1.5 font-medium">{formatSymbol(p.symbol)}</td>
                    <td className="text-right tabular-nums">{num(p.qty)}</td>
                    <td className="text-right tabular-nums">{money(p.avgCost)}</td>
                    <td className="text-right tabular-nums">{money(last)}</td>
                    <td
                      className={cn('text-right tabular-nums', pnl >= 0 ? 'text-up' : 'text-down')}
                    >
                      {signed(pnl)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}
