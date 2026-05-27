import { Injectable, Logger } from '@nestjs/common';
import { chromium, Browser, Page } from 'playwright';

export interface ScreenshotResult {
  homepageBase64: string | null;
  mobileBase64: string | null;
  pricingBase64: string | null;
  aboutBase64: string | null;
}

@Injectable()
export class ScreenshotService {
  private readonly logger = new Logger(ScreenshotService.name);

  async captureScreenshots(baseUrl: string): Promise<ScreenshotResult> {
    this.logger.log(`Capturing screenshots for ${baseUrl}`);
    let browser: Browser | null = null;
    
    try {
      browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
      
      const homepageBase64 = await this.capturePage(browser, baseUrl, { width: 1440, height: 900 });
      const mobileBase64 = await this.capturePage(browser, baseUrl, { width: 390, height: 844 }, true);
      
      // Try to find pricing and about pages
      const pricingUrl = this.resolveUrl(baseUrl, '/pricing');
      const pricingBase64 = await this.capturePage(browser, pricingUrl, { width: 1440, height: 900 }).catch(() => null);
      
      const aboutUrl = this.resolveUrl(baseUrl, '/about');
      const aboutBase64 = await this.capturePage(browser, aboutUrl, { width: 1440, height: 900 }).catch(() => null);

      return {
        homepageBase64,
        mobileBase64,
        pricingBase64,
        aboutBase64
      };
    } catch (error: any) {
      this.logger.error(`Failed to capture screenshots for ${baseUrl}: ${error.message}`);
      return {
        homepageBase64: null,
        mobileBase64: null,
        pricingBase64: null,
        aboutBase64: null
      };
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  private async capturePage(browser: Browser, url: string, viewport: {width: number, height: number}, isMobile = false): Promise<string | null> {
    let page: Page | null = null;
    try {
      const context = await browser.newContext({
        viewport,
        userAgent: isMobile ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1' : undefined,
        isMobile
      });
      page = await context.newPage();
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      // Wait a bit for animations/fonts
      await page.waitForTimeout(2000);
      
      const buffer = await page.screenshot({ type: 'jpeg', quality: 60, fullPage: false });
      return buffer.toString('base64');
    } catch (error) {
      this.logger.warn(`Failed to capture page ${url}`);
      return null;
    } finally {
      if (page) {
        await page.close();
      }
    }
  }

  private resolveUrl(base: string, path: string): string {
    try {
      return new URL(path, base).toString();
    } catch {
      return base;
    }
  }
}
