import Anthropic from '@anthropic-ai/sdk';
import type { LLMProvider, ProviderRequest, ProviderResponse } from '../types';

export class AnthropicProvider implements LLMProvider {
  readonly name = 'anthropic' as const;
  private client: Anthropic;
  private model: string;

  constructor(apiKey: string, model = 'claude-sonnet-4-5') {
    this.client = new Anthropic({ apiKey });
    this.model = model;
  }

  isAvailable(): boolean {
    return Boolean(process.env['ANTHROPIC_API_KEY']);
  }

  async complete(request: ProviderRequest): Promise<ProviderResponse> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: request.maxTokens ?? 1024,
      system: request.systemPrompt,
      messages: [{ role: 'user', content: request.userPrompt }],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('Anthropic returned empty response');
    }

    return {
      content: textBlock.text,
      model: response.model,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    };
  }
}
