import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QUEUES } from '@brandflow/shared';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsProcessor } from './analytics.processor';
import { NotificationsModule } from '../notifications/notifications.module';
import { ReliabilityMonitorService } from './reliability-monitor.service';

@Module({
  imports: [
    BullModule.registerQueue({ name: QUEUES.ANALYTICS_COLLECTION }),
    NotificationsModule
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, AnalyticsProcessor, ReliabilityMonitorService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
