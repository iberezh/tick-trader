const FEEDS = ['binance', 'sim'] as const;
type FeedKind = (typeof FEEDS)[number];

function feedKind(): FeedKind {
  const raw = process.env.MARKET_FEED ?? 'binance';
  if (!(FEEDS as readonly string[]).includes(raw)) {
    throw new Error(`MARKET_FEED must be one of ${FEEDS.join(', ')}`);
  }
  return raw as FeedKind; // validated against FEEDS above
}

export const config = {
  kafkaBrokers: (process.env.KAFKA_BROKERS ?? 'localhost:9094').split(','),
  feed: feedKind(),
  port: Number(process.env.PORT ?? 4002),
};
