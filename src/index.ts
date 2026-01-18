import Fastify from 'fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { config } from './config';
import { logger } from './utils/logger';
import { setupRoutes } from './routes';
import { natsClient } from './services/nats';
import { setupExampleHandlers } from './handlers/example.handler';

async function buildServer() {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const server = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
      transport: isDevelopment
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'HH:MM:ss Z',
              ignore: 'pid,hostname',
            },
          }
        : undefined,
    },
    requestIdLogLabel: 'reqId',
    disableRequestLogging: false,
  });

  // Register plugins
  await server.register(helmet, {
    contentSecurityPolicy: false,
  });

  await server.register(cors, {
    origin: config.corsOrigin,
    credentials: true,
  });

  await server.register(rateLimit, {
    max: config.rateLimitMax,
    timeWindow: config.rateLimitWindow,
  });

  // Health check endpoint
  server.get('/health', async () => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  });

  // Setup application routes
  setupRoutes(server);

  return server;
}

async function start() {
  try {
    // Initialize NATS connection
    await natsClient.connect();
    logger.info('NATS client connected');

    // Setup NATS message handlers
    setupExampleHandlers();

    // Build and start Fastify server
    const server = await buildServer();
    await server.listen({
      port: config.port,
      host: config.host,
    });

    logger.info(`Server listening on ${config.host}:${config.port}`);

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully`);
      try {
        await server.close();
        await natsClient.disconnect();
        process.exit(0);
      } catch (err) {
        logger.error({ err }, 'Error during shutdown');
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    logger.error({ err }, 'Failed to start server');
    process.exit(1);
  }
}

start();
