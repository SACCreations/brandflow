import type { LLMProvider, ProviderRequest, ProviderResponse } from '../types';
export declare class OpenAIProvider implements LLMProvider {
    readonly name: "openai";
    private client;
    private model;
    private apiKey;
    constructor(apiKey: string, model?: string);
    isAvailable(): boolean;
    complete(request: ProviderRequest): Promise<ProviderResponse>;
}
//# sourceMappingURL=openai.d.ts.map