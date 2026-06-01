export interface SanitizationResult {
    text: string;
    hasRedacted: boolean;
    redactedItems: string[];
}
/**
 * PII Sanitizer for scrubbing sensitive information before LLM transit.
 * Standard patterns for emails, phone numbers, and common ID formats.
 */
export declare class PIISanitizer {
    private static readonly EMAIL_REGEX;
    private static readonly PHONE_REGEX;
    private static readonly CREDIT_CARD_REGEX;
    static sanitize(text: string): SanitizationResult;
}
//# sourceMappingURL=sanitizer.d.ts.map