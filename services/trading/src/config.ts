function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

export const config = {
  kafkaBrokers: (process.env.KAFKA_BROKERS ?? 'localhost:9094').split(','),
  databaseUrl: required('DATABASE_URL'),
  // Shared with analytics so it can verify the same auth cookie. Dev default; set in real envs.
  jwtSecret: process.env.JWT_SECRET ?? 'dev-only-insecure-change-me',
  // Origins allowed to send credentialed requests. Reflecting any origin would defeat the
  // httpOnly cookie, so we use an explicit allowlist; add prod origins via WEB_ORIGIN (comma-sep).
  corsOrigins: [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:3010',
    ...(process.env.WEB_ORIGIN?.split(',') ?? []),
  ].map((o) => o.trim()),
  port: Number(process.env.PORT ?? 4001),
};

export function isAllowedOrigin(origin: string | undefined): origin is string {
  return origin !== undefined && config.corsOrigins.includes(origin);
}
