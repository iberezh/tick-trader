import { type PriceTick, TOPICS, type TradeExecuted } from '@tick-trader/contracts';
import { Kafka } from 'kafkajs';
import { config } from './config.js';

const kafka = new Kafka({
  clientId: 'analytics',
  brokers: config.kafkaBrokers,
  retry: { retries: 10 },
});

export interface ConsumerHandlers {
  onPrice: (tick: PriceTick) => Promise<void>;
  onTrade: (trade: TradeExecuted) => Promise<void>;
}

const routers: Record<string, (raw: string, h: ConsumerHandlers) => Promise<void>> = {
  [TOPICS.prices]: (raw, h) => h.onPrice(JSON.parse(raw) as PriceTick),
  [TOPICS.trades]: (raw, h) => h.onTrade(JSON.parse(raw) as TradeExecuted),
};

export async function startConsumers(handlers: ConsumerHandlers): Promise<void> {
  const consumer = kafka.consumer({ groupId: 'analytics' });
  await consumer.connect();
  await consumer.subscribe({ topics: [TOPICS.prices, TOPICS.trades], fromBeginning: true });
  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      const route = routers[topic];
      if (route && message.value) await route(message.value.toString(), handlers);
    },
  });
}
