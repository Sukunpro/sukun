'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const { fixture } = require('../r1064/browser-fixture.cjs');
const root = path.resolve(process.argv[2] || path.join(__dirname, '../..'));

async function main() {
  const f = await fixture(root, { width: 360, height: 760, hasTouch: true,
    seed: { 'sukun.obDone': '1', 'sukun.onboardSeen': '1', 'sukun.myfreq': JSON.stringify([{ name:'Kişisel perde',c:331.2,b:3.25 }]) } });
  const { page } = f;
  const audio = page.locator('#r1275AudioDetails');
  const summary = audio.locator('summary');
  const picker = page.locator('#r1275Ambience');
  const toggle = page.locator('#r1275AmbienceAction');
  const list = page.locator('#r1276ActiveAmbiences');
  const frequency = page.locator('#r1276MainFrequency');
  const waitHz = (carrier, beat) => page.waitForFunction(([carrier,beat]) => {
    const text = document.getElementById('r1276MainFrequency').innerText;
    return text.includes(carrier) && text.includes(beat);
  }, [carrier,beat]);
  try {
    await page.waitForFunction(() => {
      const state = window.SukunRecoveryData?.status();
      return state && !state.pending && !state.busy && !state.error && !window.SukunInteractionGateR732?.active();
    }, null, { timeout: 45000 });
    if (await page.locator('#dailyCard').isVisible()) await page.locator('#dcClose').click();
    await page.locator('.tab[data-t="zkr"]').first().click();
    await page.locator('#r920TefEnter').click();
    await page.waitForFunction(() => window.SUKUN_TEFEKKUR?.active?.());
    await summary.tap();
    const channels = await picker.locator('option').evaluateAll(options =>
      options.slice(1, 3).map(node => ({ id: node.value, name: node.textContent })));
    assert.equal(channels.length,2);
    for (const { id, name } of channels) {
      await picker.selectOption(id);
      await toggle.tap();
      await list.getByRole('button', { name: name + ' ambiyansını kapat' }).waitFor();
    }
    const [first,second] = channels;
    await picker.selectOption(first.id);
    await page.locator('#r1275FrequencyAction').tap();
    await page.waitForFunction(() => FR.playing);
    await summary.tap();
    assert.equal(await audio.getAttribute('open'),null);
    await waitHz('180 Hz','7,83 Hz');
    const stopFirst = list.locator('[data-stop-ambience="' + first.id + '"]');
    const stopSecond = list.locator('[data-stop-ambience="' + second.id + '"]');
    await stopSecond.press('Enter');
    await stopSecond.waitFor({ state: 'detached' });
    assert.equal(await stopFirst.evaluate(b => document.activeElement === b),true);
    assert.deepEqual(await page.evaluate(() => Object.keys(AMB)),[first.id]);
    assert.equal(await picker.inputValue(),first.id);
    assert.equal(await page.evaluate(() => FR.playing),true);

    // Apply a named preset through its native control, then retune through the native input.
    await page.evaluate(() => {
      const preset = FREQ_PRESETS.findIndex(p => p.id === 'tefekkur');
      document.querySelector('#presets [data-p="' + preset + '"]').click();
    });
    await waitHz('136,1 Hz','6 Hz');
    assert.match(await frequency.innerText(),/Derin Tefekkür/);
    await page.evaluate(() => {
      const carrier = document.getElementById('carNum');
      carrier.value = '331.25';carrier.dispatchEvent(new Event('change',{bubbles:true}));
    });
    await waitHz('331,25 Hz','6 Hz');
    assert.doesNotMatch(await frequency.innerText(),/Derin Tefekkür/);
    await page.evaluate(() => {
      const preset = FREQ_PRESETS.findIndex(p => p.cat === 'diapason' && p.c === 256);
      document.querySelector('#presets [data-p="' + preset + '"]').click();
    });
    await waitHz('256 Hz','0 Hz');
    assert.equal(await page.evaluate(() => FR.b),0);
    await page.evaluate(() => document.querySelector('#presets [data-my="0"]').click());
    await waitHz('331,2 Hz','3,25 Hz');
    assert.match(await frequency.innerText(),/Kişisel perde/);
    await page.evaluate(() => document.getElementById('frToggle').click());
    await frequency.waitFor({ state:'hidden' });
    await summary.tap();
    await page.locator('#r1275FrequencyAction').tap();
    await summary.tap();
    await waitHz('331,2 Hz','3,25 Hz');
    assert.match(await frequency.innerText(),/Kişisel perde/);
    await page.evaluate(() => {
      SukunFrequencyHubR1101.controller.applyLibrary({name:'Aynı perdede yeni seçim',apply:{c:331.2,b:3.25}});
    });
    await page.waitForFunction(() => document.getElementById('r1276MainFrequency').innerText.includes('Aynı perdede yeni seçim'));
    await page.evaluate(() => document.getElementById('frToggle').click());
    await frequency.waitFor({ state:'hidden' });
    assert.deepEqual(await page.evaluate(() => Object.keys(AMB)),[first.id]);
    await stopFirst.press('Enter');
    await list.waitFor({ state:'hidden' });
    assert.equal(await summary.evaluate(node => document.activeElement === node),true);
    assert.deepEqual(await page.evaluate(() => Object.keys(AMB)),[]);
    assert.deepEqual(f.errors,[]);
    console.log('PASS contemplation wheel: two named ambiences, direct independent stops, keyboard focus, primary preset, native retune, zero-beat reference and stop.');
  } catch(error) {
    console.error(await page.evaluate(() => ({ screen: document.getElementById('r1275WheelAudio')?.innerText,
      ambiences: Object.keys(AMB), frequency: [FR.playing,FR.c,FR.b], tef: window.SUKUN_TEFEKKUR?.active?.() })).catch(() => ({})));
    throw error;
  } finally { await f.close(); }
}
main().catch(error => { console.error(error);process.exitCode=1; });
