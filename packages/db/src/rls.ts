import { PrismaClient } from '@prisma/client';

/**
 * Creates a Prisma extension that sets the PostgreSQL session variable
 * `app.current_tenant_id` before every query, enabling Row-Level Security.
 *
 * Usage:
 *   const db = createTenantClient(businessId);
 *   const contents = await db.content.findMany();
 *   await db.$disconnect();
 */
export function withRLS(client: PrismaClient, businessId: string): PrismaClient {
  return client.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query }: { args: unknown; query: (args: unknown) => Promise<unknown> }) {
          await client.$executeRaw`SELECT set_config('app.current_tenant_id', ${businessId}, true)`;
          return query(args);
        },
      },
    },
  }) as unknown as PrismaClient;
}

/**
 * Sets the tenant context on an existing transaction client.
 * Use this inside $transaction callbacks.
 */
export async function setTenantContext(
  tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>,
  businessId: string,
): Promise<void> {
  await tx['$executeRaw']`SELECT set_config('app.current_tenant_id', ${businessId}, true)`;
}
