import type { LLMProvider, ProviderRequest, ProviderResponse } from '../types';

/**
 * Fallback provider for when all primary providers are unavailable.
 * Returns a simple templated response using a lightweight local strategy.
 * In production this could call a self-hosted OSS model.
 */
export class FallbackProvider implements LLMProvider {
  readonly name = 'fallback' as const;

  isAvailable(): boolean {
    // Always available as last resort
    return true;
  }

  async complete(request: ProviderRequest): Promise<ProviderResponse> {
    // In a real production scenario this would call a self-hosted model.
    // For MVP, this throws an informative error instead of silently degrading.
    throw new Error(
      `All AI providers are unavailable. Request ID: ${request.requestId}. ` +
        'Please configure OPENAI_API_KEY or ANTHROPIC_API_KEY.',
    );
  }
}
