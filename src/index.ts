import { buildApp } from './app.js';
import { config } from './core/config.js';
import { logger } from './core/logger.js';
import { natsClient } from './messaging/nats.js';

async function start() {
  try {
    // 1. Connect to Message Broker
    await natsClient.connect();
    
    // 2. Build & Start HTTP Server
    const app = await buildApp();
    await app.listen({ port: config.port, host: config.host });

    logger.info(`Server listening on ${config.host}:${config.port}`);

    // ── Graceful shutdown ────────────────────────────────────────────────
    let isShuttingDown = false;

    const shutdown = async (signal: string) => {
      if (isShuttingDown) return;
      isShuttingDown = true;

      logger.info(`Received ${signal}, starting graceful shutdown…`);

      // Stop accepting new connections
      const closeTimeout = setTimeout(() => {
        logger.error('Graceful shutdown timed out, forcing exit');
        process.exit(1);
      }, config.shutdownTimeout);

      try {
        await app.close();
        await natsClient.disconnect();
        clearTimeout(closeTimeout);
        logger.info('Shutdown complete');
        process.exit(0);
      } catch (err) {
        logger.error({ err }, 'Error during shutdown');
        clearTimeout(closeTimeout);
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
