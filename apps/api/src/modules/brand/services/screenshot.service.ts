import { Injectable, Logger } from '@nestjs/common';
import { chromium, Browser, Page } from 'playwright';

export interface ComputedStyles {
  headingFonts: string[];
  bodyFonts: string[];
}

export interface ScreenshotResult {
  homepageBase64: string | null;
  mobileBase64: string | null;
  subpagesBase64: string[];
  computedStyles?: ComputedStyles;
}

@Injectable()
export class ScreenshotService {
  private readonly logger = new Logger(ScreenshotService.name);

  async captureScreenshots(mainUrl: string, subUrls: string[] = []): Promise<ScreenshotResult> {
    this.logger.log(`Capturing screenshots for ${mainUrl} and ${subUrls.length} subpages`);
    let browser: Browser | null = null;
    
    try {
      browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
      
      const { base64: homepageBase64, computedStyles } = await this.capturePageWithStyles(browser, mainUrl, { width: 1440, height: 900 });
      const mobileBase64 = await this.capturePage(browser, mainUrl, { width: 390, height: 844 }, true);
      
      const subpagesBase64: string[] = [];
      const urlsToCapture = subUrls.slice(0, 3); // Max 3 subpages to avoid massive payloads
      
      for (const url of urlsToCapture) {
        const base64 = await this.capturePage(browser, url, { width: 1440, height: 900 }).catch(() => null);
        if (base64) subpagesBase64.push(base64);
      }

      return {
        homepageBase64,
        mobileBase64,
        subpagesBase64,
        computedStyles
      };
    } catch (error: any) {
      this.logger.error(`Failed to capture screenshots for ${mainUrl}: ${error.message}`);
      return {
        homepageBase64: null,
        mobileBase64: null,
        subpagesBase64: []
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

  private async capturePageWithStyles(browser: Browser, url: string, viewport: {width: number, height: number}): Promise<{ base64: string | null, computedStyles?: ComputedStyles }> {
    let page: Page | null = null;
    try {
      const context = await browser.newContext({ viewport });
      page = await context.newPage();
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(2000);
      
      const computedStyles = await page.evaluate(() => {
        const getFonts = (selector: string) => {
          const els = Array.from(document.querySelectorAll(selector)).slice(0, 50);
          return Array.from(new Set(els.map(el => {
            const computed = (window as any).getComputedStyle(el);
            const ff = computed ? computed.fontFamily : null;
            return ff ? ff.replace(/["']/g, '').split(',')[0].trim() : null;
          }).filter(Boolean))).slice(0, 5) as string[];
        };
        
        return {
          headingFonts: getFonts('h1, h2, h3, h4, h5, h6'),
          bodyFonts: getFonts('p, span, a')
        };
      }).catch(() => undefined);
      
      const buffer = await page.screenshot({ type: 'jpeg', quality: 60, fullPage: false });
      return { base64: buffer.toString('base64'), computedStyles };
    } catch (error) {
      this.logger.warn(`Failed to capture page with styles ${url}`);
      return { base64: null };
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
