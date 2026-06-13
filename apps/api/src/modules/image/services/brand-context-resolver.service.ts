import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';

/**
 * Fully resolved brand context for poster generation.
 * Extracts all visual identity data needed by the PosterPromptBuilder.
 */
export interface ResolvedBrandContext {
  id: string;
  name: string;
  tagline?: string;
  industry?: string;
  positioning?: string;
  tone: string[];
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
  visualStyle?: string;
  logoUrl?: string;
  logoDescription?: string;
}

@Injectable()
export class BrandContextResolverService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resolves all brand data needed to build a brand-aware poster prompt.
   * Pulls from: Brand.visualRules JSON (colors, fonts), Brand.tone, Brand.tagline,
   * Brand.industry, and the brand's logo Asset record.
   */
  async resolve(brandId: string, businessId: string): Promise<ResolvedBrandContext> {
    const brand = await this.prisma.client.brand.findFirst({
      where: { id: brandId, businessId, deletedAt: null },
    });

    if (!brand) {
      throw new NotFoundException(`Brand ${brandId} not found`);
    }

    const vr = (brand.visualRules as Record<string, any>) || {};

    // Extract colors from color tokens array (preferred) or flat fields (fallback)
    const tokens: Array<{ name: string; type: string; value: string }> =
      Array.isArray(vr['colorTokens']) ? vr['colorTokens'] : [];

    const primary   = tokens.find(t => t.type === 'primary')?.value   || vr['primaryColor']   || undefined;
    const secondary = tokens.find(t => t.type === 'secondary')?.value || vr['secondaryColor'] || undefined;
    const accent    = tokens.find(t => t.type === 'accent')?.value    || vr['accentColor']    || undefined;

    // Extract font from multiple possible structures
    const fontFamily = vr['fontFamily']
      || vr['typography']?.primary
      || vr['fonts']?.heading
      || undefined;

    // Extract visual style
    const visualStyle = vr['style']
      || vr['visualStyle']
      || vr['designStyle']
      || undefined;

    // Fetch logo asset (tagged with role: 'logo')
    let logoUrl: string | undefined;
    let logoDescription: string | undefined;

    try {
      const logoAsset = await this.prisma.client.asset.findFirst({
        where: {
          brandId,
          businessId,
          OR: [
            { type: 'logo' },
            { fileName: { contains: 'logo', mode: 'insensitive' } },
            { tags: { path: ['role'], equals: 'logo' } },
          ],
        },
        orderBy: { createdAt: 'desc' },
        select: { cdnUrl: true, s3Key: true, fileName: true },
      });

      if (logoAsset?.cdnUrl) {
        logoUrl = logoAsset.cdnUrl;
      }
    } catch {
      // Logo fetch is non-critical — proceed without it
    }

    logoDescription = vr['logoDescription'] || undefined;

    // Parse tone
    let tone: string[] = [];
    if (Array.isArray(brand.tone)) {
      tone = brand.tone.filter((t): t is string => typeof t === 'string');
    } else if (typeof brand.tone === 'string') {
      tone = [brand.tone];
    }

    return {
      id: brand.id,
      name: brand.name,
      tagline: brand.tagline ?? undefined,
      industry: brand.industry ?? undefined,
      positioning: brand.positioning ?? undefined,
      tone,
      primaryColor: primary,
      secondaryColor: secondary,
      accentColor: accent,
      fontFamily,
      visualStyle,
      logoUrl,
      logoDescription,
    };
  }
}
