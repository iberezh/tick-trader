import { type Static, Type } from '@sinclair/typebox';

export const SideSchema = Type.Union([Type.Literal('buy'), Type.Literal('sell')]);
export type Side = Static<typeof SideSchema>;

export const PriceTickSchema = Type.Object({
  symbol: Type.String(),
  price: Type.Number(),
  ts: Type.Number(), // epoch ms
});
export type PriceTick = Static<typeof PriceTickSchema>;

export const OrderPlacedSchema = Type.Object({
  orderId: Type.String(),
  symbol: Type.String(),
  side: SideSchema,
  qty: Type.Number(),
  requestedAt: Type.Number(),
});
export type OrderPlaced = Static<typeof OrderPlacedSchema>;

export const TradeExecutedSchema = Type.Object({
  orderId: Type.String(),
  symbol: Type.String(),
  side: SideSchema,
  qty: Type.Number(),
  price: Type.Number(),
  executedAt: Type.Number(),
});
export type TradeExecuted = Static<typeof TradeExecutedSchema>;

export const OrderRejectedSchema = Type.Object({
  orderId: Type.String(),
  reason: Type.String(),
  rejectedAt: Type.Number(),
});
export type OrderRejected = Static<typeof OrderRejectedSchema>;

// Event type tags as stored in the event store `type` column.
export const EVENT_TYPES = {
  orderPlaced: 'OrderPlaced',
  tradeExecuted: 'TradeExecuted',
  orderRejected: 'OrderRejected',
} as const;
