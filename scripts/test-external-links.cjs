const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.goto('https://www.morecommunity.app/', { waitUntil: 'domcontentloaded' });
    
    // Find all external links
    const externalLinks = await page.$$eval('a[href^="http"]', links => 
        links.map(l => ({ text: l.innerText.trim(), href: l.href }))
            .filter(l => !l.href.includes('morecommunity.app'))
    );
    console.log('External links on home page:', externalLinks);

    await browser.close();
})();
