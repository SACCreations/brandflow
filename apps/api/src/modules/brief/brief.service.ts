import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@brandflow/db';
import { LLMGateway } from '@brandflow/ai';

@Injectable()
export class BriefService {
  private readonly ai: LLMGateway;

  constructor() {
    this.ai = new LLMGateway({ defaultProvider: 'openai' });
  }

  async findAll(businessId: string) {
    return prisma.brief.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
      include: { campaign: { select: { name: true } } },
    });
  }

  async findById(id: string, businessId: string) {
    const brief = await prisma.brief.findFirst({
      where: { id, businessId },
      include: { campaign: true },
    });
    if (!brief) throw new NotFoundException('Brief not found');
    return brief;
  }

  async create(businessId: string, dto: any) {
    return prisma.brief.create({
      data: {
        ...dto,
        businessId,
      },
    });
  }

  async createFromTemplate(businessId: string, templateType: string) {
    const templates: Record<string, any> = {
      product_launch: {
        objective: 'Drive awareness and pre-orders for new product',
        audience: 'Early adopters, existing customers',
        contentType: 'Multi-channel announcement',
        tone: 'Excited, authoritative, innovative',
        campaignTheme: 'The Future of [Product]',
      },
      seasonal_sale: {
        objective: 'Clear inventory and boost Q4 revenue',
        audience: 'Price-sensitive shoppers, previous buyers',
        contentType: 'Promotional ads and email',
        tone: 'Urgent, persuasive, direct',
        campaignTheme: 'Holiday Savings Event',
      },
      thought_leadership: {
        objective: 'Establish brand authority in [Industry]',
        audience: 'Industry peers, enterprise decision makers',
        contentType: 'Long-form blog and LinkedIn posts',
        tone: 'Insightful, provocative, professional',
        campaignTheme: 'Industry Trends 2024',
      }
    };

    const config = templates[templateType] || {};
    return this.create(businessId, config);
  }

  async getAiSuggestions(businessId: string, field: string, context?: any) {
    // In production, we'd fetch high-performing campaign data from AnalyticsService
    // For now, we simulate an AI suggestion based on the brand context
    const prompt = `You are a strategic marketing consultant. 
      Suggest a ${field} for a content brief.
      Context: ${JSON.stringify(context || {})}
      Return only the suggested text.`;

    const { response } = await this.ai.complete(
      "You suggest high-converting marketing brief details.",
      prompt,
      { temperature: 0.8 }
    );

    return { suggestion: response.content };
  }

  async validate(id: string, businessId: string) {
    const brief = await this.findById(id, businessId);
    
    const mandatoryFields = [
      'objective', 
      'audience', 
      'platform', 
      'cta', 
      'contentType', 
      'businessGoal'
    ];

    const missing = mandatoryFields.filter(f => !brief[f as keyof typeof brief]);
    const isComplete = missing.length === 0;

    if (brief.isComplete !== isComplete) {
      await prisma.brief.update({
        where: { id },
        data: { isComplete },
      });
    }

    return { isComplete, missing };
  }
}
