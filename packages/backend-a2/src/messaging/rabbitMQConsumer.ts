import amqplib, { Connection, Channel, ConsumeMessage } from 'amqplib';
import { syncService } from '../services/SyncService';
import type { SalonEvent } from '../types';
import {
  EXCHANGE_NAME,
  REPORTING_QUEUES,
  ROUTING_KEYS,
} from '../types';

interface QueueConfig {
  name:       string;
  routingKey: string;
}

const QUEUE_CONFIGS: QueueConfig[] = [
  { name: REPORTING_QUEUES.CREATED,   routingKey: ROUTING_KEYS.CREATED   },
  { name: REPORTING_QUEUES.UPDATED,   routingKey: ROUTING_KEYS.UPDATED   },
  { name: REPORTING_QUEUES.CANCELLED, routingKey: ROUTING_KEYS.CANCELLED },
];

export class A2RabbitMQConsumer {
  private connection: Connection | null = null;
  private channel:    Channel    | null = null;
  private readonly url: string;

  constructor() {
    this.url = process.env.RABBITMQ_URL ?? 'amqp://localhost:5672';
  }

  // ── Setup konekcije i svih queues ─────────────────
  async connect(): Promise<void> {
    try {
      this.connection = await amqplib.connect(this.url);
      this.channel    = await this.connection.createChannel();

      // Prefetch 5 — reporting može obrađivati više odjednom
      await this.channel.prefetch(5);

      // Assert salon.events exchange
      await this.channel.assertExchange(EXCHANGE_NAME, 'topic', {
        durable: true,
      });

      // Kreiraj i bind queue za svaki tip eventa
      for (const config of QUEUE_CONFIGS) {
        await this.channel.assertQueue(config.name, {
          durable:   true,
          arguments: {
            'x-message-ttl': 86_400_000, // 24h TTL
          },
        });

        await this.channel.bindQueue(
          config.name,
          EXCHANGE_NAME,
          config.routingKey,
        );

        console.log(`📬 Bound queue: ${config.name} → ${config.routingKey}`);
      }

      // Reconnect na pad konekcije
      this.connection.on('close', () => {
        console.warn('⚠  [A.2] RabbitMQ closed. Reconnecting in 5s...');
        this.connection = null;
        this.channel    = null;
        setTimeout(() => this.connect(), 5000);
      });

      this.connection.on('error', (err) => {
        console.error('❌ [A.2] RabbitMQ error:', err.message);
      });

      console.log('✅ [A.2] RabbitMQ Consumer connected');

    } catch (error) {
      console.error('❌ [A.2] Consumer connect failed:', error);
      setTimeout(() => this.connect(), 5000);
    }
  }

  // ── Pokreni konzumiranje svih queues ──────────────
  async startConsuming(): Promise<void> {
    if (!this.channel) {
      throw new Error('[A.2] Consumer not connected');
    }

    for (const config of QUEUE_CONFIGS) {
      await this.channel.consume(
        config.name,
        async (msg) => {
          if (!msg) return;
          await this.handleMessage(msg, config.name);
        },
        { noAck: false },
      );

      console.log(`🎯 [A.2] Consuming: ${config.name}`);
    }
  }

  // ── Obrada jedne poruke ───────────────────────────
  private async handleMessage(
    msg:       ConsumeMessage,
    queueName: string,
  ): Promise<void> {
    let eventId = 'UNKNOWN';

    try {
      const rawContent = msg.content.toString();
      const event      = JSON.parse(rawContent) as SalonEvent;
      eventId          = event.eventId;

      console.log(`\n📨 [A.2] Received [${queueName}]: ${event.eventType} | ${eventId}`);

      await syncService.processEvent(event);

      this.channel?.ack(msg);
      console.log(`✅ [A.2] ACK: ${eventId}`);

    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown';
      console.error(`❌ [A.2] Error processing [${eventId}]: ${errMsg}`);

      // NACK bez requeue — greška je logirana u sync_events
      // Manuelna inspekcija i re-processing ako treba
      this.channel?.nack(msg, false, false);
    }
  }

  async close(): Promise<void> {
    try {
      await this.channel?.close();
      await this.connection?.close();
      console.log('✅ [A.2] Consumer closed');
    } catch (error) {
      console.error('❌ [A.2] Error closing consumer:', error);
    }
  }

  isReady(): boolean {
    return this.channel !== null && this.connection !== null;
  }
}

export const a2RabbitMQConsumer = new A2RabbitMQConsumer();
