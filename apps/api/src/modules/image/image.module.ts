import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ImageController } from './image.controller';
import { ImageService } from './image.service';
import { CreativeGenerationService } from './creative-generation.service';
import { ImageJobProcessor } from './queue/image-job.processor';
import { CanvasService } from './canvas.service';
import { ImageWebSocketGateway } from './image.gateway';

const IMAGE_GENERATION_QUEUE = 'image-generation';

@Module({
  imports: [
    BullModule.registerQueue({
      name: IMAGE_GENERATION_QUEUE,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('jwt.secret') || process.env['JWT_SECRET'],
      }),
    }),
  ],
  controllers: [ImageController],
  providers: [ImageService, CreativeGenerationService, ImageJobProcessor, CanvasService, ImageWebSocketGateway],
  exports: [ImageService, CreativeGenerationService, CanvasService, ImageWebSocketGateway],
})
export class ImageModule {}
