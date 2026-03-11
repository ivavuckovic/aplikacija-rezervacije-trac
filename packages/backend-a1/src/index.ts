import 'dotenv/config';
import { app } from './app';
import { prisma } from './infrastructure/database/prismaClient';
import { redisClient } from './infrastructure/cache/redisClient';
import { rabbitMQPublisher } from './infrastructure/messaging/rabbitMQPublisher';

const PORT = parseInt(process.env.PORT ?? '4000', 10);

async function bootstrap(): Promise<void> {
  try {
    await prisma.$connect();
    console.log('✅ PostgreSQL connected');

    await redisClient.connect();
    console.log('✅ Redis connected');

    await rabbitMQPublisher.connect();
    console.log('✅ RabbitMQ connected');

    app.listen(PORT, () => {
      console.log(`🚀 Backend A.1 running on http://localhost:${PORT}`);
      console.log(`📌 Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

async function shutdown(signal: string): Promise<void> {
  console.log(`\n⚠  Received ${signal}. Shutting down gracefully...`);
  try {
    await prisma.$disconnect();
    await redisClient.disconnect();
    await rabbitMQPublisher.close();
    console.log('✅ All connections closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

bootstrap();
