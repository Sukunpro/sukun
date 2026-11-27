'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const { fixture } = require('../r1064/browser-fixture.cjs');

async function measure(page) {
  return page.evaluate(() => {
    const byId = id => document.getElementById(id);
    const card = byId('r1275WheelAudio');
    const disclosure = byId('r1275AudioDetails').querySelector('summary');
    const label = byId('r1275SoundsLabel');
    const range = document.createRange();
    range.selectNodeContents(label);
    const inside = (inner, outer) => inner.left >= outer.left - 1 && inner.right <= outer.right + 1 &&
      inner.top >= outer.top - 1 && inner.bottom <= outer.bottom + 1;
    const labelFits = inside(range.getBoundingClientRect(), disclosure.getBoundingClientRect());
    const chevron = getComputedStyle(disclosure, '::after');
    const controls = [...card.querySelectorAll('button,summary,select')].filter(el => el.checkVisibility());
    return {
      labelFits,
      chevronWidth: parseFloat(chevron.width),
      cardPaint: [getComputedStyle(card).backgroundColor, getComputedStyle(card).backgroundImage],
      controls: controls.map(el => {
        const box = el.getBoundingClientRect();
        return {
          label: el.getAttribute('aria-label') || el.textContent.trim(),
          withinCard: inside(box, card.getBoundingClientRect()),
          height: box.height,
          background: getComputedStyle(el).backgroundColor
        };
      }),
      overflow: card.scrollWidth - card.clientWidth
    };
  });
}

function assertFocusGeometry(result) {
  assert(result.labelFits, 'The Sounds label must stay in its closed or expanded frame');
  assert(result.chevronWidth > 0 && result.chevronWidth < 12, 'Use a compact disclosure mark');
  assert.deepEqual(result.cardPaint, ['rgba(0, 0, 0, 0)', 'none'], 'The reflection scene shows through the card');
  assert(result.overflow <= 1, 'The audio card must fit the mobile viewport');
  for (const control of result.controls) {
    assert(control.withinCard, 'Control outside the sound card: ' + control.label);
    assert(control.height >= 44, 'Short touch target: ' + control.label);
    assert.match(control.background, /^rgba\(/, 'Expected translucent reflection control: ' + control.label);
  }
}

async function run() {
  const root = path.resolve(process.argv[2] || path.join(__dirname, '../..'));
  const f = await fixture(root, { width: 320, height: 700, hasTouch: true,
    seed: { 'sukun.obDone': '1', 'sukun.onboardSeen': '1' } });
  try {
    const p = f.page;
    await p.waitForFunction(() => {
      const state = window.SukunRecoveryData?.status();
      return state && !state.pending && !state.busy && !window.SukunInteractionGateR732?.active();
    }, null, { timeout: 45000 });
    if (await p.locator('#dailyCard').isVisible()) await p.locator('#dcClose').click();
    await p.locator('.tab[data-t="zkr"]').first().click();
    await p.locator('#r920TefEnter').tap();
    await p.waitForFunction(() => document.body.classList.contains('sukun-tefekkur-mode'));
    const mode = () => p.locator('#r920Practice').getAttribute('data-r1056-focus-controls');
    const toggle = p.locator('#r1056FocusControlsToggle');
    if (await mode() !== 'hidden') await toggle.tap();
    assert.equal(await mode(), 'hidden');
    assertFocusGeometry(await measure(p));

    const summary = p.locator('#r1275AudioDetails summary');
    await summary.tap();
    const select = p.locator('#r1275Ambience');
    const choices = await select.locator('option').evaluateAll(options =>
      options.filter(el => el.value).sort((a, b) => b.textContent.length - a.textContent.length)
        .slice(0, 2).map(el => el.value));
    assert.equal(choices.length, 2);
    for (const value of choices) {
      await select.selectOption(value);
      await p.locator('#r1275AmbienceAction').tap();
      await p.locator('#r1276ActiveAmbiences button[data-stop-ambience="' + value + '"]').waitFor();
    }
    await p.locator('#r1275FrequencyAction').tap();
    await p.locator('#r1276MainFrequency').waitFor();
    assertFocusGeometry(await measure(p));
    await summary.tap();
    assert.equal(await p.locator('#r1276ActiveAmbiences button:visible').count(), 2);
    assert(await p.locator('#r1276MainFrequency').isVisible());
    for (const width of [320, 393]) {
      await p.setViewportSize({ width, height: 760 });
      assertFocusGeometry(await measure(p));
    }
    await toggle.tap();
    assert.equal(await mode(), 'shown');
    assertFocusGeometry(await measure(p));
    assert.deepEqual(f.errors, []);
    console.log('PASS translucent reflection sound controls, disclosure and active layers at 320px and 393px');
  } finally {
    await f.close();
  }
}
run().catch(error => { console.error(error); process.exitCode = 1; });
