'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {fixture} = require('../r1064/browser-fixture.cjs');
const root = path.resolve(process.argv[2] || path.join(__dirname, '../..'));
const output = process.argv[3];
const report = { build: fs.readFileSync(path.join(root, 'version.txt'), 'utf8').trim(), checks: [] };
const button = '#r1263StopReasonButton';
const dialog = '#r1263StopReasonDialog';
const message = '#r1263StopReasonMessage';
const close = '#r1263StopReasonClose';

async function run(width, height, entry) {
  const app = await fixture(root, {width, height, seed:{
    'sukun.obDone':'1', 'sukun.onboardSeen':'1', 'sukun.obSeenBuild':JSON.stringify(report.build), 'sukun.r920.focus':'0'
  }});
  const p = app.page;
  const row = { width, height, entry, modes: [] };
  report.checks.push(row);
  try {
    if (entry === 'index.html') await p.goto(app.origin + '/index.html', {waitUntil:'load'});
    await p.emulateMedia({reducedMotion:'reduce'});
    await p.evaluate(() => {window.obClose?.(); document.getElementById('dcClose')?.click();});
    await p.waitForFunction(() => window.SukunPlaybackStopReason && window.SukunDockSize && !window.SukunInteractionGateR732?.active?.());
    const snapshot = () => p.evaluate(() => SukunPlaybackStopReason.snapshot());
    assert.equal(await snapshot(), null);
    // Use the frequency engine's normal control, even when its tab is scrolled or
    // obscured by the fixed player. User-facing dock controls below use real clicks.
    await p.locator('.tab[data-t="frq"]').click();
    await p.locator('#frToggle').evaluate(node => node.click());
    await p.waitForFunction(() => FR.playing);
    await p.locator('#r170Now').waitFor({state:'visible'});
    for (const mode of ['mini','midi','max']) {
      await p.evaluate(mode => SukunDockSize.set(mode, true), mode);
      await p.locator(button).click({timeout:10000});
      assert(await p.locator(dialog).isVisible(), mode + ' detail dialog');
      const empty = await p.locator(message).innerText();
      assert(empty.trim().length > 0 && !/bluetooth|kulaklık|zamanlayıcı/i.test(empty));
      assert(await p.evaluate(() => FR.playing), 'Viewing diagnostics interrupted playback');
      const box = await p.locator(dialog).boundingBox();
      assert(box.x >= -1 && box.x+box.width <= width+1, 'Detail dialog overflows horizontally');
      await p.locator(close).click();
      assert.equal(await p.locator(dialog).isVisible(), false);
      const overlap = await p.locator(button).evaluate(trigger => {
        const rect = trigger.getBoundingClientRect();
        const controls = ['r588Play','r588Stop'].map(id => document.getElementById(id));
        return controls.filter(Boolean).some(control => {
          const r = control.getBoundingClientRect();
          return Math.min(rect.right,r.right)-Math.max(rect.left,r.left)>1 &&
            Math.min(rect.bottom,r.bottom)-Math.max(rect.top,r.top)>1;
        });
      });
      assert(!overlap, mode+' explanation covers a transport control');
      row.modes.push(mode);
    }

    await p.locator('#r588Play').click();
    await p.waitForFunction(() => SukunPlaybackStopReason.snapshot()?.code === 'user-paused');
    const paused = await snapshot();
    assert.equal(paused.scope, 'all');
    await p.locator(button).click();
    assert.match(await p.locator(message).innerText(), /duraklat/i);
    assert((await p.locator('#r1263StopReasonTime').innerText()).trim());
    await p.locator(close).click();
    row.dockPause = paused;

    if (width < 500) {
      // Keep the live change handler, one-second clock tick and fade completion.
      // Advance only the selected ten-minute deadline in this disposable profile.
      await p.locator('#r588Play').click();
      await p.waitForFunction(() => FR.playing && !SukunAudioSessionRegistry.aggregateSnapshot().paused);
      const started = await p.evaluate(async () => {
        const selection = await SukunSessionState.command('select', {mode:'esma', journeyKind:'single', index:0});
        if (!selection.accepted) return false;
        return (await SukunSessionState.command('start')).accepted;
      });
      assert(started, 'Timer scenario requires an accepted dhikr');
      await p.waitForFunction(() => SukunSessionState.snapshot().phase === 'PLAYING');
      await p.evaluate(() => {
        const select = document.getElementById('sleepTimer');
        select.value = '10';
        select.dispatchEvent(new Event('change', {bubbles:true}));
        stEnd = Date.now() - 1000;
      });
      await p.waitForFunction(() => !FR.playing && SukunPlaybackStopReason.snapshot()?.code === 'sleep-timer', null, {timeout:35000});
      row.sleepExpiry = await snapshot();
      assert.equal(row.sleepExpiry.scope, 'all');
      await p.waitForFunction(() => SukunSessionState.snapshot().phase === 'IDLE');
      assert.deepEqual(await snapshot(), row.sleepExpiry, 'Dhikr teardown overwrote the timer receipt');
    }

    // This event is emitted only after the media owner validates an unplanned
    // pause. Inject its observed receipt, without simulating physical headphones.
    await p.evaluate(() => dispatchEvent(new CustomEvent('sukun:r696-media-interruption', {
      detail:{key:'fixture-private-media-id', hidden:false, currentTime:1, at:Date.now()}
    })));
    await p.waitForFunction(() => SukunPlaybackStopReason.snapshot()?.code === 'unknown');
    const unknown = await snapshot();
    assert.equal(unknown.scope, 'recording');
    await p.reload({waitUntil:'load'});
    await p.waitForFunction(() => window.SukunPlaybackStopReason);
    assert.deepEqual(await snapshot(), unknown, 'Last interruption must survive reload in the same tab');
    row.lastAfterReload = unknown;
    await p.waitForFunction(() => !window.SukunInteractionGateR732?.active?.());
    await p.evaluate(() => {window.obClose?.(); document.getElementById('dcClose')?.click();});
    await p.locator('.tab[data-t="ntf"]').click();
    await p.locator('#r1263StopReasonNotifications').click();
    assert.match(await p.locator(message).innerText(), /Nedeni belirlenemedi/);
    await p.evaluate(() => I18N.set('en'));
    await p.waitForFunction(() => document.getElementById('r1263StopReasonMessage')?.textContent.includes('cause is unknown'));
    assert.match(await p.locator('#r1263StopReasonScope').innerText(), /recording/i);
    await p.keyboard.press('Escape');
    await p.waitForFunction(() => !document.getElementById('r1263StopReasonDialog').open);
    await p.waitForFunction(() => document.activeElement.id === 'r1263StopReasonNotifications');
    assert.deepEqual(app.errors, []);
    row.ok = true;
  } finally { await app.close(); }
}

(async () => {
  try {
    await run(390, 844, 'nero.html');
    await run(1280, 900, 'index.html');
    report.passed = true;
  } catch (error) {
    report.passed = false;
    report.error = error.stack;
    process.exitCode = 1;
  } finally {
    if (output) {
      fs.mkdirSync(path.dirname(output), {recursive:true});
      fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
    }
    console.log(JSON.stringify(report, null, 2));
  }
})();
