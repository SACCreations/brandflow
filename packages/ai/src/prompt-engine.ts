import type { BrandContext, PromptContext, ResolvedPrompt } from './types';

/**
 * Resolves layered prompts and injects context variables.
 *
 * Prompt layer priority (lowest to highest):
 *   platform → business → brand → campaign
 *
 * Later layers can override or extend earlier ones.
 */
export class PromptEngine {
  /**
   * Build the final system prompt by injecting brand/KB context
   * into a resolved prompt template.
   */
  buildSystemPrompt(resolved: ResolvedPrompt, context: PromptContext): string {
    let template = resolved.template;

    // Inject brand context
    if (context.brand) {
      template = this.injectBrandContext(template, context.brand);
    }

    // Inject knowledge entries as a context block
    if (context.knowledgeEntries && context.knowledgeEntries.length > 0) {
      const knowledgeBlock = context.knowledgeEntries
        .slice(0, 10) // Limit to top 10 for token budget
        .map((e, i) => `${i + 1}. ${e}`)
        .join('\n');
        
      if (template.includes('{{knowledge_entries}}')) {
        template = template.replace('{{knowledge_entries}}', knowledgeBlock);
      } else {
        template += `\n\nBrand Knowledge Context:\n${knowledgeBlock}`;
      }
    } else {
      template = template.replace('{{knowledge_entries}}', 'No additional knowledge available.');
    }

    // Inject campaign context
    if (context.campaignContext) {
      for (const [key, value] of Object.entries(context.campaignContext)) {
        template = template.replace(new RegExp(`{{campaign_${key}}}`, 'g'), value);
      }
    }

    // Inject any extra variables
    if (context.extra) {
      for (const [key, value] of Object.entries(context.extra)) {
        const replacement = Array.isArray(value) ? value.join(', ') : value;
        template = template.replace(new RegExp(`{{${key}}}`, 'g'), replacement);
      }
    }

    // Remove any remaining unresolved placeholders (graceful degradation)
    template = template.replace(/\{\{[^}]+\}\}/g, '');

    return template;
  }

  /**
   * Sanitize user input to prevent prompt injection.
   */
  sanitizeInput(input: string): string {
    // Strip attempts to inject system-level instructions
    const injectionPatterns = [
      /ignore (all |previous |above )?instructions?/gi,
      /forget (everything|all)/gi,
      /you are now/gi,
      /act as (a |an )?/gi,
      /system:/gi,
      /\[INST\]/gi,
      /\[\/INST\]/gi,
      /<\|im_start\|>/gi,
      /<\|im_end\|>/gi,
    ];

    let sanitized = input;
    for (const pattern of injectionPatterns) {
      sanitized = sanitized.replace(pattern, '[FILTERED]');
    }

    // Limit input length
    return sanitized.slice(0, 2000);
  }

  private injectBrandContext(template: string, brand: BrandContext): string {
    return template
      .replace(/\{\{brand_name\}\}/g, brand.name)
      .replace(/\{\{positioning\}\}/g, brand.positioning ?? 'Not specified')
      .replace(/\{\{audience\}\}/g, brand.audience ?? 'Not specified')
      .replace(/\{\{tone\}\}/g, brand.tone?.join(', ') ?? 'professional')
      .replace(
        /\{\{banned_phrases\}\}/g,
        brand.governance?.bannedPhrases?.join(', ') ?? 'None',
      )
      .replace(
        /\{\{required_phrases\}\}/g,
        brand.governance?.requiredPhrases?.join(', ') ?? 'None',
      )
      .replace(
        /\{\{cta_preferences\}\}/g,
        brand.governance?.ctaPreferences?.join(', ') ?? 'None',
      );
  }
}
