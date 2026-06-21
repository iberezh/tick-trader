import { Link } from 'react-router-dom';
import { LogoMark } from '@/components/logo-mark';
import { ChartsShowcase } from './charts-showcase';
import { LandingHero } from './landing-hero';
import { useSimSeries } from './use-sim';
import { UsesSection } from './uses-section';

const TICKS = [
  { s: 'BTCUSDT', v: '64,213.50', d: '▲ 2.41%', up: true },
  { s: 'ETHUSDT', v: '3,402.18', d: '▲ 1.07%', up: true },
  { s: 'SOLUSDT', v: '142.66', d: '▼ 0.83%', up: false },
  { s: 'BNBUSDT', v: '589.40', d: '▲ 0.62%', up: true },
  { s: 'XRPUSDT', v: '0.5218', d: '▼ 1.14%', up: false },
  { s: 'ADAUSDT', v: '0.3907', d: '▲ 3.02%', up: true },
  { s: 'AVAXUSDT', v: '27.43', d: '▲ 0.91%', up: true },
  { s: 'DOGEUSDT', v: '0.1241', d: '▼ 0.46%', up: false },
  { s: 'events/s', v: '1,204', d: '● live', up: true },
];

export function Landing() {
  const series = useSimSeries();
  return (
    <div className="min-h-screen bg-[#06080a] font-hanken text-[#e9f2ec]">
      <div className="overflow-hidden border-b border-[#19222a] bg-black/35">
        <div className="tt-scroll flex w-max whitespace-nowrap py-1.5 font-mono text-xs">
          {[0, 1].map((half) => (
            <div key={half} className="flex shrink-0">
              {['a', 'b'].flatMap((rep) =>
                TICKS.map((t) => (
                  <span key={`${half}-${rep}-${t.s}`} className="pr-10 text-[#7c8a83]">
                    {t.s} <b className="text-[#e9f2ec]">{t.v}</b>{' '}
                    <span className={t.up ? 'text-[#00e08f]' : 'text-[#ff5247]'}>{t.d}</span>
                  </span>
                )),
              )}
            </div>
          ))}
        </div>
      </div>

      <nav className="sticky top-0 z-30 border-b border-[#19222a] bg-[#06080a]/80 backdrop-blur">
        <div className="mx-auto flex h-[62px] max-w-[1180px] items-center gap-6 px-6">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-1 font-grotesk text-[17px] font-bold tracking-tight"
          >
            <LogoMark
              size={20}
              className="text-[#00e08f] drop-shadow-[0_0_8px_rgba(0,224,143,0.55)]"
            />
            tick-trader
          </button>
          <div className="ml-auto flex items-center gap-4">
            <div className="hidden items-center gap-4 font-mono text-sm md:flex">
              <a href="#charts" className="text-[#7c8a83] hover:text-[#00e08f]">
                {'// charts'}
              </a>
              <a href="#replay" className="text-[#7c8a83] hover:text-[#00e08f]">
                {'// replay'}
              </a>
              <a href="#trade" className="text-[#7c8a83] hover:text-[#00e08f]">
                {'// trade'}
              </a>
            </div>
            <Link
              to="/app"
              className="rounded-lg bg-[#00e08f] px-4 py-2 font-grotesk text-sm font-bold text-[#04130c]"
            >
              ▸ Live demo
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-[1180px] px-6">
        <LandingHero candles={series.BTCUSDT ?? []} />
        <ChartsShowcase series={series} />
        <UsesSection />
        <section className="border-t border-[#19222a] py-20 text-center">
          <div className="font-mono text-sm text-[#7c8a83]">
            <span className="text-[#00e08f]">$</span> open /app{' '}
            <span className="text-[#00e08f]">#</span> place an order, then scrub the slider
          </div>
          <h2 className="mt-4 font-grotesk text-4xl font-bold tracking-tight">
            Watch the market rewind.
          </h2>
          <div className="mt-6 flex justify-center">
            <Link
              to="/app"
              className="rounded-lg bg-[#00e08f] px-4 py-2.5 font-grotesk text-sm font-bold text-[#04130c]"
            >
              ▸ Open live charts
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#19222a]">
        <div className="mx-auto flex max-w-[1180px] flex-wrap justify-between gap-2 px-6 py-6 font-mono text-xs text-[#54605a]">
          <span>tick-trader · event-sourced paper-trading · v0.1</span>
          <span>github.com/iberezh/tick-trader</span>
        </div>
      </footer>
    </div>
  );
}
