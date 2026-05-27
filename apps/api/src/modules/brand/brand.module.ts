import { Module } from '@nestjs/common';
import { BrandController } from './brand.controller';
import { BrandService } from './brand.service';
import { BrandAnalyserController } from './brand-analyser.controller';
import { BrandAnalyserService } from './brand-analyser.service';
import { BrandAnalysisProcessor } from './brand-analysis.processor';
import { LlmSettingsModule } from '../llm-settings/llm-settings.module';
import { BusinessModule } from '../business/business.module';
import { BullModule } from '@nestjs/bullmq';

import { ScreenshotService } from './services/screenshot.service';
import { VisionAnalysisService } from './services/vision-analysis.service';
import { FontDetectionService } from './services/font-detection.service';
import { AudienceDetectionService } from './services/audience-detection.service';
import { AssetCatalogService } from './services/asset-catalog.service';
import { PersonalityEngineService } from './services/personality-engine.service';
import { DeepCrawlerService } from './services/deep-crawler.service';

@Module({
  imports: [
    LlmSettingsModule, 
    BusinessModule,
    BullModule.registerQueue({
      name: 'brand-analysis',
    }),
  ],
  controllers: [BrandController, BrandAnalyserController],
  providers: [
    BrandService, 
    BrandAnalyserService, 
    BrandAnalysisProcessor,
    ScreenshotService,
    VisionAnalysisService,
    FontDetectionService,
    AudienceDetectionService,
    AssetCatalogService,
    PersonalityEngineService,
    DeepCrawlerService
  ],
  exports: [BrandService, BrandAnalyserService],
})
export class BrandModule {}

