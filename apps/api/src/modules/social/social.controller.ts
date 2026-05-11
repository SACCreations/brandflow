import {
  Controller, Get, Post, Delete, Body, Param, UseGuards, ParseUUIDPipe, HttpCode, HttpStatus, Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SocialService } from './social.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '@brandflow/shared';

@ApiTags('social')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('social')
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  @Get('accounts')
  @ApiOperation({ summary: 'List connected social accounts' })
  findAll(@CurrentUser() user: JwtPayload) {
    return this.socialService.findAll(user.businessId);
  }

  @Delete('accounts/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Disconnect a social account' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    return this.socialService.remove(id, user.businessId);
  }

  @Post('linkedin/callback')
  @ApiOperation({ summary: 'Handle LinkedIn OAuth callback' })
  linkedInCallback(
    @CurrentUser() user: JwtPayload,
    @Body('code') code: string,
    @Body('redirectUri') redirectUri: string,
  ) {
    return this.socialService.handleLinkedInCallback(user.businessId, code, redirectUri);
  }
}
