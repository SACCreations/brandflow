import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AutomationController } from './automation.controller';
import { AutomationService } from './automation.service';
import { QUEUES } from '@brandflow/shared';

@Module({
  imports: [BullModule.registerQueue({ name: QUEUES.AUTOMATION })],
  controllers: [AutomationController],
  providers: [AutomationService],
  exports: [AutomationService],
})
export class AutomationModule {}
