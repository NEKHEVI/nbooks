// Test du mode demo : n'importe quel courriel / mot de passe ouvre le compte de demo.
const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const BASE = 'http://localhost:4000';
(async () => {
  const pw = path.join(process.env.LOCALAPPDATA, 'ms-playwright');
  const dirs = fs.readdirSync(pw).filter((d) => d.startsWith('chromium-')).sort();
  const browser = await chromium.launch({ headless: true, executablePath: path.join(pw, dirs[dirs.length - 1], 'chrome-win64', 'chrome.exe') });
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 900 }, locale: 'fr-CA' });
  await ctx.addCookies([{ name: 'locale', value: 'fr', url: BASE }]);
  const page = await ctx.newPage();
  await page.goto(BASE + '/auth/login');
  await page.waitForSelector('input');
  await page.locator('input:not([type=password]):not([type=checkbox])').first().fill('vendeur@test.ca');
  await page.locator('input[type="password"]').first().fill('abc');
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL((u) => !u.pathname.includes('/auth/'), { timeout: 40000 });
  await page.waitForTimeout(3000);
  const orgOk = await page.getByText('Entreprise Démo RBooks').first().isVisible();
  console.log('tableau de bord Entreprise Demo visible:', orgOk);
  await page.screenshot({ path: path.join(__dirname, 'connexion-demo-dashboard.png') });
  await page.goto(BASE + '/invoices'); await page.waitForTimeout(3000);
  const inv = await page.getByText('FAC-0001').first().isVisible();
  console.log('factures visibles (FAC-0001):', inv);
  // Champs minimaux : un seul caractere et un courriel mal forme
  await ctx.clearCookies(); await ctx.addCookies([{ name: 'locale', value: 'fr', url: BASE }]);
  await page.evaluate(() => localStorage.clear());
  await page.goto(BASE + '/auth/login'); await page.waitForSelector('input');
  await page.locator('input:not([type=password]):not([type=checkbox])').first().fill('x');
  await page.locator('input[type="password"]').first().fill('y');
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL((u) => !u.pathname.includes('/auth/'), { timeout: 40000 });
  console.log('courriel mal forme "x" accepte en mode demo: true');
  await browser.close();
  if (!(orgOk && inv)) process.exit(2);
})().catch((e) => { console.error('ERREUR', e.message); process.exit(1); });
