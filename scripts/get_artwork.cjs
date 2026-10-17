const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36');
    await page.goto('https://clarendonfineart.com/products/balloon-girl-140', { waitUntil: 'networkidle2' });

    const data = await page.evaluate(() => {
        // Find JSON-LD
        const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
        const jsonLd = scripts.map(s => {
            try { return JSON.parse(s.innerText); } catch (e) { return null; }
        }).filter(Boolean);

        // Find all images on the page
        const imgs = Array.from(document.querySelectorAll('img')).map(img => ({
            src: img.src,
            srcset: img.getAttribute('srcset'),
            dataSrc: img.getAttribute('data-src'),
            alt: img.alt,
            width: img.naturalWidth,
            height: img.naturalHeight
        }));

        // Find scripts that might contain product object
        const allScripts = Array.from(document.querySelectorAll('script')).map(s => s.innerText);
        const productScripts = allScripts.filter(t => t.includes('Balloon Girl') || t.includes('"featured_image"'));

        return { jsonLd, imgs, productScriptsSnippet: productScripts.map(s => s.substring(0, 500)) };
    });

    console.log('JSON-LD:');
    console.log(JSON.stringify(data.jsonLd, null, 2));

    console.log('\nRelevant Images:');
    const relevant = data.imgs.filter(i => 
        (i.src && (i.src.includes('products') || i.src.includes('Balloon') || i.src.includes('balloon') || i.src.includes('ART'))) ||
        (i.alt && i.alt.toLowerCase().includes('balloon'))
    );
    console.log(JSON.stringify(relevant, null, 2));

    await browser.close();
})();
