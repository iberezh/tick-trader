import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { Candle, EquityPoint } from '@/lib/api';
import { equityOption } from '@/lib/chart-theme';
import { EChart } from '../app/echart';
import { SIM_INITIAL_EQUITY, SIM_POSITION_MULT } from './use-sim';

const fmt = (n: number): string =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const POS = [
  { sym: 'BTC', lot: '0.50 @ 61,200', pnl: '+1,506.75' },
  { sym: 'ETH', lot: '4.00 @ 3,310', pnl: '+368.72' },
];

// Hero shows the paper ACCOUNT (equity curve + positions) — distinct from the market candles below.
export function LandingHero({ candles }: { candles: Candle[] }) {
  const points = useMemo<EquityPoint[]>(() => {
    const recent = candles.slice(-60);
    const base = recent[0]?.close ?? 0;
    return recent.map((c) => ({
      t: c.t,
      equity: SIM_INITIAL_EQUITY + (c.close - base) * SIM_POSITION_MULT,
      cash: 0,
      realizedPnl: 0,
      unrealizedPnl: 0,
    }));
  }, [candles]);
  const option = useMemo(() => equityOption(points), [points]);
  const eq = points[points.length - 1]?.equity ?? SIM_INITIAL_EQUITY;
  const pnl = eq - SIM_INITIAL_EQUITY;
  const pct = (pnl / SIM_INITIAL_EQUITY) * 100;
  const up = pct >= 0;

  return (
    <section id="top" className="grid gap-10 py-16 lg:grid-cols-2 lg:items-center">
      <div>
        <div className="font-mono text-xs tracking-wide text-[#00e08f]">$ tick-trader --live</div>
        <h1 className="mt-5 font-grotesk text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl">
          Trade the past.
          <br />
          Replay any moment.
          <span className="tt-blink text-[#00e08f]">_</span>
        </h1>
        <p className="mt-5 max-w-[46ch] text-[#7c8a83]">
          Real-time candlestick charts streaming from Binance, a paper portfolio that tracks every
          fill, and a <span className="text-[#e9f2ec]">time-travel slider</span> that rewinds the
          whole board to any instant.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            to="/app"
            className="rounded-lg bg-[#00e08f] px-4 py-2.5 font-grotesk text-sm font-bold text-[#04130c]"
          >
            ▸ Open live charts
          </Link>
          <a
            href="#charts"
            className="rounded-lg border border-[#19222a] px-4 py-2.5 font-grotesk text-sm font-bold hover:border-[#00e08f] hover:text-[#00e08f]"
          >
            See time-travel
          </a>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#19222a] bg-gradient-to-b from-[#0d1115] to-[#090c0f] shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)]">
        <div className="flex items-center gap-2 border-b border-[#19222a] bg-black/25 px-3.5 py-2.5 font-mono text-xs text-[#7c8a83]">
          <span className="h-2.5 w-2.5 rounded-full bg-[#34211f]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#322c14]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#0e2a1f]" />
          <span className="ml-1.5">paper account · live</span>
          <span className="ml-auto flex items-center gap-1.5 text-[#00e08f]">
            <span className="tt-pulse h-1.5 w-1.5 rounded-full bg-[#00e08f]" />
            LIVE
          </span>
        </div>
        <div className="p-4">
          <div className="mb-1 flex items-baseline gap-3 font-mono">
            <span className="text-xs text-[#7c8a83]">EQUITY</span>
            <span className="text-2xl font-bold tabular-nums">{fmt(eq)}</span>
            <span className={up ? 'text-[#00e08f]' : 'text-[#ff5247]'}>
              {up ? '▲ +' : '▼ '}
              {Math.abs(pct).toFixed(2)}%
            </span>
          </div>
          <div className="h-[176px]">
            <EChart option={option} height="100%" />
          </div>
          <div className="mt-2 flex justify-between border-t border-[#19222a] pt-2 font-mono text-[10px] text-[#54605a]">
            <span>● streaming · Binance</span>
            <span>last tick · just now</span>
          </div>
          <div className="pt-1.5 font-mono text-xs">
            {POS.map((p) => (
              <div
                key={p.sym}
                className="grid grid-cols-[44px_1fr_auto] gap-2 py-0.5 text-[#7c8a83]"
              >
                <span>{p.sym}</span>
                <span>{p.lot}</span>
                <span className="text-[#00e08f]">{p.pnl} ▲</span>
              </div>
            ))}
          </div>
          <div className="mt-1.5 flex items-baseline justify-between border-t border-[#19222a] pt-2 font-mono">
            <span className="text-[10px] tracking-wide text-[#54605a]">CASH · OPEN P&amp;L</span>
            <span>
              <span className="text-base font-bold tabular-nums">38,540.00</span>
              <span className={`ml-2 text-xs ${pnl >= 0 ? 'text-[#00e08f]' : 'text-[#ff5247]'}`}>
                {pnl >= 0 ? '▲ +$' : '▼ −$'}
                {fmt(Math.abs(pnl))}
              </span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
