import type { LLMProvider, ProviderRequest, ProviderResponse } from '../types';
export declare class GoogleProvider implements LLMProvider {
    readonly name: "google";
    private model;
    private apiKey;
    constructor(apiKey: string, model?: string);
    isAvailable(): boolean;
    complete(request: ProviderRequest): Promise<ProviderResponse>;
}
//# sourceMappingURL=google.d.ts.map