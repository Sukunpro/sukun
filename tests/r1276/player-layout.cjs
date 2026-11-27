'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const { fixture } = require('../r1064/browser-fixture.cjs');

const root = path.resolve(process.argv[2] || path.join(__dirname, '../..'));
const buttonId = 'r1263StopReasonButton';

async function run() {
  const app = await fixture(root, { width: 320, height: 760, hasTouch: true,
    seed: { 'sukun.obDone': '1', 'sukun.onboardSeen': '1' } });
  const page = app.page;
  try {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    if (await page.locator('#dcClose').isVisible()) await page.locator('#dcClose').click();
    await page.waitForFunction(() => window.SukunDockSize && !window.SukunInteractionGateR732?.active());
    await page.locator('.tab[data-t="frq"]').click();
    await page.locator('#frToggle').evaluate(button => button.click());
    await page.waitForFunction(() => FR.playing);
    await page.locator('#r170Now').waitFor({state:'visible'});

    for (const width of [320, 393, 1280]) {
      await page.setViewportSize({ width, height: width === 1280 ? 900 : 760 });
      for (const language of ['tr','en']) {
        await page.evaluate(lang => I18N.set(lang), language);
        const expected = language === 'tr' ? 'Ses neden durdu?' : 'Why did the sound stop?';
        await page.waitForFunction(([id,label]) => document.getElementById(id).getAttribute('aria-label') === label, [buttonId,expected]);
        for (const mode of ['mini','midi','max']) {
          await page.evaluate(value => SukunDockSize.set(value, true), mode);
          await page.waitForFunction(value => document.body.classList.contains('r588-mode-' + value), mode);
          const button = page.locator('#' + buttonId);
          await button.scrollIntoViewIfNeeded();
          const m = await button.evaluate(async node => {
            await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
            const box = node.getBoundingClientRect();
            const dock = document.getElementById('r588DockShell').getBoundingClientRect();
            const style = getComputedStyle(node);
            const text = document.createRange();
            text.selectNodeContents(node.firstElementChild);
            const lines = Array.from(text.getClientRects(), r => ({
              left: r.left-box.left, right: box.right-r.right,
              top: r.top-box.top, bottom: box.bottom-r.bottom
            }));
            return { framed: parseFloat(style.borderTopWidth) >= 1 && style.borderStyle !== 'none',
              inDock: box.left >= dock.left-1 && box.right <= dock.right+1 && box.top >= dock.top-1 && box.bottom <= dock.bottom+1,
              height: box.height, icon: getComputedStyle(node,'::before').content, lines };
          });
          const detail = JSON.stringify({ width, language, mode, ...m });
          assert(m.inDock && m.framed && m.height >= 44, detail);
          if (mode === 'mini') {
            assert.equal(m.icon, '"?"', detail);
            assert.equal(m.lines.length, 0, detail);
          } else {
            assert(m.lines.length && m.lines.every(r => r.left >= 8 && r.right >= 8 && r.top >= 1 && r.bottom >= 1), detail);
          }
        }
      }
    }
    assert.deepEqual(app.errors, []);
    console.log('PASS player help frame and full label across 3 widths, 3 player sizes and 2 languages');
  } finally { await app.close(); }
}
run().catch(error => { console.error(error); process.exitCode = 1; });
