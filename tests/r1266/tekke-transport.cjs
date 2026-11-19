'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const {fixture} = require('../r1064/browser-fixture.cjs');

async function enterDhikr(page) {
  await page.evaluate(() => { window.obClose?.(); document.querySelector('#dcClose')?.click(); });
  await page.waitForFunction(() => !window.SukunInteractionGateR732?.active?.());
  await page.locator('#tekkeTab').click();
  await page.locator('#tk [data-tk-action="purpose-dhikr"]').click();
  await page.locator('#tk #gBtn').click();
  await page.waitForFunction(() => window.Tekke?.sessionState?.()?.phase === 'playing');
}

async function check() {
  const app = await fixture(path.resolve(__dirname, '../..'), {
    width: 412, height: 915, hasTouch: true, seed: {'sukun.obDone': '1'}
  });
  const {page} = app;
  page.setDefaultTimeout(30000);
  try {
    await enterDhikr(page);
    const title = page.locator('#tk #r992TransportTitle');
    const pause = page.locator('#tk #r992Pause');
    const finish = page.locator('#tk #r992Finish');
    const volume = page.locator('#tk #r992Volume');
    const stage = page.locator('#tk #stage');
    const originalPause = await pause.elementHandle();
    assert.equal(await title.getAttribute('aria-expanded'), 'true');
    const expanded = await stage.boundingBox();

    await title.tap();
    assert.equal(await title.getAttribute('aria-expanded'), 'false');
    assert.equal(await finish.isVisible(), false);
    assert.equal(await volume.isVisible(), false);
    assert((await stage.boundingBox()).height > expanded.height + 60, 'Folding frees space for the scene');
    assert(await pause.evaluate((element, original) => element === original, originalPause));
    assert.equal(await page.evaluate(() => window.Tekke.sessionState().phase), 'playing');

    await pause.tap();
    await page.waitForFunction(() => window.Tekke.sessionState().phase === 'paused');
    await title.tap();
    assert.equal(await title.getAttribute('aria-expanded'), 'true');
    assert(await finish.isVisible() && await volume.isVisible());
    assert.equal(await page.evaluate(() => window.Tekke.sessionState().phase), 'paused');
    const label = await title.locator('.r992TransportLabel').boundingBox();
    const x = label.x + label.width / 2;
    const y = label.y + label.height / 2;
    const touch = await page.context().newCDPSession(page);
    await touch.send('Input.dispatchTouchEvent', {type: 'touchStart', touchPoints: [{x, y}]});
    for (const delta of [12, 24, 36, 48]) {
      await touch.send('Input.dispatchTouchEvent', {type: 'touchMove', touchPoints: [{x, y: y + delta}]});
    }
    await touch.send('Input.dispatchTouchEvent', {type: 'touchEnd', touchPoints: []});
    await touch.detach();
    assert.equal(await title.getAttribute('aria-expanded'), 'false', 'A downward drag folds exactly once');
    assert.equal(await page.evaluate(() => window.Tekke.sessionState().phase), 'paused');
    await pause.tap();
    await page.waitForFunction(() => window.Tekke.sessionState().phase === 'playing');
    assert(await page.evaluate(() => window.SukunTabOwner.owns()), 'Resumed audio belongs to this tab');
    await page.reload({waitUntil: 'load'});
    await enterDhikr(page);
    assert.equal(await title.getAttribute('aria-expanded'), 'false', 'Another session restores the folded rail');
    assert(await pause.isVisible());
    console.log('Tekke transport tap, drag, playback, stage space and saved preference passed.');
  } finally {
    await app.close();
  }
}

check().catch(error => { console.error(error); process.exitCode = 1; });
