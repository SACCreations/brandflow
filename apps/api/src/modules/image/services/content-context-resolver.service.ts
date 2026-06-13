import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';

/**
 * Resolved content context for poster generation.
 * Extracts the key marketing copy elements from a generated content piece.
 */
export interface ResolvedContentContext {
  contentId: string;
  headline: string;
  subheadline?: string;
  body?: string;
  cta?: string;
  campaignObjective?: string;
  contentType: string;
  platform: string;
}

@Injectable()
export class ContentContextResolverService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resolves content data for poster generation.
   * Extracts headline, subheadline, CTA, and campaign objective from a
   * linked approved content piece and its brief.
   */
  async resolve(contentId: string, businessId: string): Promise<ResolvedContentContext | null> {
    const content = await this.prisma.client.content.findFirst({
      where: { id: contentId, businessId },
      include: {
        brief: {
          select: { objective: true, cta: true, businessGoal: true },
        },
      },
    });

    if (!content) return null;

    const body = content.body || '';
    const metadata = (content.metadata as Record<string, any>) || {};

    // ─── Headline Extraction ───────────────────────────────────────────────
    // Priority: metadata.headline → first line of body → first 100 chars
    let headline =
      metadata['headline']
      || this.extractHeadline(body)
      || body.slice(0, 100).trim();

    // Sanitize: remove markdown headers, trim to 150 chars
    headline = headline.replace(/^#+\s*/, '').replace(/\*\*/g, '').trim().slice(0, 150);

    // ─── Subheadline Extraction ────────────────────────────────────────────
    let subheadline: string | undefined =
      metadata['subheadline']
      || this.extractSubheadline(body, headline);

    if (subheadline) {
      subheadline = subheadline.replace(/^#+\s*/, '').replace(/\*\*/g, '').trim().slice(0, 200);
    }

    // ─── CTA Extraction ───────────────────────────────────────────────────
    const cta =
      content.brief?.cta
      || metadata['cta']
      || this.extractCTA(body);

    // ─── Campaign Objective ───────────────────────────────────────────────
    const campaignObjective =
      content.brief?.objective
      || content.brief?.businessGoal
      || metadata['campaignObjective']
      || undefined;

    return {
      contentId: content.id,
      headline,
      subheadline,
      body: body.slice(0, 600),
      cta,
      campaignObjective,
      contentType: content.type,
      platform: content.platform,
    };
  }

  /**
   * Extract the primary headline from content body text.
   * Looks for: markdown H1/H2, first bold text, or first sentence.
   */
  private extractHeadline(body: string): string | undefined {
    const lines = body.split('\n').map(l => l.trim()).filter(Boolean);

    // Check for markdown headers
    for (const line of lines.slice(0, 5)) {
      if (line.startsWith('# ')) return line.slice(2).trim();
      if (line.startsWith('## ')) return line.slice(3).trim();
    }

    // Check for bold text (likely headline)
    const boldMatch = body.match(/\*\*([^*]{10,100})\*\*/);
    if (boldMatch?.[1]) return boldMatch[1].trim();

    // First substantial non-empty line
    const firstLine = lines.find(l => l.length > 10 && l.length < 150);
    return firstLine?.slice(0, 100);
  }

  /**
   * Extract a supporting subheadline from the body.
   */
  private extractSubheadline(body: string, headline?: string): string | undefined {
    const lines = body.split('\n').map(l => l.trim()).filter(Boolean);

    // Skip lines that match the headline
    const remaining = lines.filter(l => {
      const clean = l.replace(/^#+\s*/, '').replace(/\*\*/g, '');
      return clean !== headline && l.length > 20 && l.length < 250;
    });

    // Second substantial line is often a subheadline
    return remaining[1]?.replace(/^#+\s*/, '').replace(/\*\*/g, '').trim().slice(0, 200);
  }

  /**
   * Try to extract a call-to-action from content body.
   */
  private extractCTA(body: string): string | undefined {
    // Common CTA patterns in marketing copy
    const ctaPatterns = [
      // Explicit CTA label
      /(?:call[- ]to[- ]action|cta)[:\s]+([^\n.]{5,70})/i,
      // Common CTA phrases at end of sentences
      /\b((?:get started|learn more|sign up|contact us|book (?:a )?demo|try (?:for )?free|schedule (?:a )?call|start (?:your )?free trial|request (?:a )?quote|download now|get (?:a )?quote|see pricing)[^\n.]{0,30})/i,
    ];

    for (const pattern of ctaPatterns) {
      const match = body.match(pattern);
      if (match?.[1]) {
        return match[1].trim().slice(0, 70);
      }
    }

    return undefined;
  }
}
