// Captures de la page de connexion NBooks dans les 4 thèmes, clair et sombre, ordi et téléphone.
// Usage : node capturer-connexion.cjs [URL de base] [dossier]. Aucun identifiant utilisé.
const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const BASE = process.argv[2] || 'http://localhost:4173';
const OUT = process.argv[3] || path.join(__dirname, 'out');
const THEMES = ['editorial', 'instrument', 'verre', 'bento'];
const MODES = ['dark', 'light'];
const DEVICES = { ordi: { width: 1440, height: 900 }, tel: { width: 390, height: 844 } };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const pw = path.join(process.env.LOCALAPPDATA, 'ms-playwright');
  const dirs = fs.readdirSync(pw).filter((d) => d.startsWith('chromium-')).sort();
  const exe = path.join(pw, dirs[dirs.length - 1], 'chrome-win64', 'chrome.exe');
  const browser = await chromium.launch({ headless: true, executablePath: exe });
  for (const [dev, viewport] of Object.entries(DEVICES)) {
    for (const theme of THEMES) {
      for (const mode of MODES) {
        const ctx = await browser.newContext({ viewport, locale: 'fr-CA', deviceScaleFactor: 1 });
        await ctx.addCookies([{ name: 'locale', value: 'fr', url: BASE }]);
        await ctx.addInitScript(([t, m]) => { try { localStorage.setItem('nk-theme', t); localStorage.setItem('theme', m); } catch (e) {} }, [theme, mode]);
        const page = await ctx.newPage();
        page.on('pageerror', (e) => console.log('pageerror:', e.message.slice(0, 160)));
        await page.goto(BASE + '/auth/login');
        await page.waitForTimeout(3500);
        const name = `connexion-${theme}-${mode === 'dark' ? 'sombre' : 'clair'}-${dev}.png`;
        await page.screenshot({ path: path.join(OUT, name) });
        console.log('ok', name);
        await ctx.close();
      }
    }
  }
  await browser.close();
})().catch((e) => { console.error('ERREUR', e.message); process.exit(1); });
