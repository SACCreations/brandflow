import { Module } from '@nestjs/common';
import { LlmSettingsController } from './llm-settings.controller';
import { LlmSettingsService } from './llm-settings.service';
import { BudgetService } from './budget.service';

@Module({
  controllers: [LlmSettingsController],
  providers: [LlmSettingsService, BudgetService],
  exports: [LlmSettingsService, BudgetService],
})
export class LlmSettingsModule {}
