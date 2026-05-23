import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { prisma, withRLS } from '@brandflow/db';
import { TenantContext } from '../tenant/tenant.context';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await prisma.$connect();
  }

  async onModuleDestroy() {
    await prisma.$disconnect();
  }

  /**
   * Returns a tenant-aware Prisma client if a tenant context is present.
   * Otherwise returns the default prisma singleton.
   */
  get client() {
    const tenantId = TenantContext.getTenantId();
    if (tenantId) {
      return withRLS(prisma, tenantId);
    }
    return prisma;
  }
}
