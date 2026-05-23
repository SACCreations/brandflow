import type { LLMProvider, ProviderRequest, ProviderResponse } from '../types';

export class GoogleProvider implements LLMProvider {
  readonly name = 'google' as const;
  private model: string;
  private apiKey: string;

  constructor(apiKey: string, model = 'gemini-2.0-flash') {
    this.model = model;
    this.apiKey = apiKey;
  }

  isAvailable(): boolean {
    return Boolean(this.apiKey && !this.apiKey.startsWith('sk-mock') && !this.apiKey.includes('mock'));
  }

  async complete(request: ProviderRequest): Promise<ProviderResponse> {

    const modelName = request.model ?? this.model;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${this.apiKey}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: request.systemPrompt }]
        },
        contents: typeof request.userPrompt === 'string'
          ? [
              {
                role: 'user',
                parts: [{ text: request.userPrompt }]
              }
            ]
          : request.userPrompt.map((m: any) => ({
              role: m.role === 'assistant' ? 'model' : m.role,
              parts: [{ text: m.content }]
            })),
        generationConfig: {
          maxOutputTokens: request.maxTokens ?? 1024,
          temperature: request.temperature ?? 0.7,
        }
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Google Gemini API failed with status ${res.status}: ${errorText}`);
    }

    const data: any = await res.json();
    const candidate = data.candidates?.[0];
    const content = candidate?.content?.parts?.[0]?.text;

    if (!content) {
      throw new Error('Google Gemini returned empty response');
    }

    return {
      content,
      model: modelName,
      inputTokens: data.usageMetadata?.promptTokenCount ?? 0,
      outputTokens: data.usageMetadata?.candidatesTokenCount ?? 0,
    };
  }
}
