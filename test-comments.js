import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  // Navigate to local app
  await page.goto('http://localhost:3000');
  
  // Wait for the feed to load (e.g. wait for the message circle icon)
  await page.waitForSelector('.lucide-message-circle');
  
  // Find the first message circle button and click it
  const buttons = await page.$$('button');
  let clicked = false;
  for (const btn of buttons) {
    const html = await page.evaluate(el => el.innerHTML, btn);
    if (html.includes('lucide-message-circle')) {
      console.log("Found comment button, clicking it...");
      await btn.click();
      clicked = true;
      break;
    }
  }
  
  if (clicked) {
    // Wait a bit for the modal to theoretically appear
    await new Promise(r => setTimeout(r, 1000));
    
    // Take a screenshot
    await page.screenshot({ path: 'screenshot.png' });
    console.log("Screenshot taken.");
  } else {
    console.log("No comment button found.");
  }
  
  await browser.close();
})();
