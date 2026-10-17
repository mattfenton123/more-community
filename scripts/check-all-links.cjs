const puppeteer = require('puppeteer');

const pagesToCrawl = [
  '/',
  '/about.html',
  '/discover.html',
  '/leaders.html',
  '/tunbridge-wells.html',
  '/a-z-challenge.html',
  '/kent-adventures.html',
  '/mindful-miles.html',
  '/tw-creative-collective.html',
  '/tw-good-neighbours.html',
  '/tw-interfaith-network.html',
  '/tw-parkrun.html',
  '/tw-ramblers.html',
  '/tw-yoga-collective.html',
  '/yentw.html',
  '/business-plan.html',
  '/commercials.html',
  '/investor-deck.html',
  '/accelerator.html',
  '/hackathons.html',
  '/sponsorship.html'
];

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const allLinks = new Map(); // href -> Set of source pages

  for (const pagePath of pagesToCrawl) {
    const page = await browser.newPage();
    try {
      await page.goto(`https://www.morecommunity.app${pagePath}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      const links = await page.$$eval('a[href]', els => els.map(a => a.getAttribute('href')));
      for (const link of links) {
        if (!link) continue;
        const trimmed = link.trim();
        if (trimmed === '' || trimmed.startsWith('mailto:') || trimmed.startsWith('tel:') || trimmed.startsWith('javascript:')) continue;
        if (!allLinks.has(trimmed)) {
          allLinks.set(trimmed, new Set());
        }
        allLinks.get(trimmed).add(pagePath);
      }
    } catch (e) {
      console.error(`Failed to crawl ${pagePath}:`, e.message);
    } finally {
      await page.close();
    }
  }

  console.log(`Discovered ${allLinks.size} unique links across all pages.`);
  console.log('\n--- Checking status of all internal & relative links ---');
  const broken = [];
  const valid = [];

  const checkPage = await browser.newPage();
  for (const [link, sources] of allLinks.entries()) {
    if (link.startsWith('#')) {
      continue; // Anchor link
    }
    let targetUrl;
    if (link.startsWith('http://') || link.startsWith('https://')) {
      targetUrl = link;
    } else if (link.startsWith('/')) {
      targetUrl = `https://www.morecommunity.app${link}`;
    } else {
      targetUrl = `https://www.morecommunity.app/${link}`;
    }

    try {
      const resp = await checkPage.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });
      const status = resp ? resp.status() : 0;
      if (status >= 400 || status === 0) {
        broken.push({ link, targetUrl, status, sources: Array.from(sources) });
        console.log(`[BROKEN ${status}] ${link} (from ${Array.from(sources).join(', ')})`);
      } else {
        valid.push({ link, status });
      }
    } catch (e) {
      broken.push({ link, targetUrl, status: 'ERROR', error: e.message, sources: Array.from(sources) });
      console.log(`[ERROR] ${link} -> ${e.message} (from ${Array.from(sources).join(', ')})`);
    }
  }

  await checkPage.close();
  await browser.close();

  console.log(`\nScan complete. Total: ${allLinks.size}, Valid: ${valid.length}, Broken: ${broken.length}`);
})();
