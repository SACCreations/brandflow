import { IsString, IsNotEmpty, IsOptional, IsUUID, IsIn, MaxLength } from 'class-validator';

export class CreateConversationDto {
  @IsUUID()
  @IsOptional()
  brandId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  title?: string;
}

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  message!: string;
}

export class ConvertToContentDto {
  @IsUUID()
  @IsNotEmpty()
  messageId!: string;

  @IsString()
  @IsNotEmpty()
  platform!: string;

  @IsString()
  @IsNotEmpty()
  type!: string;

  @IsUUID()
  @IsOptional()
  campaignId?: string;
}

export class TestChatDto {
  @IsString()
  @IsNotEmpty()
  message!: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['openai', 'anthropic', 'google'])
  provider!: string;
}
