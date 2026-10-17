const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    const consoleLogs = [];
    page.on('console', msg => consoleLogs.push({ type: msg.type(), text: msg.text() }));
    page.on('pageerror', err => consoleLogs.push({ type: 'pageerror', text: err.toString() }));

    await page.goto('https://www.morecommunity.app/login', { waitUntil: 'networkidle2' });
    console.log('Login page title:', await page.title());

    // Check form fields
    const inputs = await page.$$eval('input', els => els.map(i => ({ type: i.type, name: i.name, placeholder: i.placeholder, id: i.id })));
    console.log('Inputs found on login page:', inputs);

    const buttons = await page.$$eval('button', els => els.map(b => b.innerText.trim()));
    console.log('Buttons found on login page:', buttons);

    // Try submitting empty login
    const submitBtn = await page.$('button[type="submit"]');
    if (submitBtn) {
        await submitBtn.click();
        await new Promise(r => setTimeout(r, 1000));
        console.log('After empty submit, console logs:', consoleLogs);
    }

    await browser.close();
})();
