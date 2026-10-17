const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function createClarendonExtended() {
    const targetW = 3840;
    const targetH = 2160;

    const artH = targetH;
    const artW = Math.round(artH * (1200 / 1191)); // 2176px
    const sideW = Math.round((targetW - artW) / 2); // 832px

    const mainArt = await sharp('balloon_girl_unframed.jpg')
        .resize(artW, artH, { kernel: sharp.kernel.lanczos3 })
        .toBuffer();

    const leftSlice = await sharp(mainArt)
        .extract({ left: 0, top: 0, width: 300, height: artH })
        .flop()
        .resize(sideW + 20, artH, { fit: 'fill' })
        .toBuffer();

    const rightSlice = await sharp(mainArt)
        .extract({ left: artW - 300, top: 0, width: 300, height: artH })
        .flop()
        .resize(sideW + 20, artH, { fit: 'fill' })
        .toBuffer();

    const dest = path.join(process.env.USERPROFILE, 'Downloads', 'Balloon-Girl-Clarendon-Original-Extended-3840x2160.jpg');

    await sharp({
        create: {
            width: targetW,
            height: targetH,
            channels: 3,
            background: { r: 168, g: 161, b: 156 }
        }
    })
    .composite([
        { input: leftSlice, left: 0, top: 0 },
        { input: rightSlice, left: targetW - (sideW + 20), top: 0 },
        { input: mainArt, left: sideW, top: 0 }
    ])
    .jpeg({ quality: 98, chromaSubsampling: '4:4:4' })
    .toFile(dest);

    console.log('Saved Clarendon Extended version to:', dest);
}

createClarendonExtended().catch(console.error);
