/**
 * More Community — Commercials PDF Export
 * ─────────────────────────────────────────────
 * Uses Puppeteer's native PDF renderer for crisp,
 * text-sharp output at A4 portrait.
 *
 * Usage:  node export-commercials-pdf.js
 * Output: more-community-commercials.pdf
 */

const puppeteer = require('puppeteer');
const fs        = require('fs');
const path      = require('path');
const http      = require('http');

const PORT   = 8059;
const OUT    = path.join(__dirname, 'more-community-commercials.pdf');
const sleep  = (ms) => new Promise(r => setTimeout(r, ms));

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
  console.log('\n📄  More Community — Commercials & Competitor Analysis → PDF\n');
  
  const server = await startServer();
  console.log('  ✓ Local server running');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });
  console.log('  ✓ Browser launched');
  
  const page = await browser.newPage();
  
  // Load the commercials page
  await page.goto(`http://127.0.0.1:${PORT}/commercials.html`, {
    waitUntil: 'networkidle0',
    timeout: 30000
  });
  console.log('  ✓ Page loaded');
  
  // Wait for fonts
  await page.evaluateHandle('document.fonts.ready');
  await sleep(1500);
  console.log('  ✓ Fonts ready');

  // Generate PDF
  await page.pdf({
    path: OUT,
    format: 'A4',
    printBackground: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
    preferCSSPageSize: false,
    displayHeaderFooter: false,
  });
  
  const stats = fs.statSync(OUT);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(1);
  console.log(`\n  ✅ PDF exported: ${OUT}`);
  console.log(`  📦 Size: ${sizeMB} MB\n`);

  await browser.close();
  if (server) server.close();
}

main().catch(err => {
  console.error('❌ Export failed:', err.message);
  process.exit(1);
});
