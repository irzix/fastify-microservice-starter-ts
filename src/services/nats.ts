import {
  connect,
  type NatsConnection,
  type Subscription,
  JSONCodec,
} from 'nats';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';

const jc = JSONCodec();

class NatsClient {
  private nc: NatsConnection | null = null;
  private subs: Subscription[] = [];

  async connect(): Promise<void> {
    this.nc = await connect({
      servers: config.nats.servers,
      reconnectTimeWait: config.nats.reconnectTimeWait,
      maxReconnectAttempts: config.nats.maxReconnectAttempts,
    });

    this.nc.closed().then((err) => {
      if (err) logger.error({ err }, 'NATS connection closed with error');
      else logger.info('NATS connection closed');
    });

    logger.info(`Connected to NATS: ${config.nats.servers.join(', ')}`);
  }

  async disconnect(): Promise<void> {
    for (const sub of this.subs) sub.unsubscribe();
    this.subs = [];
    if (this.nc) {
      await this.nc.drain();
      this.nc = null;
    }
  }

  publish(subject: string, data: unknown): void {
    if (!this.nc) throw new Error('NATS not connected');
    this.nc.publish(subject, jc.encode(data));
  }

  async request(subject: string, data: unknown, timeout = 5000): Promise<unknown> {
    if (!this.nc) throw new Error('NATS not connected');
    const msg = await this.nc.request(subject, jc.encode(data), { timeout });
    return jc.decode(msg.data);
  }

  subscribe(
    subject: string,
    handler: (data: unknown, reply?: string) => void | Promise<void>,
  ): void {
    if (!this.nc) throw new Error('NATS not connected');

    const sub = this.nc.subscribe(subject);
    this.subs.push(sub);

    (async () => {
      for await (const msg of sub) {
        try {
          const data = jc.decode(msg.data);
          await handler(data, msg.reply || undefined);
        } catch (err) {
          logger.error({ err }, `Error handling message on ${subject}`);
        }
      }
    })();

    logger.info(`Subscribed to: ${subject}`);
  }

  get connected(): boolean {
    return this.nc !== null && !this.nc.isClosed();
  }
}

export const natsClient = new NatsClient();
