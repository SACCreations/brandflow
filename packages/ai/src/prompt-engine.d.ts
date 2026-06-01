import type { PromptContext, ResolvedPrompt } from './types';
/**
 * Resolves layered prompts and injects context variables.
 *
 * Prompt layer priority (lowest to highest):
 *   platform → business → brand → campaign
 *
 * Later layers can override or extend earlier ones.
 */
export declare class PromptEngine {
    /**
     * Build the final system prompt by injecting brand/KB context
     * into a resolved prompt template.
     */
    buildSystemPrompt(resolved: ResolvedPrompt, context: PromptContext): string;
    /**
     * Sanitize user input to prevent prompt injection.
     */
    sanitizeInput(input: string): string;
    private injectBrandContext;
}
//# sourceMappingURL=prompt-engine.d.ts.map