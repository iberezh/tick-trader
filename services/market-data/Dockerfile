# Build from repo root: docker build -f services/market-data/Dockerfile .
FROM node:22-slim
RUN corepack enable
ENV HUSKY=0
WORKDIR /repo

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml .npmrc ./
COPY packages/contracts/package.json packages/contracts/package.json
COPY services/market-data/package.json services/market-data/package.json
RUN pnpm install --frozen-lockfile --filter @tick-trader/market-data...

COPY tsconfig.base.json ./
COPY packages/contracts ./packages/contracts
COPY services/market-data ./services/market-data

WORKDIR /repo/services/market-data
EXPOSE 4002
CMD ["pnpm", "start"]
