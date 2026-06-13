export type ImageProviderName = 'openai' | 'flux' | 'stability' | 'mock';

export interface ImageGenerationRequest {
  prompt: string;
  negativePrompt?: string;
  width: number;
  height: number;
  numberOfImages?: number;
  quality?: 'standard' | 'hd';
  /** Visual style preset passed to providers that support it */
  style?: string;
  businessId: string;
  model?: string;
  /** Brand-aware poster context — used by DALL-E style parameter and prompt prefix validation */
  posterContext?: {
    primaryColor?: string;
    secondaryColor?: string;
    category?: string;
    platform?: string;
    isPoster?: boolean;
  };
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
