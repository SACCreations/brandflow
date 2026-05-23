import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { prisma } from '@brandflow/db';
import { LLMGateway, type ProviderResponse, encryption } from '@brandflow/ai';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';

@Injectable()
export class ChatService {
  private readonly gateway: LLMGateway;

  constructor(private readonly config: ConfigService) {
    this.gateway = new LLMGateway({
      defaultProvider: this.config.get('llm.defaultProvider', 'openai') as 'openai' | 'anthropic',
      fallbackProvider: this.config.get('llm.fallbackProvider', 'anthropic') as 'openai' | 'anthropic',
      requestTimeoutMs: this.config.get('llm.requestTimeoutMs', 30000),
    });
  }

  async testChat(
    businessId: string | null,
    dto: { message: string; provider: string }
  ) {
    const start = Date.now();
    const primaryProvider = (dto.provider || 'openai').toLowerCase();
    const fallbackProvider = primaryProvider === 'openai' ? 'anthropic' : 'openai';
    const requestId = randomUUID();

    let decryptedApiKey: string | undefined;
    if (businessId) {
      const settings = await prisma.llmSettings.findUnique({
        where: { businessId },
      });
      if (settings?.apiKey) {
        try {
          const encryptionKey = this.config.get<string>('ENCRYPTION_KEY')!;
          decryptedApiKey = encryption.decrypt(settings.apiKey, encryptionKey);
          console.log(`[ChatService] Loaded and decrypted custom API key for businessId: ${businessId}`);
        } catch (err: any) {
          console.error(`[ChatService] Failed to decrypt business API key:`, err.message);
        }
      }
    }

    let finalResponse: ProviderResponse | null = null;
    let usedProvider = primaryProvider;
    let success = false;
    let errorMessage: string | null = null;
    let retryCount = 0;
    let fallbackUsed = false;

    // We build our own retry and fallback wrapper to strictly log the details
    try {
      console.log(`[ChatService] Attempting LLM completion with Primary Provider: ${primaryProvider}`);
      const result = await this.gateway.complete(
        'You are a helpful AI assistant validating the BrandFlow platform infrastructure.',
        dto.message,
        {
          provider: primaryProvider as any,
          maxTokens: 500,
          temperature: 0.7,
          apiKey: decryptedApiKey,
        }
      );
      finalResponse = result.response;
      usedProvider = result.provider;
      success = true;
    } catch (primaryError: any) {
      console.error(`[ChatService] Primary provider ${primaryProvider} failed:`, primaryError.message);
      errorMessage = primaryError.message;
      retryCount++;

      // Trigger automatic fallback flow
      console.log(`[ChatService] Triggering Fallback Provider: ${fallbackProvider}`);
      fallbackUsed = true;
      try {
        const fallbackResult = await this.gateway.complete(
          'You are a helpful AI assistant validating the BrandFlow platform infrastructure.',
          dto.message,
          {
            provider: fallbackProvider as any,
            maxTokens: 500,
            temperature: 0.7,
            apiKey: decryptedApiKey,
          }
        );
        finalResponse = fallbackResult.response;
        usedProvider = fallbackResult.provider;
        success = true;
        errorMessage = null; // Clear primary error as fallback succeeded
      } catch (fallbackError: any) {
        console.error(`[ChatService] Fallback provider ${fallbackProvider} also failed:`, fallbackError.message);
        errorMessage = `Primary [${primaryProvider}] error: ${primaryError.message}. Fallback [${fallbackProvider}] error: ${fallbackError.message}`;
      }
    }

    const latency = Date.now() - start;

    // Log the AI Request in our database table
    try {
      await prisma.aIRequestLog.create({
        data: {
          requestId,
          businessId,
          provider: usedProvider,
          model: finalResponse?.model || 'unknown',
          latency,
          inputTokens: finalResponse?.inputTokens || 0,
          outputTokens: finalResponse?.outputTokens || 0,
          success,
          errorMessage,
        },
      });
      console.log(`[ChatService] AI Request Log persisted to database successfully.`);
    } catch (dbError) {
      console.error('[ChatService] Failed to persist AI Request Log:', dbError);
    }

    if (!success) {
      throw new InternalServerErrorException(errorMessage || 'LLM Gateway request failed');
    }

    return {
      success: true,
      provider: usedProvider,
      model: finalResponse?.model || 'unknown',
      response: finalResponse?.content || '',
      tokens: {
        input: finalResponse?.inputTokens || 0,
        output: finalResponse?.outputTokens || 0,
      },
      latency,
      retryCount,
      fallbackUsed,
      fallbackProvider: fallbackUsed ? fallbackProvider : null,
    };
  }

  /**
   * Brand-aware chat endpoint: enriches prompt with brand context
   * and relevant knowledge base entries via vector search.
   */
  async ask(businessId: string, message: string, brandId?: string) {
    const start = Date.now();
    const requestId = randomUUID();

    // Gather brand context if specified
    let brandContext = '';
    if (brandId) {
      const brand = await prisma.brand.findFirst({
        where: { id: brandId, businessId },
        select: { name: true, industry: true, toneOfVoice: true, targetAudience: true, description: true },
      });
      if (brand) {
        brandContext = `\n\nBrand Context:\n- Name: ${brand.name}\n- Industry: ${brand.industry || 'N/A'}\n- Tone: ${brand.toneOfVoice || 'N/A'}\n- Target Audience: ${brand.targetAudience || 'N/A'}\n- Description: ${brand.description || 'N/A'}`;
      }
    }

    // Retrieve relevant knowledge via vector search (requires rebuilt @brandflow/ai)
    let knowledgeContext = '';
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const ai = require('@brandflow/ai');
      if (ai.VectorService) {
        const vectorService = new ai.VectorService();
        const results = await vectorService.search(message, { businessId, topK: 3 });
        if (results.length > 0) {
          knowledgeContext = '\n\nRelevant Knowledge:\n' + results.map((r: any) => `- ${r.content}`).join('\n');
        }
      }
    } catch {
      // Vector search is non-critical — proceed without it
    }

    const systemPrompt = `You are BrandFlow AI, a helpful brand strategy and content assistant. Help users with content ideas, brand positioning, marketing strategy, and creative direction. Be concise, actionable, and professional.${brandContext}${knowledgeContext}`;

    // Get business API key if available
    let decryptedApiKey: string | undefined;
    const settings = await prisma.llmSettings.findUnique({
      where: { businessId },
    });
    if (settings?.apiKey) {
      try {
        const encryptionKey = this.config.get<string>('ENCRYPTION_KEY')!;
        decryptedApiKey = encryption.decrypt(settings.apiKey, encryptionKey);
      } catch {
        // Use platform key as fallback
      }
    }

    try {
      const result = await this.gateway.complete(systemPrompt, message, {
        provider: 'openai',
        maxTokens: 1000,
        temperature: 0.7,
        apiKey: decryptedApiKey,
      });

      const latency = Date.now() - start;

      // Log request
      await prisma.aIRequestLog.create({
        data: {
          requestId,
          businessId,
          provider: result.provider,
          model: result.response.model,
          latency,
          inputTokens: result.response.inputTokens || 0,
          outputTokens: result.response.outputTokens || 0,
          success: true,
          errorMessage: null,
        },
      }).catch(() => { /* non-critical */ });

      return {
        success: true,
        response: result.response.content,
        provider: result.provider,
        model: result.response.model,
        latency,
      };
    } catch (err: any) {
      throw new InternalServerErrorException(err?.message || 'Chat request failed');
    }
  }
}
