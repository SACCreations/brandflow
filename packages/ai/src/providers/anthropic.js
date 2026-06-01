"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnthropicProvider = void 0;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
class AnthropicProvider {
    name = 'anthropic';
    client;
    model;
    apiKey;
    constructor(apiKey, model = 'claude-sonnet-4-5') {
        this.client = new sdk_1.default({ apiKey });
        this.model = model;
        this.apiKey = apiKey;
    }
    isAvailable() {
        return Boolean(this.apiKey);
    }
    async complete(request) {
        // For JSON mode, prefill the assistant response to force JSON output
        const messages = typeof request.userPrompt === 'string'
            ? [{ role: 'user', content: request.userPrompt }]
            : request.userPrompt;
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
exports.AnthropicProvider = AnthropicProvider;
//# sourceMappingURL=anthropic.js.map