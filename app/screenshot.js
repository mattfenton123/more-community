import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Using 127.0.0.1:3000 for the Next.js app
const baseUrl = 'http://127.0.0.1:3000';
const outputDir = path.join(__dirname, '..', 'images', 'screenshots');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function capture() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  // Set viewport to a nice desktop size
  await page.setViewport({ width: 1440, height: 900 });

  try {
    // 1. Discover Page
    console.log('Capturing Discover page...');
    await page.goto(`${baseUrl}/discover`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await new Promise(r => setTimeout(r, 4000));
    await page.screenshot({ path: path.join(outputDir, 'discover.png') });

    // 2. Community Page
    console.log('Capturing Community page...');
    await page.goto(`${baseUrl}/community/1`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await new Promise(r => setTimeout(r, 4000));
    await page.screenshot({ path: path.join(outputDir, 'community.png') });
  } catch (err) {
    console.error('Screenshot error:', err);
  } finally {
    await browser.close();
    console.log('Done!');
  }
}

capture().catch(console.error);
