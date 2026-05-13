import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { prisma } from '@brandflow/db';
import * as crypto from 'node:crypto';
import type { Response } from 'express';
import type { ConnectSocialAccountDto } from '@brandflow/shared';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const LINKEDIN_DEFAULT_SCOPES = ['openid', 'profile', 'email', 'w_member_social'] as const;

interface LinkedInOAuthState {
  businessId: string;
  returnTo: string;
  nonce: string;
}

interface LinkedInTokenResponse {
  access_token?: string;
  expires_in?: number;
  scope?: string;
  refresh_token?: string;
  error?: string;
  error_description?: string;
}

interface LinkedInUserInfo {
  sub?: string;
  name?: string;
  email?: string;
}

@Injectable()
export class SocialService {
  private readonly encKey: Buffer;

  constructor(
    private readonly config: ConfigService,
    private readonly jwtService: JwtService,
  ) {
    const key = config.get<string>('app.encryptionKey');
    if (!key || key.length < 32) {
      throw new Error('ENCRYPTION_KEY must be at least 32 characters');
    }
    // Derive 32-byte key from config value
    this.encKey = crypto.createHash('sha256').update(key).digest();
  }

  // ── Encryption helpers ──────────────────────────────────────────────────────

  private encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, this.encKey, iv, { authTagLength: TAG_LENGTH });
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, encrypted]).toString('base64url');
  }

  private decrypt(ciphertext: string): string {
    const buf = Buffer.from(ciphertext, 'base64url');
    const iv = buf.subarray(0, IV_LENGTH);
    const tag = buf.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
    const encrypted = buf.subarray(IV_LENGTH + TAG_LENGTH);
    const decipher = crypto.createDecipheriv(ALGORITHM, this.encKey, iv, {
      authTagLength: TAG_LENGTH,
    });
    decipher.setAuthTag(tag);
    return decipher.update(encrypted) + decipher.final('utf8');
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  async findAll(businessId: string) {
    const accounts = await prisma.socialAccount.findMany({
      where: { businessId },
      select: {
        id: true,
        platform: true,
        name: true,
        externalId: true,
        accountType: true,
        tokenExpiresAt: true,
        scopes: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            schedules: true,
            publishJobs: true,
          },
        },
        // NEVER return raw tokens
      },
      orderBy: { updatedAt: 'desc' },
    });
    return accounts;
  }

  async connect(businessId: string, dto: ConnectSocialAccountDto) {
    return this.upsert(businessId, dto.platform, {
      name: dto.name.trim(),
      externalId: dto.externalId.trim(),
      accountType: dto.accountType.trim(),
      accessToken: dto.accessToken,
      refreshToken: dto.refreshToken ?? undefined,
      tokenExpiresAt: dto.tokenExpiresAt ?? undefined,
      scopes: dto.scopes,
    });
  }

  async upsert(
    businessId: string,
    platform: string,
    data: {
      name: string;
      externalId: string;
      accountType?: string;
      accessToken: string;
      refreshToken?: string;
      tokenExpiresAt?: Date;
      scopes?: string[];
    },
  ) {
    const encryptedAccess = this.encrypt(data.accessToken);
    const encryptedRefresh = data.refreshToken ? this.encrypt(data.refreshToken) : null;

    const existing = await prisma.socialAccount.findFirst({
      where: { businessId, platform, externalId: data.externalId },
    });

    if (existing) {
      const existingScopes = Array.isArray(existing.scopes)
        ? existing.scopes.map((scope) => String(scope))
        : undefined;

      return prisma.socialAccount.update({
        where: { id: existing.id },
        data: {
          name: data.name,
          externalId: data.externalId,
          accountType: data.accountType ?? existing.accountType,
          accessToken: encryptedAccess,
          refreshToken: encryptedRefresh,
          tokenExpiresAt: data.tokenExpiresAt,
          scopes: data.scopes ?? existingScopes,
        },
        select: {
          id: true,
          platform: true,
          name: true,
          externalId: true,
          accountType: true,
          tokenExpiresAt: true,
          scopes: true,
        },
      });
    }

    return prisma.socialAccount.create({
      data: {
        businessId,
        platform,
        name: data.name,
        externalId: data.externalId,
        accountType: data.accountType ?? 'personal',
        accessToken: encryptedAccess,
        refreshToken: encryptedRefresh,
        tokenExpiresAt: data.tokenExpiresAt,
        scopes: data.scopes ?? [],
      },
      select: {
        id: true,
        platform: true,
        name: true,
        externalId: true,
        accountType: true,
        tokenExpiresAt: true,
        scopes: true,
      },
    });
  }

  async getDecryptedTokens(id: string, businessId: string) {
    const account = await prisma.socialAccount.findFirst({ where: { id, businessId } });
    if (!account) throw new NotFoundException('Social account not found');
    return {
      accessToken: this.decrypt(account.accessToken),
      refreshToken: account.refreshToken ? this.decrypt(account.refreshToken) : null,
    };
  }

  async remove(id: string, businessId: string) {
    const account = await prisma.socialAccount.findFirst({ where: { id, businessId } });
    if (!account) throw new NotFoundException('Social account not found');

    const pendingSchedules = await prisma.schedule.count({
      where: {
        businessId,
        socialAccountId: id,
        status: 'pending',
      },
    });

    if (pendingSchedules > 0) {
      throw new BadRequestException('Cancel pending schedules before disconnecting this account.');
    }

    return prisma.socialAccount.delete({ where: { id } });
  }

  async createLinkedInAuthUrl(businessId: string, returnTo?: string) {
    const { clientId, callbackUrl } = this.getLinkedInConfig();
    const safeReturnTo = this.sanitizeReturnTo(returnTo);
    const state = await this.jwtService.signAsync(
      {
        businessId,
        returnTo: safeReturnTo,
        nonce: crypto.randomUUID(),
      } satisfies LinkedInOAuthState,
      { expiresIn: '10m' },
    );

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: callbackUrl,
      state,
      scope: LINKEDIN_DEFAULT_SCOPES.join(' '),
    });

    return {
      authUrl: `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`,
      stateExpiresIn: '10m',
    };
  }

  async handleLinkedInCallback({
    code,
    state,
    error,
    errorDescription,
    res,
  }: {
    code?: string;
    state?: string;
    error?: string;
    errorDescription?: string;
    res: Response;
  }) {
    let oauthState: LinkedInOAuthState | null = null;

    try {
      oauthState = state
        ? await this.jwtService.verifyAsync<LinkedInOAuthState>(state)
        : null;
    } catch {
      const fallbackUrl = this.buildSocialRedirect('/publish/social', 'error', 'Invalid or expired LinkedIn OAuth state.');
      return res.redirect(fallbackUrl);
    }

    const returnTo = this.sanitizeReturnTo(oauthState?.returnTo);

    if (error) {
      const message = errorDescription || error;
      return res.redirect(this.buildSocialRedirect(returnTo, 'error', message));
    }

    if (!code) {
      return res.redirect(this.buildSocialRedirect(returnTo, 'error', 'LinkedIn did not provide an authorization code.'));
    }

    try {
      const tokenResponse = await this.exchangeLinkedInCodeForToken(code);
      const accessToken = tokenResponse.access_token;

      if (!accessToken) {
        throw new BadRequestException(tokenResponse.error_description || tokenResponse.error || 'LinkedIn did not return an access token.');
      }

      const profile = await this.fetchLinkedInUserInfo(accessToken);
      const externalId = profile.sub || profile.email;

      if (!oauthState?.businessId || !externalId) {
        throw new BadRequestException('Unable to resolve the LinkedIn account identity.');
      }

      const account = await this.upsert(oauthState.businessId, 'linkedin', {
        name: profile.name || profile.email || 'LinkedIn account',
        externalId,
        accountType: 'personal',
        accessToken,
        refreshToken: tokenResponse.refresh_token,
        tokenExpiresAt: tokenResponse.expires_in
          ? new Date(Date.now() + tokenResponse.expires_in * 1000)
          : undefined,
        scopes: tokenResponse.scope?.split(' ').filter(Boolean) ?? [...LINKEDIN_DEFAULT_SCOPES],
      });

      return res.redirect(this.buildSocialRedirect(returnTo, 'connected', undefined, account.id));
    } catch (callbackError) {
      const message = callbackError instanceof Error ? callbackError.message : 'LinkedIn connection failed.';
      return res.redirect(this.buildSocialRedirect(returnTo, 'error', message));
    }
  }

  private sanitizeReturnTo(returnTo?: string | null): string {
    if (!returnTo || !returnTo.startsWith('/')) {
      return '/publish/social';
    }

    return returnTo.startsWith('//') ? '/publish/social' : returnTo;
  }

  private buildSocialRedirect(returnTo: string, status: 'connected' | 'error', message?: string, accountId?: string) {
    const webUrl = this.config.get<string>('app.webUrl', 'http://localhost:3002');
    const target = new URL(returnTo, webUrl);
    target.searchParams.set('linkedin', status);

    if (message) {
      target.searchParams.set('linkedin_message', message);
    }

    if (accountId) {
      target.searchParams.set('accountId', accountId);
    }

    return target.toString();
  }

  private getLinkedInConfig() {
    const clientId = process.env['LINKEDIN_CLIENT_ID'];
    const clientSecret = process.env['LINKEDIN_CLIENT_SECRET'];
    const callbackUrl = process.env['LINKEDIN_CALLBACK_URL'] || `${this.config.get<string>('app.url', 'http://localhost:4000')}/social/linkedin/callback`;

    if (!clientId || !clientSecret) {
      throw new BadRequestException('LinkedIn OAuth is not configured. Add LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET.');
    }

    return { clientId, clientSecret, callbackUrl };
  }

  private async exchangeLinkedInCodeForToken(code: string): Promise<LinkedInTokenResponse> {
    const { clientId, clientSecret, callbackUrl } = this.getLinkedInConfig();
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: callbackUrl,
      client_id: clientId,
      client_secret: clientSecret,
    });

    const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
      signal: AbortSignal.timeout(15_000),
    });

    const payload = await response.json() as LinkedInTokenResponse;

    if (!response.ok) {
      throw new BadRequestException(payload.error_description || payload.error || `LinkedIn token exchange failed (${response.status}).`);
    }

    return payload;
  }

  private async fetchLinkedInUserInfo(accessToken: string): Promise<LinkedInUserInfo> {
    const response = await fetch('https://api.linkedin.com/v2/userinfo', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      signal: AbortSignal.timeout(15_000),
    });

    const payload = await response.json() as LinkedInUserInfo & { message?: string };

    if (!response.ok) {
      throw new BadRequestException(payload.message || `LinkedIn profile lookup failed (${response.status}).`);
    }

    return payload;
  }
}
