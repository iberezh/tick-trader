import { usePortfolioSnapshot } from '@/hooks/use-analytics-data';
import { num } from '@/lib/format';

export function PositionsWidget() {
  const { data: portfolio } = usePortfolioSnapshot();
  const rows = (portfolio?.positions ?? []).filter((p) => p.qty !== 0);
  return (
    <div className="h-full overflow-auto">
      <table className="w-full font-mono text-xs">
        <thead>
          <tr className="text-muted-foreground">
            <th className="px-2 py-1 text-left font-normal">sym</th>
            <th className="px-2 py-1 text-right font-normal">qty</th>
            <th className="px-2 py-1 text-right font-normal">avg</th>
            <th className="px-2 py-1 text-right font-normal">value</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-2 py-3 text-center text-muted-foreground">
                no open positions
              </td>
            </tr>
          ) : (
            rows.map((p) => (
              <tr key={p.symbol} className="border-border/40 border-t">
                <td className="px-2 py-1">{p.symbol.replace('USDT', '')}</td>
                <td className="px-2 py-1 text-right">{num(p.qty, 4)}</td>
                <td className="px-2 py-1 text-right">{num(p.avgCost, 2)}</td>
                <td className="px-2 py-1 text-right">{num(p.qty * p.avgCost, 0)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
