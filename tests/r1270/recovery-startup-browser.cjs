'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('playwright');
const { assertRecoverySafety } = require('../r1090/recovery-safety-fixture.cjs');

const root = path.resolve(process.argv[2] || path.join(__dirname, '../..'));
const origin = 'https://appassets.androidplatform.net';
const base = '/sukun/';
const recoveryDb = 'sukunRecoveryDataR1019';

async function openApp(browser, state, { width = 360, height = 760, lang } = {}) {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 2.5,
    hasTouch: true,
    isMobile: true,
    locale: lang === 'en' ? 'en-GB' : 'tr-TR',
    serviceWorkers: 'block',
    userAgent: 'Mozilla/5.0 (Linux; Android 13; 2107113SR; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/' + browser.version() + ' Mobile Safari/537.36'
  });

  await context.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.origin !== origin || !url.pathname.startsWith(base)) return route.abort();
    if (url.pathname === base + 'fixture.html') return route.fulfill({ contentType: 'text/html', body: '<!doctype html>' });
    const file = path.resolve(root, decodeURIComponent(url.pathname.slice(base.length)));
    if (!file.startsWith(root + path.sep)) return route.abort();
    const stat = await fs.stat(file).catch(() => null);
    return stat?.isFile() ? route.fulfill({ path: file }) : route.fulfill({ status: 404, body: '' });
  });

  await context.addInitScript(({ state, recoveryDb, lang }) => {
    if (lang) localStorage.setItem('sukun.lang', JSON.stringify(lang));
    if (state === 'checking') {
      const setTimer = window.setTimeout;
      window.setTimeout = (callback, delay, ...args) => {
        // This case releases the journal request explicitly. Keep the fixture
        // pending even on slower legacy browser test workers.
        const recoveryTimeout = delay === 10000 && new Error().stack.includes('recovery-data-r1270.js');
        return setTimer(callback, recoveryTimeout ? 60000 : delay, ...args);
      };
    }
    const open = IDBFactory.prototype.open;
    IDBFactory.prototype.open = function(name, ...args) {
      if (name !== recoveryDb || window.location.pathname.endsWith('/fixture.html')) return open.call(this, name, ...args);
      if (state === 'unavailable') throw new DOMException('Kurtarma deposu test için erişilemiyor.', 'UnknownError');
      if (state !== 'checking' || window.finishJournalCheck) return open.call(this, name, ...args);

      let request;
      const pending = {
        get result() { return request.result; },
        get error() { return request.error; },
        get transaction() { return request.transaction; }
      };
      window.finishJournalCheck = () => {
        request = open.call(this, name, ...args);
        for (const event of ['upgradeneeded', 'success', 'blocked', 'error']) {
          request.addEventListener(event, nativeEvent => pending['on' + event]?.(nativeEvent));
        }
      };
      return pending;
    };
  }, { state, recoveryDb, lang });

  const page = await context.newPage();
  // A cold WebView fixture transfers the full offline shell through Playwright routes.
  page.setDefaultNavigationTimeout(120000);
  if (state === 'journal') {
    await page.goto(origin + base + 'fixture.html');
    await page.evaluate(dbName => new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, 1);
      request.onerror = () => reject(request.error);
      request.onupgradeneeded = () => {
        request.result.createObjectStore('points', { keyPath: 'id' });
        request.result.createObjectStore('meta', { keyPath: 'key' });
      };
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction('meta', 'readwrite');
        transaction.objectStore('meta').put({ key: 'journal', value: { beforeId: 'fixture', schema: 1 } });
        transaction.oncomplete = () => { db.close(); resolve(); };
        transaction.onerror = () => { db.close(); reject(transaction.error); };
      };
    }), recoveryDb);
  }

  await page.goto(origin + base + 'nero.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof obVisible === 'function' && obVisible() && window.SukunRecoveryData);
  return { context, page };
}

async function checkStartup(browser) {
  const { context, page } = await openApp(browser, 'checking');
  try {
    await page.waitForFunction(() => typeof window.finishJournalCheck === 'function');
    assert.equal(await page.evaluate(() => SukunRecoveryData.hasPending()), true);
    assert.equal(await page.locator('#obDhikr').isDisabled(), true);
    assert.equal(await page.locator('#obReading').isDisabled(), true);
    assert.match(await page.locator('#obText').textContent(), /kayıtlar kontrol ediliyor/);
    assert.equal(await page.locator('#obSkip').isEnabled(), true);
    const title = await page.locator('#obTitle').textContent();
    await page.locator('#obNext').tap();
    assert.notEqual(await page.locator('#obTitle').textContent(), title);
    await page.locator('#obSkip').tap();
    await page.locator('#onboardCard').waitFor({ state: 'hidden' });

    const frequencyTab = page.locator('.wrap > nav.tabs [data-t="frq"]');
    await frequencyTab.tap();
    assert.match(await page.locator('#sukunToast').textContent(), /deposu kontrol ediliyor/);
    assert.equal(await frequencyTab.evaluate(node => node.classList.contains('act')), false);

    await page.evaluate(() => { window.finishJournalCheck(); });
    await page.waitForFunction(() => !SukunRecoveryData.hasPending());
    await frequencyTab.tap();
    await page.locator('.wrap > nav.tabs [data-t="frq"].act').waitFor({ state: 'visible' });
  } finally {
    await context.close();
  }
}

async function checkBlockedTap(browser, state) {
  const { context, page } = await openApp(browser, state);
  try {
    if (state === 'unavailable') {
      await page.waitForFunction(() => SukunRecoveryData.status().error);
    } else {
      await page.waitForFunction(() => document.querySelector('#r1019DataRecovery [data-role="status"]')?.textContent.includes('Bekleyen eski işlem bulundu'));
    }
    await page.locator('#obSkip').tap();
    const dialog = page.locator('#r1019RecoveryEmergency');
    await dialog.waitFor({ state: 'visible' });
    assert.equal(await dialog.locator('[data-emergency-close]').evaluate(node => document.activeElement === node), true);
    assert.equal(await page.locator('#onboardCard').evaluate(node => node.hidden), false);
    assert.equal(await dialog.locator('[data-action="reload"]').isVisible(), state === 'unavailable');
    assert.equal(await page.evaluate(() => SukunRecoveryData.hasPending()), true);
    await dialog.locator('[data-emergency-close]').tap();
    await dialog.waitFor({ state: 'hidden' });
  } finally {
    await context.close();
  }
}

module.exports = { openApp };

if (require.main === module) (async () => {
  assertRecoverySafety(await fs.readFile(path.join(root, 'assets/runtime/recovery-data-r1270.js'), 'utf8'));
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH, headless: true, args: ['--disable-gpu'] });
  try {
    await checkStartup(browser);
    console.log('PASS: first tour during slow storage and navigation after verification');
    await checkBlockedTap(browser, 'unavailable');
    console.log('PASS: failed storage keeps data guarded and exposes reload on tap');
    await checkBlockedTap(browser, 'journal');
    console.log('PASS: confirmed journal keeps data guarded and exposes recovery on tap');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
