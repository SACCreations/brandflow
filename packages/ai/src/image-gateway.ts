import { OpenAIImageProvider } from './providers/openai-image';
import { StabilityImageProvider } from './providers/stability-image';
import type { 
  ImageProvider, 
  ImageGenerationRequest, 
  ImageGenerationResponse, 
  ImageGatewayConfig 
} from './image-types';

export class ImageGateway {
  private providers: Map<string, ImageProvider> = new Map();
  private config: Required<ImageGatewayConfig>;

  constructor(config: ImageGatewayConfig = { defaultProvider: 'stability' }) {
    this.config = {
      defaultProvider: config.defaultProvider,
      fallbackProvider: config.fallbackProvider ?? 'openai',
      requestTimeoutMs: config.requestTimeoutMs ?? 45_000,
      maxRetries: config.maxRetries ?? 2,
    };

    const stabilityKey = process.env['STABILITY_API_KEY'] || 'sk-mock-stability-key';
    this.providers.set('stability', new StabilityImageProvider(stabilityKey));

    const openaiKey = process.env['OPENAI_API_KEY'] || 'sk-mock-openai-key';
    this.providers.set('openai', new OpenAIImageProvider(openaiKey));
  }

  async generate(
    preferredProvider: string | undefined,
    request: ImageGenerationRequest
  ): Promise<ImageGenerationResponse> {
    const providerName = preferredProvider ?? this.config.defaultProvider;
    const providerOrder = this.buildProviderChain(providerName);

    let lastError: Error | undefined;

    for (const name of providerOrder) {
      const provider = this.providers.get(name);
      if (!provider || !provider.isAvailable()) {
        continue;
      }

      try {
        console.log(`[ImageGateway] Invoking image generation with provider: ${name}`);
        const response = await this.withTimeout(
          provider.generate(request),
          this.config.requestTimeoutMs
        );
        return response;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        console.error(`[ImageGateway] Provider ${name} failed:`, lastError.message);
      }
    }

    throw lastError ?? new Error('All image generators in fallback chain failed');
  }

  private buildProviderChain(preferred: string): string[] {
    const chain = [preferred];
    if (this.config.fallbackProvider && !chain.includes(this.config.fallbackProvider)) {
      chain.push(this.config.fallbackProvider);
    }
    for (const name of this.providers.keys()) {
      if (!chain.includes(name)) {
        chain.push(name);
      }
    }
    return chain;
  }

  private withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error(`Image generation request timed out after ${ms}ms`)),
        ms
      );
      promise.then(
        (v) => {
          clearTimeout(timer);
          resolve(v);
        },
        (e) => {
          clearTimeout(timer);
          reject(e);
        }
      );
    });
  }
}
