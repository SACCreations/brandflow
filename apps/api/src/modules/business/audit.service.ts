import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { createHash } from 'crypto';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async getLogs(businessId: string, limit = 50, offset = 0) {
    return this.prisma.client.auditLog.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  async log(params: {
    businessId: string;
    userId?: string;
    action: string;
    entityType: string;
    entityId?: string;
    before?: any;
    after?: any;
  }) {
    const { businessId, userId, action, entityType, entityId, before, after } = params;

    // Get previous hash for the business to create a chain
    const lastLog = await this.prisma.client.auditLog.findFirst({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
    });

    const previousHash = lastLog?.hash || null;
    
    // Create tamper-evident hash
    const dataToHash = JSON.stringify({
      businessId,
      userId,
      action,
      entityType,
      entityId,
      before,
      after,
      previousHash,
      timestamp: new Date().toISOString(),
    });
    
    const hash = createHash('sha256').update(dataToHash).digest('hex');

    return this.prisma.client.auditLog.create({
      data: {
        businessId,
        userId,
        action,
        entityType,
        entityId,
        before,
        after,
        hash,
        previousHash,
      },
    });
  }
}
