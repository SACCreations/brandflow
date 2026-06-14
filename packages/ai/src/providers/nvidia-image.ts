import OpenAI from 'openai';
import type { ImageProvider, ImageGenerationRequest, ImageGenerationResponse } from '../image-types';

export class NvidiaImageProvider implements ImageProvider {
  readonly name = 'nvidia' as const;
  private client: OpenAI;
  private model: string;
  private apiKey: string;

  constructor(apiKey: string, model = 'black-forest-labs/flux.2-klein-4b') {
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
      supportsNegativePrompt: false, // FLUX.2-klein-4b does not support negative prompts
    };
  }

  async generate(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    const modelToUse = request.model ?? this.model;

    if (!this.apiKey) {
      throw new Error('Nvidia API key is required');
    }

    try {
      const width = request.width ?? 1024;
      const height = request.height ?? 1024;

      const payload: any = {
        prompt: request.prompt,
        seed: 0,
        steps: 4,
        width,
        height,
        samples: request.numberOfImages ?? 1,
      };

      const response = await fetch(`https://ai.api.nvidia.com/v1/genai/${modelToUse}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`NVIDIA NIM generation failed [${response.status}]: ${errText}`);
      }

      const data = (await response.json()) as any;

      if (!data.artifacts || data.artifacts.length === 0) {
        throw new Error('NVIDIA NIM returned an empty image payload');
      }
      
      const images = data.artifacts.map((art: any) => {
        const base64Data = art.base64 || art.blob;
        if (!base64Data) {
          throw new Error('NVIDIA NIM returned invalid image format');
        }
        return {
          base64: base64Data,
          seed: data.seed ?? Math.floor(Math.random() * 1000000),
        };
      });

      const costPerImage = 2.0; // Approx cost in cents for NIM FLUX.2-klein-4b
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

