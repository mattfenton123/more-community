const sharp = require('sharp');
const fs = require('fs');

async function processImages() {
    const targetW = 3840;
    const targetH = 2160;

    // Artwork aspect ratio is nearly square: 1200 x 1191
    // We resize it with high quality Lanczos3 upsampling to 1960px tall
    // which leaves an elegant 100px top and bottom gallery passe-partout mat margin
    const artH = 1960;
    const artW = Math.round(artH * (1200 / 1191)); // 1975px

    const resizedArt = await sharp('balloon_girl_unframed.jpg')
        .resize(artW, artH, {
            kernel: sharp.kernel.lanczos3
        })
        .toBuffer();

    // Subtle drop shadow / border around the artwork to give realistic depth like fine art prints in The Frame
    const borderSvg = Buffer.from(
        `<svg width="${artW + 16}" height="${artH + 16}">
            <rect x="0" y="0" width="${artW + 16}" height="${artH + 16}" fill="rgba(0,0,0,0.18)" rx="4" />
        </svg>`
    );

    // 1. Warm Museum White Mat (#F6F5F2) - Gold standard for Samsung Frame Art Mode
    await sharp({
        create: {
            width: targetW,
            height: targetH,
            channels: 3,
            background: { r: 246, g: 245, b: 242 }
        }
    })
    .composite([
        { input: borderSvg, top: Math.round((targetH - artH - 16)/2) + 4, left: Math.round((targetW - artW - 16)/2) + 4 },
        { input: resizedArt, top: Math.round((targetH - artH)/2), left: Math.round((targetW - artW)/2) }
    ])
    .jpeg({ quality: 98, chromaSubsampling: '4:4:4' })
    .toFile('Balloon-Girl-Samsung-55-Museum-White-Mat-3840x2160.jpg');
    console.log('✓ Created Museum White Mat edition (3840x2160)');

    // 2. Modern Gallery Charcoal/Dark Mat (#181A1E) - Stunning for dark room viewing & OLED/QLED
    await sharp({
        create: {
            width: targetW,
            height: targetH,
            channels: 3,
            background: { r: 24, g: 26, b: 30 }
        }
    })
    .composite([
        { input: borderSvg, top: Math.round((targetH - artH - 16)/2) + 4, left: Math.round((targetW - artW - 16)/2) + 4 },
        { input: resizedArt, top: Math.round((targetH - artH)/2), left: Math.round((targetW - artW)/2) }
    ])
    .jpeg({ quality: 98, chromaSubsampling: '4:4:4' })
    .toFile('Balloon-Girl-Samsung-55-Charcoal-Mat-3840x2160.jpg');
    console.log('✓ Created Charcoal Mat edition (3840x2160)');

    // 3. Framed Artwork Edition on Museum Mat
    const framedMeta = await sharp('balloon_girl_framed.jpg').metadata();
    const framedH = 1960;
    const framedW = Math.round(framedH * (framedMeta.width / framedMeta.height));
    const resizedFramed = await sharp('balloon_girl_framed.jpg')
        .resize(framedW, framedH, { kernel: sharp.kernel.lanczos3 })
        .toBuffer();

    await sharp({
        create: {
            width: targetW,
            height: targetH,
            channels: 3,
            background: { r: 246, g: 245, b: 242 }
        }
    })
    .composite([
        { input: resizedFramed, top: Math.round((targetH - framedH)/2), left: Math.round((targetW - framedW)/2) }
    ])
    .jpeg({ quality: 98, chromaSubsampling: '4:4:4' })
    .toFile('Balloon-Girl-Samsung-55-Framed-3840x2160.jpg');
    console.log('✓ Created Framed Artwork edition (3840x2160)');

    // 4. Clean Master Original
    fs.copyFileSync('balloon_girl_unframed.jpg', 'Balloon-Girl-Original-Master.jpg');
    console.log('✓ Saved Balloon-Girl-Original-Master.jpg');
}

processImages().catch(console.error);
