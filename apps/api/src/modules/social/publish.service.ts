import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { prisma } from '@brandflow/db';
import { LLMGateway } from '@brandflow/ai';

@Injectable()
export class PublishService {
  private readonly logger = new Logger(PublishService.name);
  private readonly ai: LLMGateway;

  constructor() {
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
          status: 'pending',
          // In a real app, we might store the tailored body in a separate ContentVersion or Metadata
        }
      });

      jobs.push(job);
    }

    return jobs;
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
