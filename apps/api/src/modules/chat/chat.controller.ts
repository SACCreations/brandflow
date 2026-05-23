import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  CreateConversationDto,
  SendMessageDto,
  ConvertToContentDto,
  TestChatDto,
} from './dto';
import type { JwtPayload } from '@brandflow/shared';

@ApiTags('chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // ─── Conversations ─────────────────────────────────────────────

  @Post('conversations')
  @ApiOperation({ summary: 'Create a new conversation' })
  createConversation(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateConversationDto,
  ) {
    return this.chatService.createConversation(user.businessId, user.sub, dto);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'List conversations for the current user' })
  listConversations(
    @CurrentUser() user: JwtPayload,
    @Query('brandId') brandId?: string,
  ) {
    return this.chatService.listConversations(user.businessId, user.sub, brandId);
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Get a conversation with messages' })
  getConversation(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.chatService.getConversation(id, user.businessId, user.sub);
  }

  @Delete('conversations/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a conversation' })
  deleteConversation(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.chatService.deleteConversation(id, user.businessId, user.sub);
  }

  // ─── Messages ──────────────────────────────────────────────────

  @Post('conversations/:id/messages')
  @ApiOperation({ summary: 'Send a message and get brand-aware AI response' })
  sendMessage(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(id, user.businessId, user.sub, dto.message);
  }

  // ─── Convert to Content ────────────────────────────────────────

  @Post('conversations/:id/convert')
  @ApiOperation({ summary: 'Convert a chat message into a content draft' })
  convertToContent(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: ConvertToContentDto,
  ) {
    return this.chatService.convertToContent(id, user.businessId, user.sub, dto);
  }

  // ─── Legacy / Testing ──────────────────────────────────────────

  @Post('test')
  @ApiOperation({ summary: 'Test AI gateway connectivity' })
  testChat(
    @CurrentUser() user: JwtPayload,
    @Body() dto: TestChatDto,
  ) {
    return this.chatService.testChat(user.businessId, dto);
  }
}
