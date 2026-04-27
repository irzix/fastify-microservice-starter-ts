import type { FastifyInstance } from 'fastify';

export async function requestId(server: FastifyInstance): Promise<void> {
  server.addHook('onRequest', async (request, reply) => {
    const id = (request.headers['x-request-id'] as string) ?? crypto.randomUUID();
    request.id = id;
    reply.header('x-request-id', id);
  });
}
