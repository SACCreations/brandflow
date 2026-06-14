import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { prisma } from '@brandflow/db';
import { encryption } from '@brandflow/ai';
import { type UpdateLlmSettingsDto, DEFAULT_NVIDIA_SYSTEM_PROMPTS } from '@brandflow/shared';

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
        nvidiaTaskModels: {
          contentCreation: 'meta/llama-3.1-70b-instruct',
          imagePromptCreation: 'nvidia/nemotron-nano-8b-instruct',
          imageGeneration: 'black-forest-labs/flux.2-klein-4b',
          socialMediaCaptions: 'meta/llama-3.1-70b-instruct',
          campaignStrategy: 'nvidia/llama-3.1-nemotron-70b-instruct',
        },
        nvidiaSystemPrompts: DEFAULT_NVIDIA_SYSTEM_PROMPTS,
      };
    }

    // Mask API key
    return {
      ...settings,
      nvidiaSystemPrompts: settings.nvidiaSystemPrompts ?? DEFAULT_NVIDIA_SYSTEM_PROMPTS,
      apiKey: settings.apiKey ? '********' : null,
      fluxApiKey: settings.fluxApiKey ? '********' : null,
      hasApiKey: !!settings.apiKey,
    };
  }

  async updateSettings(businessId: string, dto: UpdateLlmSettingsDto) {
    const { apiKey, fluxApiKey, nvidiaTaskModels, nvidiaSystemPrompts, ...otherSettings } = dto;

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

    let encryptedFluxApiKey: string | null | undefined;
    if (fluxApiKey === '********') {
      encryptedFluxApiKey = undefined;
    } else if (fluxApiKey === '' || fluxApiKey === null) {
      encryptedFluxApiKey = null;
    } else if (fluxApiKey) {
      encryptedFluxApiKey = encryption.encrypt(fluxApiKey, this.encryptionKey);
    }

    return prisma.llmSettings.upsert({
      where: { businessId },
      update: {
        ...otherSettings,
        ...(nvidiaTaskModels !== undefined ? { nvidiaTaskModels: nvidiaTaskModels as any } : {}),
        ...(nvidiaSystemPrompts !== undefined ? { nvidiaSystemPrompts: nvidiaSystemPrompts as any } : {}),
        ...(encryptedApiKey !== undefined ? { apiKey: encryptedApiKey } : {}),
        ...(encryptedFluxApiKey !== undefined ? { fluxApiKey: encryptedFluxApiKey } : {}),
      } as any,
      create: {
        businessId,
        provider: dto.provider ?? 'openai',
        model: dto.model ?? 'gpt-4o',
        temperature: dto.temperature ?? 0.7,
        maxTokens: dto.maxTokens ?? 2000,
        isFallbackEnabled: dto.isFallbackEnabled ?? true,
        ...(nvidiaTaskModels ? { nvidiaTaskModels: nvidiaTaskModels as any } : {}),
        ...(nvidiaSystemPrompts ? { nvidiaSystemPrompts: nvidiaSystemPrompts as any } : {}),
        ...(encryptedApiKey !== undefined && encryptedApiKey !== null ? { apiKey: encryptedApiKey } : {}),
        ...(encryptedFluxApiKey !== undefined && encryptedFluxApiKey !== null ? { fluxApiKey: encryptedFluxApiKey } : {}),
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

  /**
   * Resolves the best API key for IMAGE GENERATION for a business.
   *
   * Priority order:
   * 1. Dedicated imageApiKey (set specifically for image generation)
   * 2. Main LLM apiKey (if provider is 'openai' — same key works for DALL-E)
   * 3. null (will use mock provider)
   *
   * This is the method the ImageJobProcessor must use — NOT getDecryptedApiKey()
   * when the user's LLM provider is NVIDIA (those keys don't work for DALL-E).
   */
  async getDecryptedImageApiKey(businessId: string): Promise<{ key: string | null; source: 'image_specific' | 'llm_shared' | 'none' }> {
    const settings = await prisma.llmSettings.findUnique({
      where: { businessId },
      select: { apiKey: true, imageApiKey: true, provider: true },
    });

    if (!settings) return { key: null, source: 'none' };

    // Try dedicated image API key first
    if (settings.imageApiKey) {
      try {
        const key = encryption.decrypt(settings.imageApiKey, this.encryptionKey);
        if (key) return { key, source: 'image_specific' };
      } catch (err) {
        console.error(`[LlmSettingsService] Failed to decrypt imageApiKey for business ${businessId}:`, err);
      }
    }

    // Fall back to main API key if provider is openai or nvidia (same key works for their respective image generators)
    if (settings.apiKey && (settings.provider === 'openai' || settings.provider === 'nvidia')) {
      try {
        const key = encryption.decrypt(settings.apiKey, this.encryptionKey);
        if (key) return { key, source: 'llm_shared' };
      } catch (err) {
        console.error(`[LlmSettingsService] Failed to decrypt apiKey for business ${businessId}:`, err);
      }
    }

    return { key: null, source: 'none' };
  }

  async getDecryptedFluxApiKey(businessId: string): Promise<string | null> {
    const settings = await prisma.llmSettings.findUnique({
      where: { businessId },
      select: { fluxApiKey: true },
    });

    if (!settings?.fluxApiKey) return null;

    try {
      return encryption.decrypt(settings.fluxApiKey, this.encryptionKey);
    } catch (err) {
      console.error(`[LlmSettingsService] Failed to decrypt fluxApiKey for business ${businessId}:`, err);
      return null;
    }
  }

  async updateImageApiKey(businessId: string, imageApiKey: string | null): Promise<void> {
    let encryptedKey: string | null = null;
    if (imageApiKey && imageApiKey !== '********') {
      encryptedKey = encryption.encrypt(imageApiKey, this.encryptionKey);
    }

    await prisma.llmSettings.upsert({
      where: { businessId },
      update: { imageApiKey: encryptedKey },
      create: {
        businessId,
        provider: 'openai',
        model: 'gpt-4o',
        imageApiKey: encryptedKey,
      },
    });
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
        case 'nvidia': {
          const res = await fetch('https://integrate.api.nvidia.com/v1/models', {
            headers: { Authorization: `Bearer ${apiKey}` },
          });
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
