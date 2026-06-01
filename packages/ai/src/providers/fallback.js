"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FallbackProvider = void 0;
/**
 * Fallback provider for when all primary providers are unavailable.
 * Always throws an error directing users to configure their API key.
 */
class FallbackProvider {
    name = 'fallback';
    isAvailable() {
        // Always available as last resort to surface a clear error
        return true;
    }
    async complete(request) {
        // Return a mock response so the application works without API keys in development
        const isTopicSuggest = request.systemPrompt?.includes('generate exactly 5 creative');
        let content = 'This is a mock AI generated response because no valid API key was provided.';
        if (isTopicSuggest) {
            content = JSON.stringify({
                topics: [
                    { id: '1', name: 'Mock Topic 1: The Future of ' + (request.model || 'Marketing'), tag: 'Innovation' },
                    { id: '2', name: 'Mock Topic 2: 5 Ways to Improve Engagement', tag: 'Strategy' },
                    { id: '3', name: 'Mock Topic 3: Understanding Your Audience', tag: 'Analytics' },
                    { id: '4', name: 'Mock Topic 4: The Power of Brand Voice', tag: 'Branding' },
                    { id: '5', name: 'Mock Topic 5: Mastering Social Media in 2026', tag: 'Social' }
                ]
            });
        }
        else if (request.jsonMode) {
            content = JSON.stringify({ result: 'mock data' });
        }
        return {
            content,
            model: 'mock-fallback-model',
            inputTokens: 10,
            outputTokens: 50,
        };
    }
}
exports.FallbackProvider = FallbackProvider;
//# sourceMappingURL=fallback.js.map