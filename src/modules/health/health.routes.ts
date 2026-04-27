import type { FastifyInstance } from 'fastify';
import { natsClient } from '../../messaging/nats.js';

export async function healthRoutes(server: FastifyInstance): Promise<void> {
  server.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    nats: natsClient.connected,
  }));
}
