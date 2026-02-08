import type { FastifyInstance } from 'fastify';
import { exampleRoutes } from './example.js';

export function setupRoutes(server: FastifyInstance): void {
  server.register(exampleRoutes, { prefix: '/api/v1' });
}
