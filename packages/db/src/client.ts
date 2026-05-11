import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  const client = new PrismaClient({
    log:
      process.env['NODE_ENV'] === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

  return client;
}

// Singleton: reuse in development to avoid exhausting connection pool
export const prisma = global.__prisma ?? createPrismaClient();

if (process.env['NODE_ENV'] !== 'production') {
  global.__prisma = prisma;
}
