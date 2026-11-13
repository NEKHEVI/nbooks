// Captures headless : rapport de taxes (TPS/TVQ), bilan, factures fournisseurs capturees.
// Usage : node docs\rbooks\captures-taxes\capturer.cjs (Node 18, depuis C:\DEV\CODEGOD\RAWLF\rbooks)
const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const OUT = __dirname;
const lines = fs.readFileSync('C:\\DEV\\CODEGOD\\RAWLF\\secrets\\rbooks-demo.txt', 'utf8').split(/\r?\n/);
const val = (k) => (lines.find((l) => l.startsWith(k)) || '').replace(/^[^:]*:\s*/, '').trim();
const EMAIL = val('Courriel'), PASSWORD = val('Mot de passe');
const BASE = process.env.RBOOKS_WEB || 'http://localhost:4000';
(async () => {
  const pw = path.join(process.env.LOCALAPPDATA, 'ms-playwright');
  const dirs = fs.readdirSync(pw).filter((d) => d.startsWith('chromium-')).sort();
  const exe = path.join(pw, dirs[dirs.length - 1], 'chrome-win64', 'chrome.exe');
  const browser = await chromium.launch({ headless: true, executablePath: exe });
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 }, locale: 'fr-CA' });
  await ctx.addCookies([{ name: 'locale', value: 'fr', url: BASE }]);
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log('pageerror:', e.message.slice(0, 200)));
  const shot = async (name, wait = 2500) => { await page.waitForTimeout(wait); await page.screenshot({ path: path.join(OUT, name + '.png') }); console.log('ok', name); };
  await page.goto(BASE + '/auth/login');
  await page.waitForSelector('input', { timeout: 20000 });
  await page.locator('input:not([type=password]):not([type=checkbox])').first().fill(EMAIL);
  await page.locator('input[type="password"]').first().fill(PASSWORD);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL((u) => !u.pathname.includes('/auth/'), { timeout: 30000 });
  await page.waitForTimeout(3000);
  const q = (f, t) => `?fromDate=${f}&toDate=${t}&basis=accrual`;
  await page.goto(BASE + '/financial-reports/sales-tax-liability-summary' + q('2025-01-01', '2026-12-31')); await shot('01-rapport-taxes-toutes-periodes', 6000);
  await page.goto(BASE + '/financial-reports/sales-tax-liability-summary' + q('2026-11-01', '2026-11-30')); await shot('02-rapport-taxes-novembre-2026', 6000);
  await page.goto(BASE + '/financial-reports/sales-tax-liability-summary' + q('2026-06-01', '2026-06-30')); await shot('03-rapport-taxes-juin-2026-achats-captures', 6000);
  await page.goto(BASE + '/financial-reports/balance-sheet' + q('2020-01-01', '2026-12-31')); await shot('04-bilan', 6000);
  await page.goto(BASE + '/bills'); await shot('05-factures-fournisseurs');
  await browser.close();
})().catch((e) => { console.error('ERREUR', e.message); process.exit(1); });