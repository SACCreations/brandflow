import type { LLMProvider, ProviderRequest, ProviderResponse } from '../types';
export declare class AnthropicProvider implements LLMProvider {
    readonly name: "anthropic";
    private client;
    private model;
    private apiKey;
    constructor(apiKey: string, model?: string);
    isAvailable(): boolean;
    complete(request: ProviderRequest): Promise<ProviderResponse>;
}
//# sourceMappingURL=anthropic.d.ts.map