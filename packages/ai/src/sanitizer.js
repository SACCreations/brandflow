"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PIISanitizer = void 0;
/**
 * PII Sanitizer for scrubbing sensitive information before LLM transit.
 * Standard patterns for emails, phone numbers, and common ID formats.
 */
class PIISanitizer {
    static EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    static PHONE_REGEX = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    static CREDIT_CARD_REGEX = /\b(?:\d[ -]*?){13,16}\b/g;
    static sanitize(text) {
        const redactedItems = [];
        let hasRedacted = false;
        let sanitized = text.replace(this.EMAIL_REGEX, (match) => {
            hasRedacted = true;
            redactedItems.push(`email:${match}`);
            return '[EMAIL_REDACTED]';
        });
        sanitized = sanitized.replace(this.PHONE_REGEX, (match) => {
            hasRedacted = true;
            redactedItems.push(`phone:${match}`);
            return '[PHONE_REDACTED]';
        });
        sanitized = sanitized.replace(this.CREDIT_CARD_REGEX, (match) => {
            hasRedacted = true;
            redactedItems.push(`card:${match}`);
            return '[CARD_REDACTED]';
        });
        return {
            text: sanitized,
            hasRedacted,
            redactedItems,
        };
    }
}
exports.PIISanitizer = PIISanitizer;
//# sourceMappingURL=sanitizer.js.map