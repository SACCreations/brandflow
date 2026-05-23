import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { prisma } from '@brandflow/db';
import { LLMGateway, type ProviderResponse, encryption } from '@brandflow/ai';
import type { CreateConversationDto, ConvertToContentDto } from './dto';

const MAX_CONTEXT_MESSAGES = 20;
const MAX_KNOWLEDGE_RESULTS = 5;

@Injectable()
export class ChatService {
  private readonly gateway: LLMGateway;
  private vectorService: any;

  constructor(private readonly config: ConfigService) {
    this.gateway = new LLMGateway({
      defaultProvider: this.config.get('llm.defaultProvider', 'openai') as 'openai' | 'anthropic',
      fallbackProvider: this.config.get('llm.fallbackProvider', 'anthropic') as 'openai' | 'anthropic',
      requestTimeoutMs: this.config.get('llm.requestTimeoutMs', 30000),
    });
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const ai = require('@brandflow/ai');
      if (ai.VectorService) {
        this.vectorService = new ai.VectorService();
      }
    } catch (err) { console.error("Error in getBusinessLlmSettings:", err);
      // Vector search unavailable
    }
  }

  // ─── Conversations ─────────────────────────────────────────────

  async createConversation(businessId: string, userId: string, dto: CreateConversationDto) {
    // Validate brand belongs to business if provided
    if (dto.brandId) {
      const brand = await prisma.brand.findFirst({
        where: { id: dto.brandId, businessId },
        select: { id: true },
      });
      if (!brand) throw new NotFoundException('Brand not found');
    }

    const conversation = await prisma.conversation.create({
      data: {
        businessId,
        userId,
        brandId: dto.brandId || null,
        title: dto.title || null,
      },
      include: {
        brand: { select: { id: true, name: true } },
      },
    });

    return conversation;
  }

  async listConversations(businessId: string, userId: string, brandId?: string) {
    const where: any = { businessId, userId };
    if (brandId) where.brandId = brandId;

    const conversations = await prisma.conversation.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: 50,
      include: {
        brand: { select: { id: true, name: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { content: true, createdAt: true },
        },
      },
    });

    return conversations.map((c) => ({
      id: c.id,
      title: c.title || this.generateTitle(c.messages[0]?.content),
      brandId: c.brandId,
      brandName: c.brand?.name || null,
      lastMessage: c.messages[0]?.content?.slice(0, 100) || null,
      updatedAt: c.updatedAt,
      createdAt: c.createdAt,
    }));
  }

  async getConversation(id: string, businessId: string, userId: string) {
    const conversation = await prisma.conversation.findFirst({
      where: { id, businessId, userId },
      include: {
        brand: { select: { id: true, name: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            role: true,
            content: true,
            provider: true,
            model: true,
            latency: true,
            createdAt: true,
          },
        },
      },
    });

    if (!conversation) throw new NotFoundException('Conversation not found');
    return conversation;
  }

  async deleteConversation(id: string, businessId: string, userId: string) {
    const conversation = await prisma.conversation.findFirst({
      where: { id, businessId, userId },
      select: { id: true },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');

    await prisma.conversation.delete({ where: { id } });
  }

  // ─── Messages ──────────────────────────────────────────────────

  async sendMessage(conversationId: string, businessId: string, userId: string, message: string) {
    // Validate conversation ownership
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, businessId, userId },
      include: {
        brand: {
          select: { name: true, industry: true, tone: true, audience: true, description: true },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: MAX_CONTEXT_MESSAGES,
          select: { role: true, content: true },
        },
      },
    });

    if (!conversation) throw new NotFoundException('Conversation not found');

    // Persist user message
    await prisma.chatMessage.create({
      data: { conversationId, role: 'user', content: message },
    });

    // Build conversation context (reverse to chronological order)
    const historyMessages = conversation.messages.reverse().map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    // Build brand context
    let brandContext = '';
    if (conversation.brand) {
      const b = conversation.brand;
      const toneStr = b.tone ? (Array.isArray(b.tone) ? (b.tone as string[]).join(', ') : String(b.tone)) : null;
      brandContext = [
        '\n\n## Brand Context',
        `- Name: ${b.name}`,
        b.industry ? `- Industry: ${b.industry}` : null,
        toneStr ? `- Tone: ${toneStr}` : null,
        b.audience ? `- Target Audience: ${b.audience}` : null,
        b.description ? `- Description: ${b.description}` : null,
      ].filter(Boolean).join('\n');
    }

    // Retrieve relevant knowledge via vector search
    let knowledgeContext = '';
    try {
      if (this.vectorService) {
        const results = await this.vectorService.search(message, {
          businessId,
          topK: MAX_KNOWLEDGE_RESULTS,
        });
        if (results && results.length > 0) {
          knowledgeContext = '\n\n## Relevant Knowledge\n' +
            results.map((r: any) => `- ${r.content}`).join('\n');
        }
      }
    } catch (err) { console.error("Error in getBusinessLlmSettings:", err);
      // Vector search is non-critical
    }

    const systemPrompt = `You are BrandFlow AI, a professional brand strategy and content assistant. You help with content ideas, brand positioning, marketing strategy, copywriting, and creative direction. Be concise, actionable, and professional. Always stay on-brand when brand context is provided.${brandContext}${knowledgeContext}`;

    // Build messages array for multi-turn context
    const llmMessages = [
      ...historyMessages,
      { role: 'user' as const, content: message },
    ];

    // Get business LLM settings
    const llmSettings = await this.getBusinessLlmSettings(businessId);
    if (!llmSettings?.apiKey) {
      throw new InternalServerErrorException(
        'No AI provider configured. Please add your API key in Settings → AI Provider.',
      );
    }

    const start = Date.now();
    const requestId = randomUUID();

    try {
      const result = await this.gateway.complete(systemPrompt, llmMessages as any, {
        provider: llmSettings.provider as any,
        maxTokens: llmSettings.maxTokens,
        temperature: llmSettings.temperature,
        apiKey: llmSettings.apiKey,
      });

      const latency = Date.now() - start;
      const response = result.response;

      // Persist assistant message
      const assistantMsg = await prisma.chatMessage.create({
        data: {
          conversationId,
          role: 'assistant',
          content: response.content,
          provider: result.provider,
          model: response.model,
          latency,
          inputTokens: response.inputTokens || 0,
          outputTokens: response.outputTokens || 0,
        },
      });

      // Auto-generate conversation title from first user message
      if (!conversation.messages.length) {
        const title = this.generateTitle(message);
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { title },
        });
      } else {
        // Touch updatedAt
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() },
        });
      }

      // Log request (non-critical)
      prisma.aIRequestLog.create({
        data: {
          requestId,
          businessId,
          provider: result.provider,
          model: response.model,
          latency,
          inputTokens: response.inputTokens || 0,
          outputTokens: response.outputTokens || 0,
          success: true,
          errorMessage: null,
        },
      }).catch(() => {});

      return {
        id: assistantMsg.id,
        role: 'assistant',
        content: response.content,
        provider: result.provider,
        model: response.model,
        latency,
        createdAt: assistantMsg.createdAt,
      };
    } catch (err: any) {
      // Log failure
      prisma.aIRequestLog.create({
        data: {
          requestId,
          businessId,
          provider: 'unknown',
          model: 'unknown',
          latency: Date.now() - start,
          inputTokens: 0,
          outputTokens: 0,
          success: false,
          errorMessage: err.message,
        },
      }).catch(() => {});

      throw new InternalServerErrorException('Failed to generate response. Please try again.');
    }
  }

  // ─── Convert to Content ────────────────────────────────────────

  async convertToContent(
    conversationId: string,
    businessId: string,
    userId: string,
    dto: ConvertToContentDto,
  ) {
    // Validate conversation ownership
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, businessId, userId },
      select: { id: true, brandId: true },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');
    if (!conversation.brandId) {
      throw new ForbiddenException('Conversation must be linked to a brand to convert to content');
    }

    // Get the message
    const chatMessage = await prisma.chatMessage.findFirst({
      where: { id: dto.messageId, conversationId },
      select: { id: true, content: true, role: true },
    });
    if (!chatMessage) throw new NotFoundException('Message not found');

    // Refine content for the target platform/type
    const llmSettings = await this.getBusinessLlmSettings(businessId);
    const brand = await prisma.brand.findFirst({
      where: { id: conversation.brandId, businessId },
      select: { name: true, tone: true, audience: true },
    });

    const toneStr = brand?.tone ? (Array.isArray(brand.tone) ? (brand.tone as string[]).join(', ') : String(brand.tone)) : null;
    const refinePrompt = `You are a professional content writer. Reformat and refine the following text into a ${dto.type} for ${dto.platform}. Maintain the brand voice${toneStr ? ` (tone: ${toneStr})` : ''}${brand?.audience ? ` targeting ${brand.audience}` : ''}. Output ONLY the final content, no explanations or metadata.`;

    let finalBody = chatMessage.content;

    try {
      const result = await this.gateway.complete(refinePrompt, chatMessage.content, {
        provider: (llmSettings?.provider || 'openai') as any,
        maxTokens: llmSettings?.maxTokens || 1000,
        temperature: 0.6,
        apiKey: llmSettings?.apiKey,
      });
      finalBody = result.response.content;
    } catch (err) { console.error("Error in getBusinessLlmSettings:", err);
      // Use raw message if refinement fails
    }

    // Create content draft
    const content = await prisma.content.create({
      data: {
        businessId,
        brandId: conversation.brandId,
        platform: dto.platform,
        type: dto.type,
        body: finalBody,
        status: 'draft',
        campaignId: dto.campaignId || null,
        metadata: {
          source: 'chat',
          conversationId,
          messageId: dto.messageId,
        },
      },
      include: {
        brand: { select: { id: true, name: true } },
      },
    });

    // Create initial version
    await prisma.contentVersion.create({
      data: {
        contentId: content.id,
        version: 1,
        body: finalBody,
        editedBy: userId,
      },
    });

    return {
      id: content.id,
      platform: content.platform,
      type: content.type,
      body: content.body,
      status: content.status,
      brand: content.brand,
      createdAt: content.createdAt,
    };
  }

  // ─── Test Gateway ──────────────────────────────────────────────

  async testChat(businessId: string | null, dto: { message: string; provider: string }) {
    const start = Date.now();
    const primaryProvider = (dto.provider || 'openai').toLowerCase();
    const requestId = randomUUID();

    const llmSettings = businessId ? await this.getBusinessLlmSettings(businessId) : undefined;

    try {
      const result = await this.gateway.complete(
        'You are a helpful AI assistant validating the BrandFlow platform infrastructure.',
        dto.message,
        {
          provider: primaryProvider as any,
          maxTokens: 500,
          temperature: 0.7,
          apiKey: llmSettings?.apiKey,
        },
      );

      const latency = Date.now() - start;

      prisma.aIRequestLog.create({
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
      }).catch(() => {});

      return {
        success: true,
        provider: result.provider,
        model: result.response.model,
        response: result.response.content,
        latency,
        tokens: {
          input: result.response.inputTokens || 0,
          output: result.response.outputTokens || 0,
        },
        retryCount: 0,
        fallbackUsed: result.provider !== primaryProvider,
        fallbackProvider: result.provider !== primaryProvider ? result.provider : null,
      };
    } catch (err: any) {
      prisma.aIRequestLog.create({
        data: {
          requestId,
          businessId,
          provider: primaryProvider,
          model: 'unknown',
          latency: Date.now() - start,
          inputTokens: 0,
          outputTokens: 0,
          success: false,
          errorMessage: err.message,
        },
      }).catch(() => {});

      throw new InternalServerErrorException(err?.message || 'LLM Gateway test failed');
    }
  }

  // ─── Helpers ───────────────────────────────────────────────────

  private async getBusinessLlmSettings(businessId: string): Promise<{
    provider: string;
    model: string;
    temperature: number;
    maxTokens: number;
    apiKey: string | undefined;
  } | null> {
    try {
      const settings = await prisma.llmSettings.findUnique({
        where: { businessId },
      });
      if (!settings) return null;

      let decryptedKey: string | undefined;
      if (settings.apiKey) {
        const encryptionKey = this.config.get<string>('ENCRYPTION_KEY')!;
        decryptedKey = encryption.decrypt(settings.apiKey, encryptionKey);
      }

      return {
        provider: settings.provider,
        model: settings.model,
        temperature: settings.temperature,
        maxTokens: settings.maxTokens,
        apiKey: decryptedKey,
      };
    } catch (err) { console.error("Error in getBusinessLlmSettings:", err);
      return null;
    }
  }

  private generateTitle(content?: string | null): string {
    if (!content) return 'New conversation';
    // Use first 50 chars of the message as title
    const cleaned = content.replace(/\n/g, ' ').trim();
    return cleaned.length > 50 ? cleaned.slice(0, 50) + '…' : cleaned;
  }
}
