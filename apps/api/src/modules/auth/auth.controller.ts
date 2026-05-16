import {
  Controller,
  Post,
  Get,
  Body,
  UnauthorizedException,
  UseGuards,
  HttpCode,
  HttpStatus,
  Res,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import type { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  type RegisterDto,
  type LoginDto,
  type RefreshTokenDto,
  type JwtPayload,
} from '@brandflow/shared';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user and workspace' })
  async register(
    @Body(new ZodValidationPipe(registerSchema)) dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(dto);

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', result.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env['NODE_ENV'] === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });

    return result;
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  async login(
    @Body(new ZodValidationPipe(loginSchema)) dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto);

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', result.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env['NODE_ENV'] === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });

    return result;
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  async refresh(
    @Body(new ZodValidationPipe(refreshTokenSchema)) dto: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Accept token from body or cookie
    const token = dto.refreshToken?.trim() || (req.cookies as Record<string, string>)?.['refreshToken'];


    if (!token) {
      throw new UnauthorizedException('Refresh token required');
    }

    const result = await this.authService.refresh(token);

    // Set rotated refresh token as httpOnly cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env['NODE_ENV'] === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });

    return result;
  }


  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Logout and revoke refresh token' })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = (req.cookies as Record<string, string>)?.['refreshToken'] ?? '';
    await this.authService.logout(token);
    res.clearCookie('refreshToken', { path: '/' });
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  me(@CurrentUser() user: JwtPayload) {
    return this.authService.getProfile(user.sub, user.businessId);
  }

  @Post('mfa/setup')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initiate MFA setup — returns QR code' })
  setupMfa(@CurrentUser() user: JwtPayload) {
    return this.authService.setupMfa(user.sub);
  }

  @Post('mfa/verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify MFA code and enable MFA' })
  @HttpCode(HttpStatus.NO_CONTENT)
  verifyMfa(@CurrentUser() user: JwtPayload, @Body('code') code: string) {
    return this.authService.verifyAndEnableMfa(user.sub, code);
  }

  @Post('mfa/disable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disable MFA with verification code' })
  @HttpCode(HttpStatus.NO_CONTENT)
  disableMfa(@CurrentUser() user: JwtPayload, @Body('code') code: string) {
    return this.authService.disableMfa(user.sub, code);
  }
}
