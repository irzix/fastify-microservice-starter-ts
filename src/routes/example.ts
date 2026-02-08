import type { FastifyInstance } from 'fastify';
import { natsClient } from '../services/nats.js';

export async function exampleRoutes(server: FastifyInstance): Promise<void> {
  // Example GET endpoint
  server.get('/example', async () => ({
    message: 'This is an example endpoint',
    timestamp: new Date().toISOString(),
  }));

  // Example POST endpoint with NATS publish
  server.post('/example/publish', async (request, reply) => {
    const { subject, data } = request.body as { subject: string; data: unknown };

    if (!subject) {
      return reply.code(400).send({ error: 'Subject is required' });
    }

    try {
      natsClient.publish(subject, data);
      return { success: true, message: `Message published to ${subject}` };
    } catch (error) {
      server.log.error({ err: error }, 'Failed to publish message');
      return reply.code(500).send({ error: 'Failed to publish message' });
    }
  });

  // Example endpoint with NATS request/reply
  server.post('/example/request', async (request, reply) => {
    const { subject, data, timeout } = request.body as {
      subject: string;
      data: unknown;
      timeout?: number;
    };

    if (!subject) {
      return reply.code(400).send({ error: 'Subject is required' });
    }

    try {
      const response = await natsClient.request(subject, data, timeout);
      return { success: true, response };
    } catch (error) {
      server.log.error({ err: error }, 'Failed to request message');
      return reply.code(500).send({ error: 'Request timeout or failed' });
    }
  });
}
