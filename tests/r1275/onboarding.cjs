'use strict';

const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { openApp } = require('../r1270/recovery-startup-browser.cjs');

async function exercise(browser, choice, options) {
  const slow = choice === 'obDhikr';
  const { context, page } = await openApp(browser, slow ? 'checking' : 'normal', options);
  try {
    const card = page.locator('#onboardCard');
    const button = page.locator('#' + choice);
    assert.equal(await page.locator('#obChoices').isVisible(), true);
    if (options.lang === 'en') assert.equal(await button.textContent(), 'Listen to a surah');
    if (slow) {
      await page.waitForFunction(() => typeof finishJournalCheck === 'function');
      assert.equal(await button.isDisabled(), true);
      assert.match(await page.locator('#obText').textContent(), /kontrol ediliyor/);
      await page.evaluate(() => finishJournalCheck());
    }
    await page.waitForFunction(() => !window.SukunInteractionGateR732?.active());
    if (choice === 'obSkip') {
      const contrast = await button.evaluate(node => {
        const style = getComputedStyle(node);
        const luminance = rgb => rgb.match(/[\d.]+/g).slice(0,3).map(Number).map(n => n/255).map(n => n <= .04045 ? n/12.92 : ((n+.055)/1.055)**2.4).reduce((total,n,i) => total+n*[.2126,.7152,.0722][i],0);
        return (luminance(style.color)+.05)/(luminance(style.backgroundColor)+.05);
      });
      assert.ok(contrast >= 4.5, 'Explore label must remain readable');
    }
    await button.tap();
    if (choice === 'obNext') {
      await page.locator('#obChoices').waitFor({ state: 'hidden' });
      assert.equal(await card.isVisible(), true);
      const start = await page.locator('#obTitle').textContent();
      await button.tap();
      assert.notEqual(await page.locator('#obTitle').textContent(), start);
      await page.locator('#obSkip').tap();
    }
    await card.waitFor({ state: 'hidden' });
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('sukun.onboardSeen'))), 1);
    if (choice === 'obDhikr' || choice === 'obReading') {
      assert.equal(await page.locator('#r920Practice').isVisible(), true);
      if (choice === 'obReading') {
        assert.equal(await page.locator('#r1064ReadingSelect').inputValue(), 'reading:yasin');
        assert.equal(await page.locator('#r1064ReadingSelect').isVisible(), true);
      }
    }
    if (choice === 'obSkip') {
      await page.reload({ waitUntil: 'load' });
      await page.waitForFunction(() => window.SukunPracticeUI && window.SukunRecoveryData);
      assert.equal(await page.evaluate(() => obVisible()), false);
    }
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
    console.log('PASS', choice, options);
  } catch (error) {
    const state = await page.evaluate(() => ({
      title: document.getElementById('obTitle')?.textContent,
      message: document.getElementById('obText')?.textContent,
      recovery: window.SukunRecoveryData?.status(),
      tab: document.querySelector('.wrap > nav.tabs .act')?.dataset.t,
      practiceVisible: !!document.getElementById('r920Practice')?.getClientRects().length
    })).catch(() => null);
    throw new Error(choice + ' ' + JSON.stringify({options, state}), {cause:error});
  } finally { await context.close(); }
}

(async () => {
  const browser = await chromium.launch({executablePath:process.env.CHROMIUM_PATH, headless:true, args:['--disable-gpu']});
  try {
    await exercise(browser, 'obDhikr', {width:320, height:640});
    await exercise(browser, 'obReading', {width:393, height:820, lang:'en'});
    await exercise(browser, 'obNext', {width:672, height:320});
    await exercise(browser, 'obSkip', {width:360, height:760});
  } finally { await browser.close(); }
})().catch(error => {console.error(error); process.exitCode=1;});
