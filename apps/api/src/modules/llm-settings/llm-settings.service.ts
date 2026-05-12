import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { prisma } from '@brandflow/db';
import { encryption } from '@brandflow/ai';
import type { UpdateLlmSettingsDto } from '@brandflow/shared';

@Injectable()
export class LlmSettingsService {
  private readonly encryptionKey: string;

  constructor(private readonly config: ConfigService) {
    this.encryptionKey = this.config.get<string>('ENCRYPTION_KEY')!;
  }

  async getSettings(businessId: string) {
    const settings = await prisma.llmSettings.findUnique({
      where: { businessId },
    });

    if (!settings) {
      // Return default settings if none exist
      return {
        provider: 'openai',
        model: 'gpt-4o',
        temperature: 0.7,
        maxTokens: 2000,
        isFallbackEnabled: true,
        hasApiKey: false,
      };
    }

    // Mask API key
    return {
      ...settings,
      apiKey: settings.apiKey ? '********' : null,
      hasApiKey: !!settings.apiKey,
    };
  }

  async updateSettings(businessId: string, dto: UpdateLlmSettingsDto) {
    const { apiKey, ...otherSettings } = dto;

    let encryptedApiKey: string | undefined;
    if (apiKey) {
      encryptedApiKey = encryption.encrypt(apiKey, this.encryptionKey);
    }

    return prisma.llmSettings.upsert({
      where: { businessId },
      update: {
        ...otherSettings,
        ...(encryptedApiKey ? { apiKey: encryptedApiKey } : {}),
      } as any, // Cast to any to bypass strict Prisma null checks if necessary
      create: {
        businessId,
        provider: dto.provider ?? 'openai',
        model: dto.model ?? 'gpt-4o',
        temperature: dto.temperature ?? 0.7,
        maxTokens: dto.maxTokens ?? 2000,
        isFallbackEnabled: dto.isFallbackEnabled ?? true,
        ...(encryptedApiKey ? { apiKey: encryptedApiKey } : {}),
      },
    });
  }

  async getDecryptedApiKey(businessId: string): Promise<string | null> {
    const settings = await prisma.llmSettings.findUnique({
      where: { businessId },
      select: { apiKey: true },
    });

    if (!settings?.apiKey) return null;

    try {
      return encryption.decrypt(settings.apiKey, this.encryptionKey);
    } catch (err) {
      console.error(`[LlmSettingsService] Failed to decrypt API key for business ${businessId}:`, err);
      return null;
    }
  }
}
