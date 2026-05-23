import { v4 as uuidv4 } from 'uuid';
import type { GatewayConfig, LLMProvider, ProviderRequest, ProviderResponse, LLMConfig } from './types';
import { AnthropicProvider } from './providers/anthropic';
import { FallbackProvider } from './providers/fallback';
import { OpenAIProvider } from './providers/openai';
import { GoogleProvider } from './providers/google';
import { PIISanitizer } from './sanitizer';

export class LLMGateway {
  private providers: Map<string, LLMProvider>;
  private config: Required<GatewayConfig>;

  constructor(config: GatewayConfig) {
    this.config = {
      defaultProvider: config.defaultProvider,
      fallbackProvider: config.fallbackProvider ?? 'fallback',
      requestTimeoutMs: config.requestTimeoutMs ?? 30_000,
      maxRetries: config.maxRetries ?? 2,
      onBeforeComplete: config.onBeforeComplete ?? (() => {}),
    };

    // Initialize providers from environment — only register with valid keys
    this.providers = new Map();

    const openaiKey = process.env['OPENAI_API_KEY'];
    if (openaiKey) {
      this.providers.set('openai', new OpenAIProvider(openaiKey));
    }

    const anthropicKey = process.env['ANTHROPIC_API_KEY'];
    if (anthropicKey) {
      this.providers.set('anthropic', new AnthropicProvider(anthropicKey));
    }

    const googleKey = process.env['GOOGLE_API_KEY'];
    if (googleKey) {
      this.providers.set('google', new GoogleProvider(googleKey));
    }

    this.providers.set('fallback', new FallbackProvider());
  }

  async complete(
    systemPrompt: string,
    userPrompt: string | Array<{role: string, content: string}>,
    options: LLMConfig = {},
  ): Promise<{ response: ProviderResponse; requestId: string; provider: string }> {
    const requestId = uuidv4();
    const preferredProvider = options.provider ?? this.config.defaultProvider;

    // Validate that at least one way to reach an AI provider exists
    const hasApiKey = options.apiKey || this.providers.size > 1 || process.env['OPENAI_API_KEY'] || process.env['ANTHROPIC_API_KEY'];
    if (!hasApiKey) {
      throw new Error(
        'No AI provider API key configured. Please add your API key in Settings → AI Provider.',
      );
    }

    // ─── PII Sanitization (Optional) ─────────────────────────────
    let finalUserPrompt = userPrompt;
    if (options.sanitizePII) {
      if (typeof userPrompt === 'string') {
        const { text } = PIISanitizer.sanitize(userPrompt);
        finalUserPrompt = text;
      } else {
        finalUserPrompt = userPrompt.map(m => ({
          ...m,
          content: PIISanitizer.sanitize(m.content).text,
        }));
      }
    }

    // ─── Pre-flight check (e.g. Budget/Quota) ─────────────────────
    if (this.config.onBeforeComplete) {
      await this.config.onBeforeComplete(options);
    }

    const request: ProviderRequest = {
      systemPrompt,
      userPrompt: finalUserPrompt,
      maxTokens: options.maxTokens,
      temperature: options.temperature,
      model: options.model,
      requestId,
      jsonMode: options.jsonMode,
    };

    // If a custom API key is provided, we must use a temporary provider instance
    if (options.apiKey) {
      const tempProvider = this.createTemporaryProvider(preferredProvider, options.apiKey, options.model);
      if (tempProvider) {
        try {
          const response = await this.withTimeout(
            tempProvider.complete(request),
            this.config.requestTimeoutMs,
          );
          return { response, requestId, provider: preferredProvider };
        } catch (err) {
          console.error(`[LLMGateway] Temporary provider ${preferredProvider} failed:`, err);
          // Fall back to platform providers if allowed
        }
      }
    }

    // Try preferred provider, then fallback chain
    const providerOrder = this.buildProviderChain(preferredProvider);

    let lastError: Error | undefined;
    for (const providerName of providerOrder) {
      const provider = this.providers.get(providerName);
      if (!provider || !provider.isAvailable()) continue;

      try {
        const response = await this.withTimeout(
          provider.complete(request),
          this.config.requestTimeoutMs,
        );
        return { response, requestId, provider: providerName };
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        console.error(`[LLMGateway] Provider ${providerName} failed:`, lastError.message);
      }
    }

    throw lastError ?? new Error('All providers failed');
  }

  private createTemporaryProvider(providerName: string, apiKey: string, model?: string): LLMProvider | null {
    switch (providerName) {
      case 'openai':
        return new OpenAIProvider(apiKey, model);
      case 'anthropic':
        return new AnthropicProvider(apiKey, model);
      case 'google':
        return new GoogleProvider(apiKey, model);
      default:
        return null;
    }
  }

  private buildProviderChain(preferred: string): string[] {
    const chain: string[] = [preferred];
    if (this.config.fallbackProvider && !chain.includes(this.config.fallbackProvider)) {
      chain.push(this.config.fallbackProvider);
    }
    if (!chain.includes('fallback')) {
      chain.push('fallback');
    }
    return chain;
  }

  private withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error(`LLM request timed out after ${ms}ms`)),
        ms,
      );
      promise.then(
        (v) => { clearTimeout(timer); resolve(v); },
        (e) => { clearTimeout(timer); reject(e); },
      );
    });
  }
}
