"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMGateway = void 0;
const uuid_1 = require("uuid");
const anthropic_1 = require("./providers/anthropic");
const fallback_1 = require("./providers/fallback");
const openai_1 = require("./providers/openai");
const google_1 = require("./providers/google");
const nvidia_1 = require("./providers/nvidia");
const sanitizer_1 = require("./sanitizer");
/** Errors that indicate we should fall through to the next provider rather than fail immediately. */
const FALLTHROUGH_STATUS_CODES = new Set([429, 502, 503, 504]);
function isRateLimitOrUnavailable(err) {
    if (!err || typeof err !== 'object')
        return false;
    const status = err.status ?? err.statusCode;
    if (typeof status === 'number' && FALLTHROUGH_STATUS_CODES.has(status))
        return true;
    const msg = err.message ?? '';
    return /rate.?limit|429|too many requests|quota|overloaded|capacity/i.test(msg);
}
/** Wait for `ms` milliseconds. */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
class LLMGateway {
    providers;
    config;
    constructor(config) {
        this.config = {
            defaultProvider: config.defaultProvider,
            fallbackProvider: config.fallbackProvider ?? 'fallback',
            requestTimeoutMs: config.requestTimeoutMs ?? 30_000,
            maxRetries: config.maxRetries ?? 2,
            onBeforeComplete: config.onBeforeComplete ?? (() => { }),
        };
        // Initialize providers from environment — only register with valid keys
        this.providers = new Map();
        const openaiKey = process.env['OPENAI_API_KEY'];
        if (openaiKey) {
            this.providers.set('openai', new openai_1.OpenAIProvider(openaiKey));
        }
        const anthropicKey = process.env['ANTHROPIC_API_KEY'];
        if (anthropicKey) {
            this.providers.set('anthropic', new anthropic_1.AnthropicProvider(anthropicKey));
        }
        const googleKey = process.env['GOOGLE_API_KEY'];
        if (googleKey) {
            this.providers.set('google', new google_1.GoogleProvider(googleKey));
        }
        const nvidiaKey = process.env['NVIDIA_API_KEY'];
        if (nvidiaKey) {
            this.providers.set('nvidia', new nvidia_1.NvidiaProvider(nvidiaKey));
        }
        this.providers.set('fallback', new fallback_1.FallbackProvider());
    }
    async complete(systemPrompt, userPrompt, options = {}) {
        const requestId = (0, uuid_1.v4)();
        const preferredProvider = options.provider ?? this.config.defaultProvider;
        // Validate that at least one way to reach an AI provider exists
        const hasApiKey = options.apiKey || this.providers.size > 1 || process.env['OPENAI_API_KEY'] || process.env['ANTHROPIC_API_KEY'] || process.env['NVIDIA_API_KEY'];
        if (!hasApiKey) {
            throw new Error('No AI provider API key configured. Please add your API key in Settings → AI Provider.');
        }
        // ─── PII Sanitization (Optional) ─────────────────────────────
        let finalUserPrompt = userPrompt;
        if (options.sanitizePII) {
            if (typeof userPrompt === 'string') {
                const { text } = sanitizer_1.PIISanitizer.sanitize(userPrompt);
                finalUserPrompt = text;
            }
            else {
                finalUserPrompt = userPrompt.map(m => {
                    if (typeof m.content === 'string') {
                        return { ...m, content: sanitizer_1.PIISanitizer.sanitize(m.content).text };
                    }
                    else {
                        // Complex multimodal content - sanitize only text parts
                        return {
                            ...m,
                            content: m.content.map(part => {
                                if (part.type === 'text' && part.text) {
                                    return { ...part, text: sanitizer_1.PIISanitizer.sanitize(part.text).text };
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
        const request = {
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
        let tempProvider = null;
        if (options.apiKey) {
            tempProvider = this.createTemporaryProvider(preferredProvider, options.apiKey, options.model);
        }
        let lastError;
        // ─── Try the custom-key provider first ────────────────────────
        if (tempProvider) {
            try {
                const response = await this.withTimeout(tempProvider.complete(request), this.config.requestTimeoutMs);
                return { response, requestId, provider: preferredProvider };
            }
            catch (err) {
                lastError = err instanceof Error ? err : new Error(String(err));
                const shouldFallThrough = isRateLimitOrUnavailable(err);
                console.warn(`[LLMGateway] Custom-key provider ${preferredProvider} failed (${lastError.message}).`, shouldFallThrough ? 'Falling through to env-configured providers.' : 'Not retrying (non-transient error).');
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
            if (options.apiKey && providerName === preferredProvider)
                continue;
            const provider = this.providers.get(providerName);
            if (!provider || !provider.isAvailable())
                continue;
            try {
                const response = await this.withTimeout(provider.complete(request), this.config.requestTimeoutMs);
                console.log(`[LLMGateway] Used fallback provider: ${providerName}`);
                return { response, requestId, provider: providerName };
            }
            catch (err) {
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
        throw new Error(isRateLimit
            ? `AI provider rate limit reached (429). Please wait a moment and try again, or switch to a different provider in Settings → AI Provider. (${finalMessage})`
            : `All AI providers failed: ${finalMessage}`);
    }
    createTemporaryProvider(providerName, apiKey, model) {
        switch (providerName) {
            case 'openai':
                return new openai_1.OpenAIProvider(apiKey, model);
            case 'anthropic':
                return new anthropic_1.AnthropicProvider(apiKey, model);
            case 'google':
                return new google_1.GoogleProvider(apiKey, model);
            case 'nvidia':
                return new nvidia_1.NvidiaProvider(apiKey, model);
            default:
                return null;
        }
    }
    buildProviderChain(preferred) {
        const chain = [preferred];
        if (this.config.fallbackProvider && !chain.includes(this.config.fallbackProvider)) {
            chain.push(this.config.fallbackProvider);
        }
        if (!chain.includes('fallback')) {
            chain.push('fallback');
        }
        return chain;
    }
    withTimeout(promise, ms) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error(`LLM request timed out after ${ms}ms`)), ms);
            promise.then((v) => { clearTimeout(timer); resolve(v); }, (e) => { clearTimeout(timer); reject(e); });
        });
    }
}
exports.LLMGateway = LLMGateway;
//# sourceMappingURL=gateway.js.map