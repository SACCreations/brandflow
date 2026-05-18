import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QUEUES } from '@brandflow/shared';
import { ImageController } from './image.controller';
import { ImageService } from './image.service';
import { CreativeGenerationService } from './creative-generation.service';
import { ImageJobProcessor } from './queue/image-job.processor';

@Module({
  imports: [
    BullModule.registerQueue({ name: QUEUES.IMAGE_GENERATION }),
  ],
  controllers: [ImageController],
  providers: [ImageService, CreativeGenerationService, ImageJobProcessor],
  exports: [ImageService, CreativeGenerationService],
})
export class ImageModule {}
