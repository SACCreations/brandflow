import { Module } from '@nestjs/common';
import { QualityService } from './quality.service';
import { QualityControllerInternal } from './quality.controller';

@Module({
  controllers: [QualityControllerInternal],
  providers: [QualityService],
  exports: [QualityService],
})
export class QualityModule {}

