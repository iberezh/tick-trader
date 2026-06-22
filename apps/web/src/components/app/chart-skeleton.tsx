// Placeholder shown in a chart's slot until its data has loaded, so the card never flashes
// an empty box. Faux candles/gridlines keep the terminal look while it pulses.
export function ChartSkeleton({ height }: { height: number | string }) {
  const bars = Array.from({ length: 14 }, (_, i) => i);
  return (
    <div
      className="relative w-full animate-pulse overflow-hidden rounded-md bg-secondary/30"
      style={{ height }}
      aria-hidden
    >
      <div className="absolute inset-0 flex items-end justify-between gap-2 px-3 pb-6 pt-4">
        {bars.map((i) => (
          <div
            key={i}
            className="flex-1 rounded-sm bg-muted-foreground/15"
            style={{ height: `${25 + ((i * 37) % 60)}%` }}
          />
        ))}
      </div>
      <div className="absolute inset-x-0 top-1/2 h-px bg-muted-foreground/10" />
      <div className="absolute inset-x-0 top-1/4 h-px bg-muted-foreground/10" />
      <div className="absolute inset-x-0 top-3/4 h-px bg-muted-foreground/10" />
    </div>
  );
}
