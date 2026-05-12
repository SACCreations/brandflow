import { Module } from '@nestjs/common';
import { ImageController } from './image.controller';
import { ImageService } from './image.service';
import { CreativeGenerationService } from './creative-generation.service';

@Module({
  controllers: [ImageController],
  providers: [ImageService, CreativeGenerationService],
  exports: [ImageService, CreativeGenerationService],
})
export class ImageModule {}
