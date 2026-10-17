const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function processWhatshisname() {
    const targetW = 3840;
    const targetH = 2160;

    // Rescale the authentic artwork to full screen height (2160px)
    const artH = targetH;
    const artW = targetH; // 1:1 aspect ratio -> 2160px
    const sideW = Math.round((targetW - artW) / 2); // 840px on left, 840px on right

    const resizedArt = await sharp('whn_2.jpg')
        .resize(artW, artH, { kernel: sharp.kernel.lanczos3 })
        .toBuffer();

    // Sample the exact edge columns to blend the atmospheric mist gradient
    const leftEdgeSlice = await sharp(resizedArt)
        .extract({ left: 0, top: 0, width: 120, height: artH })
        .resize(sideW + 20, artH, { fit: 'fill' })
        .blur(15)
        .toBuffer();

    const rightEdgeSlice = await sharp(resizedArt)
        .extract({ left: artW - 120, top: 0, width: 120, height: artH })
        .resize(sideW + 20, artH, { fit: 'fill' })
        .blur(15)
        .toBuffer();

    const dest = path.join(process.env.USERPROFILE, 'Downloads', 'Whatshisname-Gone-Andys-Toys-Samsung-Frame-55-Edge-To-Edge-4K.jpg');

    await sharp({
        create: {
            width: targetW,
            height: targetH,
            channels: 3,
            background: { r: 159, g: 158, b: 159 }
        }
    })
    .composite([
        { input: leftEdgeSlice, left: 0, top: 0 },
        { input: rightEdgeSlice, left: targetW - (sideW + 20), top: 0 },
        { input: resizedArt, left: sideW, top: 0 }
    ])
    .jpeg({ quality: 99, chromaSubsampling: '4:4:4' })
    .toFile(dest);

    const stats = fs.statSync(dest);
    const meta = await sharp(dest).metadata();
    console.log('✓ Successfully generated:', dest);
    console.log('Dimensions:', meta.width, 'x', meta.height);
    console.log('File size:', (stats.size / 1024 / 1024).toFixed(2), 'MB');
}

processWhatshisname().catch(console.error);
