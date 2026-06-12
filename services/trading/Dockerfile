# Build from repo root: docker build -f services/trading/Dockerfile .
FROM node:22-slim
RUN corepack enable
ENV HUSKY=0
WORKDIR /repo

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml .npmrc ./
COPY packages/contracts/package.json packages/contracts/package.json
COPY services/trading/package.json services/trading/package.json
RUN pnpm install --frozen-lockfile --filter @tick-trader/trading...

COPY tsconfig.base.json ./
COPY packages/contracts ./packages/contracts
COPY services/trading ./services/trading

WORKDIR /repo/services/trading
EXPOSE 4001
CMD ["pnpm", "start"]
