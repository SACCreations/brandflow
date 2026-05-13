import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { prisma } from '@brandflow/db';
import * as crypto from 'node:crypto';
import type { ConnectSocialAccountDto } from '@brandflow/shared';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

@Injectable()
export class SocialService {
  private readonly encKey: Buffer;

  constructor(private readonly config: ConfigService) {
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

  /**
   * Placeholder: LinkedIn OAuth callback handler
   * Exchange code for tokens, store encrypted, return social account record.
   */
  async handleLinkedInCallback(
    businessId: string,
    code: string,
    redirectUri: string,
  ) {
    // TODO: implement LinkedIn OAuth token exchange in Phase 2
    // For MVP, return a stub indicating the flow is ready
    throw new BadRequestException('LinkedIn OAuth not yet implemented — coming in Phase 2');
  }
}
