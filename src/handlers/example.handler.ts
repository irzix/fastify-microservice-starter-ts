import { natsClient } from '../services/nats';
import { logger } from '../utils/logger';

// Example NATS message handler
export function setupExampleHandlers(): void {
  // Subscribe to example subject
  natsClient.subscribe('example.hello', async (data, reply) => {
    logger.info({ data }, 'Received message on example.hello');

    if (reply) {
      await natsClient.publish(reply, {
        message: 'Hello from microservice!',
        received: data,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Subscribe to another example subject
  natsClient.subscribe('example.process', async (data) => {
    logger.info({ data }, 'Processing message on example.process');
    // Add your business logic here
  });
}
