"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StabilityImageProvider = void 0;
class StabilityImageProvider {
    name = 'stability';
    apiKey;
    model;
    constructor(apiKey, model = 'stable-diffusion-xl-1024-v1-0') {
        this.apiKey = apiKey;
        this.model = model;
    }
    isAvailable() {
        return Boolean(this.apiKey && !this.apiKey.startsWith('sk-mock') && !this.apiKey.includes('mock'));
    }
    getCapabilities() {
        return {
            supportedAspectRatios: ['1:1', '16:9', '2:3', '3:2', '4:5', '5:4', '9:16'],
            maxResolution: 1536,
            supportsNegativePrompt: true,
        };
    }
    async generate(request) {
        const modelToUse = request.model ?? this.model;
        const url = `https://api.stability.ai/v1/generation/${modelToUse}/text-to-image`;
        const body = {
            text_prompts: [
                { text: request.prompt, weight: 1.0 },
                ...(request.negativePrompt ? [{ text: request.negativePrompt, weight: -1.0 }] : [])
            ],
            width: request.width,
            height: request.height,
            steps: 30,
            samples: request.numberOfImages ?? 1,
        };
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                Authorization: `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`Stability AI generation failed [${res.status}]: ${errText}`);
        }
        const data = (await res.json());
        const images = data.artifacts.map((art) => ({
            base64: art.base64,
            seed: art.seed,
        }));
        return {
            images,
            costCents: 3.0 * images.length,
            provider: 'stability',
            model: modelToUse,
        };
    }
}
exports.StabilityImageProvider = StabilityImageProvider;
//# sourceMappingURL=stability-image.js.map