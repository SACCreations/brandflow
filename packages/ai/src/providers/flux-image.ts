import type { ImageProvider, ImageGenerationRequest, ImageGenerationResponse } from '../image-types';

/**
 * FLUX.1-dev Provider via Black Forest Labs (BFL) API
 * API Docs: https://docs.bfl.ai/
 *
 * Uses async polling pattern: submit → poll for result.
 * FLUX produces exceptionally high-quality marketing creatives and posters.
 */
export class FluxImageProvider implements ImageProvider {
  readonly name = 'flux' as const;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  isAvailable(): boolean {
    return Boolean(this.apiKey && !this.apiKey.includes('mock') && !this.apiKey.startsWith('test'));
  }

  getCapabilities() {
    return {
      supportedAspectRatios: ['1:1', '16:9', '9:16', '4:5', '3:4', '2:3', '21:9', '4:3'],
      maxResolution: 1440,
      supportsNegativePrompt: false, // FLUX.1-dev uses prompt guidance, not negative prompts
    };
  }

  async generate(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    const width  = this.snapToFluxDimension(request.width);
    const height = this.snapToFluxDimension(request.height);

    // Step 1: Submit generation request
    const submitRes = await fetch('https://api.bfl.ai/v1/flux-dev', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Key': this.apiKey,
      },
      body: JSON.stringify({
        prompt: request.prompt,
        width,
        height,
        steps: 28,
        guidance: 3.5,
        seed: Math.floor(Math.random() * 999999),
        safety_tolerance: 2,
        output_format: 'jpeg',
        prompt_upsampling: false,
      }),
    });

    if (!submitRes.ok) {
      const errText = await submitRes.text();
      throw new Error(`FLUX.1-dev submit failed [${submitRes.status}]: ${errText}`);
    }

    const { id } = (await submitRes.json()) as { id: string };

    // Step 2: Poll for the result
    const imageUrl = await this.pollForResult(id);

    return {
      images: [{ url: imageUrl, seed: Math.floor(Math.random() * 999999) }],
      costCents: 3.5, // approx $0.035 per generation
      provider: 'flux',
      model: 'flux-dev',
    };
  }

  private async pollForResult(requestId: string, maxAttempts = 40): Promise<string> {
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(r => setTimeout(r, 2000)); // 2 second polling interval

      const res = await fetch(`https://api.bfl.ai/v1/get_result?id=${requestId}`, {
        headers: { 'X-Key': this.apiKey },
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`FLUX polling failed [${res.status}]: ${errText}`);
      }

      const data = (await res.json()) as {
        status: 'Pending' | 'Processing' | 'Ready' | 'Failed' | 'Error' | 'Content Moderated' | 'Request Moderated';
        result?: { sample: string };
      };

      if (data.status === 'Ready' && data.result?.sample) {
        return data.result.sample;
      }

      if (data.status === 'Failed' || data.status === 'Error') {
        throw new Error(`FLUX generation failed with status: ${data.status}`);
      }

      if (data.status === 'Content Moderated' || data.status === 'Request Moderated') {
        throw new Error('FLUX generation blocked by content policy. Adjust the image prompt.');
      }
    }

    throw new Error('FLUX generation timed out after maximum polling attempts');
  }

  /**
   * FLUX requires dimensions divisible by 32, min 256, max 1440
   */
  private snapToFluxDimension(value: number): number {
    const snapped = Math.round(value / 32) * 32;
    return Math.min(1440, Math.max(256, snapped));
  }
}
