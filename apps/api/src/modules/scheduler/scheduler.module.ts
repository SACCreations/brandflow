import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { SchedulerController } from './scheduler.controller';
import { SchedulerService } from './scheduler.service';
import { PublishProcessor } from './publish.processor';
import { QUEUES } from '@brandflow/shared';
import { SocialModule } from '../social/social.module';

@Module({
  imports: [BullModule.registerQueue({ name: QUEUES.PUBLISH }), SocialModule],
  controllers: [SchedulerController],
  providers: [SchedulerService, PublishProcessor],
  exports: [SchedulerService],
})
export class SchedulerModule {}
