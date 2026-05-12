"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimiter = void 0;
class RateLimiter {
    store;
    constructor(store) {
        this.store = store;
    }
    /**
     * Check if a business has sufficient token budget remaining.
     * Throws if the budget is exhausted.
     */
    async checkBudget(businessId, estimatedTokens) {
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
    async consume(businessId, tokens) {
        await this.store.increment(businessId, tokens);
    }
}
exports.RateLimiter = RateLimiter;
//# sourceMappingURL=rate-limiter.js.map