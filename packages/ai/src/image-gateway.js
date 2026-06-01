"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageGateway = void 0;
const openai_image_1 = require("./providers/openai-image");
const stability_image_1 = require("./providers/stability-image");
class ImageGateway {
    providers = new Map();
    config;
    constructor(config = { defaultProvider: 'stability' }) {
        this.config = {
            defaultProvider: config.defaultProvider,
            fallbackProvider: config.fallbackProvider ?? 'openai',
            requestTimeoutMs: config.requestTimeoutMs ?? 45_000,
            maxRetries: config.maxRetries ?? 2,
        };
        const stabilityKey = process.env['STABILITY_API_KEY'];
        if (stabilityKey && !stabilityKey.includes('mock')) {
            this.providers.set('stability', new stability_image_1.StabilityImageProvider(stabilityKey));
        }
        const openaiKey = process.env['OPENAI_API_KEY'];
        if (openaiKey && !openaiKey.startsWith('sk-mock') && !openaiKey.includes('mock')) {
            this.providers.set('openai', new openai_image_1.OpenAIImageProvider(openaiKey));
        }
    }
    async generate(preferredProvider, request) {
        const providerName = preferredProvider ?? this.config.defaultProvider;
        const providerOrder = this.buildProviderChain(providerName);
        let lastError;
        for (const name of providerOrder) {
            const provider = this.providers.get(name);
            if (!provider || !provider.isAvailable()) {
                continue;
            }
            try {
                console.log(`[ImageGateway] Invoking image generation with provider: ${name}`);
                const response = await this.withTimeout(provider.generate(request), this.config.requestTimeoutMs);
                return response;
            }
            catch (err) {
                lastError = err instanceof Error ? err : new Error(String(err));
                console.error(`[ImageGateway] Provider ${name} failed:`, lastError.message);
            }
        }
        throw lastError ?? new Error('All image generators in fallback chain failed');
    }
    buildProviderChain(preferred) {
        const chain = [preferred];
        if (this.config.fallbackProvider && !chain.includes(this.config.fallbackProvider)) {
            chain.push(this.config.fallbackProvider);
        }
        for (const name of this.providers.keys()) {
            if (!chain.includes(name)) {
                chain.push(name);
            }
        }
        return chain;
    }
    withTimeout(promise, ms) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error(`Image generation request timed out after ${ms}ms`)), ms);
            promise.then((v) => {
                clearTimeout(timer);
                resolve(v);
            }, (e) => {
                clearTimeout(timer);
                reject(e);
            });
        });
    }
}
exports.ImageGateway = ImageGateway;
//# sourceMappingURL=image-gateway.js.map