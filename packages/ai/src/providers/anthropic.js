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
    constructor(apiKey, model = 'claude-sonnet-4-5') {
        this.client = new sdk_1.default({ apiKey });
        this.model = model;
    }
    isAvailable() {
        return Boolean(process.env['ANTHROPIC_API_KEY']);
    }
    async complete(request) {
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
exports.AnthropicProvider = AnthropicProvider;
//# sourceMappingURL=anthropic.js.map