import type { ImageProvider, ImageGenerationRequest, ImageGenerationResponse } from '../image-types';

export class StabilityImageProvider implements ImageProvider {
  readonly name = 'stability' as const;
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model = 'stable-diffusion-xl-1024-v1-0') {
    this.apiKey = apiKey;
    this.model = model;
  }

  isAvailable(): boolean {
    return Boolean(this.apiKey && !this.apiKey.startsWith('sk-mock-disabled'));
  }

  getCapabilities() {
    return {
      supportedAspectRatios: ['1:1', '16:9', '2:3', '3:2', '4:5', '5:4', '9:16'],
      maxResolution: 1536,
      supportsNegativePrompt: true,
    };
  }

  async generate(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    const isMock = this.apiKey.startsWith('sk-mock') || !this.apiKey;
    const modelToUse = request.model ?? this.model;

    if (isMock) {
      const mockImages = [
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1600132806370-bf17e65e942f?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=80'
      ];
      
      const seed = Math.floor(Math.random() * 1000);
      const url = mockImages[(seed + 1) % mockImages.length];

      return {
        images: [{ url, seed }],
        costCents: 3.0,
        provider: 'stability',
        model: `${modelToUse}-mock`,
      };
    }

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

    const data = (await res.json()) as { artifacts: Array<{ base64: string; seed: number }> };
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
