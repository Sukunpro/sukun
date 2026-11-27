'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const { fixture } = require('../r1064/browser-fixture.cjs');
const root = path.resolve(process.argv[2] || path.join(__dirname, '../..'));

async function testWheel() {
  const f = await fixture(root, { width: 360, height: 760, hasTouch: true,
    seed: { 'sukun.obDone': '1', 'sukun.onboardSeen': '1' } });
  const { page } = f;
  const count = () => page.evaluate(() => SukunSessionState.snapshot().count);
  const waitCount = value => page.waitForFunction(n => SukunSessionState.snapshot().count === n, value);
  const undo = page.locator('#r1275Undo');
  const primary = page.locator('#r1275LayerPlay');
  const panel = page.locator('#r1275AudioDetails');
  const bg = () => page.evaluate(() => ({ amb: Object.keys(AMB).sort(), frequency: FR.playing }));
  async function select(journeyKind) {
    const result = await page.evaluate(kind => SukunTabOwner.run('manual', () =>
      SukunSessionState.command('select', { mode: 'esma', index: 0, journeyKind: kind }),
    { prime: false, releaseAfter: true }), journeyKind);
    assert.equal(result.accepted, true);
    await page.waitForFunction(kind => SukunSessionState.snapshot().journeyKind === kind, journeyKind);
  }
  try {
    await page.waitForFunction(() => {
      const r = window.SukunRecoveryData?.status();
      return r && !r.pending && !r.busy && !r.error && !r.reloadRequired && !window.SukunInteractionGateR732?.active();
    }, null, { timeout: 45000 });
    if (await page.locator('#dailyCard').isVisible()) await page.locator('#dcClose').click();
    await page.locator('.tab[data-t="zkr"]').first().click();
    await select('single');
    await page.evaluate(() => SukunManualVoice.set(false));
    const startCount = await count();
    await page.locator('#r920Counter').press('Enter');
    await waitCount(startCount + 1);
    await undo.click();
    await waitCount(startCount);
    await undo.waitFor({ state: 'hidden' });

    await panel.locator('summary').click();
    const ambience = page.locator('#r1275Ambience');
    const first = await ambience.locator('option').nth(1).getAttribute('value');
    await ambience.selectOption(first);
    await page.locator('#r1275AmbienceAction').click();
    await page.waitForFunction(id => Object.hasOwn(AMB, id), first);
    await page.locator('#r1275FrequencyAction').click();
    await page.waitForFunction(() => FR.playing);
    assert.deepEqual(await bg(), { amb: [first], frequency: true });
    await panel.locator('summary').click();

    await page.evaluate(async () => {
      await SukunVoiceSettings.setMode('turkish');
      await SukunVoiceSettings.setContent('legacy');
      __r1064SpeechFixture.setAuto(false);
    });
    await page.evaluate(() => SukunManualVoice.set(true));
    await page.locator('#r920Counter').press('Enter');
    await page.waitForFunction(() => __r1064SpeechFixture.snapshot().active);
    assert.equal(await count(), startCount);
    assert.equal(await undo.isVisible(), false);
    assert.equal(await page.evaluate(() => __r1064SpeechFixture.finish()), true);
    await waitCount(startCount + 1);
    await undo.click();
    await waitCount(startCount);
    await undo.waitFor({ state: 'hidden' });
    await page.evaluate(() => SukunManualVoice.set(false));
    await select('99');
    await primary.click();
    await page.waitForFunction(() => SukunEsma99Seyir.state().run && __r1064SpeechFixture.snapshot().active);
    const running = await count();
    await primary.click();
    await page.waitForFunction(() => SukunSessionState.snapshot().phase === 'PAUSED');
    assert.equal(await count(), running);
    assert.deepEqual(await bg(), { amb: [first], frequency: true });
    await primary.click();
    await page.waitForFunction(() => SukunEsma99Seyir.state().run && __r1064SpeechFixture.snapshot().active);
    await primary.click();
    await page.waitForFunction(() => SukunSessionState.snapshot().phase === 'PAUSED');
    assert.deepEqual(await bg(), { amb: [first], frequency: true });

    await page.evaluate(() => SukunVoiceSettings.setMode('personal'));
    await page.locator('#r1275ReadyVoice').click();
    await page.waitForFunction(() => SukunVoiceSettings.getMode() === 'generic');
    assert.equal(await count(), running);
    assert.equal(await page.evaluate(() => SukunEsma99Seyir.state().run), false);
    await page.evaluate(() => SukunVoiceSettings.setMode('personal'));
    await page.locator('#r1275Silent').click();
    await page.waitForFunction(() => SukunR698VoiceIntent.snapshot().explicitOff && document.getElementById('r1275LayerPlay').textContent.includes('+1'));
    assert.equal(await page.evaluate(() => SukunSecretPolicy.unlocked()), false);
    const silentStart = await count();
    await primary.click();
    await waitCount(silentStart + 1);
    await undo.click();
    await waitCount(silentStart);
    await undo.waitFor({ state: 'hidden' });
    assert.equal(await page.evaluate(() => SukunEsma99Seyir.state().run), false);
    assert.deepEqual(await bg(), { amb: [first], frequency: true });

    await page.locator('#r920Play').press('Enter');
    await page.waitForFunction(() => document.activeElement?.id === 'r1275EnableVoice' && document.getElementById('r1275AudioDetails').open);
    await page.locator('#r1275EnableVoice').press('Enter');
    await page.waitForFunction(() => !SukunR698VoiceIntent.snapshot().explicitOff && SukunVoiceSettings.getMode() === 'auto');
    assert.equal(await page.evaluate(() => SukunEsma99Seyir.state().run), false);
    assert.equal(await count(), silentStart);
    assert.deepEqual(await bg(), { amb: [first], frequency: true });
    assert.deepEqual(f.errors, []);
    assert.deepEqual(f.consoleErrors.filter(e => /integrity|digest/i.test(e)), []);
    console.log('PASS wheel count and one-shot undo, independent ambience/frequency during pause and resume, missing personal recording, silent public journey and source restoration.');
  } catch (error) {
    console.error(await page.evaluate(() => ({ practice: document.getElementById('r1275WheelAudio')?.innerText,
      state: SukunSessionState.snapshot().phase, gate: SukunCountCorrection.status(1),
      voice: SukunVoiceSettings.getMode(), recovery: SukunRecoveryData.status() })).catch(() => ({})));
    throw error;
  } finally {
    await f.close();
  }
}

testWheel().catch(error => { console.error(error); process.exitCode = 1; });
