export interface TokenBudgetStore {
  getUsed(businessId: string): Promise<number>;
  getBudget(businessId: string): Promise<number>;
  increment(businessId: string, tokens: number): Promise<void>;
}

export class RateLimiter {
  constructor(private readonly store: TokenBudgetStore) {}

  /**
   * Check if a business has sufficient token budget remaining.
   * Throws if the budget is exhausted.
   */
  async checkBudget(
    businessId: string,
    estimatedTokens: number,
  ): Promise<{ remaining: number; allowed: boolean }> {
    const [used, budget] = await Promise.all([
      this.store.getUsed(businessId),
      this.store.getBudget(businessId),
    ]);

    // -1 means unlimited (enterprise plans)
    if (budget === -1) {
      return { remaining: Infinity, allowed: true };
    }

    const remaining = budget - used;
    const allowed = remaining >= estimatedTokens;

    return { remaining, allowed };
  }

  /**
   * Consume tokens from a business's budget.
   */
  async consume(businessId: string, tokens: number): Promise<void> {
    await this.store.increment(businessId, tokens);
  }
}
