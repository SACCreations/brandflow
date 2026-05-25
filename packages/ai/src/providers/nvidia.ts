import OpenAI from 'openai';
import type { LLMProvider, ProviderRequest, ProviderResponse } from '../types';

export class NvidiaProvider implements LLMProvider {
  readonly name = 'nvidia' as const;
  private client: OpenAI;
  private model: string;
  private apiKey: string;

  constructor(apiKey: string, model = 'meta/llama-3.1-70b-instruct') {
    this.client = new OpenAI({ 
      apiKey,
      baseURL: "https://integrate.api.nvidia.com/v1"
    });
    this.model = model;
    this.apiKey = apiKey;
  }

  isAvailable(): boolean {
    return Boolean(this.apiKey);
  }

  async complete(request: ProviderRequest): Promise<ProviderResponse> {
    try {
      const response = await this.client.chat.completions.create({
        model: request.model ?? this.model,
        messages: [
          { role: 'system' as const, content: request.systemPrompt },
          ...(typeof request.userPrompt === 'string' 
            ? [{ role: 'user' as const, content: request.userPrompt }]
            : request.userPrompt as any),
        ],
        max_tokens: request.maxTokens ?? 1024,
        temperature: request.temperature ?? 0.7,
        ...(request.jsonMode ? { response_format: { type: 'json_object' as const } } : {}),
      });

      const choice = response.choices[0];
      if (!choice?.message.content) {
        throw new Error('Nvidia returned empty response');
      }

      return {
        content: choice.message.content,
        model: response.model,
        inputTokens: response.usage?.prompt_tokens ?? 0,
        outputTokens: response.usage?.completion_tokens ?? 0,
      };
    } catch (err: any) {
      if (err?.message?.includes('404')) {
        throw new Error(`Nvidia NIM returned 404 Not Found. This usually means the model name (e.g. "${request.model || this.model}") is invalid or unsupported. Raw error: ${err.message}`);
      }
      throw err;
    }
  }
}
