// Sonde : affiche les classes/couleurs d'elements a un point d'ecran. Usage : node sonde.cjs /invoices FAC-0001 x,y x,y
const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const lines = fs.readFileSync('C:\\DEV\\CODEGOD\\RAWLF\\secrets\\rbooks-demo.txt', 'utf8').split(/\r?\n/);
const val = (k) => (lines.find((l) => l.startsWith(k)) || '').replace(/^[^:]*:\s*/, '').trim();
const BASE = 'http://localhost:4000';
(async () => {
  const pw = path.join(process.env.LOCALAPPDATA, 'ms-playwright');
  const dirs = fs.readdirSync(pw).filter((d) => d.startsWith('chromium-')).sort();
  const browser = await chromium.launch({ headless: true, executablePath: path.join(pw, dirs[dirs.length - 1], 'chrome-win64', 'chrome.exe') });
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 900 }, locale: 'fr-CA' });
  await ctx.addCookies([{ name: 'locale', value: 'fr', url: BASE }]);
  await ctx.addInitScript(() => { try { localStorage.setItem('theme', 'light'); } catch (e) {} });
  const page = await ctx.newPage();
  await page.goto(BASE + '/auth/login');
  await page.waitForSelector('input');
  await page.locator('input:not([type=password]):not([type=checkbox])').first().fill(val('Courriel'));
  await page.locator('input[type="password"]').first().fill(val('Mot de passe'));
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL((u) => !u.pathname.includes('/auth/'), { timeout: 40000 });
  await page.goto(BASE + process.argv[2]); await page.waitForTimeout(3000);
  if (process.argv[3] !== '-') { await page.getByText(process.argv[3]).first().click(); await page.waitForTimeout(3000); }
  for (const pt of process.argv.slice(4)) {
    const [x, y] = pt.split(',').map(Number);
    const r = await page.evaluate(([x, y]) => {
      const out = []; let el = document.elementFromPoint(x, y);
      for (let i = 0; el && i < 7; i++, el = el.parentElement) {
        const cs = getComputedStyle(el);
        const cn = el.className && el.className.baseVal !== undefined ? el.className.baseVal : String(el.className);
        out.push(el.tagName.toLowerCase() + '.' + cn.slice(0, 70) + ' bg=' + cs.backgroundColor + ' fg=' + cs.color);
      }
      return out;
    }, [x, y]);
    console.log('--- ' + pt + '\n' + r.join('\n'));
  }
  await browser.close();
})().catch((e) => { console.error('ERREUR', e.message); process.exit(1); });
