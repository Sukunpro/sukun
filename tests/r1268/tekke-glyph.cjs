'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const {fixture} = require('../r1064/browser-fixture.cjs');

const root = path.resolve(process.argv[2] || path.join(__dirname, '../..'));

async function check() {
  const app = await fixture(root, {
    width: 360, height: 740, hasTouch: true,
    seed: {'sukun.obDone': '1', 'tekke.transport.folded': 'true'}
  });
  const {page} = app;
  try {
    await page.evaluate(() => {
      window.obClose?.();
      document.querySelector('#dcClose')?.click();
    });
    await page.waitForFunction(() => !window.SukunInteractionGateR732?.active?.());
    await page.locator('#tekkeTab').click();
    await page.locator('#tk #gBtn').click();
    await page.waitForFunction(() => window.Tekke.sessionState().phase === 'playing');

    // Double the text itself like a WebView text-size preference, keeping the
    // viewport and all other CSS dimensions at their normal sizes. Whole-page
    // zoom would also enlarge the ring and miss the original failure.
    await page.evaluate(() => {
      const selectors = [
        '#hu', '#backSukun', '#helpBtn', '#panelBtn', '#r992SessionBadge',
        '#zkAr', '#zkTr', '#zkPill', '#zkHand', '#phase', '#r992Pause'
      ];
      for (const selector of selectors) {
        const element = document.querySelector('#tk ' + selector);
        const size = parseFloat(getComputedStyle(element).fontSize);
        element.style.setProperty('font-size', (2 * size) + 'px', 'important');
      }
    });

    for (const [width, height] of [[360, 740], [740, 360], [320, 568]]) {
      await page.setViewportSize({width, height});
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      // Sample the drawing on a real hold frame near its maximum expansion.
      const sample = await page.waitForFunction(() => {
        const find = id => document.querySelector('#tk #' + id);
        if (find('phN').textContent.trim() !== 'TUT') return false;
        const scale = new DOMMatrixReadOnly(getComputedStyle(find('huWrap')).transform).a;
        if (scale < 1.065) return false;

        const circle = find('bArcBg').getBoundingClientRect();
        const path = find('hu').querySelector('path');
        const range = document.createRange();
        range.selectNodeContents(find('hu'));
        const word = path ? path.getBoundingClientRect() : range.getBoundingClientRect();
        const centeredX = circle.x + circle.width / 2;
        const centeredY = circle.y + circle.height / 2;
        const clearance = circle.width / 2 - Math.max(...[
          [word.left, word.top], [word.left, word.bottom],
          [word.right, word.top], [word.right, word.bottom]
        ].map(([x, y]) => Math.hypot(x - centeredX, y - centeredY)));

        const button = find('helpBtn');
        range.selectNodeContents(button);
        const helpText = range.getBoundingClientRect();
        const helpBox = button.getBoundingClientRect();
        // The count animation briefly expands the Arabic line box. Compare the
        // text ranges so its own line-height padding is not reported as ink.
        range.selectNodeContents(find('zkAr'));
        const ar = range.getBoundingClientRect();
        range.selectNodeContents(find('zkTr'));
        const tr = range.getBoundingClientRect();
        return {
          wordFits: word.width > 0 && clearance >= -1,
          helpFits: helpText.top >= helpBox.top - 1 && helpText.bottom <= helpBox.bottom + 1,
          arabicFits: ar.bottom <= tr.top + 1,
          bottomControlFits: find('r992Transport').getBoundingClientRect().bottom <= innerHeight + 1,
          clearance: Math.round(clearance)
        };
      }, null, {timeout: 30000});
      const result = await sample.jsonValue();
      assert(result.wordFits, 'The complete word and diacritic must fit inside the ring at maximum expansion');
      assert(result.helpFits, 'The question mark must fit inside its button');
      assert(result.arabicFits, 'Arabic and transliteration have separate rows');
      assert(result.bottomControlFits, 'The folded transport fits the viewport');
      console.log(JSON.stringify({width, height, textScale: 2, ...result}));
    }
  } finally {
    await app.close();
  }
}

check().catch(error => { console.error(error); process.exitCode = 1; });
