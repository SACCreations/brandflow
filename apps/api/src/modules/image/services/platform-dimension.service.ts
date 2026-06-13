import { Injectable } from '@nestjs/common';

/**
 * Platform dimension specification for poster generation.
 * Each platform has official recommended dimensions for optimal rendering.
 */
export interface PlatformSpec {
  id: string;
  width: number;
  height: number;
  label: string;
  group: string;
  orientation: 'portrait' | 'landscape' | 'square';
  aspectRatio: string;
}

/**
 * Official platform poster dimensions for all major social media and digital platforms.
 * Sources: Meta Business Help, LinkedIn Marketing, Google Ad specs, YouTube Creator Academy.
 */
export const PLATFORM_SPECS: Record<string, PlatformSpec> = {
  // ─── Instagram ────────────────────────────────────────────────
  instagram_post:    { id: 'instagram_post',    width: 1080, height: 1080, label: 'Instagram Post',         group: 'Instagram',  orientation: 'square',    aspectRatio: '1:1' },
  instagram_story:   { id: 'instagram_story',   width: 1080, height: 1920, label: 'Instagram Story',        group: 'Instagram',  orientation: 'portrait',  aspectRatio: '9:16' },
  instagram_reel:    { id: 'instagram_reel',    width: 1080, height: 1920, label: 'Instagram Reel',         group: 'Instagram',  orientation: 'portrait',  aspectRatio: '9:16' },
  instagram_ad:      { id: 'instagram_ad',      width: 1080, height: 1080, label: 'Instagram Ad',           group: 'Instagram',  orientation: 'square',    aspectRatio: '1:1' },

  // ─── Facebook ─────────────────────────────────────────────────
  facebook_post:     { id: 'facebook_post',     width: 1200, height: 630,  label: 'Facebook Post',         group: 'Facebook',   orientation: 'landscape', aspectRatio: '1.91:1' },
  facebook_ad:       { id: 'facebook_ad',       width: 1200, height: 628,  label: 'Facebook Ad',           group: 'Facebook',   orientation: 'landscape', aspectRatio: '1.91:1' },
  facebook_story:    { id: 'facebook_story',    width: 1080, height: 1920, label: 'Facebook Story',        group: 'Facebook',   orientation: 'portrait',  aspectRatio: '9:16' },
  facebook_cover:    { id: 'facebook_cover',    width: 851,  height: 315,  label: 'Facebook Cover Photo',  group: 'Facebook',   orientation: 'landscape', aspectRatio: '851:315' },

  // ─── LinkedIn ─────────────────────────────────────────────────
  linkedin_post:     { id: 'linkedin_post',     width: 1200, height: 627,  label: 'LinkedIn Post',         group: 'LinkedIn',   orientation: 'landscape', aspectRatio: '1.91:1' },
  linkedin_banner:   { id: 'linkedin_banner',   width: 1584, height: 396,  label: 'LinkedIn Banner',       group: 'LinkedIn',   orientation: 'landscape', aspectRatio: '4:1' },
  linkedin_ad:       { id: 'linkedin_ad',       width: 1200, height: 627,  label: 'LinkedIn Sponsored Ad', group: 'LinkedIn',   orientation: 'landscape', aspectRatio: '1.91:1' },
  linkedin_story:    { id: 'linkedin_story',    width: 1080, height: 1920, label: 'LinkedIn Story',        group: 'LinkedIn',   orientation: 'portrait',  aspectRatio: '9:16' },

  // ─── X (Twitter) ──────────────────────────────────────────────
  x_post:            { id: 'x_post',            width: 1600, height: 900,  label: 'X Post (16:9)',         group: 'X',          orientation: 'landscape', aspectRatio: '16:9' },
  x_ad:              { id: 'x_ad',              width: 1200, height: 675,  label: 'X Ad',                  group: 'X',          orientation: 'landscape', aspectRatio: '16:9' },
  x_cover:           { id: 'x_cover',           width: 1500, height: 500,  label: 'X Cover Photo',         group: 'X',          orientation: 'landscape', aspectRatio: '3:1' },

  // ─── YouTube ──────────────────────────────────────────────────
  youtube_thumbnail: { id: 'youtube_thumbnail', width: 1280, height: 720,  label: 'YouTube Thumbnail',     group: 'YouTube',    orientation: 'landscape', aspectRatio: '16:9' },
  youtube_banner:    { id: 'youtube_banner',    width: 2560, height: 1440, label: 'YouTube Channel Art',   group: 'YouTube',    orientation: 'landscape', aspectRatio: '16:9' },
  youtube_post:      { id: 'youtube_post',      width: 1080, height: 1080, label: 'YouTube Post',          group: 'YouTube',    orientation: 'square',    aspectRatio: '1:1' },

  // ─── Website ──────────────────────────────────────────────────
  website_banner:    { id: 'website_banner',    width: 1920, height: 600,  label: 'Website Hero Banner',   group: 'Website',    orientation: 'landscape', aspectRatio: '16:5' },
  website_square:    { id: 'website_square',    width: 800,  height: 800,  label: 'Website Square',        group: 'Website',    orientation: 'square',    aspectRatio: '1:1' },
  website_blog:      { id: 'website_blog',      width: 1200, height: 630,  label: 'Website Blog Cover',    group: 'Website',    orientation: 'landscape', aspectRatio: '1.91:1' },

  // ─── Google Ads ───────────────────────────────────────────────
  google_display:    { id: 'google_display',    width: 300,  height: 250,  label: 'Google Display Ad',     group: 'Google Ads', orientation: 'square',    aspectRatio: '6:5' },
  google_leaderboard:{ id: 'google_leaderboard',width: 728,  height: 90,   label: 'Google Leaderboard',    group: 'Google Ads', orientation: 'landscape', aspectRatio: '728:90' },
  google_billboard:  { id: 'google_billboard',  width: 970,  height: 250,  label: 'Google Billboard',      group: 'Google Ads', orientation: 'landscape', aspectRatio: '970:250' },
  google_skyscraper: { id: 'google_skyscraper', width: 120,  height: 600,  label: 'Google Skyscraper',     group: 'Google Ads', orientation: 'portrait',  aspectRatio: '1:5' },

  // ─── Email ────────────────────────────────────────────────────
  email_header:      { id: 'email_header',      width: 600,  height: 200,  label: 'Email Header Banner',   group: 'Email',      orientation: 'landscape', aspectRatio: '3:1' },
};

@Injectable()
export class PlatformDimensionService {

  /**
   * Get dimension spec for a platform ID.
   * Falls back to instagram_post if the platform is not found.
   */
  getDimensions(platform: string): PlatformSpec {
    return PLATFORM_SPECS[platform] ?? PLATFORM_SPECS['instagram_post']!;
  }

  /**
   * Get all platform specs grouped by social network.
   */
  getAllPlatforms(): Record<string, PlatformSpec[]> {
    const groups: Record<string, PlatformSpec[]> = {};
    for (const spec of Object.values(PLATFORM_SPECS)) {
      if (!groups[spec.group]) groups[spec.group] = [];
      groups[spec.group]!.push(spec);
    }
    return groups;
  }

  /**
   * Get a flat list of all platform specs.
   */
  getAllPlatformsList(): PlatformSpec[] {
    return Object.values(PLATFORM_SPECS);
  }

  /**
   * Resolve dimensions from a platform ID, returning width and height.
   * Safe fallback to 1080x1080 if unknown.
   */
  resolve(platform: string): { width: number; height: number; aspectRatio: string; label: string } {
    const spec = this.getDimensions(platform);
    return {
      width: spec.width,
      height: spec.height,
      aspectRatio: spec.aspectRatio,
      label: spec.label,
    };
  }
}
