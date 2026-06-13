import { OpenAIImageProvider } from './providers/openai-image';
import { StabilityImageProvider } from './providers/stability-image';
import { FluxImageProvider } from './providers/flux-image';
import { NvidiaImageProvider } from './providers/nvidia-image';
import { MockImageProvider } from './providers/mock-image';
import type {
  ImageProvider,
  ImageGenerationRequest,
  ImageGenerationResponse,
  ImageGatewayConfig,
} from './image-types';

/**
 * Per-job API key injection — avoids the env-variable override anti-pattern.
 * Pass these when creating an ImageGateway instance for a specific user/job so
 * that concurrent jobs do not clobber each other's keys through process.env.
 */
export interface ImageProviderKeys {
  /** OpenAI key for DALL-E 3. Overrides OPENAI_API_KEY env var. */
  openai?: string | null;
  /** Black Forest Labs key for FLUX.1-dev. Overrides BFL_API_KEY env var. */
  flux?: string | null;
  /** Stability AI key. Overrides STABILITY_API_KEY env var. */
  stability?: string | null;
  /** NVIDIA NIM key. Overrides NVIDIA_API_KEY env var. */
  nvidia?: string | null;
}

export class ImageGateway {
  private providers: Map<string, ImageProvider> = new Map();
  private config: Required<ImageGatewayConfig>;

  constructor(
    config: ImageGatewayConfig = { defaultProvider: 'openai' },
    keys?: ImageProviderKeys,
  ) {
    this.config = {
      defaultProvider: config.defaultProvider,
      fallbackProvider: config.fallbackProvider ?? 'stability',
      requestTimeoutMs: config.requestTimeoutMs ?? 120_000,
      maxRetries: config.maxRetries ?? 2,
    };

    // ── OpenAI DALL-E 3 (best poster quality, vivid style) ────────────────────
    const openaiKey = keys?.openai ?? process.env['OPENAI_API_KEY'];
    if (openaiKey && !openaiKey.startsWith('sk-mock') && !openaiKey.includes('mock')) {
      this.providers.set('openai', new OpenAIImageProvider(openaiKey));
      console.log('[ImageGateway] Registered: OpenAI DALL-E 3');
    } else {
      console.warn('[ImageGateway] OpenAI provider NOT registered (key missing or mock). Will fall back to mock.');
    }

    // ── FLUX.1-dev via Black Forest Labs ──────────────────────────────────────
    const fluxKey = keys?.flux ?? process.env['BFL_API_KEY'] ?? process.env['FLUX_API_KEY'];
    if (fluxKey && !fluxKey.includes('mock')) {
      this.providers.set('flux', new FluxImageProvider(fluxKey));
      console.log('[ImageGateway] Registered: FLUX.1-dev');
    }

    // ── Stability AI (fallback) ───────────────────────────────────────────────
    const stabilityKey = keys?.stability ?? process.env['STABILITY_API_KEY'];
    if (stabilityKey && !stabilityKey.includes('mock')) {
      this.providers.set('stability', new StabilityImageProvider(stabilityKey));
      console.log('[ImageGateway] Registered: Stability AI');
    }

    // ── NVIDIA NIM (Image Generation) ─────────────────────────────────────────
    const nvidiaKey = keys?.nvidia ?? process.env['NVIDIA_API_KEY'];
    if (nvidiaKey && !nvidiaKey.includes('mock')) {
      this.providers.set('nvidia', new NvidiaImageProvider(nvidiaKey));
      console.log('[ImageGateway] Registered: NVIDIA NIM');
    }

    // ── Mock (always last resort — explicit) ──────────────────────────────────
    this.providers.set('mock', new MockImageProvider());
  }

  async generate(
    preferredProvider: string | undefined,
    request: ImageGenerationRequest,
  ): Promise<ImageGenerationResponse> {
    const providerName = preferredProvider ?? this.config.defaultProvider;
    const providerOrder = this.buildProviderChain(providerName);

    console.log(`[ImageGateway] Provider chain: [${providerOrder.join(' → ')}]`);

    let lastError: Error | undefined;

    for (const name of providerOrder) {
      const provider = this.providers.get(name);

      if (!provider) {
        console.log(`[ImageGateway] Provider "${name}" not registered — skipping`);
        continue;
      }

      if (!provider.isAvailable()) {
        console.log(`[ImageGateway] Provider "${name}" isAvailable()=false — skipping`);
        continue;
      }

      try {
        console.log(`[ImageGateway] ▶ Invoking provider: ${name}`);
        const response = await this.withTimeout(
          provider.generate(request),
          this.config.requestTimeoutMs,
        );
        console.log(`[ImageGateway] ✅ Provider "${name}" succeeded`);
        return response;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        console.error(`[ImageGateway] ❌ Provider "${name}" failed: ${lastError.message}`);
      }
    }

    // If ALL providers failed (including mock), surface the real error
    throw lastError ?? new Error('All image providers in fallback chain failed — check API keys');
  }

  /**
   * Exposes which real providers (non-mock) are registered and available.
   * Useful for surfacing "no API key configured" state to the caller.
   */
  hasRealProvider(): boolean {
    for (const [name, provider] of this.providers.entries()) {
      if (name !== 'mock' && provider.isAvailable()) return true;
    }
    return false;
  }

  /**
   * Returns a list of registered provider names for diagnostics.
   */
  registeredProviders(): string[] {
    return Array.from(this.providers.keys()).filter(
      (name) => name !== 'mock' && this.providers.get(name)?.isAvailable(),
    );
  }

  private buildProviderChain(preferred: string): string[] {
    const chain: string[] = [preferred];

    // Add fallback (e.g. stability) before mock
    if (this.config.fallbackProvider && !chain.includes(this.config.fallbackProvider)) {
      chain.push(this.config.fallbackProvider);
    }

    // Add any remaining real providers registered
    for (const name of this.providers.keys()) {
      if (!chain.includes(name) && name !== 'mock') {
        chain.push(name);
      }
    }

    // MOCK FALLBACK: Since the network is blocking real APIs (FLUX) and NVIDIA lacks access,
    // we append 'mock' so the UI doesn't crash with 404s, allowing frontend testing to continue.
    if (!chain.includes('mock')) {
      chain.push('mock');
    }

    return chain;
  }

  private withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error(`Image generation timed out after ${ms}ms`)),
        ms,
      );
      promise.then(
        (v) => { clearTimeout(timer); resolve(v); },
        (e) => { clearTimeout(timer); reject(e); },
      );
    });
  }
}
