import amqplib, { Connection, Channel, ConsumeMessage } from 'amqplib';
import { reservationWorkerService } from '../services/ReservationWorkerService';
import { workerPublisher }          from './rabbitMQPublisher';
import {
  ReservationMessage,
  EXCHANGE_NAME,
  PENDING_QUEUE,
  DEAD_LETTER_EXCHANGE,
  DEAD_LETTER_QUEUE,
  ROUTING_KEYS,
} from '../types';

const MAX_RETRIES = 3;

export class RabbitMQConsumer {
  private connection: Connection | null = null;
  private channel:    Channel    | null = null;
  private readonly url: string;

  constructor() {
    this.url = process.env.RABBITMQ_URL ?? 'amqp://localhost:5672';
  }

  // ── Konekcija i setup exchange/queue-a ────────────
  async connect(): Promise<void> {
    try {
      this.connection = await amqplib.connect(this.url);
      this.channel    = await this.connection.createChannel();

      // Prefetch = 1: Worker obrađuje 1 poruku u isto vreme
      await this.channel.prefetch(1);

      // ── Main Exchange ──────────────────────────────
      await this.channel.assertExchange(EXCHANGE_NAME, 'topic', {
        durable: true,
      });

      // ── Dead Letter Exchange ───────────────────────
      await this.channel.assertExchange(DEAD_LETTER_EXCHANGE, 'topic', {
        durable: true,
      });

      // ── Dead Letter Queue ──────────────────────────
      await this.channel.assertQueue(DEAD_LETTER_QUEUE, {
        durable: true,
      });
      await this.channel.bindQueue(
        DEAD_LETTER_QUEUE,
        DEAD_LETTER_EXCHANGE,
        '#',
      );

      // ── Main Pending Queue ─────────────────────────
      // Sa DLX konfiguracijom — po max retries ide u DLQ
      await this.channel.assertQueue(PENDING_QUEUE, {
        durable:   true,
        arguments: {
          'x-dead-letter-exchange':    DEAD_LETTER_EXCHANGE,
          'x-dead-letter-routing-key': 'reservation.dead',
          'x-message-ttl':             30000,   // 30s TTL po poruci
        },
      });

      await this.channel.bindQueue(
        PENDING_QUEUE,
        EXCHANGE_NAME,
        ROUTING_KEYS.RESERVATION_PENDING,
      );

      // ── Deli konekciju sa Publisher-om ─────────────
      await workerPublisher.connect(this.connection);

      // ── Graceful shutdown ──────────────────────────
      this.connection.on('close', () => {
        console.warn('⚠  RabbitMQ connection closed. Reconnecting...');
        setTimeout(() => this.connect(), 5000);
      });

      this.connection.on('error', (err) => {
        console.error('❌ RabbitMQ connection error:', err.message);
      });

      console.log(`✅ Consumer connected`);
      console.log(`📬 Listening on queue: ${PENDING_QUEUE}`);

    } catch (error) {
      console.error('❌ Consumer connect failed:', error);
      setTimeout(() => this.connect(), 5000);
    }
  }

  // ── Pokretanje konzumiranja poruka ─────────────────
  async startConsuming(): Promise<void> {
    if (!this.channel) {
      throw new Error('Consumer not connected. Call connect() first.');
    }

    await this.channel.consume(
      PENDING_QUEUE,
      async (msg) => {
        if (!msg) return;

        await this.handleMessage(msg);
      },
      { noAck: false }, // Manuelni ACK/NACK
    );

    console.log(`🎯 Worker started consuming from: ${PENDING_QUEUE}`);
  }

  // ── Obrada jedne poruke ────────────────────────────
  private async handleMessage(msg: ConsumeMessage): Promise<void> {
    const startTime = Date.now();

    let parsedMessage: ReservationMessage | null = null;
    let correlationId = 'UNKNOWN';

    try {
      // 1. Parse JSON poruke
      const rawContent = msg.content.toString();
      parsedMessage    = JSON.parse(rawContent) as ReservationMessage;
      correlationId    = parsedMessage.correlationId;

      // 2. Provjeri broj pokušaja (x-death header)
      const retryCount = this.getRetryCount(msg);
      console.log(`\n📨 [${correlationId}] Attempt ${retryCount + 1}/${MAX_RETRIES}`);

      if (retryCount >= MAX_RETRIES) {
        // Maksimalni broj pokušaja dostignut → Dead Letter
        console.error(`💀 [${correlationId}] Max retries reached. Sending to DLQ.`);
        await reservationWorkerService.handleFailure(
          parsedMessage,
          `MAX_RETRIES_EXCEEDED:${retryCount}`,
        );
        this.nack(msg, false); // Ne requeue
        return;
      }

      // 3. Delegiraj obradu Worker servisu
      await reservationWorkerService.processReservation(parsedMessage);

      // 4. ACK — poruka uspješno obrađena
      this.ack(msg);

      const elapsed = Date.now() - startTime;
      console.log(`✅ [${correlationId}] Processed in ${elapsed}ms`);

    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ [${correlationId}] Handler error: ${errMsg}`);

      // NACK sa requeue — pokušaj ponovo (do MAX_RETRIES)
      const retryCount = this.getRetryCount(msg);
      const shouldRequeue = retryCount < MAX_RETRIES - 1;

      if (!shouldRequeue && parsedMessage) {
        await reservationWorkerService.handleFailure(
          parsedMessage,
          `PROCESSING_ERROR:${errMsg}`,
        );
      }

      this.nack(msg, shouldRequeue);
    }
  }

  // ── Helper: broji pokušaje iz x-death headera ─────
  private getRetryCount(msg: ConsumeMessage): number {
    const xDeath = msg.properties.headers?.['x-death'];
    if (!xDeath || !Array.isArray(xDeath)) return 0;
    return xDeath.reduce(
      (sum: number, entry: { count: number }) => sum + (entry.count ?? 0),
      0,
    );
  }

  // ── ACK / NACK ─────────────────────────────────────
  private ack(msg: ConsumeMessage): void {
    try {
      this.channel?.ack(msg);
    } catch (e) {
      console.error('❌ ACK error:', e);
    }
  }

  private nack(msg: ConsumeMessage, requeue: boolean): void {
    try {
      this.channel?.nack(msg, false, requeue);
    } catch (e) {
      console.error('❌ NACK error:', e);
    }
  }

  // ── Graceful shutdown ──────────────────────────────
  async close(): Promise<void> {
    try {
      await workerPublisher.close();
      await this.channel?.close();
      await this.connection?.close();
      console.log('✅ Consumer closed');
    } catch (error) {
      console.error('❌ Error closing consumer:', error);
    }
  }

  isReady(): boolean {
    return this.channel !== null && this.connection !== null;
  }
}

export const rabbitMQConsumer = new RabbitMQConsumer();
