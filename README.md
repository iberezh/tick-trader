# TickTrader

**An event-sourced paper-trading platform.** No mutable balance is ever stored — cash, positions and P&L are always *folded from an append-only event log*, so you can scrub a **time-travel** slider to reconstruct the exact portfolio at any past instant, and any read model can be rebuilt by replay. Live prices stream from Binance over Kafka.

It's a showcase of **event-driven microservices + event sourcing + real-time** — the architecture gap the author's other repos (a RAG monolith and a CQRS monolith) don't cover.

---

## Architecture

CQRS + event sourcing over Kafka: a producer, a write side, and a read side that communicate **only through events**.

```
 market-data ──price.tick──▶┌───────────────────┐
 (producer · Binance WS)    │   Kafka (KRaft)   │
                            │  topics: prices   │
 trading ──trade.executed──▶│          trades   │
 (write side)               └─────────┬─────────┘
   ▲   │                              │  consumed independently
   │   └─append─▶ trading.events       │  (fan-out: zero producer changes)
   │             (append-only · SoR)   ▼
   │                              analytics (read side)
 browser ──POST /orders──▶ trading     ├─ persists price_ticks + trade_log
 browser ──queries + SSE──▶ analytics  ├─ folds → portfolio / P&L / metrics
                                       └─ SSE stream → browser
```

- **`market-data`** — producer. A `MarketFeed` adapter (`BinanceFeed` real WS by default, no API key; `SimulatedFeed` random-walk fallback, env-selected) publishes ticks to the `prices` topic. Stateless.
- **`trading`** — write side. `POST /orders` validates against the last tick, appends `OrderPlaced` → `TradeExecuted` to its append-only event store, publishes `TradeExecuted` to `trades`. Owns the system of record.
- **`analytics`** — read side. Independent consumer of `prices` + `trades`; persists price history and a local trade log, then serves every read (portfolio, temporal, metrics, OHLC, events) by **folding on read**, plus the SSE stream. The fan-out proof: it subscribes to the same events with no producer/write-side changes.
- **`apps/web`** — Vite + React SPA: a marketing landing, the trading dashboard, and a configurable analytics board.

### How it works — the event-sourcing payoff

All state is a pure function of the logs; nothing mutable is persisted:

- `cash(T)` = `STARTING_CASH − Σ buys + Σ sells` over trades ≤ T
- `positions(T)` = net qty + average cost per symbol over trades ≤ T
- `equity(T)` = `cash(T) + Σ qty × priceAsOf(symbol, T)`

`priceAsOf` makes historical valuation correct: the time-travel slider values the *historical* portfolio at *historical* prices. `GET /portfolio?at=<T>` is the same fold with a different upper bound — no special-casing.

---

## Tech specification

| Component | Technology | Details |
| --- | --- | --- |
| Services | **Fastify 5** (3 services) | producer / write side / read side, coupled only by events |
| Messaging | **Kafka (KRaft)** + **KafkaJS** | single broker; `prices` + `trades` topics |
| Schemas | **TypeBox** + `@fastify/type-provider-typebox` | one definition → runtime validation, static types, Swagger |
| DB access | **Kysely** + `pg` | typed SQL; append-only event store + read tables |
| Database | **PostgreSQL 16** | one instance, `trading` + `analytics` schemas |
| Realtime | **SSE** (one-way, auto-reconnect) | live `price` / `trade` / `pnl` to the browser |
| Web | **Vite 6 + React 19** | landing + dashboard + analytics board |
| Charts | **Apache ECharts 6** | candlesticks, equity/P&L, allocation, normalized compare |
| Grid | **react-grid-layout 2** (`/legacy`) | configurable 4-col board: drag / resize / persist |
| State | **Jotai 2** | atoms + `atomWithStorage`; SSE feeds the store |
| Styling | **Tailwind 3** + shadcn-style | dark theme; Space Grotesk / Hanken Grotesk / Space Mono |
| Routing | **react-router 7** | `/` landing · `/app` dashboard · `/app/analytics` board |
| Language | **TypeScript** (strict) | `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, no `any` |
| Tooling | **pnpm** workspaces · **Biome** · **Husky** · **GitHub Actions** | type-check → lint → test on every PR; Node ≥ 22 |

---

## Run it with Docker

```bash
docker compose up --build
# web → localhost:3000 · trading → :4001 · analytics → :4003 · Swagger at /api/v1/docs
```

Override ports if they're taken: `WEB_PORT=3010 POSTGRES_PORT=5434 docker compose up --build`. Market data uses the keyless Binance public WS by default; set `MARKET_FEED=simulated` for a deterministic offline feed.

## Local development

```bash
pnpm install
docker compose up -d kafka postgres        # infra only
pnpm --filter @tick-trader/market-data dev  # + trading, analytics, web in their own shells
pnpm --filter @tick-trader/web dev          # Vite on :5173
```

## Project layout

```
packages/contracts/   TypeBox events, topic names, constants, pure fold helpers (shared)
services/market-data/ tick producer (Binance / simulated)
services/trading/     write side: orders, append-only event store, prices consumer
services/analytics/   read side: consumers, fold-on-read queries, SSE
apps/web/             Vite + React: landing, dashboard, configurable analytics board
```

## Design notes (deliberate simplifications)

- **Single anonymous paper account** today → per-user accounts = an `account_id` on the streams (planned).
- **Market orders** fill at the last price → no order book / matching engine.
- **Fold-on-read** projections (no projection tables to drift) → at scale, snapshot + materialize to bound replay cost.
- **Single broker / single Postgres** → partitioned topics + DB-per-service at scale.
- **`market-data`** uses the Binance public WS with no reconnect/backfill → production would add auth, reconnection, and a dead-letter for gaps.

## Tests & CI

Pure folds (`cash`, `positions`, `avgCost`, `unrealizedPnl`, OHLC bucketing) and order validation are unit-tested with `node:test`. CI (GitHub Actions) runs type-check → Biome → unit tests on every PR.

## License

MIT
