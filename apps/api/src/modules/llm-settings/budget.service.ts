import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';

@Injectable()
export class BudgetService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Checks if the business has enough token budget for an LLM request.
   * Throws ForbiddenException if budget is exhausted.
   */
  async checkBudget(businessId: string) {
    const subscription = await this.prisma.client.subscription.findFirst({
      where: { businessId, status: 'active' },
    });

    if (!subscription) {
      throw new ForbiddenException('No active subscription found. Please upgrade your plan.');
    }

    // Calculate current usage from CostEvents
    // Note: In a high-scale environment, this should be cached in Redis or a dedicated table
    const aggregate = await this.prisma.client.costEvent.aggregate({
      where: { businessId },
      _sum: { inputTokens: true, outputTokens: true },
    });

    const usedTokens = (aggregate._sum.inputTokens || 0) + (aggregate._sum.outputTokens || 0);

    if (usedTokens >= subscription.tokenBudget) {
      throw new ForbiddenException(
        `Monthly token budget exhausted (${usedTokens} / ${subscription.tokenBudget}). Please upgrade your plan.`,
      );
    }

    return {
      used: usedTokens,
      limit: subscription.tokenBudget,
      remaining: subscription.tokenBudget - usedTokens,
    };
  }
}
