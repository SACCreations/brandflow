"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIProvider = void 0;
const openai_1 = __importDefault(require("openai"));
class OpenAIProvider {
    name = 'openai';
    client;
    model;
    constructor(apiKey, model = 'gpt-4o') {
        this.client = new openai_1.default({ apiKey });
        this.model = model;
    }
    isAvailable() {
        return Boolean(process.env['OPENAI_API_KEY']);
    }
    async complete(request) {
        const response = await this.client.chat.completions.create({
            model: this.model,
            messages: [
                { role: 'system', content: request.systemPrompt },
                { role: 'user', content: request.userPrompt },
            ],
            max_tokens: request.maxTokens ?? 1024,
            temperature: request.temperature ?? 0.7,
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
exports.OpenAIProvider = OpenAIProvider;
//# sourceMappingURL=openai.js.map