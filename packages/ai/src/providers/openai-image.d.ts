import type { ImageProvider, ImageGenerationRequest, ImageGenerationResponse } from '../image-types';
export declare class OpenAIImageProvider implements ImageProvider {
    readonly name: "openai";
    private client;
    private model;
    private apiKey;
    constructor(apiKey: string, model?: string);
    isAvailable(): boolean;
    getCapabilities(): {
        supportedAspectRatios: string[];
        maxResolution: number;
        supportsNegativePrompt: boolean;
    };
    generate(request: ImageGenerationRequest): Promise<ImageGenerationResponse>;
    private resolveSize;
}
//# sourceMappingURL=openai-image.d.ts.map