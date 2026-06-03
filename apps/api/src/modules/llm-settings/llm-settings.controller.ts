import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  UseGuards,
  BadRequestException,
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
  NVIDIA_MODEL_LIST,
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

  @Get('nvidia-models')
  @ApiOperation({ summary: 'Get available NVIDIA NIM models for task routing' })
  getNvidiaModels() {
    return { models: NVIDIA_MODEL_LIST };
  }

  @Patch()
  @ApiOperation({ summary: 'Update business-specific LLM settings' })
  updateSettings(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(updateLlmSettingsSchema)) dto: UpdateLlmSettingsDto,
  ) {
    return this.llmSettingsService.updateSettings(user.businessId, dto);
  }

  @Post('validate')
  @ApiOperation({ summary: 'Validate an API key' })
  async validateApiKey(
    @Body() dto: { provider: string; apiKey: string }
  ) {
    if (!dto.provider || !dto.apiKey) {
      throw new BadRequestException('Provider and API Key are required');
    }
    
    const isValid = await this.llmSettingsService.validateApiKey(dto.provider, dto.apiKey);
    
    if (!isValid) {
      throw new BadRequestException('Invalid API Key');
    }
    
    return { success: true };
  }
}
