import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { SchedulerController } from './scheduler.controller';
import { SchedulerService } from './scheduler.service';
import { PublishProcessor } from './publish.processor';
import { QUEUES } from '@brandflow/shared';

@Module({
  imports: [BullModule.registerQueue({ name: QUEUES.PUBLISH })],
  controllers: [SchedulerController],
  providers: [SchedulerService, PublishProcessor],
  exports: [SchedulerService],
})
export class SchedulerModule {}
