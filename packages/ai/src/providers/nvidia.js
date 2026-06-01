"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NvidiaProvider = void 0;
const openai_1 = __importDefault(require("openai"));
class NvidiaProvider {
    name = 'nvidia';
    client;
    model;
    apiKey;
    constructor(apiKey, model = 'meta/llama-3.1-70b-instruct') {
        this.client = new openai_1.default({
            apiKey,
            baseURL: "https://integrate.api.nvidia.com/v1"
        });
        this.model = model;
        this.apiKey = apiKey;
    }
    isAvailable() {
        return Boolean(this.apiKey);
    }
    async complete(request) {
        try {
            const response = await this.client.chat.completions.create({
                model: request.model ?? this.model,
                messages: [
                    { role: 'system', content: request.systemPrompt },
                    ...(typeof request.userPrompt === 'string'
                        ? [{ role: 'user', content: request.userPrompt }]
                        : request.userPrompt),
                ],
                max_tokens: request.maxTokens ?? 1024,
                temperature: request.temperature ?? 0.7,
                ...(request.jsonMode ? { response_format: { type: 'json_object' } } : {}),
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
        }
        catch (err) {
            if (err?.message?.includes('404')) {
                throw new Error(`Nvidia NIM returned 404 Not Found. This usually means the model name (e.g. "${request.model || this.model}") is invalid or unsupported. Raw error: ${err.message}`);
            }
            throw err;
        }
    }
}
exports.NvidiaProvider = NvidiaProvider;
//# sourceMappingURL=nvidia.js.map