import type { LLMProvider, ProviderRequest, ProviderResponse } from '../types';
export declare class NvidiaProvider implements LLMProvider {
    readonly name: "nvidia";
    private client;
    private model;
    private apiKey;
    constructor(apiKey: string, model?: string);
    isAvailable(): boolean;
    complete(request: ProviderRequest): Promise<ProviderResponse>;
}
//# sourceMappingURL=nvidia.d.ts.map