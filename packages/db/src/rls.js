"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withRLS = withRLS;
exports.setTenantContext = setTenantContext;
/**
 * Creates a Prisma extension that sets the PostgreSQL session variable
 * `app.current_tenant_id` before every query, enabling Row-Level Security.
 *
 * Usage:
 *   const db = createTenantClient(businessId);
 *   const contents = await db.content.findMany();
 *   await db.$disconnect();
 */
function withRLS(client, businessId) {
    return client.$extends({
        query: {
            $allModels: {
                async $allOperations({ args, query }) {
                    await client.$executeRaw `SELECT set_config('app.current_tenant_id', ${businessId}, true)`;
                    return query(args);
                },
            },
        },
    });
}
/**
 * Sets the tenant context on an existing transaction client.
 * Use this inside $transaction callbacks.
 */
async function setTenantContext(tx, businessId) {
    await tx['$executeRaw'] `SELECT set_config('app.current_tenant_id', ${businessId}, true)`;
}
//# sourceMappingURL=rls.js.map