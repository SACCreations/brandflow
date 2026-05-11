import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { authenticator } from 'otplib';
import { toDataURL } from 'qrcode';
import { prisma } from '@brandflow/db';
import type { Prisma } from '@brandflow/db';
import type { AuthResponse, AuthTokens, JwtPayload, RefreshTokenPayload } from '@brandflow/shared';
import type { RegisterDto, LoginDto } from '@brandflow/shared';
import { nanoid } from 'nanoid';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  // ─── Registration ─────────────────────────────────────────────
  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existing = await prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Email is already registered');
    }

    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    // Create user and business in a transaction
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const user = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
        },
      });

      // Create default business
      const businessName = dto.businessName ?? `${dto.firstName ?? dto.email}'s Workspace`;
      const slug = await this.generateUniqueSlug(businessName);
      const business = await tx.business.create({
        data: { name: businessName, slug },
      });

      // Get or create owner role
      let ownerRole = await tx.role.findFirst({
        where: { businessId: null, name: 'owner' },
      });
      if (!ownerRole) {
        ownerRole = await tx.role.create({
          data: { name: 'owner', permissions: ['*'], isCustom: false },
        });
      }

      // Create membership
      await tx.membership.create({
        data: { userId: user.id, businessId: business.id, roleId: ownerRole.id },
      });

      // Create starter subscription
      await tx.subscription.create({
        data: {
          businessId: business.id,
          plan: 'starter',
          status: 'trialing',
          seatLimit: 3,
          tokenBudget: 100_000,
          currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 day trial
        },
      });

      return { user, business, roleId: ownerRole.id };
    });

    const tokens = await this.generateTokens(result.user, result.business.id, result.roleId);

    return {
      tokens,
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        avatarUrl: result.user.avatarUrl,
        mfaEnabled: result.user.mfaEnabled,
      },
      business: {
        id: result.business.id,
        name: result.business.name,
        slug: result.business.slug,
      },
    };
  }

  // ─── Login ────────────────────────────────────────────────────
  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await argon2.verify(user.passwordHash, dto.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // MFA check
    if (user.mfaEnabled) {
      if (!dto.mfaCode) {
        throw new BadRequestException('MFA code is required');
      }
      if (!user.mfaSecret) {
        throw new BadRequestException('MFA not configured properly');
      }
      const isValid = authenticator.verify({ token: dto.mfaCode, secret: user.mfaSecret });
      if (!isValid) {
        throw new UnauthorizedException('Invalid MFA code');
      }
    }

    // Get active membership
    const membership = await prisma.membership.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' },
    });
    if (!membership) {
      throw new UnauthorizedException('No workspace found for this user');
    }

    const tokens = await this.generateTokens(user, membership.businessId, membership.roleId);
    const business = await prisma.business.findUniqueOrThrow({
      where: { id: membership.businessId },
    });

    return {
      tokens,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
        mfaEnabled: user.mfaEnabled,
      },
      business: { id: business.id, name: business.name, slug: business.slug },
    };
  }

  // ─── Refresh ──────────────────────────────────────────────────
  async refresh(refreshToken: string): Promise<AuthTokens> {
    let payload: RefreshTokenPayload;
    try {
      payload = this.jwtService.verify<RefreshTokenPayload>(refreshToken, {
        secret: this.config.get<string>('app.jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const session = await prisma.session.findUnique({
      where: { refreshToken },
      include: { user: true },
    });

    if (!session || session.userId !== payload.sub || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired or revoked');
    }

    // Token rotation: delete old session, create new one
    const membership = await prisma.membership.findFirst({
      where: { userId: session.userId },
      orderBy: { createdAt: 'asc' },
    });
    if (!membership) {
      throw new UnauthorizedException('No workspace found');
    }

    const tokens = await this.generateTokens(session.user, membership.businessId, membership.roleId);

    // Delete old session
    await prisma.session.delete({ where: { id: session.id } });

    return tokens;
  }

  // ─── Logout ───────────────────────────────────────────────────
  async logout(refreshToken: string): Promise<void> {
    await prisma.session.deleteMany({ where: { refreshToken } });
  }

  // ─── MFA Setup ────────────────────────────────────────────────
  async setupMfa(userId: string): Promise<{ secret: string; qrCodeUrl: string }> {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const issuer = this.config.get<string>('app.mfa.issuer', 'BrandFlow');
    const secret = authenticator.generateSecret();
    const otpauth = authenticator.keyuri(user.email, issuer, secret);
    const qrCodeUrl = await toDataURL(otpauth);

    // Store secret temporarily (not enabled yet until verified)
    await prisma.user.update({ where: { id: userId }, data: { mfaSecret: secret } });

    return { secret, qrCodeUrl };
  }

  async verifyAndEnableMfa(userId: string, code: string): Promise<void> {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!user.mfaSecret) {
      throw new BadRequestException('MFA setup not initiated');
    }

    const isValid = authenticator.verify({ token: code, secret: user.mfaSecret });
    if (!isValid) {
      throw new BadRequestException('Invalid verification code');
    }

    await prisma.user.update({ where: { id: userId }, data: { mfaEnabled: true } });
  }

  async disableMfa(userId: string, code: string): Promise<void> {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!user.mfaEnabled || !user.mfaSecret) {
      throw new BadRequestException('MFA is not enabled');
    }

    const isValid = authenticator.verify({ token: code, secret: user.mfaSecret });
    if (!isValid) {
      throw new UnauthorizedException('Invalid MFA code');
    }

    await prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: false, mfaSecret: null },
    });
  }

  // ─── OAuth handler ────────────────────────────────────────────
  async handleOAuthLogin(
    email: string,
    firstName?: string,
    lastName?: string,
    avatarUrl?: string,
  ): Promise<AuthResponse> {
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Auto-register OAuth users
      const registerResult = await this.register({
        email,
        password: nanoid(32), // random, unusable password for OAuth users
        firstName,
        lastName,
      });
      return registerResult;
    }

    // Update profile if provided
    if (firstName || lastName || avatarUrl) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          firstName: firstName ?? user.firstName,
          lastName: lastName ?? user.lastName,
          avatarUrl: avatarUrl ?? user.avatarUrl,
        },
      });
    }

    const membership = await prisma.membership.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' },
    });
    if (!membership) {
      throw new NotFoundException('No workspace found');
    }

    const tokens = await this.generateTokens(user, membership.businessId, membership.roleId);
    const business = await prisma.business.findUniqueOrThrow({
      where: { id: membership.businessId },
    });

    return {
      tokens,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
        mfaEnabled: user.mfaEnabled,
      },
      business: { id: business.id, name: business.name, slug: business.slug },
    };
  }

  // ─── Helpers ──────────────────────────────────────────────────
  private async generateTokens(
    user: { id: string; email: string },
    businessId: string,
    roleId: string,
  ): Promise<AuthTokens> {
    const accessPayload: JwtPayload = {
      sub: user.id,
      businessId,
      email: user.email,
      roleId,
    };

    const refreshExpiry = this.config.get<string>('app.jwt.refreshExpiry', '7d');
    const refreshPayload: RefreshTokenPayload = {
      sub: user.id,
      sessionId: nanoid(),
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload),
      this.jwtService.signAsync(refreshPayload, {
        secret: this.config.get<string>('app.jwt.refreshSecret'),
        expiresIn: refreshExpiry,
      }),
    ]);

    // Persist session
    const expiryDays = refreshExpiry.endsWith('d')
      ? parseInt(refreshExpiry.replace('d', ''), 10)
      : 7;
    await prisma.session.create({
      data: {
        userId: user.id,
        refreshToken,
        expiresAt: new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000),
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60, // 15 minutes in seconds
    };
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    const base = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 60);

    let slug = base;
    let attempt = 0;
    while (await prisma.business.findUnique({ where: { slug } })) {
      attempt++;
      slug = `${base}-${attempt}`;
    }
    return slug;
  }
}
