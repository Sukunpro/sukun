'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const { fixture } = require('../r1064/browser-fixture.cjs');

const root = path.resolve(process.argv[2] || path.join(__dirname, '../..'));
const seen = { 'sukun.obDone': '1', 'sukun.onboardSeen': '1' };

async function ready(page) {
  console.log('Mobile home startup', await page.evaluate(() => ({ recovery:window.SukunRecoveryData?.status(), practice:!!window.SukunHomePractice, ui:!!window.SukunPracticeUI, gate:window.SukunInteractionGateR732?.active(), tab:document.querySelector('.tab.act')?.dataset.t, hidden:document.querySelector('#tab-amb')?.hidden, action:document.querySelector('#prDGo')?.innerText })));
  await page.waitForFunction(() => {
    const recovery = window.SukunRecoveryData?.status();
    return recovery && !recovery.pending && !recovery.busy && !recovery.reloadRequired &&
      !recovery.error && window.SukunHomePractice && window.SukunPracticeUI &&
      !window.SukunInteractionGateR732?.active() && !document.querySelector('#tab-amb').hidden;
  }, null, { timeout: 40000 });
  if (await page.locator('#dailyCard').isVisible()) await page.locator('#dcClose').click();
  await page.locator('#prDGo').waitFor({ state: 'visible' });
}

async function newProfile() {
  // Private progress must never become the public home call to action.
  const f = await fixture(root, { width: 360, height: 760, hasTouch: true, seed: {
    ...seen,
    'sukun.berhet.seyir.state': JSON.stringify({ i: 4, rep: 9, totalDone: 120, mode: 'custom', custom: 33 }),
    'sukun.home.practiceOrder.v1': '28'
  } });
  try {
    const p = f.page;
    await ready(p);
    console.log('Loaded fresh mobile home');
    assert.equal(await p.evaluate(() => SukunSecretPolicy.unlocked()), false);
    const button = p.locator('#prDGo');
    assert.match(await button.innerText(), /İlk zikrini seç/);
    assert.equal(await p.locator('#r1275HomeCount').innerText(), '');
    const bounds = await button.boundingBox();
    assert.ok(bounds.y >= 0 && bounds.y + bounds.height <= 760, JSON.stringify(bounds));
    for (const [language, label, scope] of [
      ['en', 'Download journal and settings', 'Voice recordings and ambient audio files are excluded.'],
      ['tr', 'Defter ve ayarları indir', 'Ses kayıtları ve ambiyans ses dosyaları hariçtir.']
    ]) {
      await p.evaluate(lang => I18N.set(lang), language);
      await p.waitForFunction(([label, scope]) => document.getElementById('bakSettingsExportBtn').textContent.includes(label) &&
        document.getElementById('bakJournalExportScope').textContent.includes(scope), [label, scope]);
      assert.equal(await p.locator('#bakSettingsExportBtn').getAttribute('aria-describedby'), 'bakJournalExportScope');
    }
    console.log('Verified fresh call to action, locked journey and backup descriptions');
    await button.click();
    await p.waitForFunction(() => document.querySelector('#r920Atlas')?.open);
    assert.equal(await p.evaluate(() => window.SukunEsma99Seyir.state().run), false);
    assert.deepEqual(f.errors, []);
  } finally { await f.close(); }
}

async function savedJourney() {
  const progress = { i: 0, rep: 12, totalDone: 12, mode: 'custom', custom: 33, gap: 900 };
  const f = await fixture(root, { width: 393, height: 796, hasTouch: true, seed: {
    ...seen, 'sukun.esma99.seyir.state': JSON.stringify(progress),
    'sukun.berhet.seyir.state': JSON.stringify({ i: 28, rep: 0, totalDone: 28, mode: '1' }),
    'sukun.home.practiceOrder.v1': '28,99'
  } });
  try {
    const p = f.page;
    await ready(p);
    console.log('Loaded saved-journey mobile home');
    // With both journeys eligible, the earlier incomplete one wins over a more recent completion.
    assert.equal(await p.evaluate(() => KLT_AC('disposable-home-practice-test')), true);
    assert.equal(await p.evaluate(() => SukunBerhetiyyeSeyir.state().i), 28);
    await p.waitForFunction(() => document.querySelector('#r1275HomeCount').textContent.includes('12 / 33'));
    assert.match(await p.locator('#prDNow').innerText(), /99 Esmâ.*Rahm[aâ]n/i);
    assert.match(await p.locator('#prDGo').innerText(), /Zikre dön/);
    await p.locator('#prDGo').click();
    await p.waitForFunction(() => !document.querySelector('#tab-zkr').hidden && window.SukunSessionState.snapshot().journeyKind === '99');
    const result = await p.evaluate(() => ({ state: SukunEsma99Seyir.state(), view: SukunEsma99Seyir.display(),
      speech: __r1064SpeechFixture.snapshot().log }));
    assert.equal(result.state.i, progress.i);
    assert.equal(result.state.run, false);
    assert.equal(result.view.count, progress.rep);
    assert.equal(result.view.target, progress.custom);
    assert.deepEqual(result.speech, []);
    assert.deepEqual(f.errors, []);
  } finally { await f.close(); }
}

(async () => {
  await newProfile();
  await savedJourney();
  console.log('PASS mobile home selection, private progress, saved 99 journey, silent resume and journal labels in Turkish and English');
})().catch(error => { console.error(error); process.exitCode = 1; });
