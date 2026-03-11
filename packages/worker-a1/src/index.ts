import 'dotenv/config';
import { prisma }           from './database/prismaClient';
import { rabbitMQConsumer } from './messaging/rabbitMQConsumer';

// ── Globalni flag za graceful shutdown ────────────────
let isShuttingDown = false;

async function bootstrap(): Promise<void> {
  console.log('╔════════════════════════════════════╗');
  console.log('║   Salon Trač — Reservation Worker   ║');
  console.log('╚════════════════════════════════════╝');
  console.log(`📌 Environment: ${process.env.NODE_ENV ?? 'development'}`);
  console.log(`⏰ Started at: ${new Date().toISOString()}\n`);

  try {
    // 1. Konekcija na PostgreSQL
    await prisma.$connect();
    console.log('✅ PostgreSQL (A.1) connected');

    // 2. Konekcija na RabbitMQ i setup queues
    await rabbitMQConsumer.connect();

    // 3. Pričekaj malo da se sve inicijalizuje
    await new Promise((resolve) => setTimeout(resolve, 500));

    // 4. Počni konzumiranje poruka
    await rabbitMQConsumer.startConsuming();

    console.log('\n🚀 Worker is running. Waiting for messages...');
    console.log('   Press Ctrl+C to stop\n');

  } catch (error) {
    console.error('❌ Worker bootstrap failed:', error);
    process.exit(1);
  }
}

// ── Graceful Shutdown ────────────────────────────────
async function shutdown(signal: string): Promise<void> {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\n⚠  Received ${signal}. Graceful shutdown initiated...`);
  console.log('   Waiting for current message to finish...');

  try {
    // Daj workeru 10s da završi tekuću obradu
    const shutdownTimeout = setTimeout(() => {
      console.error('❌ Shutdown timeout. Forcing exit.');
      process.exit(1);
    }, 10_000);

    await rabbitMQConsumer.close();
    await prisma.$disconnect();

    clearTimeout(shutdownTimeout);
    console.log('✅ Worker stopped gracefully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
}

// ── Signal handlers ───────────────────────────────────
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

// ── Uncaught exception handler ────────────────────────
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  shutdown('uncaughtException');
});

process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled Rejection:', reason);
  shutdown('unhandledRejection');
});

// ── Start ─────────────────────────────────────────────
bootstrap();
