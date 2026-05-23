import OpenAI from 'openai';
import type { LLMProvider, ProviderRequest, ProviderResponse } from '../types';

export class OpenAIProvider implements LLMProvider {
  readonly name = 'openai' as const;
  private client: OpenAI;
  private model: string;
  private apiKey: string;

  constructor(apiKey: string, model = 'gpt-4o') {
    this.client = new OpenAI({ apiKey });
    this.model = model;
    this.apiKey = apiKey;
  }

  isAvailable(): boolean {
    return Boolean(this.apiKey && !this.apiKey.startsWith('sk-mock'));
  }

  async complete(request: ProviderRequest): Promise<ProviderResponse> {
    const response = await this.client.chat.completions.create({
      model: request.model ?? this.model,
      messages: [
        { role: 'system', content: request.systemPrompt },
        { role: 'user', content: request.userPrompt },
      ],
      max_tokens: request.maxTokens ?? 1024,
      temperature: request.temperature ?? 0.7,
      ...(request.jsonMode ? { response_format: { type: 'json_object' as const } } : {}),
    });

    const choice = response.choices[0];
    if (!choice?.message.content) {
      throw new Error('OpenAI returned empty response');
    }

    return {
      content: choice.message.content,
      model: response.model,
      inputTokens: response.usage?.prompt_tokens ?? 0,
      outputTokens: response.usage?.completion_tokens ?? 0,
    };
  }
}
