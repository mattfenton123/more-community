const puppeteer = require('puppeteer');
(async () => {
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.goto('https://www.morecommunity.app/discover.html', { waitUntil: 'networkidle2' });
    const pills = await page.evaluate(() => Array.from(document.querySelectorAll('.filter-pill')).map(p => ({ text: p.innerText, filter: p.dataset.filter })));
    console.log('Pills:', pills);
    await page.evaluate(() => {
        document.querySelectorAll('.filter-pill')[1].click();
    });
    const cardDisplays = await page.evaluate(() => Array.from(document.querySelectorAll('.community-card')).map(c => ({ cat: c.dataset.category, disp: c.style.display })));
    console.log('Card displays after clicking Walking pill:', cardDisplays);
    const visibleCount = cardDisplays.filter(c => c.disp !== 'none').length;
    console.log('Visible cards count:', visibleCount);
    await browser.close();
})();
