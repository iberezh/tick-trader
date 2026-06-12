import fastifyCors from '@fastify/cors';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { fastify } from 'fastify';
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
      hub.broadcast({ type: 'price', ...tick });
    },
    onTrade: async (trade) => {
      await insertTrade(trade);
      hub.broadcast({ type: 'trade', ...trade });
    },
  });

  const app = fastify().withTypeProvider<TypeBoxTypeProvider>();
  await app.register(fastifyCors, { origin: true });
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
