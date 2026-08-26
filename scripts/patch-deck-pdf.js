/**
 * patch-deck-pdf.js
 * Takes the original investor deck PDF from the Desktop, keeps pages 1-12 intact,
 * and replaces pages 13-17 with freshly rendered slides from investor-deck.html
 * at the exact same page dimensions (960×540 pts, 16:9).
 * Usage: node scripts/patch-deck-pdf.js
 */

const puppeteer = require('puppeteer');
const { PDFDocument } = require('pdf-lib');
const path = require('path');
const fs = require('fs');
const os = require('os');

const DECK_HTML   = path.resolve(__dirname, '../investor-deck.html');
const SOURCE_PDF  = 'C:/Users/msf19/Desktop/more-community-investor-deck.pdf';
const OUTPUT_PDF  = 'C:/Users/msf19/Desktop/more-community-investor-deck-new.pdf';

// Page size of the original PDF (960×540 pts = 16:9)
const PAGE_W_PT = 960;
const PAGE_H_PT = 540;

// Which slides changed / are new (0-indexed): 12=slide13, 13=slide14(new), 14=slide15, 15=slide16, 16=slide17
// We replace everything from slide 13 onwards (index 12+)
const REPLACE_FROM_SLIDE = 12; // 0-indexed; keep slides 0-11 from original

// 1280x720px in Puppeteer maps EXACTLY to 960x540 points in the PDF (1px = 0.75pt)
// This will fix the "too far away" issue and the white borders.
const RENDER_W_PX = 1280;
const RENDER_H_PX = 720;

const TEMP_DIR = path.join(os.tmpdir(), 'deck-patch-' + Date.now());

async function patchDeck() {
  fs.mkdirSync(TEMP_DIR, { recursive: true });

  // --- Step 1: Render new slides via Puppeteer ---
  console.log('🚀 Launching browser...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--allow-file-access-from-files']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: RENDER_W_PX, height: RENDER_H_PX, deviceScaleFactor: 1 });

  const fileUrl = `file:///${DECK_HTML.replace(/\\/g, '/')}`;
  console.log(`📄 Loading: ${fileUrl}`);
  await page.goto(fileUrl, { waitUntil: 'networkidle0', timeout: 60000 });
  await new Promise(r => setTimeout(r, 1000));

  const totalSlides = await page.evaluate(() =>
    document.querySelectorAll('.slide').length
  );
  console.log(`📊 Total slides in HTML: ${totalSlides}`);
  console.log(`   Rendering slides ${REPLACE_FROM_SLIDE + 1}–${totalSlides} (new/changed)`);

  // Suppress animations & hide nav
  await page.addStyleTag({
    content: `
      *, *::before, *::after { transition: none !important; animation: none !important; animation-duration: 0s !important; }
      #navBar, .nav-bar { display: none !important; }
    `
  });

  const newSlidePdfs = [];

  for (let i = REPLACE_FROM_SLIDE; i < totalSlides; i++) {
    console.log(`  🖨️  Rendering slide ${i + 1}/${totalSlides}...`);

    await page.evaluate((idx) => {
      document.querySelectorAll('.slide').forEach((s, j) => {
        s.classList.remove('active', 'prev');
        if (j === idx) s.classList.add('active');
      });
    }, i);

    await new Promise(r => setTimeout(r, 150));

    const outPath = path.join(TEMP_DIR, `slide-${String(i + 1).padStart(3, '0')}.pdf`);
    await page.pdf({
      path: outPath,
      width: `${RENDER_W_PX}px`,
      height: `${RENDER_H_PX}px`,
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      pageRanges: '1'
    });
    newSlidePdfs.push(outPath);
  }

  await browser.close();

  // --- Step 2: Load original PDF, keep pages 1-12 ---
  console.log(`\n📎 Loading original PDF: ${SOURCE_PDF}`);
  const origBytes = fs.readFileSync(SOURCE_PDF);
  const origDoc = await PDFDocument.load(origBytes);
  console.log(`   Original pages: ${origDoc.getPageCount()}`);

  // --- Step 3: Build merged PDF ---
  const merged = await PDFDocument.create();

  // Copy first REPLACE_FROM_SLIDE pages from original unchanged
  console.log(`   Keeping pages 1–${REPLACE_FROM_SLIDE} from original`);
  const keptPages = await merged.copyPages(origDoc, Array.from({ length: REPLACE_FROM_SLIDE }, (_, i) => i));
  keptPages.forEach(p => merged.addPage(p));

  // Add freshly rendered slides, scaled to match original page dimensions
  for (let idx = 0; idx < newSlidePdfs.length; idx++) {
    const slideBytes = fs.readFileSync(newSlidePdfs[idx]);
    const slideDoc = await PDFDocument.load(slideBytes);
    const origSize = slideDoc.getPage(0).getSize();
    console.log(`   Added slide ${REPLACE_FROM_SLIDE + idx + 1} (native size: ${origSize.width}×${origSize.height} pts)`);

    const [copiedPage] = await merged.copyPages(slideDoc, [0]);
    // Ensure the page box is exactly 960x540
    copiedPage.setSize(PAGE_W_PT, PAGE_H_PT);
    merged.addPage(copiedPage);
  }

  // --- Step 4: Save ---
  const mergedBytes = await merged.save();
  fs.writeFileSync(OUTPUT_PDF, mergedBytes);
  fs.rmSync(TEMP_DIR, { recursive: true, force: true });

  const sizeMB = (fs.statSync(OUTPUT_PDF).size / 1024 / 1024).toFixed(2);
  console.log(`\n✅ Saved: ${OUTPUT_PDF}`);
  console.log(`   ${sizeMB} MB | ${merged.getPageCount()} pages`);
}

patchDeck().catch(err => {
  console.error('❌ Failed:', err);
  process.exit(1);
});
