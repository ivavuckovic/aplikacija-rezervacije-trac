import amqplib, { Connection, Channel, Options } from 'amqplib';

export const EXCHANGE_NAME = 'salon.events';
export const ROUTING_KEYS = {
  RESERVATION_PENDING:   'reservation.pending',
  RESERVATION_CREATED:   'reservation.created',
  RESERVATION_UPDATED:   'reservation.updated',
  RESERVATION_CANCELLED: 'reservation.cancelled',
  RESERVATION_FAILED:    'reservation.failed',
} as const;

export type RoutingKey = typeof ROUTING_KEYS[keyof typeof ROUTING_KEYS];

class RabbitMQPublisher {
  private connection: Connection | null = null;
  private channel:    Channel    | null = null;
  private readonly url: string;

  constructor() {
    this.url = process.env.RABBITMQ_URL ?? 'amqp://localhost:5672';
  }

  async connect(): Promise<void> {
    try {
      this.connection = (await amqplib.connect(this.url)) as any;
      if (!this.connection) throw new Error('Failed to connect to RabbitMQ');
      this.channel    = await (this.connection as any).createChannel();
      if (!this.channel) throw new Error('Failed to create channel');

      await this.channel.assertExchange(EXCHANGE_NAME, 'topic', {
        durable: true,
      });

      (this.connection as any).on('close', () => {
        console.warn('⚠  RabbitMQ connection closed. Reconnecting in 5s...');
        this.connection = null;
        this.channel    = null;
        setTimeout(() => this.connect(), 5000);
      });

      (this.connection as any).on('error', (err: Error) => {
        console.error('❌ RabbitMQ connection error:', err.message);
      });

      console.log(`✅ RabbitMQ Publisher connected to exchange: ${EXCHANGE_NAME}`);
    } catch (error) {
      console.error('❌ Failed to connect to RabbitMQ:', error);
      setTimeout(() => this.connect(), 5000);
    }
  }

  async publish<T extends object>(
    routingKey: RoutingKey,
    message:    T,
  ): Promise<boolean> {
    if (!this.channel) {
      console.error('❌ RabbitMQ channel not available');
      return false;
    }

    try {
      const payload = Buffer.from(JSON.stringify(message));

      const options: Options.Publish = {
        persistent:   true,
        contentType:  'application/json',
        timestamp:    Math.floor(Date.now() / 1000),
        messageId:    crypto.randomUUID(),
      };

      const result = this.channel.publish(
        EXCHANGE_NAME,
        routingKey,
        payload,
        options,
      );

      if (result) {
        console.log(`📤 Published [${routingKey}]:`, JSON.stringify(message).slice(0, 100));
      } else {
        console.warn(`⚠  Publish returned false for [${routingKey}]`);
      }

      return result;
    } catch (error) {
      console.error(`❌ Failed to publish [${routingKey}]:`, error);
      return false;
    }
  }

  async close(): Promise<void> {
    try {
      await this.channel?.close();
      await (this.connection as any)?.close();
      console.log('✅ RabbitMQ Publisher closed');
    } catch (error) {
      console.error('❌ Error closing RabbitMQ Publisher:', error);
    }
  }

  isReady(): boolean {
    return this.channel !== null && this.connection !== null;
  }
}

export const rabbitMQPublisher = new RabbitMQPublisher();
