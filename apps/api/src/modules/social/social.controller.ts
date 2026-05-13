import {
  Controller, Get, Post, Delete, Body, Param, UseGuards, ParseUUIDPipe, HttpCode, HttpStatus, Query, Res,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import type { Response } from 'express';
import { SocialService } from './social.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  connectSocialAccountSchema,
  type ConnectSocialAccountDto,
  type JwtPayload,
} from '@brandflow/shared';

@ApiTags('social')
@ApiBearerAuth()
@Controller('social')
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  @Get('accounts')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List connected social accounts' })
  findAll(@CurrentUser() user: JwtPayload) {
    return this.socialService.findAll(user.businessId);
  }

  @Post('accounts')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Connect or update a social account' })
  connect(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(connectSocialAccountSchema)) dto: ConnectSocialAccountDto,
  ) {
    return this.socialService.connect(user.businessId, dto);
  }

  @Get('linkedin/auth-url')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Generate a LinkedIn OAuth URL' })
  createLinkedInAuthUrl(
    @CurrentUser() user: JwtPayload,
    @Query('returnTo') returnTo?: string,
  ) {
    return this.socialService.createLinkedInAuthUrl(user.businessId, returnTo);
  }

  @Delete('accounts/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Disconnect a social account' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    return this.socialService.remove(id, user.businessId);
  }

  @Get('linkedin/callback')
  @ApiOperation({ summary: 'Handle LinkedIn OAuth callback' })
  linkedInCallback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') error: string | undefined,
    @Query('error_description') errorDescription: string | undefined,
    @Res() res: Response,
  ) {
    return this.socialService.handleLinkedInCallback({ code, state, error, errorDescription, res });
  }
}
