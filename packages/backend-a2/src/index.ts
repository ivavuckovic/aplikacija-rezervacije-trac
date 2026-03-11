import 'dotenv/config';
import { app }               from './app';
import { prisma }            from './database/prismaClient';
import { a2RabbitMQConsumer } from './messaging/rabbitMQConsumer';

const PORT = parseInt(process.env.PORT ?? '4001', 10);

async function bootstrap(): Promise<void> {
  console.log('╔══════════════════════════════════════╗');
  console.log('║   Salon Trač — Reporting Portal API  ║');
  console.log('╚══════════════════════════════════════╝');

  try {
    // 1. Konekcija na PostgreSQL A.2
    await prisma.$connect();
    console.log('✅ PostgreSQL (A.2) connected');

    // 2. Konekcija na RabbitMQ i setup queues
    await a2RabbitMQConsumer.connect();

    // 3. Pričekaj inicijalizaciju
    await new Promise((resolve) => setTimeout(resolve, 500));

    // 4. Počni konzumiranje événements iz A.1
    await a2RabbitMQConsumer.startConsuming();

    // 5. Pokreni HTTP server za Reporting API
    app.listen(PORT, () => {
      console.log(`\n🚀 Reporting API running on http://localhost:${PORT}`);
      console.log(`📊 Dashboard: http://localhost:${PORT}/api/reports/summary`);
      console.log(`📌 Environment: ${process.env.NODE_ENV}\n`);
    });

  } catch (error) {
    console.error('❌ [A.2] Bootstrap failed:', error);
    process.exit(1);
  }
}

async function shutdown(signal: string): Promise<void> {
  console.log(`\n⚠  [A.2] Received ${signal}. Shutting down...`);
  try {
    await a2RabbitMQConsumer.close();
    await prisma.$disconnect();
    console.log('✅ [A.2] Shutdown complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ [A.2] Shutdown error:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

process.on('uncaughtException', (err) => {
  console.error('❌ [A.2] Uncaught:', err);
  shutdown('uncaughtException');
});

bootstrap();
