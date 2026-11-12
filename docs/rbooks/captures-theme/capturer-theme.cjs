// Captures headless du theme RAWLF. Usage : node capturer-theme.cjs [dark]
// Identifiants lus par programme (jamais affiches).
const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const DARK = process.argv[2] === 'dark';
const OUT = DARK ? path.join(__dirname, 'sombre') : __dirname;
fs.mkdirSync(OUT, { recursive: true });
const lines = fs.readFileSync('C:\\DEV\\CODEGOD\\RAWLF\\secrets\\rbooks-demo.txt', 'utf8').split(/\r?\n/);
const val = (k) => (lines.find((l) => l.startsWith(k)) || '').replace(/^[^:]*:\s*/, '').trim();
const EMAIL = val('Courriel'), PW = val('Mot de passe');
const BASE = process.env.RBOOKS_WEB || 'http://localhost:4000';

// Detecte les couleurs bleues (teinte 195-255, saturation > 0.3) dans les styles calcules.
const BLUE = () => {
  const out = {};
  const parse = (c) => { const m = c && c.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?/); return m ? [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]] : null; };
  const isBlue = (c) => {
    const p = parse(c); if (!p || p[3] < 0.15) return false;
    const [r, g, b] = [p[0] / 255, p[1] / 255, p[2] / 255];
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; if (d < 0.12) return false;
    let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; if (h < 0) h += 360;
    const s = mx === 0 ? 0 : d / mx; return h >= 195 && h <= 255 && s > 0.3;
  };
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue;
    const cs = getComputedStyle(el);
    for (const prop of ['color', 'backgroundColor', 'borderTopColor', 'borderBottomColor', 'outlineColor', 'fill', 'stroke']) {
      if (prop.startsWith('border') && (cs[prop.replace('Color', 'Style')] === 'none' || parseFloat(cs[prop.replace('Color', 'Width')]) === 0)) continue;
      if (isBlue(cs[prop])) {
        const cn = el.className && el.className.baseVal !== undefined ? el.className.baseVal : String(el.className);
        const k = prop + ' ' + cs[prop] + ' <' + el.tagName.toLowerCase() + '.' + cn.split(' ').slice(0, 3).join('.') + '>';
        out[k] = (out[k] || 0) + 1;
      }
    }
  }
  return out;
};


// Contraste : texte visible dont le rapport avec le fond effectif est < 3.
const CONTRASTE = () => {
  const parse = (c) => { const m = c && c.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?/); return m ? [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]] : null; };
  const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const bgOf = (el) => { let bg = [255, 255, 255]; const chain = []; for (let e = el; e; e = e.parentElement) chain.push(e); for (const e of chain.reverse()) { const p = parse(getComputedStyle(e).backgroundColor); if (p && p[3] > 0) bg = bg.map((v, i) => v * (1 - p[3]) + p[i] * p[3]); } return bg; };
  const out = {};
  for (const el of document.querySelectorAll('body *')) {
    if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
    const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue;
    const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.opacity === '0') continue;
    const fg = parse(cs.color); if (!fg) continue;
    const bg = bgOf(el); const fgc = fg.slice(0, 3).map((v, i) => v * fg[3] + bg[i] * (1 - fg[3]));
    const a = lum(fgc), b = lum(bg), ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    if (ratio < 3) { const k = el.textContent.trim().slice(0, 30) + ' r=' + ratio.toFixed(1) + ' <' + el.tagName.toLowerCase() + '.' + String(el.className).slice(0, 40) + '>'; out[k] = 1; }
  }
  return Object.keys(out);
};
(async () => {
  const pw = path.join(process.env.LOCALAPPDATA, 'ms-playwright');
  const dirs = fs.readdirSync(pw).filter((d) => d.startsWith('chromium-')).sort();
  const exe = path.join(pw, dirs[dirs.length - 1], 'chrome-win64', 'chrome.exe');
  const browser = await chromium.launch({ headless: true, executablePath: exe });
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 900 }, locale: 'fr-CA' });
  await ctx.addCookies([{ name: 'locale', value: 'fr', url: BASE }]);
  await ctx.addInitScript((t) => { try { localStorage.setItem('theme', t); } catch (e) {} }, DARK ? 'dark' : 'light');
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log('pageerror:', e.message.slice(0, 200)));
  const shot = async (name) => {
    await page.waitForTimeout(1800);
    await page.screenshot({ path: path.join(OUT, name + '.png') });
    const blue = await page.evaluate(BLUE);
    const keys = Object.keys(blue);
    const low = await page.evaluate(CONTRASTE);
    if (low.length) console.log('  CONTRASTE faible:', low.slice(0, 8).join(' | '));
    console.log('ok', name, keys.length ? 'BLEU: ' + keys.slice(0, 12).map((k) => k + ' x' + blue[k]).join(' | ') : 'pas de bleu');
  };
  await page.goto(BASE + '/auth/login');
  await page.waitForSelector('input', { timeout: 30000 });
  await shot('01-connexion');
  await page.locator('input:not([type=password]):not([type=checkbox])').first().fill(EMAIL);
  await page.locator('input[type="password"]').first().fill(PW);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL((u) => !u.pathname.includes('/auth/'), { timeout: 40000 });
  await page.waitForTimeout(3000);
  await shot('02-tableau-de-bord');
  await page.goto(BASE + '/invoices'); await page.waitForTimeout(3000);
  await shot('03-factures-liste');
  await page.getByText('FAC-0001').first().click();
  await page.waitForTimeout(3000);
  await shot('04-facture-tiroir-tps-tvq');
  await page.keyboard.press('Escape');
  await page.goto(BASE + '/financial-reports/balance-sheet'); await page.waitForTimeout(5000);
  await shot('05-bilan');
  await page.goto(BASE + '/tax-rates'); await page.waitForTimeout(3000);
  await shot('06-taux-de-taxe');
  await page.goto(BASE + '/invoices/new'); await page.waitForTimeout(4000);
  await shot('07-nouvelle-facture');
  await browser.close();
})().catch((e) => { console.error('ERREUR', e.message); process.exit(1); });
