const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://rentasst.com', { waitUntil: 'networkidle' });
  const text = await page.innerText('body');
  console.log(text.substring(0, 500));
  await browser.close();
})();
