import amqplib, { Connection, Channel } from 'amqplib';
import { EXCHANGE_NAME, ROUTING_KEYS }  from '../types';

type RoutingKey = typeof ROUTING_KEYS[keyof typeof ROUTING_KEYS];

class WorkerPublisher {
  private connection: Connection | null = null;
  private channel:    Channel    | null = null;
  private readonly url: string;

  constructor() {
    this.url = process.env.RABBITMQ_URL ?? 'amqp://localhost:5672';
  }

  async connect(existingConnection: Connection): Promise<void> {
    // Worker deli konekciju sa Consumer-om, ali ima zasebni channel
    this.connection = existingConnection;
    this.channel    = await this.connection.createChannel();

    await this.channel.assertExchange(EXCHANGE_NAME, 'topic', {
      durable: true,
    });

    console.log('✅ Worker Publisher channel ready');
  }

  async publish<T extends object>(
    routingKey: RoutingKey,
    message:    T,
  ): Promise<boolean> {
    if (!this.channel) {
      console.error('❌ Worker Publisher: channel not ready');
      return false;
    }

    try {
      const payload = Buffer.from(JSON.stringify(message));
      const result  = this.channel.publish(
        EXCHANGE_NAME,
        routingKey,
        payload,
        {
          persistent:  true,
          contentType: 'application/json',
          timestamp:   Math.floor(Date.now() / 1000),
          messageId:   crypto.randomUUID(),
        },
      );

      console.log(`📤 Worker published [${routingKey}]`);
      return result;
    } catch (error) {
      console.error(`❌ Worker publish error [${routingKey}]:`, error);
      return false;
    }
  }

  async close(): Promise<void> {
    await this.channel?.close();
  }
}

export const workerPublisher = new WorkerPublisher();
