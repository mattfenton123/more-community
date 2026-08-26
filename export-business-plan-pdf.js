/**
 * More Community — Business Plan PDF Export
 * ─────────────────────────────────────────────
 * Uses Puppeteer's native PDF renderer for crisp,
 * text-sharp output at A4 portrait.
 *
 * Usage:  node export-business-plan-pdf.js
 * Output: more-community-business-plan.pdf
 */

const puppeteer = require('puppeteer');
const fs        = require('fs');
const path      = require('path');
const http      = require('http');

const PORT   = 8057;
const OUT    = path.join(__dirname, 'more-community-business-plan.pdf');
const sleep  = (ms) => new Promise(r => setTimeout(r, ms));

// ── Static file server ────────────────────────────────────
function startServer() {
  return new Promise((resolve) => {
    const mime = {
      '.html': 'text/html', '.css': 'text/css',
      '.js': 'application/javascript', '.png': 'image/png',
      '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
      '.svg': 'image/svg+xml',
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
      if (err.code === 'EADDRINUSE') { console.log(`  ℹ Port ${PORT} in use — reusing`); resolve(null); }
      else throw err;
    });
  });
}

async function main() {
  console.log('\n📄  More Community — Business Plan → PDF\n');

  console.log('→ Starting server…');
  const server = await startServer();

  console.log('→ Launching browser…');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security'],
  });

  const page = await browser.newPage();

  // Full HD viewport so layout renders correctly before PDF
  await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });

  const url = `http://127.0.0.1:${PORT}/business-plan.html`;
  console.log(`→ Loading ${url}…`);
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

  // Let fonts and images settle
  await sleep(2500);

  // Inject print-mode CSS overrides:
  // • Dark background → white (readable on paper)
  // • Nav hidden
  // • Full-width layout
  // • Proper page breaks between sections
  await page.addStyleTag({ content: `
    @media print {
      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    }

    /* ── Keep dark theme for PDF (looks premium) ── */
    html, body {
      background: #020617 !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    /* ── Hide nav bar ── */
    .bp-nav { display: none !important; }

    /* ── Remove scroll reveal transforms so content is visible ── */
    .doc-section {
      opacity: 1 !important;
      transform: none !important;
      transition: none !important;
    }

    /* ── Cover: let it fill the first page ── */
    .cover {
      min-height: 100vh !important;
      page-break-after: always !important;
    }

    /* ── Page breaks before major sections ── */
    #founder   { page-break-before: always !important; }
    #problem   { page-break-before: always !important; }
    #opportunity { page-break-before: auto !important; }
    #product   { page-break-before: always !important; }
    #whynow    { page-break-before: always !important; }
    #whywin    { page-break-before: always !important; }
    #traction  { page-break-before: always !important; }
    #model     { page-break-before: always !important; }
    #competitors { page-break-before: always !important; }
    #expansion { page-break-before: always !important; }
    #ask       { page-break-before: always !important; }

    /* ── Prevent orphaned headings ── */
    h1, h2, h3 { page-break-after: avoid !important; }
    ul, table   { page-break-inside: avoid !important; }
  `});

  console.log('→ Generating PDF…');

  await page.pdf({
    path:   OUT,
    format: 'A4',
    printBackground: true,   // render background colours + images
    margin: {
      top:    '0',
      bottom: '0',
      left:   '0',
      right:  '0',
    },
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate: `
      <div style="
        width: 100%;
        font-family: 'Syne', sans-serif;
        font-size: 8px;
        color: rgba(255,255,255,0.2);
        display: flex;
        justify-content: space-between;
        padding: 0 2.5rem 1rem;
        box-sizing: border-box;
      ">
        <span>More Community — Business Plan 2026 · Confidential</span>
        <span class="pageNumber"></span>
      </div>
    `,
  });

  await browser.close();
  if (server) server.close();

  const size = (fs.statSync(OUT).size / 1024 / 1024).toFixed(1);
  console.log(`\n✅  Done!`);
  console.log(`   📄 ${OUT}`);
  console.log(`   📦 ${size} MB  ·  A4 portrait  ·  native PDF text\n`);
}

main().catch(err => {
  console.error('\n❌  Failed:', err.message);
  process.exit(1);
});
