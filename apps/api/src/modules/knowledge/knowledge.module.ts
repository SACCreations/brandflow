import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { KnowledgeController } from './knowledge.controller';
import { KnowledgeService } from './knowledge.service';
import { KnowledgeProcessor } from './knowledge.processor';
import { IngestionService } from './ingestion.service';
import { MemoryService } from './memory.service';
import { FreshnessService } from './freshness.service';
import { QUEUES } from '@brandflow/shared';
import { LlmSettingsModule } from '../llm-settings/llm-settings.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: QUEUES.KNOWLEDGE_INGESTION }),
    LlmSettingsModule,
  ],
  controllers: [KnowledgeController],
  providers: [
    KnowledgeService,
    IngestionService,
    KnowledgeProcessor,
    MemoryService,
    FreshnessService,
  ],
  exports: [KnowledgeService, IngestionService, MemoryService],
})
export class KnowledgeModule {}
