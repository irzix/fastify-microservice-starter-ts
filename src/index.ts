import Fastify from 'fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { config } from './config.js';
import { logger } from './utils/logger.js';
import { setupRoutes } from './routes/index.js';
import { natsClient } from './services/nats.js';
import { setupExampleHandlers } from './handlers/example.handler.js';

export async function buildServer() {
  const isDev = config.nodeEnv !== 'production';

  const server = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? (isDev ? 'debug' : 'info'),
    },
  });

  // Register plugins
  await server.register(helmet, { contentSecurityPolicy: false });
  await server.register(cors, { origin: config.corsOrigin, credentials: true });
  await server.register(rateLimit, {
    max: config.rateLimitMax,
    timeWindow: config.rateLimitWindow,
  });

  // Health check endpoint
  server.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    nats: natsClient.connected,
  }));

  // Setup application routes
  setupRoutes(server);

  return server;
}

async function start() {
  try {
    await natsClient.connect();
    setupExampleHandlers();

    const server = await buildServer();
    await server.listen({ port: config.port, host: config.host });

    logger.info(`Server listening on ${config.host}:${config.port}`);

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}, shutting down`);
      await server.close();
      await natsClient.disconnect();
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    logger.error({ err }, 'Failed to start server');
    process.exit(1);
  }
}

start();
