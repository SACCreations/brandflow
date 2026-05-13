import { Module } from '@nestjs/common';
import { BrandController } from './brand.controller';
import { BrandService } from './brand.service';
import { BrandAnalyserController } from './brand-analyser.controller';
import { BrandAnalyserService } from './brand-analyser.service';
import { LlmSettingsModule } from '../llm-settings/llm-settings.module';

@Module({
  imports: [LlmSettingsModule],
  controllers: [BrandController, BrandAnalyserController],
  providers: [BrandService, BrandAnalyserService],
  exports: [BrandService, BrandAnalyserService],
})
export class BrandModule {}
