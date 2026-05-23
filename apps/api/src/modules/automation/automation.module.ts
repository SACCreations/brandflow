import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AutomationController } from './automation.controller';
import { AutomationService } from './automation.service';
import { AutomationEngineService } from './automation-engine.service';
import { AutomationProcessor } from './automation.processor';
import { SocialModule } from '../social/social.module';
import { QualityModule } from '../quality/quality.module';

const AUTOMATION_QUEUE = 'automation';
const AUTOMATION_EXECUTION_QUEUE = 'automation-execution';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: AUTOMATION_QUEUE },
      { name: AUTOMATION_EXECUTION_QUEUE },
    ),
    SocialModule,
    QualityModule,
  ],
  controllers: [AutomationController],
  providers: [AutomationService, AutomationEngineService, AutomationProcessor],
  exports: [AutomationService, AutomationEngineService],
})
export class AutomationModule {}
