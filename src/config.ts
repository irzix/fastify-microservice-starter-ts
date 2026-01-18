import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  rateLimitWindow: process.env.RATE_LIMIT_WINDOW || '1 minute',
  nats: {
    servers: process.env.NATS_SERVERS?.split(',') || ['nats://localhost:4222'],
    reconnectTimeWait: parseInt(process.env.NATS_RECONNECT_TIME_WAIT || '2000', 10),
    maxReconnectAttempts: parseInt(process.env.NATS_MAX_RECONNECT_ATTEMPTS || '10', 10),
  },
};
