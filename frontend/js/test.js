(async () => {
  const puppeteer = (await import('puppeteer')).default;
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto('http://localhost:3000', {waitUntil: 'networkidle0'});
  
  await page.screenshot({ path: 'screenshot_final.png' });
  
  await browser.close();
})();
