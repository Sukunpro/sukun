'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.resolve(process.argv[2] || path.join(__dirname, '../..'));
const {fixture} = require(path.join(root, 'tests/r1064/browser-fixture.cjs'));

async function check(width, height) {
  const app = await fixture(root, {width, height, hasTouch:true});
  const {page} = app;
  const focused = selector => page.locator(selector).evaluate(el => el === document.activeElement);
  try {
    await page.evaluate(() => { window.obClose?.(); document.querySelector('#dcClose')?.click(); });
    await page.waitForFunction(() => !window.SukunInteractionGateR732?.active?.());
    await page.locator('#tekkeTab').click();
    await page.waitForFunction(() => document.activeElement?.id === 'gBtn');
    await page.keyboard.press('Tab');
    assert.ok(await focused('#backSukun'), 'Tab from Start should stay at the gate and reach Return');
    await page.keyboard.press('Shift+Tab');
    assert.ok(await focused('#gBtn'), 'Reverse Tab should return to Start');

    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    assert.ok(await focused('#r992GateSettings'));
    await page.keyboard.press('Tab');
    assert.ok(await focused('[data-tk-action="purpose-dhikr"]'), 'Closed settings should be skipped');
    await page.keyboard.press('Enter');
    await page.locator('#gBtn').focus();
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => document.querySelector('#tk')?.dataset.tkEntered === '1');
    await page.waitForFunction(() => document.activeElement?.id === 'r992TransportTitle');
    await page.locator('#tk #panelBtn').click();
    await page.waitForFunction(() => document.activeElement?.closest('#panel.open'));
    await page.keyboard.press('Shift+Tab');
    assert.ok(await focused('#r992PanelFooter [data-tk-action="close-settings"]'));
    await page.keyboard.press('Escape');
    assert.ok(await focused('#panelBtn'));
    await page.locator('#tk #helpBtn').click();
    await page.waitForFunction(() => document.activeElement?.id === 'r997HelpClose');
    await page.keyboard.press('Escape');
    assert.ok(await focused('#helpBtn'));
    await page.locator('#backSukun').focus();
    await page.keyboard.press('Shift+Tab');
    assert.ok(await page.evaluate(() => !!document.activeElement?.closest('#r992Transport')));
    await page.keyboard.press('Tab');
    assert.ok(await focused('#backSukun'));
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => document.querySelector('#tk').hidden);
    assert.deepEqual(app.errors, []);
    console.log('PASS Tekke keyboard entry, session, settings, guide and exit at '+width+'×'+height);
  } finally { await app.close(); }
}

(async () => {
  await check(320, 568);
  await check(360, 740);
})().catch(error => { console.error(error); process.exitCode=1; });
