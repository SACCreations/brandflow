import { DeepCrawlerService } from './apps/api/src/modules/brand/services/deep-crawler.service';
import { ScreenshotService } from './apps/api/src/modules/brand/services/screenshot.service';
import { Logger } from '@nestjs/common';

async function run() {
  const crawler = new DeepCrawlerService();
  console.time('Crawl');
  try {
    const pages = await crawler.crawl('https://linear.app', 3);
    console.log(`Crawled ${pages.length} pages`);
  } catch (e) {
    console.error(e);
  }
  console.timeEnd('Crawl');

  const screenshot = new ScreenshotService();
  console.time('Screenshot');
  try {
    const res = await screenshot.captureScreenshots('https://linear.app', ['https://linear.app/about']);
    console.log(`Captured main, mobile, and ${res.subpagesBase64.length} subpages`);
  } catch(e) {
    console.error(e);
  }
  console.timeEnd('Screenshot');
}

run();
