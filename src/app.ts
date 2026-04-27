import Fastify from 'fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { config } from './core/config.js';
import { errorHandler, requestId } from './core/plugins/index.js';
import { healthRoutes } from './modules/health/health.routes.js';
import { orderRoutes } from './modules/order/order.routes.js';

export async function buildApp() {
  const isDev = config.nodeEnv !== 'production';

  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? (isDev ? 'debug' : 'info'),
    },
    genReqId: () => crypto.randomUUID(),
  });

  // ── Plugins ──────────────────────────────────────────────────────────────
  await app.register(requestId);
  await app.register(errorHandler);
  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cors, { origin: config.corsOrigin, credentials: true });
  await app.register(rateLimit, {
    max: config.rateLimitMax,
    timeWindow: config.rateLimitWindow,
  });

  // ── Modules ──────────────────────────────────────────────────────────────
  await app.register(healthRoutes);
  await app.register(orderRoutes, { prefix: '/api/v1' });

  return app;
}
