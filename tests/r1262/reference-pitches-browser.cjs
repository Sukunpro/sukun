'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { fixture } = require('../r1064/browser-fixture.cjs');

const root = path.resolve(process.argv[2] || path.join(__dirname, '../..'));
const output = process.argv[3];
const pitches = { fork128: 128, fork1361: 136.1, fork256: 256, fork384: 384 };
const group = '#presets [data-acc="diapason"]';
const report = { build: fs.readFileSync(path.join(root, 'version.txt'), 'utf8').trim(), pitches: [] };

// Read the actual PCM file admitted to the background audio element. Fractional
// zero crossings avoid rounding 136.1 Hz to the nearest FFT bin. Channel
// equality catches a residual split even when it is below the pitch tolerance.
async function measureLoop() {
  const audio = document.getElementById('sukunBackgroundMixAudio');
  const bytes = await (await fetch(audio.currentSrc)).arrayBuffer();
  const view = new DataView(bytes);
  if (view.getUint32(0) !== 0x52494646 || view.getUint32(8) !== 0x57415645 ||
      view.getUint16(20, true) !== 1 || view.getUint16(22, true) !== 2 ||
      view.getUint16(34, true) !== 16 || view.getUint32(36) !== 0x64617461) {
    throw Error('Expected a stereo PCM16 WAV loop');
  }
  const rate = view.getUint32(24, true);
  const frames = view.getUint32(40, true) / 4;
  if (frames < 4 * rate) throw Error('Insufficient rendered audio');
  const channelHz = [];
  let stereoDifference = 0;
  for (let channel = 0; channel < 2; channel++) {
    let previous = 0, first, last, crossings = 0;
    for (let frame = rate; frame < 3 * rate; frame++) {
      const offset = 44 + frame * 4 + channel * 2;
      const sample = view.getInt16(offset, true);
      if (channel === 0) {
        stereoDifference = Math.max(stereoDifference, Math.abs(sample - view.getInt16(offset + 2, true)));
      }
      if (frame > rate && previous <= 0 && sample > 0) {
        const position = frame - 1 - previous / (sample - previous);
        first ??= position;
        last = position;
        crossings++;
      }
      previous = sample;
    }
    if (crossings < 2) throw Error('No measurable pitch in channel ' + channel);
    channelHz.push((crossings - 1) * rate / (last - first));
  }
  return { channelHz, stereoDifference, rate };
}

async function run(page) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.evaluate(() => { window.obClose?.(); document.getElementById('dcClose')?.click(); });
  await page.waitForFunction(() => !window.SukunInteractionGateR732?.active?.());
  await page.locator('.tab[data-t="frq"]').click();
  if (!await page.locator('#r1107PresetsBox').evaluate(box => box.open)) {
    await page.locator('#r1107PresetsSummary').click();
  }
  await page.locator('#preFilter [data-f="diapason"]').click();
  if (!await page.locator(group).evaluate(el => el.classList.contains('open'))) {
    await page.locator(group + ' [data-acctgl]').click();
  }
  const indices = await page.evaluate(() => Object.fromEntries(
    FREQ_PRESETS.map((p, i) => [p, i]).filter(([p]) => p.cat === 'diapason').map(([p, i]) => [p.id, i])
  ));
  assert.deepEqual(Object.keys(indices).sort(), Object.keys(pitches).sort());
  const card = id => page.locator(group + ' button[data-p="' + indices[id] + '"]');
  const selection = () => page.evaluate(() => SukunHealthR940.read().checks.find(r => r.code === 'REFERENCE_PITCH_SELECTION'));
  const catalogue = () => page.evaluate(() => SukunHealthR940.read().checks.find(r => r.code === 'REFERENCE_PITCH_CATALOG'));
  assert.equal((await catalogue()).status, 'PASS');
  const partialDetail = await page.evaluate(() => {
    const report = SukunHealthViewR943.summarize({
      lastRun: { at: Date.now() }, checks: [{ code: 'RUNTIME_INTEGRITY', status: 'NOT_MEASURED',
        evidence: { expected: 194, files: [{ status: 'MATCH' }], complete: false } }]
    });
    return report.areas.flatMap(area => area.checks).find(row => row.code === 'RUNTIME_INTEGRITY').detail;
  });
  assert.match(partialDetail, /\b194\b/);

  const setup = await page.evaluate(() => SukunFrequencyR1120.apply({
    vol: .12, wave: 'square', mode: 'mix', harmonik: 2, fm: true, pink: true, noise: 'brown',
    noiseVol: .25, secondary: { on: true, c: 100, b: 4 }
  }));
  assert(setup.ok && !setup.playing);
  for (const [id, hz] of Object.entries(pitches)) {
    await card(id).click();
    await page.waitForFunction(() => FR.playing && ctx?.state === 'running' && FR.oL && FR.oR);
    const live = await page.evaluate(() => {
      const profile = SukunFrequencyR1120.capture();
      const saved = SukunFrequencySetsR1120.validateSettings(profile);
      return {
        profile, saved, left: FR.oL.frequency.value, right: FR.oR.frequency.value,
        types: [FR.oL.type, FR.oR.type], gate: !!FR.gate, iso: !!FR.iso, harmonics: FR.harmonics.length,
        secondaryPlaying: !!FR2.E
      };
    });
    assert.equal(live.profile.c, hz);
    assert.equal(live.profile.b, 0);
    assert.equal(live.profile.vol, .12);
    assert.equal(live.profile.noise, 'off');
    for (const key of ['fm', 'am', 'rm', 'pwm', 'uzam', 'filterOn', 'pink']) assert.equal(live.profile[key], false);
    assert.deepEqual(live.types, ['sine', 'sine']);
    assert(Math.abs(live.left - hz) < .001 && Math.abs(live.right - hz) < .001);
    assert(!live.gate && !live.iso && !live.secondaryPlaying && live.harmonics === 0);
    assert(live.saved.ok && live.saved.value.b === 0, 'Named sets must preserve a zero beat');
    const health = await selection();
    assert(health && ['PASS', 'OBSERVED'].includes(health.status), JSON.stringify(health));
    assert.equal(health.evidence.expectedHz, hz);
    await page.waitForFunction(() => SukunBackgroundMix.snapshot().ready, null, { timeout: 30000 });
    const loop = await page.evaluate(measureLoop);
    for (const got of loop.channelHz) assert(Math.abs(got - hz) < .02, JSON.stringify({ hz, got }));
    assert(loop.stereoDifference <= 1, 'The two PCM channels differ: ' + JSON.stringify(loop));
    report.pitches.push({ id, hz, left: live.left, right: live.right, health: health.status, ...loop });
    console.log(JSON.stringify(report.pitches.at(-1)));
  }

  // Corrupt one channel only at the selection observation boundary. Restore it
  // even if the health engine throws so this cannot leak into a subsequent case.
  let fault;
  await page.evaluate(() => {
    FR.oR.frequency.cancelScheduledValues(ctx.currentTime);
    FR.oR.frequency.setValueAtTime(400, ctx.currentTime);
  });
  try {
    await page.waitForFunction(() => Math.abs(FR.oR.frequency.value - 400) < .001);
    fault = await page.evaluate(() => {
      dispatchEvent(new CustomEvent('sukun:referencepitch', { detail: { id: 'fork384', ok: true } }));
      const r = SukunHealthR940.read();
      return { row: r.checks.find(x => x.code === 'REFERENCE_PITCH_SELECTION'),
        incident: r.incidents.some(x => x.code === 'REFERENCE_PITCH_SELECTION') };
    });
  } finally { await page.evaluate(() => FR.oR.frequency.setValueAtTime(384, ctx.currentTime)); }
  assert.equal(fault.row.status, 'FAIL', JSON.stringify(fault));
  assert.equal(fault.row.evidence.reason, 'oscillator-mismatch');
  assert(fault.incident);

  await card('fork128').click();
  assert.equal((await selection()).status, 'PASS');
  const badCatalogue = await page.evaluate(() => {
    const preset = FREQ_PRESETS.find(p => p.id === 'fork1361');
    const old = preset.c;
    try {
      preset.c = 136;
      return SukunHealthR940.read().checks.find(r => r.code === 'REFERENCE_PITCH_CATALOG');
    } finally { preset.c = old; }
  });
  assert.equal(badCatalogue.status, 'FAIL');
  assert.deepEqual(badCatalogue.evidence.invalidHz, [136.1]);
  assert.equal((await catalogue()).status, 'PASS');
  await page.evaluate(() => SukunAudioSessionRegistry.pauseAll('ui:reference-pitch-regression'));
  await page.waitForFunction(() => SukunFrequencyR1120.held());
  await card('fork256').click();
  const paused = await selection();
  assert.equal(paused.status, 'OBSERVED', JSON.stringify(paused));
  assert.equal(paused.evidence.reason, 'settings-only');
  assert(await page.evaluate(() => SukunFrequencyR1120.held() && !SukunBackgroundMix.snapshot().playing));
  report.diagnostics = { wrongChannel: fault.row.evidence.reason, incident: fault.incident,
    wrongCatalogueHz: badCatalogue.evidence.invalidHz, paused: paused.evidence.reason };
}

(async () => {
  let app;
  try {
    app = await fixture(root, { width: 390, height: 900, seed: {
      'sukun.obDone': '1', 'sukun.onboardSeen': '1', 'sukun.obSeenBuild': JSON.stringify('2026-08-06-r3'),
      'sukun.r920.focus': '0', 'sukun.theme': '"feyz"'
    } });
    report.browser = app.browser.version();
    await run(app.page);
    assert.deepEqual(app.errors, []);
    report.passed = true;
  } catch (error) {
    report.passed = false;
    report.error = error.stack;
    process.exitCode = 1;
  } finally {
    if (app) await app.close();
    if (output) {
      fs.mkdirSync(path.dirname(output), { recursive: true });
      fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
    }
    console.log(JSON.stringify(report, null, 2));
  }
})();
