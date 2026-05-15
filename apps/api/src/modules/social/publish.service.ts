import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { prisma } from '@brandflow/db';
import { LLMGateway } from '@brandflow/ai';
import { SocialService } from './social.service';

@Injectable()
export class PublishService {
  private readonly logger = new Logger(PublishService.name);
  private readonly ai: LLMGateway;

  constructor(private readonly socialService: SocialService) {
    this.ai = new LLMGateway({ defaultProvider: 'openai' });
  }

  /**
   * Prepares a content piece for multiple platforms by generating tailored variations.
   */
  async prepareMultiPost(contentId: string, accountIds: string[], businessId: string) {
    const content = await prisma.content.findUnique({
      where: { id: contentId },
      include: { brand: true, brief: true }
    });

    if (!content) throw new NotFoundException('Content not found');

    const accounts = await prisma.socialAccount.findMany({
      where: { id: { in: accountIds }, businessId }
    });

    const jobs = [];

    for (const account of accounts) {
      this.logger.log(`Tailoring content for ${account.platform} (${account.name})`);

      // 1. Generate platform-specific variation using AI
      const tailoredBody = await this.tailorContent(content.body, account.platform, content.brand);

      // 2. Create the PublishJob
      const job = await prisma.publishJob.create({
        data: {
          businessId,
          contentId,
          socialAccountId: account.id,
          tailoredBody,
          status: 'pending',
        }
      });

      jobs.push(job);
    }

    return jobs;
  }

  async publishContent(contentId: string, socialAccountId: string, businessId: string, tailoredBody?: string) {
    const [content, account] = await Promise.all([
      prisma.content.findFirst({
        where: { id: contentId, businessId },
        include: { brand: true },
      }),
      prisma.socialAccount.findFirst({
        where: { id: socialAccountId, businessId },
      }),
    ]);

    if (!content) {
      throw new NotFoundException('Content not found');
    }

    if (!account) {
      throw new NotFoundException('Social account not found');
    }

    if (account.tokenExpiresAt && account.tokenExpiresAt.getTime() <= Date.now()) {
      throw new BadRequestException('LinkedIn token expired. Reconnect the account before publishing.');
    }

    const finalBody = tailoredBody || content.body;

    switch (account.platform) {
      case 'linkedin': {
        return this.publishLinkedInPost(finalBody, account, businessId);
      }
      default:
        throw new BadRequestException(`Platform ${account.platform} is not supported for direct publishing yet.`);
    }
  }

  private async tailorContent(body: string, platform: string, brand: any): Promise<string> {
    const platformRules: Record<string, string> = {
      twitter: 'Keep it concise, under 280 characters. Use 1-2 relevant hashtags. Use a punchy tone.',
      linkedin: 'Professional and insightful. Use white space for readability. Focus on industry impact.',
      instagram: 'Visual-first. Use engaging emojis and 5-10 hashtags. Focus on lifestyle or behind-the-scenes.',
      facebook: 'Community-focused. Use a conversational tone. Include a clear call to action.'
    };

    const prompt = `Rewrite the following content for ${platform}.
      Rules: ${platformRules[platform.toLowerCase()] || 'Maintain the brand voice.'}
      Brand Tone: ${JSON.stringify(brand.tone)}
      
      Original Content:
      ${body}`;

    try {
      const { response } = await this.ai.complete(
        "You are an expert social media manager specializing in multi-platform content tailoring.",
        prompt,
        { temperature: 0.7 }
      );
      return response.content;
    } catch (error) {
      this.logger.error(`Failed to tailor content for ${platform}`, error);
      return body; // Fallback to original
    }
  }

  private async publishLinkedInPost(
    body: string,
    account: {
      id: string;
      externalId: string;
      accountType: string;
      platform: string;
    },
    businessId: string,
  ) {
    const { accessToken } = await this.socialService.getDecryptedTokens(account.id, businessId);
    const authorType = account.accountType === 'organization' ? 'organization' : 'person';

    const response = await fetch('https://api.linkedin.com/rest/posts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'LinkedIn-Version': '202405',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify({
        author: `urn:li:${authorType}:${account.externalId}`,
        commentary: body,
        visibility: 'PUBLIC',
        distribution: {
          feedDistribution: 'MAIN_FEED',
          targetEntities: [],
          thirdPartyDistributionChannels: [],
        },
        lifecycleState: 'PUBLISHED',
        isReshareDisabledByAuthor: false,
      }),
      signal: AbortSignal.timeout(20_000),
    });

    const text = await response.text();
    const payload = text ? this.tryParseJson(text) : {};

    if (!response.ok) {
      const message = typeof payload === 'object' && payload && 'message' in payload
        ? String((payload as { message?: unknown }).message)
        : `LinkedIn publish failed (${response.status}).`;
      throw new BadRequestException(message);
    }

    const externalPostId = response.headers.get('x-restli-id')
      || (typeof payload === 'object' && payload && 'id' in payload ? String((payload as { id?: unknown }).id) : null)
      || `linkedin:${account.externalId}:${Date.now()}`;

    // Log the publication
    await prisma.auditLog.create({
      data: {
        businessId,
        action: 'publish',
        entityType: 'content',
        entityId: contentId,
        after: { platform: 'linkedin', externalPostId },
        hash: `pub-${crypto.randomUUID()}`, // Simple hash for now
      }
    });

    return { externalPostId };
  }

  private tryParseJson(value: string): unknown {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  async getQueue(businessId: string) {
    return prisma.publishJob.findMany({
      where: { businessId },
      include: {
        content: { select: { body: true, type: true } },
        socialAccount: { select: { name: true, platform: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}
