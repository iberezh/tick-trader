function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

export const config = {
  kafkaBrokers: (process.env.KAFKA_BROKERS ?? 'localhost:9094').split(','),
  databaseUrl: required('DATABASE_URL'),
  port: Number(process.env.PORT ?? 4003),
};
