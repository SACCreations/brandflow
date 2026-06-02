import type { ImageProvider, ImageGenerationRequest, ImageGenerationResponse } from '../image-types';

export class MockImageProvider implements ImageProvider {
  readonly name = 'mock' as const;

  isAvailable(): boolean {
    return true; // Always available as a local fallback
  }

  getCapabilities() {
    return {
      supportedAspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:2'],
      maxResolution: 2048,
      supportsNegativePrompt: true,
    };
  }

  async generate(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    const promptLower = request.prompt.toLowerCase();
    
    // Curated list of premium, gorgeous Unsplash images
    const images = {
      workspace: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1080&auto=format&fit=crop&q=80',
      marketing: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1080&auto=format&fit=crop&q=80',
      cyberpunk: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1080&auto=format&fit=crop&q=80',
      tech: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1080&auto=format&fit=crop&q=80',
      architecture: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1080&auto=format&fit=crop&q=80',
      product: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1080&auto=format&fit=crop&q=80',
      abstract: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1080&auto=format&fit=crop&q=80',
    };

    let selectedUrl = images.abstract;

    if (promptLower.includes('work') || promptLower.includes('office') || promptLower.includes('desk') || promptLower.includes('team')) {
      selectedUrl = images.workspace;
    } else if (promptLower.includes('marketing') || promptLower.includes('ad') || promptLower.includes('growth') || promptLower.includes('sale')) {
      selectedUrl = images.marketing;
    } else if (promptLower.includes('cyberpunk') || promptLower.includes('neon') || promptLower.includes('futuristic')) {
      selectedUrl = images.cyberpunk;
    } else if (promptLower.includes('tech') || promptLower.includes('code') || promptLower.includes('software') || promptLower.includes('ai') || promptLower.includes('digital')) {
      selectedUrl = images.tech;
    } else if (promptLower.includes('building') || promptLower.includes('interior') || promptLower.includes('architect') || promptLower.includes('room')) {
      selectedUrl = images.architecture;
    } else if (promptLower.includes('product') || promptLower.includes('gadget') || promptLower.includes('device') || promptLower.includes('mockup')) {
      selectedUrl = images.product;
    }

    // Delay a bit to simulate real generation
    await new Promise((resolve) => setTimeout(resolve, 2000));

    return {
      images: [
        {
          url: selectedUrl,
          seed: Math.floor(Math.random() * 1000000),
        },
      ],
      costCents: 0,
      provider: 'mock',
      model: 'mock-generator-v1',
    };
  }
}
