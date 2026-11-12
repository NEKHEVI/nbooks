// Capture du resultat de l'envoi RBooks Capture -> facture fournisseur dans RBooks. Usage : node capturer-capture.cjs
const { chromium } = require('@playwright/test');
const fs = require('fs'); const path = require('path');
const OUT = __dirname;
const lines = fs.readFileSync('C:\\DEV\\CODEGOD\\RAWLF\\secrets\\rbooks-demo.txt', 'utf8').split(/\r?\n/);
const val = (k) => (lines.find((l) => l.startsWith(k)) || '').replace(/^[^:]*:\s*/, '').trim();
const BASE = process.env.RBOOKS_WEB || 'http://localhost:4000';
(async () => {
  const pw = path.join(process.env.LOCALAPPDATA, 'ms-playwright');
  const dirs = fs.readdirSync(pw).filter((d) => d.startsWith('chromium-')).sort();
  const browser = await chromium.launch({ headless: true, executablePath: path.join(pw, dirs[dirs.length - 1], 'chrome-win64', 'chrome.exe') });
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 900 }, locale: 'fr-CA' });
  await ctx.addCookies([{ name: 'locale', value: 'fr', url: BASE }]);
  const page = await ctx.newPage();
  await page.goto(BASE + '/auth/login');
  await page.locator('input:not([type=password]):not([type=checkbox])').first().fill(val('Courriel'));
  await page.locator('input[type=password]').first().fill(val('Mot de passe'));
  await page.locator('button[type=submit]').first().click();
  await page.waitForURL((u) => !u.pathname.includes('/auth/'), { timeout: 30000 });
  await page.goto(BASE + '/bills'); await page.waitForTimeout(3500);
  await page.screenshot({ path: path.join(OUT, '11-capture-factures-fournisseurs.png') });
  await page.getByText('CAP-D0002', { exact: false }).first().click();
  await page.waitForTimeout(3500);
  await page.screenshot({ path: path.join(OUT, '12-capture-facture-fournisseur-detail.png') });
  console.log('ok capture');
  await browser.close();
})().catch((e) => { console.error('ERREUR', e.message.slice(0, 400)); process.exit(1); });