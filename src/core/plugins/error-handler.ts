import type { FastifyInstance, FastifyReply, FastifyRequest, FastifyError } from 'fastify';
import { logger } from '../logger.js';

export async function errorHandler(server: FastifyInstance): Promise<void> {
  server.setErrorHandler((error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
    const statusCode = error.statusCode ?? 500;

    if (statusCode >= 500) {
      logger.error({ err: error, requestId: request.id }, error.message);
    } else {
      logger.warn({ err: error, requestId: request.id }, error.message);
    }

    return reply.code(statusCode).send({
      statusCode,
      error: error.name ?? 'Error',
      message: error.message,
      requestId: request.id,
    });
  });

  server.setNotFoundHandler((_request, reply) => {
    return reply.code(404).send({
      statusCode: 404,
      error: 'Not Found',
      message: 'Route not found',
    });
  });
}
