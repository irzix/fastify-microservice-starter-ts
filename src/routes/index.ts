import { FastifyInstance } from 'fastify';
import { exampleRoutes } from './example';

export function setupRoutes(server: FastifyInstance): void {
  server.register(exampleRoutes, { prefix: '/api/v1' });
}
