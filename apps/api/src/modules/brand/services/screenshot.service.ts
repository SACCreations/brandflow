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

  async captureScreenshots(mainUrl: string, _subUrls: string[] = []): Promise<ScreenshotResult> {
    this.logger.log(`Capturing screenshots for ${mainUrl}`);

    // Hard 30-second cap so the screenshot step never blocks the whole pipeline
    const SCREENSHOT_TIMEOUT_MS = 30_000;
    const timeoutResult: ScreenshotResult = { homepageBase64: null, mobileBase64: null, subpagesBase64: [] };

    const capturePromise = this._captureScreenshots(mainUrl);
    return Promise.race([
      capturePromise,
      new Promise<ScreenshotResult>((resolve) => setTimeout(() => resolve(timeoutResult), SCREENSHOT_TIMEOUT_MS)),
    ]);
  }

  private async _captureScreenshots(mainUrl: string): Promise<ScreenshotResult> {
    let browser: Browser | null = null;

    try {
      browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });

      const [{ base64: homepageBase64, computedStyles }, mobileBase64] = await Promise.all([
        this.capturePageWithStyles(browser, mainUrl, { width: 1440, height: 900 }),
        this.capturePage(browser, mainUrl, { width: 390, height: 844 }, true),
      ]);

      // Skip subpage screenshots to keep payload small and avoid further timeouts
      return {
        homepageBase64,
        mobileBase64,
        subpagesBase64: [],
        computedStyles,
      };
    } catch (error: any) {
      this.logger.error(`Failed to capture screenshots for ${mainUrl}: ${error.message}`);
      return { homepageBase64: null, mobileBase64: null, subpagesBase64: [] };
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  private async capturePage(browser: Browser, url: string, viewport: { width: number; height: number }, isMobile = false): Promise<string | null> {
    let page: Page | null = null;
    try {
      const context = await browser.newContext({
        viewport,
        userAgent: isMobile
          ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
          : undefined,
        isMobile,
      });
      page = await context.newPage();
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 8000 });
      await page.waitForTimeout(500);

      const buffer = await page.screenshot({ type: 'jpeg', quality: 50, fullPage: false });
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

  private async capturePageWithStyles(browser: Browser, url: string, viewport: { width: number; height: number }): Promise<{ base64: string | null; computedStyles?: ComputedStyles }> {
    let page: Page | null = null;
    try {
      const context = await browser.newContext({ viewport });
      page = await context.newPage();
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 8000 });
      await page.waitForTimeout(500);

      const computedStyles = await page
        .evaluate(() => {
          const getFonts = (selector: string) => {
            const els = Array.from(document.querySelectorAll(selector)).slice(0, 30);
            return Array.from(
              new Set(
                els
                  .map((el) => {
                    const computed = (window as any).getComputedStyle(el);
                    const ff = computed ? computed.fontFamily : null;
                    return ff ? ff.replace(/["']/g, '').split(',')[0].trim() : null;
                  })
                  .filter(Boolean),
              ),
            ).slice(0, 5) as string[];
          };

          return {
            headingFonts: getFonts('h1, h2, h3'),
            bodyFonts: getFonts('p, span'),
          };
        })
        .catch(() => undefined);

      const buffer = await page.screenshot({ type: 'jpeg', quality: 50, fullPage: false });
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
}
