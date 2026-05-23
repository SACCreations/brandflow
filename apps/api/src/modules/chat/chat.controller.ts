import {
  Controller,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IsString, IsNotEmpty, IsIn } from 'class-validator';
import type { JwtPayload } from '@brandflow/shared';

export class TestChatDto {
  @IsString()
  @IsNotEmpty()
  message!: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['openai', 'anthropic', 'google'])
  provider!: string;
}

@ApiTags('chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('test')
  @ApiOperation({ summary: 'Test chat endpoint to validate AI Gateway and log responses' })
  testChat(
    @CurrentUser() user: JwtPayload,
    @Body() dto: TestChatDto,
  ) {
    // Pass user.businessId to scope request logging to the current tenant
    return this.chatService.testChat(user.businessId, dto);
  }
}
