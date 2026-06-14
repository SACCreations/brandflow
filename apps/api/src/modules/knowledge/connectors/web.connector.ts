import { chromium } from 'playwright';
import { Logger, BadRequestException } from '@nestjs/common';
import * as dns from 'dns';
import { promisify } from 'util';
import fetch from 'node-fetch';

const dnsLookup = promisify(dns.lookup);

export class WebConnector {
  private readonly logger = new Logger(WebConnector.name);

  // -------------------------------------------------------------------------
  // SSRF guard: returns true if the IP is private/reserved
  // -------------------------------------------------------------------------
  private isPrivateIp(ip: string): boolean {
    const ipv4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const match = ip.match(ipv4);
    if (match) {
      const [o1, o2] = match.slice(1).map(Number);
      if (o1 === 127) return true;                          // loopback
      if (o1 === 10) return true;                           // Class A private
      if (o1 === 172 && o2 !== undefined && o2 >= 16 && o2 <= 31) return true; // Class B private
      if (o1 === 192 && o2 === 168) return true;           // Class C private
      if (o1 === 169 && o2 === 254) return true;           // link-local / AWS metadata
      if (ip === '0.0.0.0' || ip === '255.255.255.255') return true;
    }
    // IPv6 loopback / link-local / unique-local
    if (ip === '::1' || ip === '::' || ip.startsWith('fe80:') ||
        ip.startsWith('fc00:') || ip.startsWith('fd00:')) {
      return true;
    }
    return false;
  }

  // -------------------------------------------------------------------------
  // Validate URL safety (SSRF protection)
  // -------------------------------------------------------------------------
  private async validateUrl(rawUrl: string): Promise<string> {
    // Ensure protocol
    let targetUrl = rawUrl.trim();
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = 'https://' + targetUrl;
    }

    let parsed: URL;
    try {
      parsed = new URL(targetUrl);
    } catch {
      throw new BadRequestException(`Invalid URL: ${rawUrl}`);
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new BadRequestException(`Non-HTTP protocol rejected: ${parsed.protocol}`);
    }

    try {
      const lookupResult = await dnsLookup(parsed.hostname);
      // Node util.promisify on dns.lookup returns either a string (if old node) or { address, family }
      const address = typeof lookupResult === 'string' ? lookupResult : (lookupResult as any)?.address;
      
      if (!address) {
        throw new BadRequestException(`Cannot resolve host: ${parsed.hostname}`);
      }

      if (this.isPrivateIp(address)) {
        this.logger.warn(`SSRF block: ${targetUrl} → ${address}`);
        throw new BadRequestException('Crawling of private/reserved IP addresses is blocked.');
      }
    } catch (e: any) {
      if (e instanceof BadRequestException) throw e;
      this.logger.error(`DNS lookup failed for ${parsed.hostname}: ${e.message}`);
      throw new BadRequestException(`Cannot resolve host: ${parsed.hostname}`);
    }

    return targetUrl;
  }

  // -------------------------------------------------------------------------
  // Fetch with exponential back-off (3 attempts, jittered)
  // -------------------------------------------------------------------------
  private async fetchWithRetry(url: string): Promise<string> {
    const MAX = 3;
    let lastErr: Error | undefined;

    for (let attempt = 1; attempt <= MAX; attempt++) {
      try {
        this.logger.log(`fetch attempt ${attempt}/${MAX} → ${url}`);
        const res = await fetch(url, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
              '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
          timeout: 15000,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.text();
      } catch (err: any) {
        lastErr = err;
        this.logger.warn(`attempt ${attempt} failed: ${err.message}`);
        if (attempt < MAX) {
          const delay = Math.pow(2, attempt) * 200 + Math.random() * 100;
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    }

    throw lastErr ?? new Error('All fetch attempts failed');
  }

  // -------------------------------------------------------------------------
  // Strip HTML and decode entities → plain text
  // -------------------------------------------------------------------------
  private htmlToText(html: string): string {
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
      .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  // -------------------------------------------------------------------------
  // Primary crawl entry-point
  // -------------------------------------------------------------------------
  async crawl(url: string, depth: number = 0): Promise<string> {
    this.logger.log(`crawl() started: ${url} (depth=${depth})`);

    // 1. SSRF validation + protocol normalisation
    const safeUrl = await this.validateUrl(url);

    // 2. Try Playwright first (handles JS-heavy pages)
    let browser: any;
    try {
      this.logger.log(`Playwright: launching for ${safeUrl}`);
      browser = await chromium.launch({ headless: true });
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto(safeUrl, { waitUntil: 'networkidle', timeout: 30000 });

      await page.evaluate(() => {
        ['script', 'style', 'nav', 'footer', 'header', 'aside'].forEach((tag) => {
          document.querySelectorAll(tag).forEach((el) => el.remove());
        });
      });

      const title = await page.title();
      const bodyText = await page.innerText('body');
      await browser.close();
      this.logger.log(`Playwright: success for ${safeUrl}`);
      return `# ${title}\n\nSource: ${safeUrl}\n\n${bodyText}`;
    } catch (playwrightErr: any) {
      this.logger.warn(`Playwright failed (${playwrightErr.message}), falling back to node-fetch`);
      try {
        if (browser) await browser.close();
      } catch (_) {
        // ignore browser close failure on error fallback
      }
    }

    // 3. Fallback: node-fetch + HTML → text
    try {
      const html = await this.fetchWithRetry(safeUrl);
      const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      const title = (titleMatch && titleMatch[1]) ? titleMatch[1].trim() : 'Crawled Content';
      const bodyText = this.htmlToText(html);
      this.logger.log(`node-fetch fallback: success for ${safeUrl}`);
      return `# ${title}\n\nSource: ${safeUrl}\n\n${bodyText}`;
    } catch (fetchErr: any) {
      this.logger.error(`Both Playwright and node-fetch failed for ${safeUrl}: ${fetchErr.message}`);
      throw new Error(`Failed to crawl URL: ${fetchErr.message}`);
    }
  }
}
