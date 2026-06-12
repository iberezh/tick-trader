import { type PriceTick, TOPICS } from '@tick-trader/contracts';
import { Kafka, Partitioners, type Producer } from 'kafkajs';
import { config } from './config.js';

const kafka = new Kafka({
  clientId: 'trading',
  brokers: config.kafkaBrokers,
  retry: { retries: 10 },
});

export async function createProducer(): Promise<Producer> {
  const admin = kafka.admin();
  await admin.connect();
  await admin.createTopics({ topics: [{ topic: TOPICS.trades, numPartitions: 1 }] });
  await admin.disconnect();
  const producer = kafka.producer({ createPartitioner: Partitioners.DefaultPartitioner });
  await producer.connect();
  return producer;
}

// Maintains a last-price cache by consuming the prices topic. The write side reads
// prices but never produces them — it only subscribes.
export async function startPriceCache(cache: Record<string, number>): Promise<void> {
  const consumer = kafka.consumer({ groupId: 'trading-prices' });
  await consumer.connect();
  await consumer.subscribe({ topic: TOPICS.prices, fromBeginning: false });
  await consumer.run({
    eachMessage: ({ message }) => {
      if (message.value) {
        const tick = JSON.parse(message.value.toString()) as PriceTick;
        cache[tick.symbol] = tick.price;
      }
      return Promise.resolve();
    },
  });
}
