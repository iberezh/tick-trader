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
  port: Number(process.env.PORT ?? 4001),
};
