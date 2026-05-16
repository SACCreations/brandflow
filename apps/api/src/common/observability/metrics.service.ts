import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Records a business metric event.
   */
  async recordMetric(
    businessId: string,
    key: string,
    value: number | string | any,
    metadata: Record<string, any> = {}
  ) {
    try {
      await this.prisma.client.analyticsEvent.create({
        data: {
          businessId,
          source: 'system.metrics',
          eventType: `metric.${key}`,
          payload: { value, ...metadata },
        },
      });
    } catch (err: any) {
      this.logger.error(`Failed to record metric ${key}: ${err.message}`);
    }
  }

  /**
   * Tracks a successful operation.
   */
  async incrementSuccess(businessId: string, operation: string) {
    await this.recordMetric(businessId, `${operation}.success`, 1);
  }

  /**
   * Tracks a failed operation.
   */
  async incrementFailure(businessId: string, operation: string, reason: string) {
    await this.recordMetric(businessId, `${operation}.failure`, 1, { reason });
  }
}
