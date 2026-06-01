"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIImageProvider = void 0;
const openai_1 = __importDefault(require("openai"));
class OpenAIImageProvider {
    name = 'openai';
    client;
    model;
    apiKey;
    constructor(apiKey, model = 'dall-e-3') {
        this.apiKey = apiKey;
        this.model = model;
        this.client = new openai_1.default({ apiKey });
    }
    isAvailable() {
        return Boolean(this.apiKey && !this.apiKey.startsWith('sk-mock') && !this.apiKey.includes('mock'));
    }
    getCapabilities() {
        return {
            supportedAspectRatios: ['1:1', '16:9', '9:16'],
            maxResolution: 1792,
            supportsNegativePrompt: false,
        };
    }
    async generate(request) {
        const modelToUse = request.model ?? this.model;
        const quality = request.quality ?? 'standard';
        if (!this.client) {
            throw new Error('OpenAI Image Client not initialized — API key is required');
        }
        const response = await this.client.images.generate({
            model: modelToUse,
            prompt: request.prompt,
            n: request.numberOfImages ?? 1,
            size: this.resolveSize(request.width, request.height),
            quality: quality,
            response_format: 'url',
        });
        const costPerImage = quality === 'hd' ? 8.0 : 4.0;
        if (!response.data || response.data.length === 0) {
            throw new Error('DALL-E returned an empty image payload');
        }
        const images = response.data.map((img) => ({
            url: img.url,
            seed: Math.floor(Math.random() * 1000000),
        }));
        return {
            images,
            costCents: costPerImage * images.length,
            provider: 'openai',
            model: modelToUse,
        };
    }
    resolveSize(w, h) {
        const ratio = w / h;
        if (ratio > 1.2)
            return '1792x1024';
        if (ratio < 0.8)
            return '1024x1792';
        return '1024x1024';
    }
}
exports.OpenAIImageProvider = OpenAIImageProvider;
//# sourceMappingURL=openai-image.js.map