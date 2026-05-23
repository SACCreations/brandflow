import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { prisma } from '@brandflow/db';
import { encryption } from '@brandflow/ai';
import type { UpdateLlmSettingsDto } from '@brandflow/shared';

@Injectable()
export class LlmSettingsService {
  private readonly encryptionKey: string;

  constructor(private readonly config: ConfigService) {
    this.encryptionKey = this.config.get<string>('app.encryptionKey') || this.config.get<string>('ENCRYPTION_KEY') || process.env['ENCRYPTION_KEY']!;
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

    let encryptedApiKey: string | null | undefined;
    if (apiKey === '********') {
      // Keep existing key
      encryptedApiKey = undefined;
    } else if (apiKey === '' || apiKey === null) {
      // Clear key
      encryptedApiKey = null;
    } else if (apiKey) {
      // Encrypt new key
      encryptedApiKey = encryption.encrypt(apiKey, this.encryptionKey);
    }

    return prisma.llmSettings.upsert({
      where: { businessId },
      update: {
        ...otherSettings,
        ...(encryptedApiKey !== undefined ? { apiKey: encryptedApiKey } : {}),
      } as any, // Cast to any to bypass strict Prisma null checks if necessary
      create: {
        businessId,
        provider: dto.provider ?? 'openai',
        model: dto.model ?? 'gpt-4o',
        temperature: dto.temperature ?? 0.7,
        maxTokens: dto.maxTokens ?? 2000,
        isFallbackEnabled: dto.isFallbackEnabled ?? true,
        ...(encryptedApiKey !== undefined && encryptedApiKey !== null ? { apiKey: encryptedApiKey } : {}),
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

  async validateApiKey(provider: string, apiKey: string): Promise<boolean> {
    try {
      switch (provider) {
        case 'openai': {
          const res = await fetch('https://api.openai.com/v1/models', {
            headers: { Authorization: `Bearer ${apiKey}` },
          });
          return res.ok;
        }
        case 'anthropic': {
          const res = await fetch('https://api.anthropic.com/v1/models', {
            headers: { 
              'x-api-key': apiKey,
              'anthropic-version': '2023-06-01'
            },
          });
          return res.ok;
        }
        case 'google': {
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
          return res.ok;
        }
        default:
          return false;
      }
    } catch (error) {
      console.error(`[LlmSettingsService] Failed to validate ${provider} API key:`, error);
      return false;
    }
  }
}
