"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMGateway = void 0;
const uuid_1 = require("uuid");
const anthropic_1 = require("./providers/anthropic");
const fallback_1 = require("./providers/fallback");
const openai_1 = require("./providers/openai");
class LLMGateway {
    providers;
    config;
    constructor(config) {
        this.config = {
            defaultProvider: config.defaultProvider,
            fallbackProvider: config.fallbackProvider ?? 'fallback',
            requestTimeoutMs: config.requestTimeoutMs ?? 30_000,
            maxRetries: config.maxRetries ?? 2,
        };
        // Initialize providers from environment
        this.providers = new Map();
        const openaiKey = process.env['OPENAI_API_KEY'];
        if (openaiKey) {
            this.providers.set('openai', new openai_1.OpenAIProvider(openaiKey));
        }
        const anthropicKey = process.env['ANTHROPIC_API_KEY'];
        if (anthropicKey) {
            this.providers.set('anthropic', new anthropic_1.AnthropicProvider(anthropicKey));
        }
        this.providers.set('fallback', new fallback_1.FallbackProvider());
    }
    async complete(systemPrompt, userPrompt, options = {}) {
        const requestId = (0, uuid_1.v4)();
        const preferredProvider = options.provider ?? this.config.defaultProvider;
        const request = {
            systemPrompt,
            userPrompt,
            maxTokens: options.maxTokens,
            temperature: options.temperature,
            requestId,
        };
        // Try preferred provider, then fallback chain
        const providerOrder = this.buildProviderChain(preferredProvider);
        let lastError;
        for (const providerName of providerOrder) {
            const provider = this.providers.get(providerName);
            if (!provider || !provider.isAvailable())
                continue;
            try {
                const response = await this.withTimeout(provider.complete(request), this.config.requestTimeoutMs);
                return { response, requestId, provider: providerName };
            }
            catch (err) {
                lastError = err instanceof Error ? err : new Error(String(err));
                // Log and try next provider
                console.error(`[LLMGateway] Provider ${providerName} failed:`, lastError.message);
            }
        }
        throw lastError ?? new Error('All providers failed');
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