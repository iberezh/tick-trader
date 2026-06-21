import { useMemo, useState } from 'react';
import type { Candle, EquityPoint } from '@/lib/api';
import { candleOption, equityOption } from '@/lib/chart-theme';
import { EChart } from '../app/echart';
import { SIM_SYMBOLS } from './use-sim';

const fmt = (n: number): string =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const TFS = ['1m', '5m', '15m', '1h'];

export function ChartsShowcase({ series }: { series: Record<string, Candle[]> }) {
  const [sym, setSym] = useState('BTCUSDT');
  const [tf, setTf] = useState('1m');
  const [frac, setFrac] = useState(100);
  const all = series[sym] ?? [];
  const candles =
    frac >= 100 ? all : all.slice(0, Math.max(20, Math.round((all.length * frac) / 100)));
  const option = useMemo(() => candleOption(candles), [candles]);
  const eqOption = useMemo(() => {
    const base = candles[0]?.close ?? 0;
    const points: EquityPoint[] = candles.map((c) => ({
      t: c.t,
      equity: 100000 + (c.close - base) * 2.4,
      cash: 0,
      realizedPnl: 0,
      unrealizedPnl: 0,
    }));
    return equityOption(points);
  }, [candles]);
  const last = candles[candles.length - 1]?.close ?? 0;

  return (
    <section id="charts" className="scroll-mt-24 border-t border-[#19222a] py-16">
      <div className="font-mono text-xs tracking-wide text-[#00e08f]">
        <span className="text-[#54605a]">{'// 01'}</span> &nbsp;the-charts
      </div>
      <h2 className="mt-3 font-grotesk text-3xl font-bold tracking-tight">
        Charts that move as the market does.
      </h2>
      <p className="mt-3 max-w-[60ch] text-[#7c8a83]">
        Live candlesticks, an equity curve that tracks the paper account, and a crosshair on every
        bar. Switch symbols, change the timeframe, and scrub — the chart and the curve rewind
        together.
      </p>

      <div
        id="replay"
        className="mt-7 scroll-mt-24 rounded-2xl border border-[#19222a] bg-gradient-to-b from-[#0d1115] to-[#090c0f] p-4"
      >
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <div className="flex gap-1.5">
            {SIM_SYMBOLS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSym(s)}
                className={`rounded-lg border px-3 py-1.5 font-mono text-xs ${
                  s === sym
                    ? 'border-[#00e08f] bg-[#00e08f] text-[#04130c]'
                    : 'border-[#19222a] text-[#7c8a83]'
                }`}
              >
                {s.replace('USDT', '')}
                <span className="opacity-60"> USDT</span>
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="font-mono text-xl font-bold tabular-nums">{fmt(last)}</span>
            <div className="flex gap-1">
              {TFS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTf(t)}
                  className={`rounded-md border px-2 py-1 font-mono text-[11px] ${
                    t === tf
                      ? 'border-[#2a4a3c] bg-[#00e08f]/10 text-[#00e08f]'
                      : 'border-[#19222a] text-[#7c8a83]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="h-[320px]">
          <EChart option={option} height="100%" />
        </div>
        <div className="mt-3 font-mono text-[10px] tracking-wide text-[#54605a]">
          EQUITY · paper account
        </div>
        <div className="h-[78px]">
          <EChart option={eqOption} height="100%" />
        </div>
        <div
          id="trade"
          className="mt-3 flex scroll-mt-24 items-center gap-3 border-t border-[#19222a] pt-3"
        >
          <span className="font-mono text-[10px] tracking-wide text-[#54605a]">⏮ TIME-TRAVEL</span>
          <input
            type="range"
            min={20}
            max={100}
            value={frac}
            onChange={(e) => setFrac(Number(e.target.value))}
            className="flex-1 accent-[#00e08f]"
            aria-label="Time travel"
          />
          <span className="w-24 text-right font-mono text-xs text-[#00e08f]">
            {frac >= 100 ? 'now' : `−${Math.round((100 - frac) * 2.4)}m`}
          </span>
        </div>
      </div>
    </section>
  );
}
