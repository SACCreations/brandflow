import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { RedisService } from '../../common/redis/redis.service';

@Injectable()
export class BudgetService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /**
   * Checks if the business has enough token budget for an LLM request.
   * Uses Redis for fast lookup, falling back to DB aggregation.
   */
  async checkBudget(businessId: string) {
    const subscription = await this.prisma.client.subscription.findFirst({
      where: { businessId, status: 'active' },
    });

    if (!subscription) {
      throw new ForbiddenException('No active subscription found. Please upgrade your plan.');
    }

    // Try to get from Redis first
    const cacheKey = `budget:${businessId}:used`;
    let usedTokensString = await this.redis.get(cacheKey);
    let usedTokens: number;

    if (usedTokensString === null) {
      // Cache miss: aggregate from DB
      const aggregate = await this.prisma.client.costEvent.aggregate({
        where: { businessId },
        _sum: { inputTokens: true, outputTokens: true },
      });
      usedTokens = (aggregate._sum.inputTokens || 0) + (aggregate._sum.outputTokens || 0);
      
      // Set in Redis with 1 hour TTL
      await this.redis.set(cacheKey, usedTokens.toString(), 3600);
    } else {
      usedTokens = parseInt(usedTokensString, 10);
    }

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

  /**
   * Increments the cached budget usage.
   */
  async incrementUsage(businessId: string, tokens: number) {
    const cacheKey = `budget:${businessId}:used`;
    await this.redis.incrBy(cacheKey, tokens);
  }
}
