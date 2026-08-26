/**
 * Batch-convert all PNGs in portal/images/ to WebP at quality 80.
 * Creates .webp siblings alongside originals, then deletes the PNGs.
 *
 * Requires `sharp` (already in app/package.json).
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const PORTAL_IMAGES = path.resolve(__dirname, '..', 'portal', 'images');
const APP_IMAGES = path.resolve(__dirname, '..', 'app', 'public', 'images');
const QUALITY = 80;
const MAX_WIDTH = 1200; // max dimension — plenty for mobile PWA cards

async function convertDir(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let saved = 0;

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      saved += await convertDir(full);
      continue;
    }
    if (!/\.png$/i.test(entry.name)) continue;

    const webpName = entry.name.replace(/\.png$/i, '.webp');
    const webpPath = path.join(dir, webpName);

    const originalSize = fs.statSync(full).size;

    await sharp(full)
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toFile(webpPath);

    const newSize = fs.statSync(webpPath).size;
    const pct = ((1 - newSize / originalSize) * 100).toFixed(0);
    console.log(`  ✓ ${path.relative(PORTAL_IMAGES, full)} → .webp  (${(originalSize / 1024).toFixed(0)}KB → ${(newSize / 1024).toFixed(0)}KB, -${pct}%)`);

    // Remove original PNG
    fs.unlinkSync(full);
    saved += originalSize - newSize;
  }
  return saved;
}

async function main() {
  console.log('\n🖼️  Optimising portal images (PNG → WebP)…\n');

  let totalSaved = 0;
  totalSaved += await convertDir(PORTAL_IMAGES);
  
  // Also convert source images if they exist
  if (fs.existsSync(APP_IMAGES)) {
    console.log('\n  Also converting app/public/images…\n');
    totalSaved += await convertDir(APP_IMAGES);
  }

  console.log(`\n✅  Done! Saved ${(totalSaved / (1024 * 1024)).toFixed(1)} MB total\n`);
}

main().catch(console.error);
