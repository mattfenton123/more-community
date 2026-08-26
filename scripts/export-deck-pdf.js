/**
 * export-deck-pdf.js
 * Exports investor-deck.html to a multi-page PDF.
 * Strategy: render each slide individually as a native single-page PDF via
 * Puppeteer, then merge all pages with pdf-lib. No screenshots.
 * Usage: node scripts/export-deck-pdf.js
 */

const puppeteer = require('puppeteer');
const { PDFDocument } = require('pdf-lib');
const path = require('path');
const fs = require('fs');
const os = require('os');
const http = require('http');

const PORT = 8060;
const OUTPUT_PATH = 'C:/Users/msf19/Desktop/more-community-investor-deck-final-v7.pdf';
const TEMP_DIR = path.join(os.tmpdir(), 'deck-pdf-' + Date.now());

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
      if (fp.endsWith('/')) fp += 'index.html';
      const ct = mime[path.extname(fp).toLowerCase()] || 'application/octet-stream';
      fs.readFile(fp, (err, data) => {
        if (err) { res.writeHead(404); res.end('Not found'); }
        else     { res.writeHead(200, { 'Content-Type': ct }); res.end(data); }
      });
    });
    server.listen(PORT, () => resolve(server));
  });
}

async function exportDeckToPDF() {
  const server = await startServer();
  fs.mkdirSync(TEMP_DIR, { recursive: true });

  console.log('🚀 Launching browser...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
  });

  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(60000);

  // Set viewport to 1280x720 before loading.
  // 1280x720px in Puppeteer = 960x540 points in PDF, perfectly matching the original document scale.
  await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });

  const fileUrl = `http://localhost:${PORT}/investor-deck.html`;
  console.log(`📄 Loading: ${fileUrl}`);
  await page.goto(fileUrl, { waitUntil: 'networkidle0', timeout: 60000 });
  await new Promise(r => setTimeout(r, 1000));

  const slideCount = await page.evaluate(() =>
    document.querySelectorAll('.slide').length
  );
  console.log(`📊 Found ${slideCount} slides`);

  // Detect the slide dimensions once
  const { w, h } = await page.evaluate(() => {
    const el = document.querySelector('.slide');
    if (!el) return { w: 1280, h: 720 };
    const r = el.getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height) };
  });

  console.log(`📐 Slide dimensions: ${w}×${h}px`);

  // Before injecting CSS, let's swap the huge PNG images for our highly compressed JPEGs
  await page.evaluate(() => {
    document.querySelectorAll('img').forEach(img => {
      if (img.src.endsWith('.png') && !img.src.includes('logo')) {
        img.src = img.src.replace('.png', '-opt.jpg');
      }
    });
  });

  await new Promise(r => setTimeout(r, 500));

  // Inject a print stylesheet that unstacks the slides, and heavily simplifies the CSS
  await page.addStyleTag({
    content: `
      @media print {
        *, *::before, *::after {
          transition: none !important;
          animation: none !important;
          animation-duration: 0s !important;
          /* Strip all complex CSS filters and gradients that cause PDF viewer lag */
          backdrop-filter: none !important;
          filter: none !important;
          mix-blend-mode: normal !important;
          box-shadow: none !important;
        }
        
        /* Replace all complex gradients with simple translucent solid colors */
        .bg-overlay-dark, .bg-overlay-left, .bg-overlay-right, .bg-overlay-center, 
        .s2-img-grad, .split-right-overlay, .split-right-overlay-r {
          background: rgba(15, 23, 42, 0.85) !important;
        }
        
        html, body {
          height: auto !important;
          overflow: visible !important;
          background: var(--slate-950) !important;
        }
        .deck {
          height: auto !important;
          overflow: visible !important;
          display: block !important;
          position: static !important;
        }
        .slide {
          position: relative !important;
          display: flex !important;
          opacity: 1 !important;
          transform: none !important;
          pointer-events: auto !important;
          width: ${w}px !important;
          height: ${h}px !important;
          overflow: hidden !important;
          page-break-after: always !important;
          page-break-inside: avoid !important;
        }
        .slide:last-child {
          page-break-after: auto !important;
        }
        #navBar, .nav-bar, .key-hint, .progress-bar {
          display: none !important;
        }
      }
    `
  });

  console.log('🖨️  Generating single native PDF document...');

  // Generate the whole document in one native pass!
  await page.pdf({
    path: OUTPUT_PATH,
    width: `${w}px`,
    height: `${h}px`,
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 }
  });

  await browser.close();

  const sizeMB = (fs.statSync(OUTPUT_PATH).size / 1024 / 1024).toFixed(2);
  console.log(`\n✅ PDF saved: ${OUTPUT_PATH}`);
  console.log(`   ${sizeMB} MB`);
  
  server.close();
}

exportDeckToPDF().catch(err => {
  console.error('❌ Export failed:', err);
  process.exit(1);
});
