// node tests/r1268/mobile-layout.cjs [site-root]
// Exercise an unseeded profile and enlarged text in Chromium's mobile layout.
'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs/promises');
const {chromium} = require('playwright');

const root = path.resolve(process.argv[2] || path.join(__dirname, '../..'));
const tabLabels = '.wrap > nav.tabs > button > .tbL';
const homeLabels = '#r616Home .r616Stat > *, #r616Home .r616Shortcut > span, #r616BottomNav > button > span';

async function checkMode(page, mode, saved) {
  await page.waitForFunction(() => window.SukunLayoutModes && window.SukunShellSkin &&
    document.body.classList.contains('r716-shell'));
  const state = await page.evaluate(() => ({
    mode: window.SukunLayoutModes.current(),
    bodyMode: document.body.className.match(/\br617-mode-(classic|simple|focus)\b/)?.[1],
    appearance: window.SukunShellSkin.getAppearance(),
    saved: localStorage.getItem('sukun.ui.shellMode')
  }));
  assert.deepEqual(state, {mode, bodyMode: mode, appearance: 'feyz', saved});
}

async function changeLayout(page, next) {
  await page.evaluate(() => window.SukunLayoutModes.open());
  await page.locator('.r617ModeOption[data-mode="' + next + '"]').click();
  await Promise.all([
    page.waitForNavigation({waitUntil: 'domcontentloaded'}),
    page.locator('#r617ModeApply').click()
  ]);
  await checkMode(page, next, next);
}

// Range rectangles measure the letters themselves. Scaling the font and leaving
// the viewport intact exposes wrapping errors that screenshot zoom cannot.
async function enlargeText(page, selector) {
  const growth = await page.locator(selector).evaluateAll(elements => {
    const first = elements.find(el => el.getBoundingClientRect().width && el.firstChild?.nodeType === Node.TEXT_NODE);
    const letter = document.createRange();
    letter.setStart(first.firstChild, 0);
    letter.setEnd(first.firstChild, 1);
    const original = letter.getBoundingClientRect().height;
    const sizes = elements.map(el => parseFloat(getComputedStyle(el).fontSize));
    for (const [i, el] of elements.entries()) el.style.setProperty('font-size', sizes[i] * 2 + 'px', 'important');
    return letter.getBoundingClientRect().height / original;
  });
  assert.ok(growth > 1.75, 'Browser did not render enlarged glyphs');
}
async function checkWords(page, selector, minLabels) {
  const result = await page.locator(selector).evaluateAll(elements => {
    const labels = elements.filter(el => el.getBoundingClientRect().width);
    const issues = [];
    for (const el of labels) {
      const frame = el.closest('button, .r616Stat').getBoundingClientRect();
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const text = walker.currentNode;
        for (const match of text.data.matchAll(/\S+/gu)) {
          const range = document.createRange();
          range.setStart(text, match.index);
          range.setEnd(text, match.index + match[0].length);
          const [rect, extra] = range.getClientRects();
          if (!rect || extra || rect.left < frame.left - 2 || rect.right > frame.right + 2 ||
              rect.top < frame.top - 3 || rect.bottom > frame.bottom + 3) issues.push(match[0]);
        }
      }
    }
    return {labels: labels.length, issues};
  });
  assert.ok(result.labels >= minLabels, 'Expected visible labels for ' + selector);
  assert.deepEqual(result.issues, [], 'A word wrapped or escaped its control');
}

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH, headless: true, args: ['--disable-gpu']
  });
  try {
    const origin = 'https://sukun.test';
    const context = await browser.newContext({
      viewport: {width: 360, height: 760}, isMobile: true, hasTouch: true,
      deviceScaleFactor: 2.5, locale: 'tr-TR', serviceWorkers: 'block'
    });
    // The shared audio fixture pre-seeds Classic. Load the real files into a
    // fresh same-origin context so the very first layout choice is observable.
    await context.route('**/*', async route => {
      const url = new URL(route.request().url());
      const file = path.resolve(root, '.' + decodeURIComponent(url.pathname));
      if (url.origin !== origin || !file.startsWith(root + path.sep)) return route.abort();
      const stat = await fs.stat(file).catch(() => null);
      return stat?.isFile() ? route.fulfill({path: file}) : route.fulfill({status: 404, body: ''});
    });
    const page = await context.newPage();
    await page.goto(origin + '/nero.html', {waitUntil: 'domcontentloaded'});
    await checkMode(page, 'classic', null);
    await page.waitForFunction(() => typeof obVisible === 'function' && obVisible() &&
      typeof document.getElementById('obSkip').onclick === 'function' && !window.SukunInteractionGateR732?.active());
    await page.locator('#obSkip').tap();
    await page.locator('#onboardCard').waitFor({state: 'hidden'});
    assert.ok(await page.locator('.wrap > nav.tabs .tab.act').evaluate(tab => tab === document.activeElement),
      'Closing the first tour returns keyboard focus to the active Classic tab');
    await page.locator('.wrap > nav.tabs [data-t="amb"]').click();
    const water = page.locator('#mixer [data-ambacc="su"]');
    if (!await water.evaluate(el => el.classList.contains('open'))) await water.locator('.preAccHead').click();
    const row = page.locator('#chn-su_fokurdama');
    await row.waitFor({state: 'visible'});
    await checkWords(page, tabLabels, 6);
    await enlargeText(page, tabLabels + ', #chn-su_fokurdama :is(.chIc,.chName b,.chName small)');
    await checkWords(page, tabLabels, 6);
    assert.ok(await row.evaluate(el => {
      const icon = document.createRange();
      icon.selectNodeContents(el.querySelector('.chIc'));
      return icon.getBoundingClientRect().right <= el.querySelector('.chName').getBoundingClientRect().left + 1;
    }), 'Mixer icon overlaps the channel text');

    await changeLayout(page, 'simple');
    await page.setViewportSize({width: 320, height: 640});
    await checkWords(page, homeLabels, 15);
    await enlargeText(page, homeLabels);
    await checkWords(page, homeLabels, 15);
    const last = page.locator('#r616BottomNav > button:visible').last();
    await last.scrollIntoViewIfNeeded();
    assert.ok(await last.evaluate(el => {
      const button = el.getBoundingClientRect(), nav = el.parentElement.getBoundingClientRect();
      return button.left >= nav.left - 1 && button.right <= nav.right + 1;
    }), 'Final home tab is unreachable');
    await page.reload({waitUntil: 'domcontentloaded'});
    await checkMode(page, 'simple', 'simple');
    await changeLayout(page, 'classic');
    await page.evaluate(() => window.SukunDiscoveryR1158.open('araclar'));
    const backup = page.locator('#bakBox');
    if (!await backup.evaluate(box => box.open)) await backup.locator('summary').click();
    for (const width of [320, 360, 412]) {
      await page.setViewportSize({width, height: 740});
      await page.locator('#bakJournalImport').scrollIntoViewIfNeeded();
      assert.ok(await backup.evaluate(box => {
        const outer = box.getBoundingClientRect();
        return box.scrollWidth <= box.clientWidth + 1 &&
          [...box.querySelectorAll('.bakRow :is(label, select, button)')].every(control => {
            const rect = control.getBoundingClientRect();
            const targetFits = control.tagName === 'LABEL' || rect.height >= 44;
            return targetFits && rect.width > 0 && rect.left >= outer.left - 1 && rect.right <= outer.right + 1;
          });
      }), 'Every backup control fits the ' + width + 'px viewport');
    }
    console.log('PASS: Classic/Feyz, 320–412px journal controls, first-tour focus, saved layout, 200% labels, mixer icon and tabs');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
