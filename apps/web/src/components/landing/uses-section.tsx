const USES = [
  {
    ic: '[ ◉ ]',
    title: 'Live candlesticks',
    body: 'Real prices stream from Binance as candles and a live equity curve — no refresh, no polling.',
  },
  {
    ic: '[ ⏮ ]',
    title: 'Time-travel replay',
    body: 'One slider rewinds the whole board — chart, positions and P&L exactly as they were at any past moment.',
  },
  {
    ic: '[ ⇄ ]',
    title: 'Paper trading',
    body: 'Buy and sell at the live price and watch your P&L move — risk-free, no account, no real money.',
  },
  {
    ic: '[ ▤ ]',
    title: 'Every tick kept',
    body: 'Nothing is overwritten. The full history is replayable, so any moment is reproducible to the tick.',
  },
];

export function UsesSection() {
  return (
    <section id="uses" className="scroll-mt-24 border-t border-[#19222a] py-16">
      <div className="font-mono text-xs tracking-wide text-[#00e08f]">
        <span className="text-[#54605a]">{'// 02'}</span> &nbsp;what-you-can-do
      </div>
      <h2 className="mt-3 font-grotesk text-3xl font-bold tracking-tight">
        A trading desk you can rewind.
      </h2>
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {USES.map((u) => (
          <div
            key={u.title}
            className="rounded-xl border border-[#19222a] bg-[#0d1115] p-5 transition-colors hover:border-[#2a4a3c]"
          >
            <div className="font-mono text-sm font-bold text-[#00e08f]">{u.ic}</div>
            <h3 className="mt-3 font-grotesk text-base font-bold">{u.title}</h3>
            <p className="mt-2 text-sm text-[#7c8a83]">{u.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
