import { Module } from '@nestjs/common';
import { QualityService } from './quality.service';
import { QualityControllerInternal } from './quality.controller';
import { LlmSettingsModule } from '../llm-settings/llm-settings.module';

@Module({
  imports: [LlmSettingsModule],
  controllers: [QualityControllerInternal],
  providers: [QualityService],
  exports: [QualityService],
})
export class QualityModule {}

