"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CostTracker = void 0;
/**
 * Cost model for supported AI providers and models.
 * Costs are in USD cents per 1M tokens.
 */
const COST_TABLE = {
    // OpenAI
    'gpt-4o': { input: 500, output: 1500 },
    'gpt-4o-mini': { input: 15, output: 60 },
    'gpt-4-turbo': { input: 1000, output: 3000 },
    // Anthropic
    'claude-sonnet-4-5': { input: 300, output: 1500 },
    'claude-3-opus-20240229': { input: 1500, output: 7500 },
    'claude-3-haiku-20240307': { input: 25, output: 125 },
};
class CostTracker {
    emit;
    constructor(emit) {
        this.emit = emit;
    }
    /**
     * Calculate cost and emit a CostEvent.
     */
    async track(params) {
        const costCents = this.calculateCostCents(params.model, params.inputTokens, params.outputTokens);
        await this.emit({
            businessId: params.businessId,
            module: params.module,
            model: params.model,
            inputTokens: params.inputTokens,
            outputTokens: params.outputTokens,
            costCents,
            requestId: params.requestId,
        });
        return costCents;
    }
    calculateCostCents(model, inputTokens, outputTokens) {
        const rates = COST_TABLE[model] ?? { input: 100, output: 300 }; // default fallback
        const inputCost = (inputTokens / 1_000_000) * rates.input;
        const outputCost = (outputTokens / 1_000_000) * rates.output;
        return Math.ceil(inputCost + outputCost);
    }
}
exports.CostTracker = CostTracker;
//# sourceMappingURL=cost-tracker.js.map