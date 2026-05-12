"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FallbackProvider = void 0;
/**
 * Fallback provider for when all primary providers are unavailable.
 * Returns a simple templated response using a lightweight local strategy.
 * In production this could call a self-hosted OSS model.
 */
class FallbackProvider {
    name = 'fallback';
    isAvailable() {
        // Always available as last resort
        return true;
    }
    async complete(request) {
        // In a real production scenario this would call a self-hosted model.
        // For MVP, this throws an informative error instead of silently degrading.
        throw new Error(`All AI providers are unavailable. Request ID: ${request.requestId}. ` +
            'Please configure OPENAI_API_KEY or ANTHROPIC_API_KEY.');
    }
}
exports.FallbackProvider = FallbackProvider;
//# sourceMappingURL=fallback.js.map