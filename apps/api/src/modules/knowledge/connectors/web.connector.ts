import { chromium } from 'playwright';
import { Logger } from '@nestjs/common';

export class WebConnector {
  private readonly logger = new Logger(WebConnector.name);

  async crawl(url: string, depth: number = 0): Promise<string> {
    this.logger.log(`Crawling URL: ${url} (depth: ${depth})`);
    
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
