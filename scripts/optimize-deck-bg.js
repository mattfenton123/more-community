const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const directories = [
  path.join(__dirname, '../images/heroes'),
  path.join(__dirname, '../images')
];

async function optimize() {
  for (const dir of directories) {
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir);
    for (const file of files) {
      if (file.endsWith('.png') && !file.includes('logo')) {
        const fullPath = path.join(dir, file);
        const outPath = fullPath.replace('.png', '-opt.jpg');
        await sharp(fullPath)
          .resize({ width: 1280, withoutEnlargement: true })
          .jpeg({ quality: 50 })
          .toFile(outPath);
        console.log('Optimized:', outPath);
      }
    }
  }
}
optimize().catch(console.error);
