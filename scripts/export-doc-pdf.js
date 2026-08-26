/**
 * export-doc-pdf.js
 * Exports long-form document HTML pages to A4 portrait PDFs.
 * Usage: node scripts/export-doc-pdf.js <input.html> [output.pdf]
 *
 * Examples:
 *   node scripts/export-doc-pdf.js business-plan.html
 *   node scripts/export-doc-pdf.js commercials.html
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const inputFile = process.argv[2];
if (!inputFile) {
  console.error('Usage: node scripts/export-doc-pdf.js <input.html> [output.pdf]');
  process.exit(1);
}

const ROOT = path.resolve(__dirname, '..');
const INPUT_PATH = path.resolve(ROOT, inputFile);
const outputFile = process.argv[3] || inputFile.replace(/\.html$/i, '.pdf');
const OUTPUT_PATH = path.resolve(ROOT, outputFile);

async function exportDocToPDF() {
  if (!fs.existsSync(INPUT_PATH)) {
    console.error(`❌ File not found: ${INPUT_PATH}`);
    process.exit(1);
  }

  console.log(`🚀 Launching browser...`);
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--allow-file-access-from-files']
  });

  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(60000);

  // Full-width viewport at high DPI
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

  const fileUrl = `file:///${INPUT_PATH.replace(/\\/g, '/')}`;
  console.log(`📄 Loading: ${fileUrl}`);
  await page.goto(fileUrl, { waitUntil: 'networkidle0', timeout: 60000 });

  // Wait for fonts/images
  await new Promise(r => setTimeout(r, 1500));

  // Inject print overrides: suppress animations, ensure backgrounds render
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        transition: none !important;
        animation: none !important;
      }
      .doc-section, .slide, .anim-1, .anim-2, .anim-3, .anim-4, .anim-img, [style*="opacity"] {
        opacity: 1 !important;
        transform: none !important;
      }
      nav, header, .nav, .navbar, .top-bar {
        position: static !important;
      }
    `
  });

  console.log(`🖨️  Generating PDF...`);
  const pdfBytes = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
    preferCSSPageSize: true
  });

  await browser.close();
  
  fs.writeFileSync(OUTPUT_PATH, pdfBytes);

  const sizeMB = (pdfBytes.length / 1024 / 1024).toFixed(2);
  console.log(`\n✅ PDF saved to: ${OUTPUT_PATH}`);
  console.log(`   Size: ${sizeMB} MB`);
}

exportDocToPDF().catch(err => {
  console.error('❌ Export failed:', err);
  process.exit(1);
});
