import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { LlmSettingsService } from './llm-settings.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  updateLlmSettingsSchema,
  type UpdateLlmSettingsDto,
  type JwtPayload,
} from '@brandflow/shared';

@ApiTags('settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('settings/llm')
export class LlmSettingsController {
  constructor(private readonly llmSettingsService: LlmSettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get business-specific LLM settings' })
  getSettings(@CurrentUser() user: JwtPayload) {
    return this.llmSettingsService.getSettings(user.businessId);
  }

  @Patch()
  @ApiOperation({ summary: 'Update business-specific LLM settings' })
  updateSettings(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(updateLlmSettingsSchema)) dto: UpdateLlmSettingsDto,
  ) {
    return this.llmSettingsService.updateSettings(user.businessId, dto);
  }
}
