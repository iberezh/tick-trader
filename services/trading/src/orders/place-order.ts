import {
  err,
  foldAccount,
  type OrderPlaced,
  type OrderRejected,
  ok,
  type Result,
  type Side,
  STARTING_CASH,
  SYMBOLS,
  type TradeExecuted,
} from '@tick-trader/contracts';

export interface PlaceOrderInput {
  symbol: string;
  side: Side;
  qty: number;
}

export interface OrderContext {
  lastPrice: Record<string, number>;
  trades: TradeExecuted[];
  now: number;
  orderId: string;
  accountId: string;
}

export interface OrderDecision {
  placed: OrderPlaced;
  executed: TradeExecuted;
}

const isKnownSymbol = (symbol: string): boolean => (SYMBOLS as readonly string[]).includes(symbol);

function heldQty(trades: TradeExecuted[], symbol: string): number {
  return foldAccount(trades, STARTING_CASH).positions.find((p) => p.symbol === symbol)?.qty ?? 0;
}

export function placeOrder(
  input: PlaceOrderInput,
  ctx: OrderContext,
): Result<OrderDecision, OrderRejected> {
  const reject = (reason: string): Result<OrderDecision, OrderRejected> =>
    err({ orderId: ctx.orderId, reason, rejectedAt: ctx.now });

  if (!isKnownSymbol(input.symbol)) return reject(`unknown symbol ${input.symbol}`);
  if (input.qty <= 0) return reject('qty must be positive');

  const price = ctx.lastPrice[input.symbol];
  if (price === undefined) return reject(`no price available for ${input.symbol}`);
  if (input.side === 'sell' && heldQty(ctx.trades, input.symbol) < input.qty) {
    return reject('cannot sell more than held');
  }

  const placed: OrderPlaced = {
    orderId: ctx.orderId,
    accountId: ctx.accountId,
    symbol: input.symbol,
    side: input.side,
    qty: input.qty,
    requestedAt: ctx.now,
  };
  const executed: TradeExecuted = {
    orderId: ctx.orderId,
    accountId: ctx.accountId,
    symbol: input.symbol,
    side: input.side,
    qty: input.qty,
    price,
    executedAt: ctx.now,
  };
  return ok({ placed, executed });
}
