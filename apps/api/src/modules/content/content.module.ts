import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';
import { QUEUES } from '@brandflow/shared';

@Module({
  imports: [
    BullModule.registerQueue({ name: QUEUES.AI_GENERATION }),
  ],
  controllers: [ContentController],
  providers: [ContentService],
  exports: [ContentService],
})
export class ContentModule {}
