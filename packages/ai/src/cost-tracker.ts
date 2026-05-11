import type { CostEventPayload } from './types';

export type CostEventEmitter = (event: CostEventPayload) => Promise<void> | void;

/**
 * Cost model for supported AI providers and models.
 * Costs are in USD cents per 1M tokens.
 */
const COST_TABLE: Record<string, { input: number; output: number }> = {
  // OpenAI
  'gpt-4o': { input: 500, output: 1500 },
  'gpt-4o-mini': { input: 15, output: 60 },
  'gpt-4-turbo': { input: 1000, output: 3000 },
  // Anthropic
  'claude-sonnet-4-5': { input: 300, output: 1500 },
  'claude-3-opus-20240229': { input: 1500, output: 7500 },
  'claude-3-haiku-20240307': { input: 25, output: 125 },
};

export class CostTracker {
  constructor(private readonly emit: CostEventEmitter) {}

  /**
   * Calculate cost and emit a CostEvent.
   */
  async track(params: {
    businessId: string;
    module: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    requestId: string;
  }): Promise<number> {
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

  calculateCostCents(model: string, inputTokens: number, outputTokens: number): number {
    const rates = COST_TABLE[model] ?? { input: 100, output: 300 }; // default fallback
    const inputCost = (inputTokens / 1_000_000) * rates.input;
    const outputCost = (outputTokens / 1_000_000) * rates.output;
    return Math.ceil(inputCost + outputCost);
  }
}
