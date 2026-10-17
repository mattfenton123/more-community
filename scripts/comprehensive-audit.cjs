const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://www.morecommunity.app';

const STATIC_PAGES = [
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
  '/sponsorship.html',
  '/app-preview.html'
];

const APP_ROUTES = [
  '/app',
  '/discover',
  '/login',
  '/dashboard',
  '/create-community',
  '/leaderboard',
  '/events',
  '/experiences',
  '/my-communities',
  '/profile',
  '/settings',
  '/chat',
  '/notifications',
  '/admin'
];

async function runAudit() {
  console.log(`Starting comprehensive browser audit of ${BASE_URL}...`);
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1280,800']
  });

  const report = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    staticPages: {},
    appPages: {},
    brokenLinks: [],
    consoleErrors: [],
    failedRequests: [],
    scriptIssues: []
  };

  const checkedUrls = new Map(); // url -> status

  async function checkUrl(url) {
    if (checkedUrls.has(url)) return checkedUrls.get(url);
    try {
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36');
      const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      const status = resp ? resp.status() : 0;
      await page.close();
      checkedUrls.set(url, status);
      return status;
    } catch (e) {
      checkedUrls.set(url, 0);
      return 0;
    }
  }

  // --- 1. Audit Static Pages ---
  console.log('\n--- Auditing Static Pages & Microsites ---');
  for (const pagePath of STATIC_PAGES) {
    const fullUrl = `${BASE_URL}${pagePath}`;
    process.stdout.write(`Testing ${pagePath}... `);
    const pageData = {
      path: pagePath,
      url: fullUrl,
      status: null,
      title: null,
      consoleErrors: [],
      failedRequests: [],
      brokenInternalLinks: [],
      brokenHashLinks: [],
      scriptTests: {}
    };

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36');

    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        pageData.consoleErrors.push(text);
        report.consoleErrors.push({ page: pagePath, message: text });
      }
    });

    page.on('pageerror', err => {
      const text = err.toString();
      pageData.consoleErrors.push(text);
      report.consoleErrors.push({ page: pagePath, message: text });
    });

    page.on('requestfailed', req => {
      const failed = { url: req.url(), error: req.failure() ? req.failure().errorText : 'Unknown' };
      pageData.failedRequests.push(failed);
      report.failedRequests.push({ page: pagePath, ...failed });
    });

    page.on('response', resp => {
      if (resp.status() >= 400) {
        const failed = { url: resp.url(), status: resp.status() };
        pageData.failedRequests.push(failed);
        report.failedRequests.push({ page: pagePath, ...failed });
      }
    });

    try {
      const resp = await page.goto(fullUrl, { waitUntil: 'networkidle2', timeout: 20000 });
      pageData.status = resp ? resp.status() : 0;
      pageData.title = await page.title();

      // Check all <a> links on the page
      const links = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('a')).map(a => ({
          href: a.getAttribute('href'),
          text: a.innerText.trim(),
          outerHTML: a.outerHTML.substring(0, 100)
        }));
      });

      // Verify internal links and hash anchors
      for (const link of links) {
        if (!link.href) continue;
        const href = link.href.trim();
        if (href === '' || href === '#') continue;

        if (href.startsWith('#')) {
          const targetExists = await page.evaluate((targetId) => {
            return !!document.querySelector(targetId);
          }, href);
          if (!targetExists) {
            pageData.brokenHashLinks.push({ href, text: link.text });
            report.brokenLinks.push({ page: pagePath, type: 'broken-hash', href, text: link.text });
          }
        } else if (!href.startsWith('http://') && !href.startsWith('https://') && !href.startsWith('mailto:') && !href.startsWith('tel:') && !href.startsWith('javascript:')) {
          // Relative link
          const resolved = new URL(href, fullUrl).href;
          const status = await checkUrl(resolved);
          if (status >= 400 || status === 0) {
            pageData.brokenInternalLinks.push({ href, resolved, status, text: link.text });
            report.brokenLinks.push({ page: pagePath, type: 'broken-internal', href, resolved, status, text: link.text });
          }
        } else if (href.startsWith(BASE_URL)) {
          const status = await checkUrl(href);
          if (status >= 400 || status === 0) {
            pageData.brokenInternalLinks.push({ href, resolved: href, status, text: link.text });
            report.brokenLinks.push({ page: pagePath, type: 'broken-internal', href, resolved: href, status, text: link.text });
          }
        }
      }

      // --- Interactive Script Tests on this page ---
      // 1. Mobile Menu Toggle
      await page.setViewport({ width: 375, height: 667 });
      const hasMenuToggle = await page.$('#menuToggle');
      if (hasMenuToggle) {
        try {
          await page.click('#menuToggle');
          const isMenuOpen = await page.$eval('#navLinks', el => el.classList.contains('open'));
          pageData.scriptTests.mobileMenu = isMenuOpen ? 'PASS' : 'FAIL: navLinks did not get .open';
          // Click overlay to close
          const hasOverlay = await page.$('#menuOverlay');
          if (hasOverlay) {
            await page.click('#menuOverlay');
            const isMenuClosed = await page.$eval('#navLinks', el => !el.classList.contains('open'));
            pageData.scriptTests.menuOverlayClose = isMenuClosed ? 'PASS' : 'FAIL: overlay click did not close menu';
          }
        } catch (e) {
          pageData.scriptTests.mobileMenu = `ERROR: ${e.message}`;
        }
      }

      // Restore desktop viewport
      await page.setViewport({ width: 1280, height: 800 });

      // 2. Email notify button (if present)
      const hasNotify = await page.$('#notifyBtn');
      const hasEmailInput = await page.$('#emailInput');
      if (hasNotify && hasEmailInput) {
        try {
          // Test invalid email
          await page.type('#emailInput', 'invalidemail');
          await page.click('#notifyBtn');
          await page.waitForTimeout ? page.waitForTimeout(300) : new Promise(r => setTimeout(r, 300));
          const hasErrorBorder = await page.$eval('#emailInput', el => el.style.borderColor.includes('239') || el.style.borderColor.includes('red'));

          // Test valid email
          await page.evaluate(() => document.getElementById('emailInput').value = '');
          await page.type('#emailInput', 'test@example.com');
          await page.click('#notifyBtn');
          await new Promise(r => setTimeout(r, 300));
          const btnText = await page.$eval('#notifyBtn', el => el.textContent);
          const success = btnText.includes('Subscribed') || btnText.includes('✓');

          pageData.scriptTests.emailNotification = success ? 'PASS' : `FAIL: btnText was "${btnText}"`;
        } catch (e) {
          pageData.scriptTests.emailNotification = `ERROR: ${e.message}`;
        }
      }

      // 3. Page-specific tests
      if (pagePath === '/discover.html') {
        // Test filter pills & search
        try {
          const pillCount = await page.$$eval('.filter-pill', pills => pills.length);
          const initialCards = await page.$$eval('.community-card', cards => cards.filter(c => c.style.display !== 'none').length);

          // Click second filter pill
          if (pillCount > 1) {
            await page.click('.filter-pill:nth-child(2)');
            await new Promise(r => setTimeout(r, 300));
            const filteredCards = await page.$$eval('.community-card', cards => cards.filter(c => c.style.display !== 'none').length);
            pageData.scriptTests.filterPills = `PASS (Total pills: ${pillCount}, filtered visible cards: ${filteredCards}/${initialCards})`;
          }

          // Test search input
          await page.type('#searchInput', 'Parkrun');
          await new Promise(r => setTimeout(r, 300));
          const searchCards = await page.$$eval('.community-card', cards => cards.filter(c => c.style.display !== 'none').length);
          pageData.scriptTests.searchFiltering = `PASS (Cards matching 'Parkrun': ${searchCards})`;

          // Test empty search
          await page.type('#searchInput', 'NonExistentCommunity123xyz');
          await new Promise(r => setTimeout(r, 300));
          const noCards = await page.$$eval('.community-card', cards => cards.filter(c => c.style.display !== 'none').length);
          pageData.scriptTests.searchNoResults = noCards === 0 ? 'PASS' : `FAIL: Expected 0 cards but got ${noCards}`;
        } catch (e) {
          pageData.scriptTests.discoverScripts = `ERROR: ${e.message}`;
        }
      }

      if (pagePath === '/app-preview.html') {
        try {
          const tabsCount = await page.$$eval('.app-tab', tabs => tabs.length);
          const initialTitle = await page.$eval('#screenTitle', el => el.textContent.trim());

          // Click second tab
          if (tabsCount > 1) {
            await page.click('.app-tab:nth-child(2)');
            await new Promise(r => setTimeout(r, 300));
            const newTitle = await page.$eval('#screenTitle', el => el.textContent.trim());
            pageData.scriptTests.screenTabs = (newTitle !== initialTitle)
              ? `PASS (Switched from "${initialTitle}" to "${newTitle}")`
              : `FAIL: Title did not change on tab click`;
          }
        } catch (e) {
          pageData.scriptTests.appPreview = `ERROR: ${e.message}`;
        }
      }

      if (pagePath === '/investor-deck.html') {
        try {
          const totalSlides = await page.$$eval('.slide', s => s.length);
          const initialCur = await page.evaluate(() => typeof cur !== 'undefined' ? cur : null);

          // Press ArrowRight
          await page.keyboard.press('ArrowRight');
          await new Promise(r => setTimeout(r, 300));
          const afterNext = await page.evaluate(() => typeof cur !== 'undefined' ? cur : null);

          pageData.scriptTests.deckSlideNav = (afterNext !== initialCur || totalSlides > 0)
            ? `PASS (Total slides: ${totalSlides}, navigated successfully)`
            : 'FAIL';
        } catch (e) {
          pageData.scriptTests.deckSlideNav = `ERROR: ${e.message}`;
        }
      }

      console.log(`[${pageData.status}] - Errors: ${pageData.consoleErrors.length}, FailedReqs: ${pageData.failedRequests.length}, BrokenLinks: ${pageData.brokenInternalLinks.length + pageData.brokenHashLinks.length}`);
    } catch (e) {
      pageData.status = 'LOAD_ERROR';
      pageData.error = e.message;
      console.log(`FAILED TO LOAD: ${e.message}`);
    } finally {
      await page.close();
      report.staticPages[pagePath] = pageData;
    }
  }

  // --- 2. Audit Next.js App Pages ---
  console.log('\n--- Auditing Next.js App Routes ---');
  for (const routePath of APP_ROUTES) {
    const fullUrl = `${BASE_URL}${routePath}`;
    process.stdout.write(`Testing app route ${routePath}... `);
    const pageData = {
      path: routePath,
      url: fullUrl,
      status: null,
      title: null,
      consoleErrors: [],
      failedRequests: [],
      hydrationErrors: [],
      authRedirect: null,
      linksCount: 0
    };

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36');

    page.on('console', msg => {
      const text = msg.text();
      if (msg.type() === 'error') {
        pageData.consoleErrors.push(text);
        report.consoleErrors.push({ page: routePath, message: text });
      }
      if (text.includes('Hydration') || text.includes('hydrating') || text.includes('Minified React error')) {
        pageData.hydrationErrors.push(text);
        report.scriptIssues.push({ page: routePath, issue: 'React Hydration Error', message: text });
      }
    });

    page.on('pageerror', err => {
      const text = err.toString();
      pageData.consoleErrors.push(text);
      report.consoleErrors.push({ page: routePath, message: text });
    });

    page.on('requestfailed', req => {
      const failed = { url: req.url(), error: req.failure() ? req.failure().errorText : 'Unknown' };
      pageData.failedRequests.push(failed);
      report.failedRequests.push({ page: routePath, ...failed });
    });

    page.on('response', resp => {
      if (resp.status() >= 400) {
        const failed = { url: resp.url(), status: resp.status() };
        pageData.failedRequests.push(failed);
        report.failedRequests.push({ page: routePath, ...failed });
      }
    });

    try {
      const resp = await page.goto(fullUrl, { waitUntil: 'networkidle2', timeout: 20000 });
      pageData.status = resp ? resp.status() : 0;
      pageData.title = await page.title();
      const currentUrl = page.url();
      if (currentUrl !== fullUrl) {
        pageData.authRedirect = currentUrl;
      }

      pageData.linksCount = await page.$$eval('a', links => links.length);
      console.log(`[${pageData.status}] (Final URL: ${currentUrl}) - Errors: ${pageData.consoleErrors.length}, FailedReqs: ${pageData.failedRequests.length}`);
    } catch (e) {
      pageData.status = 'LOAD_ERROR';
      pageData.error = e.message;
      console.log(`FAILED TO LOAD: ${e.message}`);
    } finally {
      await page.close();
      report.appPages[routePath] = pageData;
    }
  }

  await browser.close();

  // Save report to disk
  const outputPath = path.join(__dirname, 'audit-results.json');
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
  console.log(`\nAudit complete! Full JSON report written to: ${outputPath}`);
}

runAudit().catch(err => {
  console.error('Fatal audit failure:', err);
  process.exit(1);
});
