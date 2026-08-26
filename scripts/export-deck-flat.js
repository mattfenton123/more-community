/**
 * export-deck-flat.js
 * 
 * Generates a PDF where each slide is a single flat JPEG screenshot.
 * No CSS gradients, no transparency layers, no overlays — just flat images.
 * This guarantees instant loading in any PDF viewer.
 */

const puppeteer = require('puppeteer');
const { PDFDocument } = require('pdf-lib');
const path = require('path');
const fs = require('fs');
const http = require('http');

const PORT = 8061;
const OUTPUT_PATH = 'C:/Users/msf19/Desktop/More-Investor-Deck-August-2026.pdf';

// ── Static file server ────────────────────────────────────
function startServer() {
  return new Promise((resolve) => {
    const mime = {
      '.html': 'text/html', '.css': 'text/css',
      '.js': 'application/javascript', '.png': 'image/png',
      '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
      '.webp': 'image/webp', '.svg': 'image/svg+xml',
    };
    const server = http.createServer((req, res) => {
      let fp = path.join(__dirname, '..', req.url.split('?')[0]);
      if (fp.endsWith(path.sep) || fp.endsWith('/')) fp += 'index.html';
      const ct = mime[path.extname(fp).toLowerCase()] || 'application/octet-stream';
      fs.readFile(fp, (err, data) => {
        if (err) { res.writeHead(404); res.end('Not found'); }
        else     { res.writeHead(200, { 'Content-Type': ct }); res.end(data); }
      });
    });
    server.listen(PORT, () => resolve(server));
  });
}

async function exportFlat() {
  const server = await startServer();

  console.log('🚀 Launching browser...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(60000);

  // Set viewport to 1280x720 (maps to 960x540pt in PDF)
  await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 2 });

  const url = `http://localhost:${PORT}/investor-deck.html`;
  console.log(`📄 Loading: ${url}`);
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
  await new Promise(r => setTimeout(r, 1500));

  // Count slides
  const slideCount = await page.evaluate(() =>
    document.querySelectorAll('.slide').length
  );
  console.log(`📊 Found ${slideCount} slides`);

  // Kill animations & hide nav
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        transition: none !important;
        animation: none !important;
        animation-duration: 0s !important;
        animation-fill-mode: both !important;
      }
      #navBar, .nav-bar, .key-hint, .progress-bar {
        display: none !important;
      }
    `
  });

  // Take a flat screenshot of each slide
  const screenshots = [];

  for (let i = 0; i < slideCount; i++) {
    console.log(`  📸 Capturing slide ${i + 1}/${slideCount}...`);

    // Show only slide i
    await page.evaluate((idx) => {
      document.querySelectorAll('.slide').forEach((s, j) => {
        s.classList.remove('active', 'prev');
        if (j === idx) s.classList.add('active');
      });
    }, i);

    await new Promise(r => setTimeout(r, 200));

    // Take a full-page JPEG screenshot at high quality
    const buf = await page.screenshot({
      type: 'jpeg',
      quality: 85,
      clip: { x: 0, y: 0, width: 1280, height: 720 }
    });

    screenshots.push(buf);
  }

  await browser.close();
  console.log('📎 Assembling PDF from flat screenshots...');

  // Build the PDF: each page is a single embedded JPEG image
  const pdf = await PDFDocument.create();

  // Page size in points: 960x540 (standard 16:9 at 72dpi)
  const PAGE_W = 960;
  const PAGE_H = 540;

  for (let i = 0; i < screenshots.length; i++) {
    const jpgImage = await pdf.embedJpg(screenshots[i]);
    const pg = pdf.addPage([PAGE_W, PAGE_H]);
    pg.drawImage(jpgImage, {
      x: 0, y: 0,
      width: PAGE_W,
      height: PAGE_H,
    });
  }

  const pdfBytes = await pdf.save();
  fs.writeFileSync(OUTPUT_PATH, pdfBytes);

  const sizeMB = (pdfBytes.length / 1024 / 1024).toFixed(2);
  console.log(`\n✅ PDF saved: ${OUTPUT_PATH}`);
  console.log(`   ${sizeMB} MB | ${slideCount} pages`);

  server.close();
}

exportFlat().catch(err => {
  console.error('❌ Export failed:', err);
  process.exit(1);
});
