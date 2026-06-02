import Anthropic from '@anthropic-ai/sdk';
import type { LLMProvider, ProviderRequest, ProviderResponse } from '../types';

export class AnthropicProvider implements LLMProvider {
  readonly name = 'anthropic' as const;
  private client: Anthropic;
  private model: string;
  private apiKey: string;

  constructor(apiKey: string, model = 'claude-sonnet-4-5') {
    this.client = new Anthropic({ apiKey });
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

    const response = await this.client.messages.create({
      model: request.model ?? this.model,
      max_tokens: request.maxTokens ?? 1024,
      system: request.systemPrompt,
      messages,
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('Anthropic returned empty response');
    }

    // If we prefilled with '{', prepend it to the response
    const content = request.jsonMode ? `{${textBlock.text}` : textBlock.text;

    return {
      content,
      model: response.model,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    };
  }
}
