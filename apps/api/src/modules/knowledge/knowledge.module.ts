import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { KnowledgeController } from './knowledge.controller';
import { KnowledgeService } from './knowledge.service';
import { KnowledgeProcessor } from './knowledge.processor';
import { MemoryService } from './memory.service';
import { FreshnessService } from './freshness.service';
import { QUEUES } from '@brandflow/shared';

@Module({
  imports: [
    BullModule.registerQueue({ name: QUEUES.KNOWLEDGE_INGESTION }),
  ],
  controllers: [KnowledgeController],
  providers: [KnowledgeService, KnowledgeProcessor, MemoryService, FreshnessService],
  exports: [KnowledgeService, MemoryService],
})
export class KnowledgeModule {}
