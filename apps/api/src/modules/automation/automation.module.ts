import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AutomationController } from './automation.controller';
import { AutomationService } from './automation.service';
import { AutomationEngineService } from './automation-engine.service';
import { QUEUES } from '@brandflow/shared';

@Module({
  imports: [BullModule.registerQueue({ name: QUEUES.AUTOMATION })],
  controllers: [AutomationController],
  providers: [AutomationService, AutomationEngineService],
  exports: [AutomationService, AutomationEngineService],
})
export class AutomationModule {}
