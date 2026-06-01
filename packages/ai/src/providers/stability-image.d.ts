import type { ImageProvider, ImageGenerationRequest, ImageGenerationResponse } from '../image-types';
export declare class StabilityImageProvider implements ImageProvider {
    readonly name: "stability";
    private apiKey;
    private model;
    constructor(apiKey: string, model?: string);
    isAvailable(): boolean;
    getCapabilities(): {
        supportedAspectRatios: string[];
        maxResolution: number;
        supportsNegativePrompt: boolean;
    };
    generate(request: ImageGenerationRequest): Promise<ImageGenerationResponse>;
}
//# sourceMappingURL=stability-image.d.ts.map