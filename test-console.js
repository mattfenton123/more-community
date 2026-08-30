import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  
  // Navigate to local app
  await page.goto('http://127.0.0.1:3000', { waitUntil: 'networkidle0' });
  
  // Wait a bit
  await new Promise(r => setTimeout(r, 2000));
  
  // Screenshot
  await page.screenshot({ path: 'screenshot3.png' });
  console.log("Screenshot taken.");
  
  await browser.close();
})();
