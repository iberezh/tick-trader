import { TOPICS } from '@tick-trader/contracts';
import { Kafka, Partitioners, type Producer } from 'kafkajs';
import { config } from './config.js';

const kafka = new Kafka({
  clientId: 'market-data',
  brokers: config.kafkaBrokers,
  retry: { retries: 10 },
});

export async function createProducer(): Promise<Producer> {
  const admin = kafka.admin();
  await admin.connect();
  await admin.createTopics({ topics: [{ topic: TOPICS.prices, numPartitions: 1 }] });
  await admin.disconnect();
  const producer = kafka.producer({ createPartitioner: Partitioners.DefaultPartitioner });
  await producer.connect();
  return producer;
}
