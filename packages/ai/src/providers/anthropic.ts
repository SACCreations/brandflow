import Anthropic from '@anthropic-ai/sdk';
import type { LLMProvider, ProviderRequest, ProviderResponse } from '../types';

export class AnthropicProvider implements LLMProvider {
  readonly name = 'anthropic' as const;
  private client: Anthropic;
  private model: string;
  private apiKey: string;

  constructor(apiKey: string, model = 'claude-sonnet-4-5') {
    this.client = new Anthropic({
      apiKey,
      // SDK timeout must be longer than our gateway timeout (600s) so our
      // withTimeout wrapper always fires first with a consistent error message.
      timeout: 660_000, // 11 minutes — gateway cancels at 10 min
    });
    this.model = model;
    this.apiKey = apiKey;
  }

  isAvailable(): boolean {
    if (!this.apiKey) return false;
    const key = this.apiKey.toLowerCase();
    return !key.includes('mock') && !key.includes('dummy') && !key.includes('placeholder');
  }

  async complete(request: ProviderRequest): Promise<ProviderResponse> {
    // For JSON mode, prefill the assistant response to force JSON output
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = typeof request.userPrompt === 'string'
      ? [{ role: 'user', content: request.userPrompt }]
      : request.userPrompt as Array<{ role: 'user' | 'assistant'; content: string }>;
    if (request.jsonMode) {
      messages.push({ role: 'assistant', content: '{' });
    }

    const controller = new AbortController();

    // Use streaming so the HTTP connection stays alive during long thinking-model runs.
    // Without streaming, a single slow response can look "idle" to network proxies and
    // get dropped mid-generation even when the model is actively working.
    const stream = this.client.messages.stream(
      {
        model: request.model ?? this.model,
        max_tokens: request.maxTokens ?? 1024,
        system: request.systemPrompt,
        messages,
      },
      { signal: controller.signal },
    );

    let textContent = '';
    let inputTokens = 0;
    let outputTokens = 0;
    let responseModel = request.model ?? this.model;

    try {
      for await (const event of stream) {
        // Accumulate text deltas only — skip thinking blocks from thinking models
        if (
          event.type === 'content_block_delta' &&
          (event.delta as any).type === 'text_delta'
        ) {
          textContent += (event.delta as any).text;
        }
      }

      const finalMsg = await stream.finalMessage();
      inputTokens = finalMsg.usage.input_tokens;
      outputTokens = finalMsg.usage.output_tokens;
      responseModel = finalMsg.model;
    } catch (err) {
      controller.abort();
      throw err;
    }

    if (!textContent) {
      throw new Error('Anthropic returned empty response');
    }

    // If we prefilled with '{', prepend it to the streamed content
    const content = request.jsonMode ? `{${textContent}` : textContent;

    return {
      content,
      model: responseModel,
      inputTokens,
      outputTokens,
    };
  }
}
