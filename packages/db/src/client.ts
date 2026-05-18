import { PrismaClient } from '@prisma/client';
import { AsyncLocalStorage } from 'async_hooks';

export const tenantStorage = new AsyncLocalStorage<string>();

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

  // Apply row-level security automatically for all queries when tenant context is active!
  return client.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query }: { args: any; query: (args: any) => Promise<any> }) {
          const tenantId = tenantStorage.getStore();
          if (tenantId) {
            // Use executeRawUnsafe to guarantee session scope parameter binding for RLS
            await client.$executeRawUnsafe(`SELECT set_config('app.current_tenant_id', '${tenantId}', true)`);
          }
          return query(args);
        },
      },
    },
  }) as unknown as PrismaClient;
}

// Singleton: reuse in development to avoid exhausting connection pool
export const prisma = global.__prisma ?? createPrismaClient();

if (process.env['NODE_ENV'] !== 'production') {
  global.__prisma = prisma;
}
