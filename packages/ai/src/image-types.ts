export interface ImageGenerationRequest {
  prompt: string;
  negativePrompt?: string;
  width: number;
  height: number;
  numberOfImages?: number;
  quality?: 'standard' | 'hd';
  style?: string; // e.g. 'photorealistic', 'minimalist', 'cyberpunk', 'luxury', 'futuristic'
  businessId: string;
  model?: string;
}

export interface ImageGenerationResponse {
  images: Array<{
    base64?: string;
    url?: string;
    seed?: number;
  }>;
  costCents: number;
  provider: string;
  model: string;
}

export interface ImageProvider {
  readonly name: string;
  generate(request: ImageGenerationRequest): Promise<ImageGenerationResponse>;
  isAvailable(): boolean;
  getCapabilities(): {
    supportedAspectRatios: string[];
    maxResolution: number;
    supportsNegativePrompt: boolean;
  };
}

export interface ImageGatewayConfig {
  defaultProvider: string;
  fallbackProvider?: string;
  requestTimeoutMs?: number;
  maxRetries?: number;
}
