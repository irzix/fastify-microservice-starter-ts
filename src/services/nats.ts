import { connect, NatsConnection, JSONCodec, Subscription } from 'nats';
import { config } from '../config';
import { logger } from '../utils/logger';

const jsonCodec = JSONCodec();

class NatsClient {
  private connection: NatsConnection | null = null;
  private subscriptions: Map<string, Subscription> = new Map();

  async connect(): Promise<void> {
    try {
      this.connection = await connect({
        servers: config.nats.servers,
        reconnectTimeWait: config.nats.reconnectTimeWait,
        maxReconnectAttempts: config.nats.maxReconnectAttempts,
      });

      this.connection.closed().then((err) => {
        if (err) {
          logger.error({ err }, 'NATS connection closed with error');
        } else {
          logger.info('NATS connection closed');
        }
      });

      logger.info(`Connected to NATS servers: ${config.nats.servers.join(', ')}`);
    } catch (error) {
      logger.error({ err: error }, 'Failed to connect to NATS');
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    // Unsubscribe from all subscriptions
    for (const [subject, subscription] of this.subscriptions.entries()) {
      subscription.unsubscribe();
      this.subscriptions.delete(subject);
    }

    if (this.connection) {
      await this.connection.close();
      this.connection = null;
    }
  }

  async publish(subject: string, data: unknown): Promise<void> {
    if (!this.connection) {
      throw new Error('NATS connection not established');
    }

    const encoded = jsonCodec.encode(data);
    this.connection.publish(subject, encoded);
  }

  async request(subject: string, data: unknown, timeout = 5000): Promise<unknown> {
    if (!this.connection) {
      throw new Error('NATS connection not established');
    }

    const encoded = jsonCodec.encode(data);
    const response = await this.connection.request(subject, encoded, { timeout });
    return jsonCodec.decode(response.data);
  }

  subscribe(
    subject: string,
    handler: (data: unknown, reply?: string) => void | Promise<void>
  ): void {
    if (!this.connection) {
      throw new Error('NATS connection not established');
    }

    const subscription = this.connection.subscribe(subject);
    this.subscriptions.set(subject, subscription);

    (async () => {
      for await (const msg of subscription) {
        try {
          const data = jsonCodec.decode(msg.data);
          await handler(data, msg.reply ? msg.reply : undefined);
        } catch (error) {
          logger.error({ err: error }, `Error handling message on subject ${subject}`);
        }
      }
    })();

    logger.info(`Subscribed to NATS subject: ${subject}`);
  }

  isConnected(): boolean {
    return this.connection !== null && !this.connection.isClosed();
  }
}

export const natsClient = new NatsClient();
