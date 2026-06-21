import fastifyCookie from '@fastify/cookie';
import fastifyCors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { fastify } from 'fastify';
import { AUTH_COOKIE } from './auth.js';
import { config } from './config.js';
import { startConsumers } from './consumers.js';
import { ensureSchema, insertTick, insertTrade } from './db.js';
import { queryRoutes } from './queries/routes.js';
import { SseHub } from './sse.js';

async function main(): Promise<void> {
  await ensureSchema();
  const hub = new SseHub();
  const latestPrices: Record<string, number> = {};

  await startConsumers({
    onPrice: async (tick) => {
      latestPrices[tick.symbol] = tick.price;
      await insertTick(tick);
      hub.broadcastPrice({ type: 'price', ...tick });
    },
    onTrade: async (trade) => {
      await insertTrade(trade);
      hub.broadcastToAccount(trade.accountId, { type: 'trade', ...trade });
    },
  });

  const app = fastify().withTypeProvider<TypeBoxTypeProvider>();
  await app.register(fastifyCors, { origin: true, credentials: true });
  await app.register(fastifyCookie);
  await app.register(fastifyJwt, {
    secret: config.jwtSecret,
    cookie: { cookieName: AUTH_COOKIE, signed: false },
  });
  await app.register(fastifySwagger, {
    openapi: { info: { title: 'tick-trader · analytics', version: '0.1.0' } },
  });
  await app.register(fastifySwaggerUi, { routePrefix: '/api/v1/docs' });
  await app.register(queryRoutes({ hub, latestPrices }));

  await app.listen({ host: '0.0.0.0', port: config.port });

  const shutdown = async (): Promise<void> => {
    await app.close();
    process.exit(0);
  };
  process.on('SIGTERM', () => void shutdown());
  process.on('SIGINT', () => void shutdown());
}

main().catch((error: unknown) => {
  console.error('analytics failed to start', error);
  process.exit(1);
});
