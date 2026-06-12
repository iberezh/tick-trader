# Build from repo root: docker build -f services/analytics/Dockerfile .
FROM node:22-slim
RUN corepack enable
ENV HUSKY=0
WORKDIR /repo

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml .npmrc ./
COPY packages/contracts/package.json packages/contracts/package.json
COPY services/analytics/package.json services/analytics/package.json
RUN pnpm install --frozen-lockfile --filter @tick-trader/analytics...

COPY tsconfig.base.json ./
COPY packages/contracts ./packages/contracts
COPY services/analytics ./services/analytics

WORKDIR /repo/services/analytics
EXPOSE 4003
CMD ["pnpm", "start"]
