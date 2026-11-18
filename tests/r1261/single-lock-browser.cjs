'use strict';
// Disposable Chromium profile, simulated visibility. Only FX admission is delayed.
// IndexedDB, the packed source, HTMLAudioElement and its media clock are real.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {fixture, wav} = require('../r1064/browser-fixture.cjs');

const root = path.resolve(process.argv[2] || path.join(__dirname, '../..'));
const output = path.resolve(process.argv[3] || '/tmp/r1261-single-lock.json');
const results = [];

async function command(page, action, options = {}) {
  const result = await page.evaluate(({action, options}) => SukunSessionState.command(action, options), {action, options});
  assert.equal(result.accepted, true, JSON.stringify(result));
}

async function visibility(page, hidden) {
  await page.evaluate(hidden => {
    Object.defineProperty(document, 'hidden', {configurable:true, get:() => hidden});
    Object.defineProperty(document, 'visibilityState', {configurable:true, get:() => hidden ? 'hidden' : 'visible'});
    document.dispatchEvent(new Event('visibilitychange'));
  }, hidden);
}

async function state(page) {
  return page.evaluate(() => {
    const a = document.getElementById('r476LockZikirAudio');
    const monitor = window.lockTest;
    return {
      key:zikirKey(), count:Z.count, target:Z.target, total:Z.total, auto:Z.auto,
      hidden:document.hidden, phase:SukunSessionState.snapshot().phase,
      failure:SukunRecordingFailure.get().code || '', holds:monitor.holds,
      stages:monitor.stages, jobs:monitor.jobs, aborted:monitor.aborted,
      native:SukunLockAudio.snapshot(), playing:!!(a && !a.paused && !a.ended),
      time:a?.currentTime || 0, src:a?.currentSrc || '', speech:__r1064SpeechFixture.log.length
    };
  });
}

async function setup(page, mode) {
  await page.evaluate(async ({tone, mode}) => {
    KLT_AC('single-lock-test');
    NIYET.on = NIYET.spk = NIYET.devir = false;
    ZA.kapali = true;
    Z.tick = Z.vib = Z.adv = false;
    await SukunVoiceSettings.setContent('legacy');
    await SukunVoiceSettings.setMode('personal');
    SPK.on = true;
    SukunR698VoiceIntent.explicit(true);
    await REC_DB.set('berhet:16', new Blob([Uint8Array.from(atob(tone), c => c.charCodeAt(0))], {type:'audio/wav'}));
    RECKEYS.add('berhet:16');
    SukunTempo.set(3, 'single-lock-test');

    let release;
    const gate = new Promise(resolve => { release = resolve; });
    const monitor = window.lockTest = {release, jobs:0, aborted:0, stages:[], holds:[]};
    const render = r477RenderLockTrack;
    r477RenderLockTrack = async function(blob, key, options) {
      if (key !== 'berhet:16') return render(blob, key, options);
      monitor.jobs++;
      const signal = options.signal;
      const onAbort = () => { monitor.aborted++; };
      signal?.addEventListener('abort', onAbort, {once:true});
      try {
        await gate;
        if (signal?.aborted || mode === 'unavailable') return null;
        return await render(blob, key, options);
      } finally {
        signal?.removeEventListener('abort', onAbort);
      }
    };
    if (mode === 'unavailable') r953CadenceTrack = async () => null;
    addEventListener('sukun:recordingstartup', e => {
      const {phase, code, stage} = e.detail;
      monitor.stages.push([phase, code, stage].filter(Boolean).join('/'));
    });
    addEventListener('sukun:recordingerror', () => {
      if (SukunRecordingFailure.get().active) monitor.holds.push(SukunRecordingFailure.get().code);
    });
  }, {mode, tone:wav(2.3, 330).toString('base64')});
  await command(page, 'select', {mode:'berhet', journeyKind:'single', index:16});
  // Tab ownership restores the lifetime total from storage when Start acquires the session.
  await page.evaluate(() => { Z.count = 49; Z.target = 154; zUI(); });
  assert.equal(await page.evaluate(() => S.get('sukun.total', 0)), 49, 'Saved repetitions before Start');
  await page.waitForFunction(() => !SukunTabOwner.snapshot().pending && !SukunTabOwner.snapshot().releasing);
  await command(page, 'start');
  await page.waitForFunction(() => lockTest.jobs > 0);
  if (mode === 'unavailable') {
    const started = await state(page);
    assert.equal(started.count, 49, 'Starting count before either lock source completes');
    assert.equal(started.total, 49, 'Starting total after ownership is acquired');
  }
}

async function deadline(page) {
  await page.waitForFunction(() => lockTest.stages.some(s => s.startsWith('fallback') || s.startsWith('lockPreparing')) || SukunRecordingFailure.get().active ||
    (SukunRecordingPreparation.snapshot().pending && SukunRecordingPreparation.snapshot().ageMs >= 3300), null, {timeout:12000});
}

async function run(name, scenario, mode) {
  const f = await fixture(root, {width:384, height:691, seed:{'sukun.kilitAcik':'true', 'sukun.total':'49'}});
  try {
    await setup(f.page, mode);
    const evidence = await scenario(f.page);
    assert.deepEqual(f.errors, []);
    results.push({name, passed:true, evidence});
  } catch (error) {
    results.push({name, passed:false, error:String(error.message), state:await state(f.page).catch(() => null)});
  } finally {
    await f.close();
  }
  console.log(JSON.stringify({name, passed:results.at(-1).passed, error:results.at(-1).error}));
}

async function assertCarry(page) {
  const before = await state(page);
  assert.equal(before.key, 'berhet:16');
  assert.equal(before.target, 154);
  assert(before.count >= 49);
  await page.evaluate(() => lockTest.release());
  await page.waitForFunction(() => SukunLockAudio.snapshot().playing || SukunRecordingFailure.get().active, null, {timeout:18000});
  const start = await state(page);
  assert.equal(start.failure, '', 'Playable recording was treated as unavailable');
  assert.equal(start.native.recordingOrigin, 'personal');
  assert(start.native.repeatCycles > 1, 'Lock playback must use the cadence-preserving packed file');
  assert.equal(start.native.playing, true);
  assert.equal(start.aborted, 0, 'A foreground deadline cancelled the pending lock source');
  assert.equal(start.jobs, 1, 'Each start should prepare one lock source');
  assert(start.count >= before.count && start.count <= before.count + 1, 'Handoff changed already earned repetitions');
  await page.waitForFunction(t => SukunLockAudio.snapshot().playing && document.getElementById('r476LockZikirAudio').currentTime > t + .25, start.time);
  await page.waitForFunction(n => Z.count > n, start.count, {timeout:12000});
  const hidden = await state(page);
  assert.equal(hidden.count, start.count + 1);
  assert.equal(hidden.count - start.count, hidden.total - start.total);
  assert.equal(hidden.speech, 0);
  await visibility(page, false);
  await page.waitForFunction(t => document.getElementById('r476LockZikirAudio').currentTime > t + .1, hidden.time);
  const visible = await state(page);
  assert.equal(visible.src, start.src, 'Unlock should keep the same native media source');
  assert.equal(visible.failure, '');
  assert.equal(visible.playing, true);
  await command(page, 'stop');
  return {beforeCount:before.count, startCount:start.count, hiddenCount:hidden.count,
    nativeFrom:start.time, hiddenTime:hidden.time, visibleTime:visible.time, unitSeconds:hidden.native.unitSeconds, jobs:start.jobs};
}

(async () => {
  await run('Lock after the foreground fallback starts at 49/154', async page => {
    await deadline(page);
    await page.waitForFunction(() => [...SES.ler].some(a => !a.paused && !a.ended && a.currentTime > .1), null, {timeout:12000});
    await visibility(page, true);
    return assertCarry(page);
  });
  await run('Lock before the foreground preparation deadline', async page => {
    await visibility(page, true);
    await deadline(page);
    return assertCarry(page);
  });
  await run('Explicit stop during preparation rejects late completion', async page => {
    await deadline(page);
    await command(page, 'stop');
    const stopped = await state(page);
    await visibility(page, true);
    await page.evaluate(() => lockTest.release());
    await page.waitForTimeout(900);
    await visibility(page, false);
    const late = await state(page);
    assert.equal(late.auto, false);
    assert.equal(late.native.playing, false);
    assert.equal(late.count, stopped.count);
    assert.equal(late.total, stopped.total);
    assert.equal(late.failure, '');
    return {count:late.count, playing:late.native.playing};
  });
  await run('Unavailable packed and cadence sources preserve the counter', async page => {
    await visibility(page, true);
    await deadline(page);
    await page.evaluate(() => lockTest.release());
    await page.waitForFunction(() => SukunRecordingFailure.get().active, null, {timeout:12000});
    const held = await state(page);
    assert.equal(held.native.playing, false);
    assert.equal(held.count, 49);
    assert.equal(held.total, 49);
    assert.equal(held.speech, 0);
    return {count:held.count, error:held.failure, phase:held.phase};
  }, 'unavailable');
})().catch(error => results.push({name:'runner', passed:false, error:error.stack})).finally(() => {
  const report = {build:fs.readFileSync(path.join(root, 'version.txt'), 'utf8').trim(),
    scope:'Synthetic recording, real Chromium native media, simulated visibility. Physical Android lock and audibility are unmeasured.',
    passed:results.filter(r => r.passed).length, total:results.length, results};
  fs.mkdirSync(path.dirname(output), {recursive:true});
  fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
  if (report.passed !== 4) process.exitCode = 1;
});
