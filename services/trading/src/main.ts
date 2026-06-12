import fastifyCors from '@fastify/cors';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { fastify } from 'fastify';
import { config } from './config.js';
import { createProducer, startPriceCache } from './kafka.js';
import { orderRoutes } from './orders/routes.js';

async function main(): Promise<void> {
  const producer = await createProducer();
  const lastPrice: Record<string, number> = {};
  await startPriceCache(lastPrice);

  const app = fastify().withTypeProvider<TypeBoxTypeProvider>();
  await app.register(fastifyCors, { origin: true });
  await app.register(fastifySwagger, {
    openapi: { info: { title: 'tick-trader · trading', version: '0.1.0' } },
  });
  await app.register(fastifySwaggerUi, { routePrefix: '/api/v1/docs' });
  await app.register(orderRoutes, { producer, lastPrice });

  await app.listen({ host: '0.0.0.0', port: config.port });

  const shutdown = async (): Promise<void> => {
    await producer.disconnect();
    await app.close();
    process.exit(0);
  };
  process.on('SIGTERM', () => void shutdown());
  process.on('SIGINT', () => void shutdown());
}

main().catch((error: unknown) => {
  console.error('trading failed to start', error);
  process.exit(1);
});
