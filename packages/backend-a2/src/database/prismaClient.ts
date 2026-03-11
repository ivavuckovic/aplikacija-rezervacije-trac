import { PrismaClient } from '../generated/prisma';

const globalForPrisma = globalThis as unknown as {
  prismaA2: PrismaClient | undefined;
};

export const prisma: PrismaClient =
  globalForPrisma.prismaA2 ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prismaA2 = prisma;
}
