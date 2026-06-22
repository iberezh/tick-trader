import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import { buildPortfolio, STARTING_CASH } from '@tick-trader/contracts';
import { requireAuth } from '../auth.js';
import { isAllowedOrigin } from '../config.js';
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

    // Account-scoped: each user only ever sees their own paper account.
    app.get(
      '/api/v1/portfolio',
      { preHandler: requireAuth, schema: { querystring: PortfolioQuery } },
      async (request) => {
        const at = request.query.at ? Date.parse(request.query.at) : undefined;
        const trades = await listTradesUpTo(request.account.id, at);
        const prices = at === undefined ? deps.latestPrices : await latestPricesAsOf(at);
        const asOf = at === undefined ? new Date().toISOString() : new Date(at).toISOString();
        return buildPortfolio(trades, STARTING_CASH, prices, asOf);
      },
    );

    // Prices are global market data — no account scoping needed.
    app.get('/api/v1/prices', { schema: { querystring: PricesQuery } }, async (request, reply) => {
      const w = resolveWindow(request.query);
      if (!w) return reply.code(400).send({ error: 'invalid range or bucket' });
      const ticks = await ticksInRange(request.query.symbol, w.from, w.to);
      return toCandles(ticks, w.bucketMs);
    });

    app.get(
      '/api/v1/metrics',
      { preHandler: requireAuth, schema: { querystring: MetricsQuery } },
      async (request, reply) => {
        const w = resolveWindow(request.query);
        if (!w) return reply.code(400).send({ error: 'invalid range or bucket' });
        const [trades, seed, rangeTicks] = await Promise.all([
          listTradesUpTo(request.account.id, w.to),
          latestPricesAsOf(w.from),
          ticksInRangeAllSymbols(w.from, w.to),
        ]);
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

    app.get('/api/v1/events', { preHandler: requireAuth }, async (request) => ({
      trades: await listTradesUpTo(request.account.id),
    }));

    app.get('/api/v1/stream', { preHandler: requireAuth }, (request, reply) => {
      const headers: Record<string, string> = {
        'content-type': 'text/event-stream',
        'cache-control': 'no-cache',
        connection: 'keep-alive',
      };
      // raw write bypasses the cors plugin; mirror its allowlist so the cookie only rides
      // back to trusted origins (an attacker page's EventSource gets no CORS grant).
      const origin = request.headers.origin;
      if (isAllowedOrigin(origin)) {
        headers['access-control-allow-origin'] = origin;
        headers['access-control-allow-credentials'] = 'true';
      }
      reply.raw.writeHead(200, headers);
      reply.raw.write('\n');
      const client = (event: unknown) => reply.raw.write(`data: ${JSON.stringify(event)}\n\n`);
      const entry = deps.hub.add(client, request.account.id);
      request.raw.on('close', () => deps.hub.remove(entry));
    });

    return Promise.resolve();
  };
}
