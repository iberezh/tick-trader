import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import { buildPortfolio, STARTING_CASH } from '@tick-trader/contracts';
import { latestPricesAsOf, listTradesUpTo, ticksInRange, ticksInRangeAllSymbols } from '../db.js';
import { sampleEquityCurve, toCandles } from '../projections.js';
import type { SseHub } from '../sse.js';

const HOUR_MS = 3_600_000;
const MAX_POINTS = 5_000; // cap chart resolution to keep queries/loops bounded

interface QueryDeps {
  hub: SseHub;
  latestPrices: Record<string, number>;
}

const RangeQuery = {
  from: Type.Optional(Type.Number()),
  to: Type.Optional(Type.Number()),
  bucket: Type.Optional(Type.Integer({ minimum: 1, maximum: 86_400 })),
};
const PortfolioQuery = Type.Object({ at: Type.Optional(Type.String()) });
const PricesQuery = Type.Object({ symbol: Type.String(), ...RangeQuery });
const MetricsQuery = Type.Object(RangeQuery);

interface Window {
  from: number;
  to: number;
  bucketMs: number;
}

// Resolve+validate the time window; null means a 400 (bad range or too many buckets).
function resolveWindow(q: { from?: number; to?: number; bucket?: number }): Window | null {
  const to = q.to ?? Date.now();
  const from = q.from ?? to - HOUR_MS;
  const bucketMs = (q.bucket ?? 60) * 1000;
  if (from >= to || bucketMs <= 0) return null;
  if ((to - from) / bucketMs > MAX_POINTS) return null;
  return { from, to, bucketMs };
}

export function queryRoutes(deps: QueryDeps): FastifyPluginAsyncTypebox {
  return (app) => {
    app.get('/api/v1/health', () => ({ status: 'ok' }));

    app.get('/api/v1/portfolio', { schema: { querystring: PortfolioQuery } }, async (request) => {
      const at = request.query.at ? Date.parse(request.query.at) : undefined;
      const trades = await listTradesUpTo(at);
      const prices = at === undefined ? deps.latestPrices : await latestPricesAsOf(at);
      const asOf = at === undefined ? new Date().toISOString() : new Date(at).toISOString();
      return buildPortfolio(trades, STARTING_CASH, prices, asOf);
    });

    app.get('/api/v1/prices', { schema: { querystring: PricesQuery } }, async (request, reply) => {
      const w = resolveWindow(request.query);
      if (!w) return reply.code(400).send({ error: 'invalid range or bucket' });
      const ticks = await ticksInRange(request.query.symbol, w.from, w.to);
      return toCandles(ticks, w.bucketMs);
    });

    app.get(
      '/api/v1/metrics',
      { schema: { querystring: MetricsQuery } },
      async (request, reply) => {
        const w = resolveWindow(request.query);
        if (!w) return reply.code(400).send({ error: 'invalid range or bucket' });
        const [trades, seed, rangeTicks] = await Promise.all([
          listTradesUpTo(w.to),
          latestPricesAsOf(w.from),
          ticksInRangeAllSymbols(w.from, w.to),
        ]);
        // Seed each symbol's price as of the window start so positions opened earlier
        // are still marked correctly at the left edge of the curve.
        const seedTicks = Object.entries(seed).map(([symbol, price]) => ({
          symbol,
          price,
          ts: w.from,
        }));
        return sampleEquityCurve(
          trades,
          [...seedTicks, ...rangeTicks],
          w.from,
          w.to,
          w.bucketMs,
          STARTING_CASH,
        );
      },
    );

    app.get('/api/v1/events', async () => ({ trades: await listTradesUpTo() }));

    app.get('/api/v1/stream', (request, reply) => {
      reply.raw.writeHead(200, {
        'content-type': 'text/event-stream',
        'cache-control': 'no-cache',
        connection: 'keep-alive',
        'access-control-allow-origin': '*',
      });
      reply.raw.write('\n');
      const client = (event: unknown) => reply.raw.write(`data: ${JSON.stringify(event)}\n\n`);
      deps.hub.add(client);
      request.raw.on('close', () => deps.hub.remove(client));
    });

    return Promise.resolve();
  };
}
