import type { BrandContext, QualityCheckResult } from './types';
import { LLMGateway } from './gateway';
export declare class QualityControl {
    private readonly gateway;
    constructor(gateway: LLMGateway);
    /**
     * Run comprehensive multi-layered quality control pipeline.
     */
    check(content: string, brand: BrandContext, knowledgeFacts?: {
        id: string;
        content: string;
    }[], options?: {
        apiKey?: string;
    }): Promise<QualityCheckResult>;
    private checkBannedPhrases;
    private evalCompliance;
    private evalFactuality;
    private evalSafety;
    private calculateGrade;
}
//# sourceMappingURL=quality-control.d.ts.map