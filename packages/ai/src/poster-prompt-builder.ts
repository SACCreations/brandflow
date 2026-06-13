/**
 * PosterPromptBuilder
 *
 * Builds a structured, brand-aware, platform-specific prompt for DALL-E 3 / FLUX.1-dev
 * that results in a MARKETING POSTER CREATIVE — never a generic stock photo or scene.
 *
 * Key enforcement rules:
 * 1. Every image prompt begins with "Marketing poster creative, graphic design composition,"
 * 2. Brand colors are hex-specified for visual grounding
 * 3. Platform layout orientation drives composition guidance
 * 4. Category-specific design language enforces poster vs thumbnail vs banner structure
 * 5. A strong negative prompt blocks all stock/office/generic imagery
 */

export interface PosterContextPayload {
  // ─── Brand Data ───────────────────────────────────────────────
  brandName: string;
  brandTagline?: string;
  brandIndustry?: string;
  brandTone?: string[];
  visualStyle?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
  logoUrl?: string;
  logoDescription?: string;

  // ─── Content Data ────────────────────────────────────────────
  headline: string;
  subheadline?: string;
  cta?: string;
  body?: string;
  campaignObjective?: string;

  // ─── Platform Data ───────────────────────────────────────────
  platform: string;
  platformLabel: string;
  width: number;
  height: number;

  // ─── Category ────────────────────────────────────────────────
  category: string;
}

export interface PosterPromptResult {
  systemPrompt: string;
  userMessage: string;
  negativePrompt: string;
}

export class PosterPromptBuilder {

  build(ctx: PosterContextPayload): PosterPromptResult {
    const layoutOrientation = this.resolveOrientation(ctx.width, ctx.height);
    const colorSpec = this.buildColorSpec(ctx);
    const categoryGuidance = this.getCategoryDesignGuidance(ctx.category, layoutOrientation);
    const logoZone = this.getLogoZone(ctx.category, ctx.platform);
    const toneString = (ctx.brandTone || ['professional', 'modern']).slice(0, 3).join(', ');

    const systemPrompt = `You are a world-class Creative Director and Brand Designer specializing in digital marketing poster creation for top-tier agencies.

Your ONLY job is to generate a single AI image generation prompt that creates a BRANDED MARKETING POSTER — NOT a photograph, NOT a stock image, NOT an office scene.

ABSOLUTE RULES:
1. The generated image prompt MUST begin with: "Marketing poster creative, graphic design composition,"
2. The composition MUST be a designed GRAPHIC LAYOUT — not a real-world photograph
3. Brand colors MUST be the dominant palette: ${colorSpec || 'use premium modern gradient palette'}
4. The design MUST contain clearly defined text placeholder zones for: headline, supporting text, and CTA button
5. Logo placement zone: ${logoZone}
6. Layout orientation for ${ctx.platformLabel}: ${layoutOrientation} layout
7. Category design rules: ${categoryGuidance}
8. NEVER describe: office meetings, handshakes, people in conference rooms, generic stock business scenes, hallways, aerial city shots (unless brand-relevant), or random laptop mockups
9. ALWAYS describe: graphic design elements, typography zones, brand color usage, geometric shapes, professional marketing layout, visual hierarchy
10. Visual style must match: ${ctx.visualStyle || 'modern premium corporate'} aesthetic
11. Brand industry: ${ctx.brandIndustry || 'marketing'} — visuals must connect to this sector
12. Campaign purpose: ${ctx.campaignObjective || 'brand awareness and lead generation'}

OUTPUT: Return ONLY the image prompt text. No preamble, no explanation, no metadata.`;

    const userMessage = `Generate the AI image generation prompt for this branded marketing poster:

═══════════════════════════════════════
BRAND IDENTITY
═══════════════════════════════════════
Brand Name: ${ctx.brandName}
Brand Tagline: ${ctx.brandTagline || 'N/A'}
Industry: ${ctx.brandIndustry || 'Professional Services'}
Brand Tone: ${toneString}
Visual Style: ${ctx.visualStyle || 'modern, bold, premium'}
Font Style: ${ctx.fontFamily || 'clean modern sans-serif, geometric letterforms'}
${ctx.primaryColor ? `Primary Color: ${ctx.primaryColor}` : ''}
${ctx.secondaryColor ? `Secondary Color: ${ctx.secondaryColor}` : ''}
${ctx.accentColor ? `Accent Color: ${ctx.accentColor}` : ''}
${ctx.logoUrl ? `Logo: Include branded logo placeholder zone at ${logoZone}` : ''}
${ctx.logoDescription ? `Logo Description: ${ctx.logoDescription}` : ''}

═══════════════════════════════════════
CONTENT TO VISUALIZE
═══════════════════════════════════════
Headline: "${ctx.headline}"
${ctx.subheadline ? `Subheadline: "${ctx.subheadline}"` : ''}
${ctx.cta ? `Call-to-Action: "${ctx.cta}"` : ''}
${ctx.body ? `Key Message (extract visual concepts): "${ctx.body.slice(0, 400)}"` : ''}
${ctx.campaignObjective ? `Campaign Objective: ${ctx.campaignObjective}` : ''}

═══════════════════════════════════════
PLATFORM & FORMAT
═══════════════════════════════════════
Platform: ${ctx.platformLabel}
Dimensions: ${ctx.width} × ${ctx.height}px
Orientation: ${layoutOrientation}
Category: ${ctx.category}
Design Rules: ${categoryGuidance}

═══════════════════════════════════════
REQUIRED DESIGN ELEMENTS IN PROMPT
═══════════════════════════════════════
✓ Start with: "Marketing poster creative, graphic design composition,"
✓ Specify brand color usage: ${colorSpec || 'premium gradient palette'}
✓ Describe text zone placement (where headline/CTA text would be overlaid)
✓ Describe the hero visual element (brand-relevant illustration, icon, or graphic)
✓ Specify layout sections: top (logo/brand), center (hero + headline), bottom (CTA + footer)
✓ Include quality descriptors: ultra-sharp, professional marketing artwork, print-ready quality, 8K detail
✓ Include style descriptors matching ${ctx.visualStyle || 'modern premium'} aesthetic`;

    const negativePrompt = [
      // Generic stock scenes
      'generic office meeting', 'business handshake', 'corporate conference room', 'office hallway', 'generic workspace interior',
      'stock photo', 'stock photography', 'generic business people', 'people sitting at desk', 'random corporate people',
      'aerial city view', 'random cityscapes', 'generic landscapes', 'random landscape photos', 'earth from space',
      // Photography artifacts
      'photorealistic photo of people', 'candid photograph', 'documentary photo', 'selfie',
      'blurry', 'out of focus', 'motion blur', 'noise', 'grain', 'low resolution',
      // Quality issues
      'watermark', 'logo watermark', 'amateur design', 'low quality', 'pixelated', 'compressed artifacts',
      'bad typography', 'distorted text', 'misspelled text', 'illegible font',
      // Layout issues
      'cluttered', 'disorganized layout', 'unbalanced composition', 'cropped awkwardly',
      // Generic tech
      'random laptop mockup', 'generic dashboard', 'meaningless floating UI', 'random icons',
      // Color issues
      'dull colors', 'washed out', 'oversaturated', 'color banding',
    ].join(', ');

    return { systemPrompt, userMessage, negativePrompt };
  }

  private resolveOrientation(width: number, height: number): string {
    const ratio = width / height;
    if (ratio > 1.4)  return 'wide horizontal landscape';
    if (ratio < 0.7)  return 'tall vertical portrait';
    if (ratio > 0.9 && ratio < 1.1) return 'square balanced';
    return 'near-square';
  }

  private buildColorSpec(ctx: PosterContextPayload): string {
    const parts: string[] = [];
    if (ctx.primaryColor)   parts.push(`primary ${ctx.primaryColor}`);
    if (ctx.secondaryColor) parts.push(`secondary ${ctx.secondaryColor}`);
    if (ctx.accentColor)    parts.push(`accent ${ctx.accentColor}`);
    return parts.length > 0 ? parts.join(', ') : '';
  }

  private getCategoryDesignGuidance(category: string, orientation: string): string {
    const map: Record<string, string> = {
      SMO_POSTER: 'Bold typography zone top-center, high-contrast brand color background or gradient, hero graphic in center, CTA button zone at bottom, clean margins, social-media-optimized visual hierarchy',
      FESTIVAL_BANNER: 'Festive decorative elements, warm or celebratory color scheme matching brand palette, large headline zone, event-themed graphic elements, brand logo top corner',
      OFFER_CREATIVE: 'High-contrast promotional layout, bold offer text zone, price or discount callout zone, product or service hero visual, urgency-creating design, strong CTA zone at bottom',
      WEBSITE_HERO: `Full-width ${orientation} layout, split composition with text zone left and visual zone right, spacious header feel, gradient fade from brand color, professional corporate quality`,
      PRINTABLE_STANDEE: 'Tall vertical layout (portrait), top-to-bottom information flow, brand logo top, headline center, benefits list zone, footer with contact info, print-quality design',
      PRINTABLE_BANNER: 'Wide horizontal banner layout, brand strip across width, headline zone prominent, minimal text for distance readability, large visual element',
      PRINTABLE_FLYER: 'Dense information layout, clear section zones, header/body/footer structure, readable at print size, brand color borders and accents',
      PRINTABLE_BROCHURE: 'Multi-panel layout suggestion, fold-line safe zones, front cover hero visual, organized content sections',
      AD_CREATIVE: 'Conversion-optimized layout, bold CTA button zone visually dominant, product/service hero prominent, benefit bullets zone, urgency and value proposition clear',
      SOCIAL_COVER: `${orientation} cover photo layout, brand identity dominant, minimal text for legibility, spacious with logo placement, cover-photo composition with subject-safe center zone`,
      THUMBNAIL: 'High-contrast thumbnail layout, bold close-up focal element, readable title zone even at small size, energy and visual punch, bright brand accent colors',
    };
    return map[category] || 'Professional marketing poster layout, brand color dominant, headline and CTA zones clearly defined, modern graphic design aesthetic';
  }

  private getLogoZone(category: string, platform: string): string {
    const bannerCategories = ['SOCIAL_COVER', 'WEBSITE_HERO', 'PRINTABLE_BANNER', 'linkedin_banner'];
    const topRightCategories = ['THUMBNAIL', 'AD_CREATIVE'];
    const bottomCenterCategories = ['FESTIVAL_BANNER', 'OFFER_CREATIVE'];

    if (bannerCategories.some(c => category.includes(c) || platform.includes(c.toLowerCase()))) {
      return 'top-left corner, logo lockup with brand name';
    }
    if (topRightCategories.some(c => category.includes(c))) {
      return 'top-right corner, small logo badge';
    }
    if (bottomCenterCategories.some(c => category.includes(c))) {
      return 'bottom-center, logo footer zone';
    }
    return 'top-left corner, logo mark with brand wordmark';
  }
}
