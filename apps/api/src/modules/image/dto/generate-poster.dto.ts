import {
  IsNotEmpty, IsOptional, IsString, MaxLength, IsIn, ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Valid image/poster category IDs.
 * These map to category-specific design guidance in the PosterPromptBuilder.
 */
export const VALID_POSTER_CATEGORIES = [
  'SMO_POSTER',
  'FESTIVAL_BANNER',
  'OFFER_CREATIVE',
  'WEBSITE_HERO',
  'PRINTABLE_STANDEE',
  'PRINTABLE_BANNER',
  'PRINTABLE_FLYER',
  'PRINTABLE_BROCHURE',
  'AD_CREATIVE',
  'SOCIAL_COVER',
  'THUMBNAIL',
] as const;

export type PosterCategory = (typeof VALID_POSTER_CATEGORIES)[number];

export const VALID_POSTER_PROVIDERS = ['openai', 'flux', 'stability', 'nvidia'] as const;
export const VALID_POSTER_QUALITIES = ['standard', 'hd'] as const;

export class GeneratePosterSettingsDto {
  @ApiPropertyOptional({ enum: VALID_POSTER_PROVIDERS, description: 'AI image provider (openai=DALL-E 3, flux=FLUX.1-dev, stability=SD3, nvidia=NVIDIA NIM)' })
  @IsOptional()
  @IsIn(VALID_POSTER_PROVIDERS)
  provider?: 'openai' | 'flux' | 'stability' | 'nvidia';

  @ApiPropertyOptional({ enum: VALID_POSTER_QUALITIES })
  @IsOptional()
  @IsIn(VALID_POSTER_QUALITIES)
  quality?: 'standard' | 'hd';

  @ApiPropertyOptional({ description: 'Visual style preset (e.g. modern, minimalist, bold)' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  style?: string;

  @ApiPropertyOptional({ description: 'Additional negative prompt instructions' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  negativePromptExtra?: string;
}

export class GeneratePosterDto {
  @ApiProperty({ description: 'Brand ID — pulls colors, logo, fonts, tone' })
  @IsNotEmpty({ message: 'Brand ID is required' })
  @IsString()
  brandId!: string;

  @ApiProperty({
    description: 'Target platform ID (e.g. instagram_post, linkedin_banner, youtube_thumbnail)',
    example: 'instagram_post',
  })
  @IsNotEmpty({ message: 'Platform is required' })
  @IsString()
  platform!: string;

  @ApiProperty({
    description: 'Poster creative category',
    enum: VALID_POSTER_CATEGORIES,
    example: 'SMO_POSTER',
  })
  @IsNotEmpty({ message: 'Category is required' })
  @IsIn(VALID_POSTER_CATEGORIES, { message: 'Invalid poster category' })
  category!: string;

  @ApiPropertyOptional({
    description: 'Link to an approved content piece — auto-pulls headline, CTA, and body',
  })
  @IsOptional()
  @IsString()
  contentId?: string;

  @ApiPropertyOptional({ description: 'Link to a campaign' })
  @IsOptional()
  @IsString()
  campaignId?: string;

  @ApiPropertyOptional({
    description: 'Main poster headline (required if no contentId)',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  headline?: string;

  @ApiPropertyOptional({ description: 'Supporting subheadline', maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  subheadline?: string;

  @ApiPropertyOptional({ description: 'Call-to-action text (e.g. "Get Started Free")', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  cta?: string;

  @ApiPropertyOptional({ description: 'Additional context for the visual concept', maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  additionalContext?: string;

  @ApiPropertyOptional({ type: GeneratePosterSettingsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => GeneratePosterSettingsDto)
  settings?: GeneratePosterSettingsDto;
}

// ─── Legacy DTO (kept for backward compatibility) ─────────────────────────────
// The old GenerateImageDto is preserved below so existing integrations do not break.
export { GenerateImageDto, GenerateImageSettingsDto } from './generate-image.dto';
