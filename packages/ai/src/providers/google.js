"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleProvider = void 0;
class GoogleProvider {
    name = 'google';
    model;
    apiKey;
    constructor(apiKey, model = 'gemini-2.0-flash') {
        this.model = model;
        this.apiKey = apiKey;
    }
    isAvailable() {
        return Boolean(this.apiKey);
    }
    async complete(request) {
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
                    : request.userPrompt.map((m) => ({
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
        const data = await res.json();
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
exports.GoogleProvider = GoogleProvider;
//# sourceMappingURL=google.js.map