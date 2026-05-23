import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AutomationController } from './automation.controller';
import { AutomationService } from './automation.service';
import { AutomationEngineService } from './automation-engine.service';
import { AutomationProcessor } from './automation.processor';
import { SocialModule } from '../social/social.module';
import { QualityModule } from '../quality/quality.module';
import { QUEUES } from '@brandflow/shared';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: QUEUES.AUTOMATION },
      { name: QUEUES.AUTOMATION_EXECUTION },
    ),
    SocialModule,
    QualityModule,
  ],
  controllers: [AutomationController],
  providers: [AutomationService, AutomationEngineService, AutomationProcessor],
  exports: [AutomationService, AutomationEngineService],
})
export class AutomationModule {}
