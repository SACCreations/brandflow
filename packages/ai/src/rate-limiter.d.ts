export interface TokenBudgetStore {
    getUsed(businessId: string): Promise<number>;
    getBudget(businessId: string): Promise<number>;
    increment(businessId: string, tokens: number): Promise<void>;
}
export declare class RateLimiter {
    private readonly store;
    constructor(store: TokenBudgetStore);
    /**
     * Check if a business has sufficient token budget remaining.
     * Throws if the budget is exhausted.
     */
    checkBudget(businessId: string, estimatedTokens: number): Promise<{
        remaining: number;
        allowed: boolean;
    }>;
    /**
     * Consume tokens from a business's budget.
     */
    consume(businessId: string, tokens: number): Promise<void>;
}
//# sourceMappingURL=rate-limiter.d.ts.map