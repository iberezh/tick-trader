function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

export const config = {
  kafkaBrokers: (process.env.KAFKA_BROKERS ?? 'localhost:9094').split(','),
  databaseUrl: required('DATABASE_URL'),
  // Must match the trading service's secret — analytics verifies the same auth cookie.
  jwtSecret: process.env.JWT_SECRET ?? 'dev-only-insecure-change-me',
  // Explicit allowlist for credentialed requests (REST + the raw SSE write); add prod
  // origins via WEB_ORIGIN (comma-sep). Reflecting any origin would defeat the cookie.
  corsOrigins: [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:3010',
    ...(process.env.WEB_ORIGIN?.split(',') ?? []),
  ].map((o) => o.trim()),
  port: Number(process.env.PORT ?? 4003),
};

export function isAllowedOrigin(origin: string | undefined): origin is string {
  return origin !== undefined && config.corsOrigins.includes(origin);
}
