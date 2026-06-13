import OpenAI from 'openai';
import type { ImageProvider, ImageGenerationRequest, ImageGenerationResponse } from '../image-types';

export class NvidiaImageProvider implements ImageProvider {
  readonly name = 'nvidia' as const;
  private client: OpenAI;
  private model: string;
  private apiKey: string;

  constructor(apiKey: string, model = 'stabilityai/stable-diffusion-3-medium') {
    this.apiKey = apiKey;
    this.model = model;
    this.client = new OpenAI({ 
      apiKey,
      baseURL: 'https://integrate.api.nvidia.com/v1'
    });
  }

  isAvailable(): boolean {
    return Boolean(this.apiKey && !this.apiKey.startsWith('sk-mock') && !this.apiKey.includes('mock'));
  }

  getCapabilities() {
    return {
      supportedAspectRatios: ['1:1', '16:9', '9:16'],
      maxResolution: 1024,
      supportsNegativePrompt: true,
    };
  }

  async generate(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    const modelToUse = request.model ?? this.model;

    if (!this.client) {
      throw new Error('Nvidia Image Client not initialized — API key is required');
    }

    try {
      const payload: any = {
        model: modelToUse,
        prompt: request.prompt,
        n: request.numberOfImages ?? 1,
        size: '1024x1024',
        response_format: 'b64_json',
      };
      if (request.negativePrompt) {
        // Pass as negative_prompt to the OpenAI wrapper which usually maps it appropriately for NIM SD endpoints
        payload.negative_prompt = request.negativePrompt;
      }

      const response = await this.client.images.generate(payload);

      const costPerImage = 2.0; // Approx cost in cents for NIM SD3 Medium
      if (!response.data || response.data.length === 0) {
        throw new Error('NVIDIA NIM returned an empty image payload');
      }
      
      const images = response.data.map((img) => {
        if (!img.b64_json && !img.url) {
          throw new Error('NVIDIA NIM returned invalid image format');
        }
        return {
          url: img.url,
          base64: img.b64_json,
          seed: Math.floor(Math.random() * 1000000),
        };
      });

      return {
        images,
        costCents: costPerImage * images.length,
        provider: 'nvidia',
        model: modelToUse,
      };
    } catch (err: any) {
      console.error('[NvidiaImageProvider] Generation failed:', err);
      throw err;
    }
  }
}
