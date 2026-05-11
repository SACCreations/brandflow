import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { KnowledgeController } from './knowledge.controller';
import { KnowledgeService } from './knowledge.service';
import { KnowledgeProcessor } from './knowledge.processor';
import { QUEUES } from '@brandflow/shared';

@Module({
  imports: [
    BullModule.registerQueue({ name: QUEUES.KNOWLEDGE_INGESTION }),
  ],
  controllers: [KnowledgeController],
  providers: [KnowledgeService, KnowledgeProcessor],
  exports: [KnowledgeService],
})
export class KnowledgeModule {}
