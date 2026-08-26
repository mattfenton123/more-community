/**
 * More Community — Investor Deck PDF Exporter
 * ─────────────────────────────────────────────
 * Captures each slide exactly as it appears in the browser
 * (native 16:9 landscape) and assembles a widescreen PDF.
 *
 * No CSS overrides — what you see in the browser is what you get.
 *
 * Usage:  node export-deck-pdf.js
 * Output: more-community-investor-deck.pdf
 */

const puppeteer   = require('puppeteer');
const PDFDocument = require('pdfkit');
const fs          = require('fs');
const path        = require('path');
const http        = require('http');

// ── Config ────────────────────────────────────────────────
const PORT         = 8056;           // fresh port to avoid conflicts
const TOTAL_SLIDES = 17;
const OUT_PDF      = path.join(__dirname, 'more-community-investor-deck.pdf');
const TMP_DIR      = path.join(__dirname, '_pdf_frames');

// Render at 2× scale for sharp images
// Physical viewport: 1280×720 (HD 16:9), captured at 2× = 2560×1440
const DEVICE_SCALE = 2;
const VP_W         = 1280;
const VP_H         = 720;
// Actual pixel dims of each screenshot
const PX_W         = VP_W * DEVICE_SCALE;  // 2560
const PX_H         = VP_H * DEVICE_SCALE;  // 1440

// PDF page size in points — 16:9 widescreen landscape
// 1 pt = 1/72 inch.  10" × 5.625" = 720 × 405 pt is standard slide size.
// We use a slightly larger 960×540 for more resolution room.
const PDF_W = 960;
const PDF_H = 540;

// ── Sleep helper ──────────────────────────────────────────
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ── Inline static server ──────────────────────────────────
function startServer() {
  return new Promise((resolve) => {
    const mime = {
      '.html': 'text/html',
      '.css':  'text/css',
      '.js':   'application/javascript',
      '.png':  'image/png',
      '.jpg':  'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.svg':  'image/svg+xml',
      '.ico':  'image/x-icon',
    };

    const server = http.createServer((req, res) => {
      let fp = path.join(__dirname, req.url.split('?')[0]);
      if (fp.endsWith('/')) fp += 'index.html';
      const ct = mime[path.extname(fp).toLowerCase()] || 'application/octet-stream';
      fs.readFile(fp, (err, data) => {
        if (err) { res.writeHead(404); res.end('Not found'); }
        else     { res.writeHead(200, { 'Content-Type': ct }); res.end(data); }
      });
    });

    server.listen(PORT, '127.0.0.1', () => {
      console.log(`  ✓ Server → http://127.0.0.1:${PORT}`);
      resolve(server);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`  ℹ Port ${PORT} already in use — reusing`);
        resolve(null);
      } else throw err;
    });
  });
}

// ── Main ──────────────────────────────────────────────────
async function main() {
  console.log('\n🎨  More Community — Investor Deck → PDF (16:9 Widescreen)\n');

  if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR);

  // Start server
  console.log('→ Starting local server…');
  const server = await startServer();

  // Launch Puppeteer with a proper display size
  console.log('→ Launching headless browser…');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      `--window-size=${VP_W},${VP_H}`,
      '--disable-features=VizDisplayCompositor',
      '--font-render-hinting=none',    // sharper text
    ],
  });

  const page = await browser.newPage();

  // Set exact 16:9 viewport at 2× pixel density
  await page.setViewport({
    width:             VP_W,
    height:            VP_H,
    deviceScaleFactor: DEVICE_SCALE,
  });

  // Load the deck
  const url = `http://127.0.0.1:${PORT}/investor-deck.html`;
  console.log(`→ Loading ${url}…`);
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

  // Hide the nav bar and key hint for clean export
  await page.addStyleTag({
    content: `
      .nav-bar, .key-hint, .progress-bar { display: none !important; }
      .slide { transition: none !important; }
      .slide.active { animation: none !important; }
      * { animation-duration: 0.01ms !important; }
    `,
  });

  // Allow fonts + hero images to fully paint
  await sleep(2500);

  const screenshotPaths = [];
  console.log(`\n→ Capturing ${TOTAL_SLIDES} slides…\n`);

  for (let i = 0; i < TOTAL_SLIDES; i++) {
    // Activate the target slide directly via JS — no animation delay
    await page.evaluate((index) => {
      const slides = document.querySelectorAll('.slide');
      slides.forEach((s, idx) => {
        s.classList.remove('active', 'prev');
        if (idx === index) s.classList.add('active');
      });
    }, i);

    // Short settle time for any CSS that still runs
    await sleep(400);

    const imgPath = path.join(TMP_DIR, `slide-${String(i + 1).padStart(2, '0')}.png`);

    await page.screenshot({
      path:     imgPath,
      fullPage: false,
      type:     'png',
      // Clip to exact logical viewport (Puppeteer uses logical px for clip)
      clip:     { x: 0, y: 0, width: VP_W, height: VP_H },
    });

    screenshotPaths.push(imgPath);
    process.stdout.write(`  ✓ Slide ${String(i + 1).padStart(2, ' ')} / ${TOTAL_SLIDES}\n`);
  }

  await browser.close();
  if (server) server.close();

  // ── Assemble PDF ───────────────────────────────────────
  console.log('\n→ Assembling PDF…');

  const doc = new PDFDocument({
    size:          [PDF_W, PDF_H],   // 960 × 540 pts = 16:9 widescreen landscape
    layout:        'landscape',
    autoFirstPage: false,
    margins:       { top: 0, bottom: 0, left: 0, right: 0 },
    info: {
      Title:    'More Community — Investor Deck 2026',
      Author:   'More Community',
      Subject:  'Community infrastructure for real-life connection',
      Keywords: 'More Community, investor, community, connection',
      Creator:  'morecommunity.co.uk',
    },
  });

  const ws = fs.createWriteStream(OUT_PDF);
  doc.pipe(ws);

  for (let i = 0; i < screenshotPaths.length; i++) {
    // PDFDocument's size param already defines landscape orientation here
    doc.addPage({
      size:    [PDF_W, PDF_H],
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
    });
    // Stretch the high-res screenshot to fill the page exactly — edge to edge
    doc.image(screenshotPaths[i], 0, 0, { width: PDF_W, height: PDF_H });
    process.stdout.write(`  ✓ Page  ${String(i + 1).padStart(2, ' ')} / ${TOTAL_SLIDES}\n`);
  }

  doc.end();
  await new Promise((resolve, reject) => {
    ws.on('finish', resolve);
    ws.on('error', reject);
  });

  // Cleanup tmp frames
  console.log('\n→ Cleaning up…');
  screenshotPaths.forEach(p => { try { fs.unlinkSync(p); } catch (_) {} });
  try { fs.rmdirSync(TMP_DIR); } catch (_) {}

  const size = (fs.statSync(OUT_PDF).size / 1024 / 1024).toFixed(1);
  console.log(`\n✅  Done!`);
  console.log(`   📄 ${OUT_PDF}`);
  console.log(`   📦 ${size} MB  ·  ${TOTAL_SLIDES} pages  ·  16:9 widescreen (${PDF_W} × ${PDF_H} pt)\n`);
}

main().catch((err) => {
  console.error('\n❌  Export failed:', err.message);
  console.error(err.stack);
  process.exit(1);
});
