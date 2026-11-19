'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const { fixture } = require('../r1064/browser-fixture.cjs');

async function main() {
  const root = path.resolve(__dirname, '../..');
  const browser = await fixture(root, {
    width: 393, height: 852, hasTouch: true, seed: { 'sukun.obDone': '1' }
  });
  const page = browser.page;
  const panel = page.locator('#hzvBox');
  const chapter = page.locator('[data-hzv-action="git"][data-index="1"]');
  const errorMessage = 'Cihaz sesi başlatılamadı';

  async function toolsSection() {
    await page.evaluate(() => {
      SukunPracticeUI.openSection('zmgAraclar', { reveal: false });
      document.querySelector('#trkBox').open = true;
    });
  }
  async function collapseReader() {
    await page.evaluate(() => {
      document.querySelector('#hzvBox').open = false;
      document.querySelector('#zmgOkumalar').open = false;
    });
  }
  async function snapshot() {
    return page.evaluate(() => ({
      attempts: window.hizbNavigationProbe.attempts,
      errors: window.hizbNavigationProbe.errors,
      counterScrolls: window.hizbNavigationProbe.counterScrolls,
      playing: Boolean(window.__hzvPlaying)
    }));
  }
  async function expectQuiet(name) {
    // Covers the recommendation's deferred continuation, queued reader start and voice retry.
    await page.waitForTimeout(1400);
    const state = await snapshot();
    assert.equal(state.attempts, 0, name);
    assert.equal(state.errors, 0, name);
    assert.equal(state.playing, false, name);
  }

  try {
    await page.evaluate(() => { window.obClose?.(); document.querySelector('#dcClose')?.click(); });
    await page.waitForFunction(() => !window.SukunInteractionGateR732?.active?.());
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.locator('.tab[data-t="zkr"]').tap();
    await page.evaluate(() => {
      SukunPracticeUI.openSection('zmgOkumalar', { reveal: false });
      SukunGenericRecordings.setEnabled(false);
      const probe = window.hizbNavigationProbe = { attempts: 0, errors: 0, counterScrolls: 0, failSpeech: false };
      const speak = speechSynthesis.speak.bind(speechSynthesis);
      speechSynthesis.speak = utterance => {
        if (utterance.text.trim().length <= 5) return speak(utterance); // Short platform unlock cue.
        probe.attempts++;
        if (!probe.failSpeech) return speak(utterance);
        // Fail the actual chapter request, independently of any queued platform unlock cue.
        queueMicrotask(() => {
          const error = Object.assign(new Event('error'), { utterance, error: 'synthesis-failed' });
          utterance.dispatchEvent(error);
          utterance.onerror?.(error);
        });
      };
      const status = document.querySelector('#hzvProg');
      new MutationObserver(() => {
        if (status.textContent.includes('Cihaz sesi başlatılamadı')) probe.errors++;
      }).observe(status, { childList: true, subtree: true, characterData: true });
      const counter = document.querySelector('#zStage');
      const scroll = counter.scrollIntoView.bind(counter);
      counter.scrollIntoView = (...args) => { probe.counterScrolls++; return scroll(...args); };
    });

    await panel.locator(':scope > summary').tap();
    await page.locator('.hzvSec[data-index="1"]').tap();
    await page.locator('.hzvMetinAc[data-index="2"]').tap();
    assert(await page.locator('#hzvInline-1').isVisible());
    assert(await page.locator('#hzvInline-2').isVisible());
    await expectQuiet('chapter title and book');

    await collapseReader();
    await toolsSection();
    await page.locator('#trkHizb').tap();
    assert(await chapter.isVisible());
    await expectQuiet('Terkip reader shortcut');
    await panel.locator(':scope > summary').tap();
    await toolsSection();
    await page.locator('#trkHizb').tap();
    await panel.locator(':scope > summary').tap();
    await expectQuiet('immediate close');
    assert.equal(await panel.evaluate(el => el.open), false);

    await toolsSection();
    await collapseReader();
    await page.locator('#trkSec .trkAd[data-i="1"]').tap();
    await page.locator('#trkSec .trkAd[data-i="2"]').tap();
    await page.locator('#trkKur').tap();
    await page.locator('#zaKat .zaEvet').tap();
    await expectQuiet('Terkip recommendation');
    await page.waitForFunction(() => JSON.stringify(S.get(TRK.anahtar, [])) === '[1,2]' && Z.cat === 'terkip');
    assert(await chapter.isVisible());
    assert.equal((await snapshot()).counterScrolls, 0, 'reading must retain the reader view');

    await toolsSection();
    await page.locator('#trkKur').tap();
    await page.locator('#zaKat .zaHayir').tap();
    await page.waitForFunction(() => window.hizbNavigationProbe.counterScrolls > 0);

    await page.evaluate(() => SukunPracticeUI.openSection('zmgOkumalar', { reveal: false }));
    await page.evaluate(() => { window.hizbNavigationProbe.failSpeech = true; });
    await page.locator('#hzvOku').tap();
    await page.waitForFunction(message => document.querySelector('#hzvProg').textContent.includes(message), errorMessage);
    const failed = await snapshot();
    assert.equal(failed.attempts, 2, 'failed voice gets one initial attempt and one retry');
    assert.equal(failed.playing, false);
    assert(failed.errors > 0, 'a genuine voice failure must remain visible');

    await page.evaluate(() => { window.hizbNavigationProbe.failSpeech = false; });
    await chapter.tap();
    await page.waitForFunction(() => window.__hzvPlaying && window.hizbNavigationProbe.attempts === 3);
    await toolsSection();
    await page.locator('#trkHizb').tap();
    await page.waitForTimeout(700);
    assert.equal((await snapshot()).attempts, 3, 'navigation must not restart ongoing audio');
    assert.equal((await snapshot()).playing, true, 'navigation must not stop ongoing audio');
    console.log('PASS Hizb silent navigation, Terkip selection, active playback and genuine device voice failure');
  } finally {
    await browser.close();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
