import { v4 as uuidv4 } from 'uuid';
import type { GatewayConfig, LLMProvider, ProviderRequest, ProviderResponse, LLMConfig } from './types';
import { AnthropicProvider } from './providers/anthropic';
import { FallbackProvider } from './providers/fallback';
import { OpenAIProvider } from './providers/openai';
import { GoogleProvider } from './providers/google';
import { NvidiaProvider } from './providers/nvidia';
import { PIISanitizer } from './sanitizer';

/** Errors that indicate we should fall through to the next provider rather than fail immediately. */
const FALLTHROUGH_STATUS_CODES = new Set([429, 502, 503, 504]);

function isRateLimitOrUnavailable(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const status = (err as any).status ?? (err as any).statusCode;
  if (typeof status === 'number' && FALLTHROUGH_STATUS_CODES.has(status)) return true;
  const msg = (err as any).message ?? '';
  return /rate.?limit|429|too many requests|quota|overloaded|capacity/i.test(msg);
}

/** Wait for `ms` milliseconds. */
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

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

    const nvidiaKey = process.env['NVIDIA_API_KEY'];
    if (nvidiaKey) {
      this.providers.set('nvidia', new NvidiaProvider(nvidiaKey));
    }

    this.providers.set('fallback', new FallbackProvider());
  }

  async complete(
    systemPrompt: string,
    userPrompt: string | Array<{role: string, content: import('./types').MultimodalContent}>,
    options: LLMConfig = {},
  ): Promise<{ response: ProviderResponse; requestId: string; provider: string }> {
    const requestId = uuidv4();
    const preferredProvider = options.provider ?? this.config.defaultProvider;

    // Validate that at least one way to reach an AI provider exists
    const hasApiKey = options.apiKey || this.providers.size > 1 || process.env['OPENAI_API_KEY'] || process.env['ANTHROPIC_API_KEY'] || process.env['NVIDIA_API_KEY'];
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
        finalUserPrompt = userPrompt.map(m => {
          if (typeof m.content === 'string') {
            return { ...m, content: PIISanitizer.sanitize(m.content).text };
          } else {
            // Complex multimodal content - sanitize only text parts
            return {
              ...m,
              content: m.content.map(part => {
                if (part.type === 'text' && part.text) {
                  return { ...part, text: PIISanitizer.sanitize(part.text).text };
                }
                return part;
              })
            };
          }
        });
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

    // ─── Build the ordered list of providers to try ──────────────
    // When a custom API key is provided, start with that provider.
    // On rate-limit (429) or unavailability, fall through to env-configured providers.
    const providerOrder = this.buildProviderChain(preferredProvider);

    // Prepend the custom-key temporary provider as the first candidate
    let tempProvider: LLMProvider | null = null;
    if (options.apiKey) {
      const temp = this.createTemporaryProvider(preferredProvider, options.apiKey, options.model);
      if (temp && temp.isAvailable()) {
        tempProvider = temp;
      }
    }

    let lastError: Error | undefined;

    // ─── Try the custom-key provider first ────────────────────────
    if (tempProvider) {
      try {
        const response = await this.withTimeout(
          tempProvider.complete(request),
          this.config.requestTimeoutMs,
        );
        return { response, requestId, provider: preferredProvider };
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        const shouldFallThrough = isRateLimitOrUnavailable(err);
        console.warn(
          `[LLMGateway] Custom-key provider ${preferredProvider} failed (${lastError.message}).`,
          shouldFallThrough ? 'Falling through to env-configured providers.' : 'Not retrying (non-transient error).',
        );

        // For non-transient errors (invalid key, bad request, etc.) throw immediately
        // so the user sees the actual problem.  For rate limits / server errors, fall through.
        if (!shouldFallThrough) {
          throw lastError;
        }
        // Add a short back-off before hitting the next provider
        await sleep(1500);
      }
    }

    // ─── Try env-configured provider chain ────────────────────────
    for (const providerName of providerOrder) {
      // Skip the preferred provider if we already tried it via the temp instance above
      if (options.apiKey && providerName === preferredProvider) continue;

      const provider = this.providers.get(providerName);
      if (!provider || !provider.isAvailable()) continue;

      try {
        const response = await this.withTimeout(
          provider.complete(request),
          this.config.requestTimeoutMs,
        );
        console.log(`[LLMGateway] Used fallback provider: ${providerName}`);
        return { response, requestId, provider: providerName };
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        console.error(`[LLMGateway] Provider ${providerName} failed:`, lastError.message);

        // Rate-limit on this provider too — small back-off before next
        if (isRateLimitOrUnavailable(err)) {
          await sleep(1000);
        }
      }
    }

    // All providers exhausted
    const finalMessage = lastError?.message ?? 'All AI providers failed.';
    const isRateLimit = isRateLimitOrUnavailable(lastError);
    throw new Error(
      isRateLimit
        ? `AI provider rate limit reached (429). Please wait a moment and try again, or switch to a different provider in Settings → AI Provider. (${finalMessage})`
        : `All AI providers failed: ${finalMessage}`,
    );
  }

  private createTemporaryProvider(providerName: string, apiKey: string, model?: string): LLMProvider | null {
    switch (providerName) {
      case 'openai':
        return new OpenAIProvider(apiKey, model);
      case 'anthropic':
        return new AnthropicProvider(apiKey, model);
      case 'google':
        return new GoogleProvider(apiKey, model);
      case 'nvidia':
        return new NvidiaProvider(apiKey, model);
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
