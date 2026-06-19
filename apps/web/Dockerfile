# Build from repo root: docker build -f apps/web/Dockerfile .
FROM node:22-slim
RUN corepack enable
ENV HUSKY=0
WORKDIR /repo

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml .npmrc ./
COPY packages/contracts/package.json packages/contracts/package.json
COPY apps/web/package.json apps/web/package.json
RUN pnpm install --frozen-lockfile --filter @tick-trader/web...

COPY tsconfig.base.json ./
COPY packages/contracts ./packages/contracts
COPY apps/web ./apps/web

# VITE_* are inlined at build time, so the browser-facing API URLs must be set before build.
ARG VITE_TRADING_URL=http://localhost:4001/api/v1
ARG VITE_ANALYTICS_URL=http://localhost:4003/api/v1
ENV VITE_TRADING_URL=$VITE_TRADING_URL
ENV VITE_ANALYTICS_URL=$VITE_ANALYTICS_URL

WORKDIR /repo/apps/web
RUN pnpm build
EXPOSE 3000
CMD ["pnpm", "preview", "--host", "--port", "3000"]
