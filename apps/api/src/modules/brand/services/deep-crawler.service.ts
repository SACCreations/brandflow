import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as dns from 'dns';
import { promisify } from 'util';

const dnsLookup = promisify(dns.lookup);

export interface CrawledPage {
  url: string;
  html: string;
  isMainPage: boolean;
}

@Injectable()
export class DeepCrawlerService {
  private readonly logger = new Logger(DeepCrawlerService.name);

  async crawl(baseUrl: string, maxPages = 3): Promise<CrawledPage[]> {
    this.logger.log(`Starting deep crawl for ${baseUrl}`);
    
    const normalizedBaseUrl = this.normalizeUrl(baseUrl);
    if (!normalizedBaseUrl) {
      throw new BadRequestException(`Invalid base URL: ${baseUrl}`);
    }

    await this.validateUrlSafety(normalizedBaseUrl);

    // Fetch the main page first
    const mainPageHtml = await this.fetchPage(normalizedBaseUrl);
    if (!mainPageHtml) {
      throw new BadRequestException(`Failed to fetch main page: ${normalizedBaseUrl}`);
    }

    const pages: CrawledPage[] = [{
      url: normalizedBaseUrl,
      html: mainPageHtml,
      isMainPage: true,
    }];

    // Extract links from main page
    const links = this.extractLinks(mainPageHtml, normalizedBaseUrl);
    const prioritizedLinks = this.prioritizeLinks(links, normalizedBaseUrl);
    
    // Fetch top links in parallel
    const urlsToFetch = prioritizedLinks.slice(0, maxPages - 1);
    
    if (urlsToFetch.length > 0) {
      this.logger.log(`Crawling ${urlsToFetch.length} subpages: ${urlsToFetch.join(', ')}`);
      
      const settled = await Promise.allSettled(
        urlsToFetch.map(async (url) => {
          await this.validateUrlSafety(url);
          const html = await this.fetchPage(url);
          if (!html) throw new Error(`Failed to fetch ${url}`);
          return { url, html, isMainPage: false };
        })
      );

      for (const result of settled) {
        if (result.status === 'fulfilled' && result.value) {
          pages.push(result.value);
        } else if (result.status === 'rejected') {
          this.logger.warn(`Failed to crawl subpage: ${result.reason}`);
        }
      }
    }

    return pages;
  }

  private async fetchPage(url: string): Promise<string | null> {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(8_000),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'text/html, text/plain, application/xhtml+xml',
        },
        redirect: 'follow',
      });

      if (!response.ok) {
        if (response.status === 403 || response.status === 401) {
          throw new Error(`Failed to fetch ${url} (${response.status}): The site may be blocking bots.`);
        }
        return null;
      }
      return await response.text();
    } catch (err: any) {
      if (err.message?.includes('blocking bots')) throw err;
      return null;
    }
  }

  private extractLinks(html: string, baseUrl: string): string[] {
    const matches = html.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>/gi);
    const links = new Set<string>();

    for (const match of matches) {
      const href = match[1];
      if (!href || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) {
        continue;
      }
      
      try {
        const url = new URL(href, baseUrl);
        const urlStr = url.toString().split('#')[0];
        if (urlStr && url.origin === new URL(baseUrl).origin) {
          links.add(urlStr); // ignore hashes
        }
      } catch (e) {
        // invalid URL
      }
    }

    return Array.from(links);
  }

  private prioritizeLinks(links: string[], baseUrl: string): string[] {
    const keywords = [
      '/about', '/product', '/features', '/pricing', '/careers', 
      '/company', '/story', '/mission', '/team', '/brand', '/media', '/press'
    ];
    
    // Sort links: those containing our keywords go to the top
    return links
      .filter(link => link !== baseUrl && link !== `${baseUrl}/`)
      .sort((a, b) => {
        const aLower = a.toLowerCase();
        const bLower = b.toLowerCase();
        
        const aScore = keywords.some(k => aLower.includes(k)) ? 1 : 0;
        const bScore = keywords.some(k => bLower.includes(k)) ? 1 : 0;
        
        return bScore - aScore;
      });
  }

  private normalizeUrl(value: string): string | null {
    try {
      const url = value.startsWith('http://') || value.startsWith('https://')
        ? new URL(value)
        : new URL(`https://${value}`);
      return url.toString();
    } catch {
      return null;
    }
  }

  private async validateUrlSafety(url: string): Promise<void> {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new BadRequestException(`Non-HTTP protocol rejected: ${parsed.protocol}`);
    }

    try {
      const lookupResult = await dnsLookup(parsed.hostname);
      const address = typeof lookupResult === 'string' ? lookupResult : (lookupResult as any)?.address;
      if (!address) {
        throw new BadRequestException(`Cannot resolve host: ${parsed.hostname}`);
      }
      if (this.isPrivateIp(address)) {
        throw new BadRequestException('Fetching private/reserved IP addresses is blocked.');
      }
    } catch (e: any) {
      if (e instanceof BadRequestException) throw e;
      throw new BadRequestException(`Cannot resolve host: ${parsed.hostname}`);
    }
  }

  private isPrivateIp(ip: string): boolean {
    const match = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (match) {
      const [o1, o2] = match.slice(1).map(Number);
      if (o1 === 127) return true;
      if (o1 === 10) return true;
      if (o1 === 172 && o2 !== undefined && o2 >= 16 && o2 <= 31) return true;
      if (o1 === 192 && o2 === 168) return true;
      if (o1 === 169 && o2 === 254) return true;
      if (ip === '0.0.0.0' || ip === '255.255.255.255') return true;
    }
    if (ip === '::1' || ip === '::' || ip.startsWith('fe80:') ||
        ip.startsWith('fc00:') || ip.startsWith('fd00:')) {
      return true;
    }
    return false;
  }
}
