import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Navigate to local app
  await page.goto('http://localhost:3000');
  
  // Wait for the feed to load (e.g. wait for the message circle icon)
  await page.waitForSelector('.lucide-message-circle');
  
  // Find the first message circle button and click it
  const buttons = await page.$$('button:has(.lucide-message-circle)');
  if (buttons.length > 0) {
    console.log("Found comment button, clicking it...");
    await buttons[0].click();
    
    // Wait a bit for the modal to theoretically appear
    await page.waitForTimeout(1000);
    
    // Take a screenshot
    await page.screenshot({ path: 'screenshot.png' });
    console.log("Screenshot taken.");
  } else {
    console.log("No comment button found.");
  }
  
  await browser.close();
})();
