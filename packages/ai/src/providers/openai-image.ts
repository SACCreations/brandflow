import OpenAI from 'openai';
import type { ImageProvider, ImageGenerationRequest, ImageGenerationResponse } from '../image-types';

export class OpenAIImageProvider implements ImageProvider {
  readonly name = 'openai' as const;
  private client: OpenAI;
  private model: string;
  private apiKey: string;

  constructor(apiKey: string, model = 'dall-e-3') {
    this.apiKey = apiKey;
    this.model = model;
    this.client = new OpenAI({ apiKey });
  }

  isAvailable(): boolean {
    return Boolean(this.apiKey && !this.apiKey.startsWith('sk-mock') && !this.apiKey.includes('mock'));
  }

  getCapabilities() {
    return {
      supportedAspectRatios: ['1:1', '16:9', '9:16'],
      maxResolution: 1792,
      supportsNegativePrompt: false,
    };
  }

  async generate(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
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
      style: 'vivid', // 'vivid' produces hyper-real, dramatic poster-quality results vs 'natural' for photography
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

  private resolveSize(w: number, h: number): '1024x1024' | '1792x1024' | '1024x1792' {
    const ratio = w / h;
    if (ratio > 1.2) return '1792x1024';
    if (ratio < 0.8) return '1024x1792';
    return '1024x1024';
  }
}
