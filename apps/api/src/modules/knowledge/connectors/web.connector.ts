import { chromium } from 'playwright';
import { Logger, BadRequestException } from '@nestjs/common';
import * as dns from 'dns';
import { promisify } from 'util';

const dnsLookup = promisify(dns.lookup);

export class WebConnector {
  private readonly logger = new Logger(WebConnector.name);

  private isPrivateIp(ip: string): boolean {
    const ipv4Pattern = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const match = ip.match(ipv4Pattern);
    if (match) {
      const parts = match.slice(1).map(Number);
      const octet1 = parts[0] ?? 0;
      const octet2 = parts[1] ?? 0;
      const octet3 = parts[2] ?? 0;
      const octet4 = parts[3] ?? 0;

      if (octet1 === 127) return true; // Loopback
      if (octet1 === 10) return true;  // Class A Private
      if (octet1 === 172 && octet2 >= 16 && octet2 <= 31) return true; // Class B Private
      if (octet1 === 192 && octet2 === 168) return true; // Class C Private
      if (octet1 === 169 && octet2 === 254) return true; // Link-Local (AWS metadata)
      if (ip === '0.0.0.0' || ip === '255.255.255.255') return true;
    }
    
    // IPv6 checks (loopback, unspecified, link-local, unique local)
    if (ip === '::1' || ip === '::' || ip.startsWith('fe80:') || ip.startsWith('fc00:') || ip.startsWith('fd00:')) {
      return true;
    }
    return false;
  }

  async crawl(url: string, depth: number = 0): Promise<string> {
    this.logger.log(`Crawling URL: ${url} (depth: ${depth})`);
    
    try {
      const parsedUrl = new URL(url);
      
      // Enforce protocol checks (allow only HTTP and HTTPS)
      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        throw new BadRequestException(`Rejected crawling of non-HTTP protocol: ${parsedUrl.protocol}`);
      }

      // DNS lookup to fetch underlying IP address
      const lookupResult = await dnsLookup(parsedUrl.hostname);
      const resolvedIp = lookupResult.address;

      if (this.isPrivateIp(resolvedIp)) {
        this.logger.warn(`SSRF Block: URL ${url} resolved to private/loopback IP: ${resolvedIp}`);
        throw new BadRequestException(`Crawling of private, loopback, or reserved IP addresses is strictly blocked.`);
      }
    } catch (e: any) {
      if (e instanceof BadRequestException) throw e;
      this.logger.error(`SSRF Validation failed for URL ${url}: ${e.message}`);
      throw new BadRequestException(`Failed to validate URL safety: ${e.message}`);
    }
    
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      
      // Basic extraction: get title and main content
      const title = await page.title();
      
      // Clean up the page (remove scripts, styles, etc.)
      await page.evaluate(() => {
        const toRemove = ['script', 'style', 'nav', 'footer', 'header', 'aside'];
        toRemove.forEach(tag => {
          document.querySelectorAll(tag).forEach(el => el.remove());
        });
      });

      const bodyText = await page.innerText('body');
      
      // Return as pseudo-markdown
      return `# ${title}\n\nSource: ${url}\n\n${bodyText}`;
    } catch (err: any) {
      this.logger.error(`Failed to crawl ${url}: ${err.message}`);
      throw err;
    } finally {
      await browser.close();
    }
  }
}
