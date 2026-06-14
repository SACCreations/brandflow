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
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
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
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: 'Validate an API key' })
  async validateApiKey(
    @CurrentUser() user: JwtPayload,
    @Body() dto: { provider: string; apiKey: string }
  ) {
    if (!dto.provider || !dto.apiKey) {
      throw new BadRequestException('Provider and API Key are required');
    }
    
    const isValid = await this.llmSettingsService.validateApiKey(dto.provider, dto.apiKey, user.businessId);
    
    if (!isValid) {
      throw new BadRequestException('Invalid API Key');
    }
    
    return { success: true };
  }

  @Post('image-api-key')
  @ApiOperation({
    summary: 'Save a dedicated OpenAI API key for image generation',
    description: 'Needed when the business LLM provider is NVIDIA but image generation requires an OpenAI key for DALL-E 3. The key is encrypted at rest.',
  })
  async saveImageApiKey(
    @CurrentUser() user: JwtPayload,
    @Body() dto: { imageApiKey: string | null },
  ) {
    await this.llmSettingsService.updateImageApiKey(user.businessId, dto.imageApiKey || null);
    return { success: true, message: 'Image API key saved successfully' };
  }

  @Get('image-api-key/status')
  @ApiOperation({ summary: 'Check if a dedicated image API key is configured' })
  async getImageApiKeyStatus(@CurrentUser() user: JwtPayload) {
    const { key, source } = await this.llmSettingsService.getDecryptedImageApiKey(user.businessId);
    let masked = null;
    if (key) {
      if (key.startsWith('nvapi-')) {
        masked = `nvapi-...${key.slice(-4)}`;
      } else {
        masked = `sk-...${key.slice(-4)}`;
      }
    }
    return {
      hasImageApiKey: !!key,
      source,
      masked,
    };
  }
}
