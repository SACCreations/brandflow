import { Module } from '@nestjs/common';
import { BriefController } from './brief.controller';
import { BriefService } from './brief.service';
import { LlmSettingsModule } from '../llm-settings/llm-settings.module';

@Module({
  imports: [LlmSettingsModule],
  controllers: [BriefController],
  providers: [BriefService],
  exports: [BriefService],
})
export class BriefModule {}
