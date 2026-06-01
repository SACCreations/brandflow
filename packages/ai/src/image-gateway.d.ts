import type { ImageGenerationRequest, ImageGenerationResponse, ImageGatewayConfig } from './image-types';
export declare class ImageGateway {
    private providers;
    private config;
    constructor(config?: ImageGatewayConfig);
    generate(preferredProvider: string | undefined, request: ImageGenerationRequest): Promise<ImageGenerationResponse>;
    private buildProviderChain;
    private withTimeout;
}
//# sourceMappingURL=image-gateway.d.ts.map