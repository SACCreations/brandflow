import type { LLMProvider, ProviderRequest, ProviderResponse } from '../types';
/**
 * Fallback provider for when all primary providers are unavailable.
 * Always throws an error directing users to configure their API key.
 */
export declare class FallbackProvider implements LLMProvider {
    readonly name: "fallback";
    isAvailable(): boolean;
    complete(request: ProviderRequest): Promise<ProviderResponse>;
}
//# sourceMappingURL=fallback.d.ts.map