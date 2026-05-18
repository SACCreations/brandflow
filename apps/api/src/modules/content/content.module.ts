import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';
import { ContentQueueProcessor } from './content-queue.processor';
import { LlmSettingsModule } from '../llm-settings/llm-settings.module';
import { BusinessModule } from '../business/business.module';
import { QUEUES } from '@brandflow/shared';

import { QualityModule } from '../quality/quality.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: QUEUES.AI_GENERATION }),
    LlmSettingsModule,
    BusinessModule,
    QualityModule,
  ],

  controllers: [ContentController],
  providers: [ContentService, ContentQueueProcessor],
  exports: [ContentService],
})
export class ContentModule {}
