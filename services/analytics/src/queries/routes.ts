import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import { buildPortfolio, STARTING_CASH } from '@tick-trader/contracts';
import { latestPricesAsOf, listTradesUpTo, ticksInRange, ticksUpTo } from '../db.js';
import { sampleEquityCurve, toCandles } from '../projections.js';
import type { SseHub } from '../sse.js';

const HOUR_MS = 3_600_000;

interface QueryDeps {
  hub: SseHub;
  latestPrices: Record<string, number>;
}

const PortfolioQuery = Type.Object({ at: Type.Optional(Type.String()) });
const PricesQuery = Type.Object({
  symbol: Type.String(),
  from: Type.Optional(Type.Number()),
  to: Type.Optional(Type.Number()),
  bucket: Type.Optional(Type.Number()),
});
const MetricsQuery = Type.Object({
  from: Type.Optional(Type.Number()),
  to: Type.Optional(Type.Number()),
  bucket: Type.Optional(Type.Number()),
});

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

    app.get('/api/v1/prices', { schema: { querystring: PricesQuery } }, async (request) => {
      const to = request.query.to ?? Date.now();
      const from = request.query.from ?? to - HOUR_MS;
      const bucketMs = (request.query.bucket ?? 60) * 1000;
      const ticks = await ticksInRange(request.query.symbol, from, to);
      return toCandles(ticks, bucketMs);
    });

    app.get('/api/v1/metrics', { schema: { querystring: MetricsQuery } }, async (request) => {
      const to = request.query.to ?? Date.now();
      const from = request.query.from ?? to - HOUR_MS;
      const bucketMs = (request.query.bucket ?? 60) * 1000;
      const [trades, ticks] = await Promise.all([listTradesUpTo(to), ticksUpTo(to)]);
      return sampleEquityCurve(trades, ticks, from, to, bucketMs, STARTING_CASH);
    });

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
