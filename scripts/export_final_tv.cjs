const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const src = 'C:\\Users\\msf19\\.gemini\\antigravity\\brain\\f3770b49-e87d-4a89-9487-881a2ebf3753\\balloon_girl_the_frame_16x9_1792258926177.jpg';
const dest = path.join(process.env.USERPROFILE, 'Downloads', 'Balloon-Girl-Samsung-Frame-55-Edge-To-Edge-4K.jpg');

async function exportFinal() {
    const meta = await sharp(src).metadata();
    console.log('Generated image input dimensions:', meta.width, 'x', meta.height);

    await sharp(src)
        .resize(3840, 2160, { fit: 'fill', kernel: sharp.kernel.lanczos3 })
        .jpeg({ quality: 98, chromaSubsampling: '4:4:4' })
        .toFile(dest);

    const finalMeta = await sharp(dest).metadata();
    const stats = fs.statSync(dest);
    console.log('Saved to:', dest);
    console.log('Dimensions:', finalMeta.width, 'x', finalMeta.height);
    console.log('Size:', (stats.size / 1024 / 1024).toFixed(2), 'MB');
}

exportFinal().catch(console.error);
