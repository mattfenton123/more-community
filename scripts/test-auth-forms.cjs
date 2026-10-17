const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    const consoleLogs = [];
    page.on('console', msg => {
        if (msg.type() === 'error') consoleLogs.push(msg.text());
    });
    page.on('pageerror', err => consoleLogs.push(err.toString()));

    await page.goto('https://www.morecommunity.app/login', { waitUntil: 'networkidle2' });

    // Test switching to Sign Up tab
    const signUpBtn = (await page.$$('button')).find(async b => (await page.evaluate(el => el.innerText, b)).includes('Sign Up'));
    // Click Sign Up
    await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const s = btns.find(b => b.innerText.includes('Sign Up'));
        if (s) s.click();
    });
    await new Promise(r => setTimeout(r, 500));
    const inputsAfterSignUp = await page.$$eval('input', els => els.map(i => ({ type: i.type, placeholder: i.placeholder })));
    console.log('Inputs after switching to Sign Up:', inputsAfterSignUp);

    // Test bad login attempt
    await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const s = btns.find(b => b.innerText.includes('Sign In'));
        if (s) s.click();
    });
    await page.type('input[type="email"]', 'testuser@notrealdomain123.com');
    await page.type('input[type="password"]', 'WrongPassword123!');
    const submitBtn = await page.$('button[type="submit"]');
    if (submitBtn) await submitBtn.click();
    await new Promise(r => setTimeout(r, 2000));

    // Check for error toast or banner
    const bodyText = await page.evaluate(() => document.body.innerText);
    const hasErrorMsg = bodyText.includes('Invalid') || bodyText.includes('credentials') || bodyText.includes('error') || bodyText.includes('user not found');
    console.log('Has visible error message on invalid login:', hasErrorMsg);
    console.log('Console errors:', consoleLogs);

    await browser.close();
})();
