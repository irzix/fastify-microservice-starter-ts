const env = (key: string, fallback: string): string =>
  process.env[key] ?? fallback;

const int = (key: string, fallback: number): number =>
  Number.parseInt(env(key, String(fallback)), 10);

export const config = {
  port: int('PORT', 3000),
  host: env('HOST', '0.0.0.0'),
  nodeEnv: env('NODE_ENV', 'development'),
  corsOrigin: env('CORS_ORIGIN', '*'),
  rateLimitMax: int('RATE_LIMIT_MAX', 100),
  rateLimitWindow: env('RATE_LIMIT_WINDOW', '1 minute'),
  nats: {
    servers: env('NATS_SERVERS', 'nats://localhost:4222').split(','),
    reconnectTimeWait: int('NATS_RECONNECT_TIME_WAIT', 2000),
    maxReconnectAttempts: int('NATS_MAX_RECONNECT_ATTEMPTS', 10),
  },
} as const;
