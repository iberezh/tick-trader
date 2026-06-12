import { TOPICS } from '@tick-trader/contracts';
import Fastify from 'fastify';
import { config } from './config.js';
import { createFeed } from './feed/index.js';
import { createProducer } from './kafka.js';

async function main(): Promise<void> {
  const producer = await createProducer();
  const feed = createFeed(config.feed);

  await feed.start((tick) => {
    void producer.send({
      topic: TOPICS.prices,
      messages: [{ key: tick.symbol, value: JSON.stringify(tick) }],
    });
  });

  const app = Fastify();
  app.get('/health', () => ({ status: 'ok', feed: config.feed }));
  await app.listen({ host: '0.0.0.0', port: config.port });

  const shutdown = async (): Promise<void> => {
    await feed.stop();
    await producer.disconnect();
    await app.close();
    process.exit(0);
  };
  process.on('SIGTERM', () => void shutdown());
  process.on('SIGINT', () => void shutdown());
}

main().catch((error: unknown) => {
  console.error('market-data failed to start', error);
  process.exit(1);
});
