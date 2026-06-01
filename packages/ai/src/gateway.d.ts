import type { GatewayConfig, ProviderResponse, LLMConfig } from './types';
export declare class LLMGateway {
    private providers;
    private config;
    constructor(config: GatewayConfig);
    complete(systemPrompt: string, userPrompt: string | Array<{
        role: string;
        content: import('./types').MultimodalContent;
    }>, options?: LLMConfig): Promise<{
        response: ProviderResponse;
        requestId: string;
        provider: string;
    }>;
    private createTemporaryProvider;
    private buildProviderChain;
    private withTimeout;
}
//# sourceMappingURL=gateway.d.ts.map