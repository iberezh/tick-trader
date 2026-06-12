import { randomUUID } from 'node:crypto';
import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import { EVENT_TYPES, TOPICS } from '@tick-trader/contracts';
import type { Producer } from 'kafkajs';
import { appendEvents, listAccountTrades, listOrderEvents } from '../db.js';
import { placeOrder } from './place-order.js';

const OrderBody = Type.Object({
  symbol: Type.String(),
  side: Type.Union([Type.Literal('buy'), Type.Literal('sell')]),
  qty: Type.Number({ exclusiveMinimum: 0 }),
});

interface OrderRoutesOptions {
  producer: Producer;
  lastPrice: Record<string, number>;
}

export const orderRoutes: FastifyPluginAsyncTypebox<OrderRoutesOptions> = (app, opts) => {
  const { producer, lastPrice } = opts;

  app.get('/api/v1/health', () => ({ status: 'ok' }));

  app.post('/api/v1/orders', { schema: { body: OrderBody } }, async (request, reply) => {
    const orderId = randomUUID();
    const trades = await listAccountTrades();
    const decision = placeOrder(request.body, { lastPrice, trades, now: Date.now(), orderId });

    if (!decision.ok) {
      await appendEvents([
        { streamId: `order:${orderId}`, type: EVENT_TYPES.orderRejected, payload: decision.error },
      ]);
      return reply.code(400).send(decision.error);
    }

    const { placed, executed } = decision.value;
    await appendEvents([
      { streamId: `order:${orderId}`, type: EVENT_TYPES.orderPlaced, payload: placed },
      { streamId: `order:${orderId}`, type: EVENT_TYPES.tradeExecuted, payload: executed },
    ]);
    await producer.send({
      topic: TOPICS.trades,
      messages: [{ key: executed.symbol, value: JSON.stringify(executed) }],
    });
    return reply.code(201).send(executed);
  });

  app.get(
    '/api/v1/orders/:id',
    { schema: { params: Type.Object({ id: Type.String() }) } },
    async (request) => ({
      orderId: request.params.id,
      events: await listOrderEvents(request.params.id),
    }),
  );

  return Promise.resolve();
};
