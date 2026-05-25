import { Module } from '@nestjs/common';
import { BrandController } from './brand.controller';
import { BrandService } from './brand.service';
import { BrandAnalyserController } from './brand-analyser.controller';
import { BrandAnalyserService } from './brand-analyser.service';
import { BrandAnalysisProcessor } from './brand-analysis.processor';
import { LlmSettingsModule } from '../llm-settings/llm-settings.module';
import { BusinessModule } from '../business/business.module';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    LlmSettingsModule, 
    BusinessModule,
    BullModule.registerQueue({
      name: 'brand-analysis',
    }),
  ],
  controllers: [BrandController, BrandAnalyserController],
  providers: [BrandService, BrandAnalyserService, BrandAnalysisProcessor],
  exports: [BrandService, BrandAnalyserService],
})
export class BrandModule {}
