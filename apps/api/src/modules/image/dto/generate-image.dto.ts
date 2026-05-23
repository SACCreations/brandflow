import { IsNotEmpty, IsOptional, IsString, MinLength, MaxLength, IsIn, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const VALID_CATEGORIES = [
  'SMO_POSTER', 'FESTIVAL_BANNER', 'OFFER_CREATIVE', 'WEBSITE_HERO',
  'PRINTABLE_STANDEE', 'PRINTABLE_BANNER', 'PRINTABLE_FLYER', 'PRINTABLE_BROCHURE',
  'AD_CREATIVE', 'SOCIAL_COVER', 'THUMBNAIL',
];

const VALID_PROVIDERS = ['stability', 'openai'];
const VALID_QUALITIES = ['standard', 'hd'];

export class GenerateImageSettingsDto {
  @ApiPropertyOptional({ minimum: 256, maximum: 2048 })
  @IsOptional()
  @Min(256, { message: 'Width must be at least 256px' })
  @Max(2048, { message: 'Width cannot exceed 2048px' })
  width?: number;

  @ApiPropertyOptional({ minimum: 256, maximum: 2048 })
  @IsOptional()
  @Min(256, { message: 'Height must be at least 256px' })
  @Max(2048, { message: 'Height cannot exceed 2048px' })
  height?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  aspectRatio?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  style?: string;

  @ApiPropertyOptional({ enum: VALID_QUALITIES })
  @IsOptional()
  @IsIn(VALID_QUALITIES, { message: 'Quality must be "standard" or "hd"' })
  quality?: 'standard' | 'hd';

  @ApiPropertyOptional({ enum: VALID_PROVIDERS })
  @IsOptional()
  @IsIn(VALID_PROVIDERS, { message: 'Provider must be "stability" or "openai"' })
  provider?: string;
}

export class GenerateImageDto {
  @ApiProperty({ description: 'Brand ID to associate the generation with' })
  @IsNotEmpty({ message: 'Brand ID is required' })
  @IsString()
  brandId!: string;

  @ApiPropertyOptional({ description: 'Optional campaign link' })
  @IsOptional()
  @IsString()
  campaignId?: string;

  @ApiProperty({ description: 'Image generation prompt', minLength: 10, maxLength: 2000 })
  @IsNotEmpty({ message: 'Prompt is required' })
  @IsString()
  @MinLength(10, { message: 'Prompt must be at least 10 characters' })
  @MaxLength(2000, { message: 'Prompt cannot exceed 2000 characters' })
  prompt!: string;

  @ApiProperty({ description: 'Creative category', enum: VALID_CATEGORIES })
  @IsNotEmpty({ message: 'Category is required' })
  @IsIn(VALID_CATEGORIES, { message: 'Invalid creative category' })
  category!: string;

  @ApiPropertyOptional({ type: GenerateImageSettingsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => GenerateImageSettingsDto)
  settings?: GenerateImageSettingsDto;
}
