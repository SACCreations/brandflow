import type { CostEventPayload } from './types';
export type CostEventEmitter = (event: CostEventPayload) => Promise<void> | void;
export declare class CostTracker {
    private readonly emit;
    constructor(emit: CostEventEmitter);
    /**
     * Calculate cost and emit a CostEvent.
     */
    track(params: {
        businessId: string;
        module: string;
        model: string;
        inputTokens: number;
        outputTokens: number;
        requestId: string;
    }): Promise<number>;
    calculateCostCents(model: string, inputTokens: number, outputTokens: number): number;
}
//# sourceMappingURL=cost-tracker.d.ts.map