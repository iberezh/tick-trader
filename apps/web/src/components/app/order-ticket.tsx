import { type Side, SYMBOLS } from '@tick-trader/contracts';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { placeOrder } from '@/lib/api';
import { formatSymbol } from '@/lib/format';
import { store, useStore } from '@/lib/store';

export function OrderTicket() {
  const symbol = useStore((s) => s.selectedSymbol);
  const [qty, setQty] = useState('0.01');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const amount = Number(qty);
  const valid = Number.isFinite(amount) && amount > 0;

  const submit = async (side: Side): Promise<void> => {
    if (!valid) return;
    setError(null);
    setBusy(true);
    const result = await placeOrder({ symbol, side, qty: amount });
    setBusy(false);
    if (!result.ok) setError(result.message ?? 'order rejected');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order ticket</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <Label htmlFor="symbol">Symbol</Label>
          <Select id="symbol" value={symbol} onChange={(e) => store.setSymbol(e.target.value)}>
            {SYMBOLS.map((s) => (
              <option key={s} value={s}>
                {formatSymbol(s)}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="qty">Quantity</Label>
          <Input
            id="qty"
            type="number"
            min="0"
            step="0.01"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            aria-invalid={!valid}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={() => void submit('buy')} disabled={busy || !valid}>
            Buy
          </Button>
          <Button
            variant="destructive"
            onClick={() => void submit('sell')}
            disabled={busy || !valid}
          >
            Sell
          </Button>
        </div>
        {!valid ? (
          <p className="text-xs text-down">Quantity must be greater than zero.</p>
        ) : error ? (
          <p className="text-xs text-down">{error}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
