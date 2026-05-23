import type { LLMProvider, ProviderRequest, ProviderResponse } from '../types';

/**
 * Fallback provider for when all primary providers are unavailable.
 * Always throws an error directing users to configure their API key.
 */
export class FallbackProvider implements LLMProvider {
  readonly name = 'fallback' as const;

  isAvailable(): boolean {
    // Always available as last resort to surface a clear error
    return true;
  }

  async complete(request: ProviderRequest): Promise<ProviderResponse> {
    throw new Error(
      `No AI provider API key configured. Request ID: ${request.requestId}. ` +
        'Please add your API key in Settings → LLM Settings.',
    );
  }
}
