'use strict';
// Full, unmodified app bytes and real Chromium UI/media. Setup uses public
// selection/unlock APIs and generated tones in a disposable browser profile.
// Navigation itself is never invoked through evaluate(), dispatchEvent(),
// force-clicks, copied handlers, or a replacement transport/resolver.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const {fixture, wav, hash} = require('../r1064/browser-fixture.cjs');
const root = path.resolve(process.argv[2] || path.join(__dirname, '../..'));
const output = path.resolve(process.argv[3] || '/tmp/r1123-dhikr-navigation-browser.json');
const sources = ['index.html', 'nero.html', 'assets/runtime/session-r919.js',
  'assets/runtime/interface-r920.js', 'assets/runtime/wheels-r924.js',
  'assets/runtime/berhet-layout-r938.js', 'version.txt'];
const git = (...args) => { try { return execFileSync('git', ['-C', root, ...args], {encoding: 'utf8'}).trim(); } catch { return null; } };
const report = {
  suite: 'r1123 full-app local Esma/Berhetiyye navigation', expectedChecks: 76,
  sourceSha256: hash(fs.readFileSync(path.join(root, 'index.html'))),
  startedAt: new Date().toISOString(), sourceRoot: root,
  commit: git('rev-parse', 'HEAD'), eventCommit: process.env.GITHUB_SHA || null,
  worktree: git('status', '--porcelain'), trackedDiffSha256: hash(git('diff', 'HEAD', '--') || ''),
  sourceHashes: Object.fromEntries(sources.map(name => [name, hash(fs.readFileSync(path.join(root, name)))])),
  testSha256: hash(fs.readFileSync(__filename)), fixtureSha256: hash(fs.readFileSync(path.join(__dirname, '../r1064/browser-fixture.cjs'))),
  build: fs.readFileSync(path.join(root, 'version.txt'), 'utf8').trim(), profiles: [], checks: [],
  limitations: [
    'Full shipped application served byte-for-byte. Isolated headless Linux Chromium at 390x844, Turkish locale; service workers and external network traffic blocked.',
    'Klasik base and Klasik/Feyz are tested separately by the existing persisted appearance setting. Feyz is an appearance, not a separate layout; both explicitly verify the real classic layout owner.',
    'Labelled public unlock/selection/reset APIs set up each case. Generated 30-second WAV personal recordings replace user data, not production playback code. Native HTMLMediaElement play/pause, readiness and advancing currentTime remain real.',
    'The shared fixture controls device speech voices/completion. These cases require zero speech fallback. Observation wrappers only record calls and media references and delegate to the original native methods.',
    'Wheel motion is disabled through its visible native setting to make hit testing deterministic. Navigation and start/pause/stop/manual count use trusted visible Playwright clicks, without force or DOM event injection.',
    'Real frequency and ambience owners are started through public APIs only in the explicitly labelled unrelated-background cases.',
    'No physical Android/Samsung, touch hardware, subjective audibility, OS lockscreen, Bluetooth, audio-focus, offline update or service-worker acceptance is claimed.'
  ]
};
let f, p, profile, probeSequence = 0;
function save() {
  report.total = report.checks.length;
  report.passed = report.checks.filter(row => row.passed).length;
  report.allPassed = report.total === report.expectedChecks && report.passed === report.total && !report.fatal;
  fs.mkdirSync(path.dirname(output), {recursive: true});
  fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
}
async function state() {
  return p.evaluate(() => {
    const s = SukunSessionState.snapshot();
    const media = window.__r1123Media.map(a => ({
      id: a.__r1123Id, key: a._sukunRecordingKey || a.dataset.sukLockKey || '',
      native: a instanceof HTMLMediaElement, paused: a.paused, ended: a.ended,
      time: a.currentTime, duration: Number.isFinite(a.duration) ? a.duration : null,
      ready: a.readyState, seeking: a.seeking, silent: a.dataset.sukSilentCarrier === '1',
      source: a.currentSrc, rate: a.playbackRate
    }));
    return {
      selected: {cat: Z.cat, index: Z.idx, count: Z.count, total: Z.total, auto: Z.auto},
      session: {phase: s.phase, mode: s.activeMode, index: s.activeIndex, kind: s.journeyKind, count: s.count, requestId: s.requestId},
      display: {name: document.getElementById('r920ActiveName')?.textContent, count: document.getElementById('r920Count')?.textContent, total: document.getElementById('totalCnt')?.textContent},
      direct: SukunDirectZikirTransportR698.state(), command: SukunSessionState.commandDiagnostics(),
      resume: SukunResumePolicy.snapshot(), flowEvents: __r1123FlowEvents.slice(-8),
      flow: currentFlowState.snapshot().context, media, speech: __r1064SpeechFixture.log.length,
      monitor: {...__r1123Window, violations: __r1123Window.violations.slice()},
      frequency: FR.playing, ambience: Object.keys(AMB).sort(), context: ctx?.state || null,
      aggregate: SukunAudioSessionRegistry.aggregateSnapshot(),
      journey28: SukunBerhetiyyeSeyir.state(), journey99: SukunEsma99Seyir.state()
    };
  });
}
const active = s => s.media.filter(a => !a.silent && /^(esma|berhet):/.test(a.key) && !a.paused && !a.ended && a.ready >= 2);
async function idle() { await p.waitForFunction(() => !window.SukunInteractionGateR732?.active?.()); await p.waitForTimeout(80); }
async function tap(selector) {
  await idle();
  if (await p.locator('#kandil.on').isVisible()) { await p.locator('#kandil.on').click({position: {x: 20, y: 20}}); await idle(); }
  assert(await p.locator(selector).isVisible(), 'Native control must be visible: ' + selector);
  assert(await p.locator(selector).isEnabled(), 'Native control must be enabled: ' + selector);
  // Native center scrolling through the app's explicit navigation policy keeps
  // controls below the sticky Berhetiyye menu. Playwright's nearest-edge scroll
  // can leave a visible button underneath it; clicks still require hit testing.
  await p.locator(selector).evaluate(el => SukunViewportPolicy.scrollTo(el, {block: 'center', behavior: 'instant'}, 'r1123-native-control'));
  await p.waitForTimeout(250);
  await p.locator(selector).click({timeout: 15000});
  await idle();
}
async function controls() {
  if (await p.locator('#r938PanelToggle').getAttribute('aria-expanded') !== 'true') await tap('#r938PanelToggle');
  await p.locator('#r938PanelBody').waitFor({state: 'visible'});
}
async function reset() {
  if (await p.locator('#r629DoneClose').isVisible()) await tap('#r629DoneClose');
  if (await p.locator('#logClose').isVisible()) await tap('#logClose');
  await p.evaluate(async () => {
    if (window.SUKUN_TEFEKKUR?.active?.()) SUKUN_TEFEKKUR.exit();
    window.SukunReadingUIR1064?.close?.();
    SukunR698Transport.stop('r1123-labelled-fixture-reset');
    await SukunR698Transport.whenStopped();
    SukunAudioSessionRegistry.stopAll();
    SukunBerhetiyyeSeyir.stop(); SukunEsma99Seyir.stop();
    SukunForegroundArbiter.clearQueue('r1123-labelled-fixture-reset');
    SukunRecordingFailure.clearForRetry();
  });
  await p.waitForFunction(() => !SukunR698Transport.snapshot().pendingStop && !SukunTabOwner.snapshot().releasing && !SukunTabOwner.snapshot().pending);
  await idle();
}
async function select(cat, index = 4) {
  const result = await p.evaluate(options => SukunSessionState.command('select', options), {mode: cat, index, journeyKind: 'single'});
  assert.equal(result.accepted, true, JSON.stringify(result));
  await p.waitForFunction(({cat, index}) => {
    const s = SukunSessionState.snapshot();
    return s.journeyKind === 'single' && s.activeMode === cat && s.activeIndex === index && Z.cat === cat && Z.idx === index && Z.count === 0 && document.getElementById('r920Practice')?.dataset.mode === cat;
  }, {cat, index});
  await controls();
  await idle();
}
async function monitor() {
  await p.evaluate(() => { window.__r1123Window = {started: performance.now(), peak: 0, samples: 0, plays: 0, violations: []}; __r1123Sample(); });
}
async function waitPlaying(cat, index) {
  const probe = ++probeSequence;
  // Synchronous predicate: Playwright must see true, never a truthy Promise.
  await p.waitForFunction(({cat, index, probe}) => {
    const key = cat === 'berhet' ? `berhet:${index}` : `esma:${index}:nida`;
    const candidates = __r1123Media.filter(a => a.dataset.sukSilentCarrier !== '1' &&
      (a._sukunRecordingKey || a.dataset.sukLockKey) === key && a instanceof HTMLMediaElement &&
      !a.paused && !a.ended && !a.seeking && a.readyState >= 2 && Number.isFinite(a.duration) && a.duration > 20);
    const a = candidates[0], at = performance.now(), s = SukunSessionState.snapshot();
    if (!a || candidates.length !== 1 || !Z.auto || s.activeIndex !== index || s.activeMode !== cat || s.phase !== 'PLAYING') { delete window.__r1123Probe; return false; }
    const old = window.__r1123Probe;
    if (!old || old.probe !== probe || old.a !== a || old.source !== a.currentSrc) {
      window.__r1123Probe = {probe, a, source: a.currentSrc, at, time: a.currentTime}; return false;
    }
    return at - old.at >= 180 && a.currentTime > old.time + .03;
  }, {cat, index, probe}, {timeout: 20000, polling: 50});
}
async function setup(cat, phase) {
  await reset(); await select(cat);
  const before = await state(); noPlayback(before);
  if (phase !== 'stopped') {
    await tap('#r932EasyPlay'); await waitPlaying(cat, 4);
    if (phase === 'paused') {
      await tap('#r932EasyPlay');
      await p.waitForFunction(() => SukunSessionState.snapshot().phase === 'PAUSED' && !Z.auto);
      await p.waitForTimeout(200);
    }
  }
  const ready = await state();
  assert.equal(ready.selected.count, 0, 'Fresh count must still be zero');
  assert.equal(ready.selected.total, before.selected.total, 'Setup must not accidentally finish a tone');
  assert.equal(ready.session.kind, 'single');
  assert.equal(ready.speech, 0);
  if (phase !== 'running') noPlayback(ready);
  await monitor();
  return state();
}
function noPlayback(s) {
  assert.equal(!!s.selected.auto, false);
  assert.equal(!!s.direct.auto, false);
  assert.equal(s.journey28.run, false); assert.equal(s.journey99.run, false);
  assert(!['PLAYING', 'PREPARING'].includes(s.session.phase), 'Local dhikr cannot start without Play');
  assert.equal(active(s).length, 0, 'No real dhikr media may be playing');
}
function unchangedTotal(before, after) {
  assert.equal(after.selected.total, before.selected.total, 'Navigation must not manufacture a completed reading');
  assert.equal(after.display.total, before.display.total, 'Visible lifetime total must remain unchanged');
  assert.equal(after.speech, 0, 'Personal recording cannot fall back to synthetic device speech');
  assert(after.monitor.peak <= 1, 'No overlapping native dhikr voices: ' + JSON.stringify(after.monitor));
}
function button(surface, direction) { return '#' + (surface === 'wheel' ? 'r959Wheel' : 'r920') + (direction === 1 ? 'Next' : 'Previous'); }
async function navigate(cat, surface, direction, phase, before) {
  const selector = button(surface, direction), target = before.selected.index + direction;
  const fromClick = await p.evaluate(() => __r1123Clicks.length);
  const fromFlow = await p.evaluate(() => __r1123FlowEvents.length);
  await tap(selector);
  await p.waitForFunction(({cat, target, previousRequest, action}) => {
    const s = SukunSessionState.snapshot(), d = SukunSessionState.commandDiagnostics();
    return Z.cat === cat && Z.idx === target && Z.count === 0 && s.activeIndex === target &&
      s.activeMode === cat && d?.requestId > previousRequest && d.action === action && d.accepted === true;
  }, {cat, target, previousRequest: before.session.requestId, action: direction === 1 ? 'next' : 'previous'}, {timeout: 15000});
  if (phase === 'running') await waitPlaying(cat, target);
  else await p.waitForTimeout(350);
  const after = await state();
  assert.equal(after.session.kind, 'single'); assert.equal(after.selected.count, 0); assert.equal(after.display.count.trim(), '0');
  assert(after.display.name.trim()); assert.notEqual(after.display.name, before.display.name, 'Visible current name must change');
  unchangedTotal(before, after);
  assert.equal(after.resume.contexts.zikir?.status, 'continue', 'Successful zero-count navigation must retain ResumePolicy progress');
  const flowEvents = await p.evaluate(from => __r1123FlowEvents.slice(from), fromFlow);
  assert(flowEvents.some(e => e.context === 'zikir' && e.surface === 'r919' && e.action === (direction === 1 ? 'next' : 'prev')), 'Existing flow-navigation success event must be preserved');
  if (phase === 'running') assert.equal(active(after).length, 1);
  else { noPlayback(after); assert.equal(after.monitor.plays, 0, 'Stopped/paused navigation may not issue any real recording play'); }
  const clicks = await p.evaluate(from => __r1123Clicks.slice(from), fromClick);
  assert(clicks.some(row => row.id === selector.slice(1) && row.trusted), 'Expected trusted hit on visible navigation button');
  if (surface === 'wheel') assert(clicks.some(row => row.id === button('lower', direction).slice(1) && !row.trusted), 'Wheel must delegate to the shipped lower button');
  return {before, after, clicks, flowEvents};
}
async function check(name, fn) {
  try { report.checks.push({profile: profile.label, name, passed: true, evidence: await fn()}); }
  catch (error) {
    const screenshot = path.join(path.dirname(output), `r1123-failure-${profile.label}-${report.checks.length}.png`);
    await p.screenshot({path: screenshot}).catch(() => {});
    report.checks.push({profile: profile.label, name, passed: false, error: error.stack || String(error), screenshot, state: await state().catch(() => null)});
  }
  save(); console.log(JSON.stringify({profile: profile.label, name, passed: report.checks.at(-1).passed}));
}
async function run(feyz) {
  profile = {label: feyz ? 'classic-feyz' : 'classic-base', width: 390, height: 844, feyz};
  report.profiles.push(profile);
  f = await fixture(root, {seed: {
    'sukun.ui.shellMode': 'classic', 'sukun.shell.r716': feyz ? '1' : '0',
    'sukun.kilitAcik': 'true', 'sukun.onboardSeen': '1', 'sukun.obDone': '1',
    'sukun.obSeenBuild': JSON.stringify(report.build), 'sukun.zikir.quickControls.focus.v1': '1',
    'sukun.r920.focus': '0', 'sukun.wheel.navigation': '1'
  }});
  p = f.page; profile.browser = f.browser.version();
  try {
    if (await p.locator('#dailyCard').isVisible()) await p.keyboard.press('Escape');
    await p.locator('#dailyCard').waitFor({state: 'hidden'});
    await idle();
    await p.evaluate(async tone => {
      KLT_AC('LABELLED-r1123-disposable-navigation-test');
      I18N.set('tr');
      const bytes = Uint8Array.from(atob(tone), c => c.charCodeAt(0));
      for (const cat of ['esma', 'berhet']) for (let i = 2; i <= 7; i++) {
        const key = cat === 'berhet' ? `berhet:${i}` : `esma:${i}:nida`;
        await REC_DB.set(key, new Blob([bytes], {type: 'audio/wav'})); RECKEYS.add(key);
      }
      NIYET.on = NIYET.spk = NIYET.devir = false; ZA.kapali = true;
      SukunManualVoice.set(false);
      KAYIT.yankiMik = 0; KAYIT.mekan = false;
      await SukunVoiceSettings.setContent('legacy'); await SukunVoiceSettings.setMode('personal');
      SPK.on = true; SukunR698VoiceIntent.explicit(true);
      Object.assign(Z, {target: 999, targetMode: 'manual', adv: false, tick: false, vib: false});
      SukunTempo.set(6, 'r1123-labelled-fixture');
      window.__r1123Media = []; window.__r1123Clicks = []; window.__r1123FlowEvents = [];
      window.addEventListener('sukun:flownavigation', e => __r1123FlowEvents.push({...e.detail, at: performance.now()})); window.__r1123Window = {peak: 0, samples: 0, plays: 0, violations: []};
      let serial = 0; const play = HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play = function(...args) {
        if (!__r1123Media.includes(this)) { this.__r1123Id = ++serial; __r1123Media.push(this); }
        if (this.dataset.sukSilentCarrier !== '1' && /^(esma|berhet):/.test(this._sukunRecordingKey || this.dataset.sukLockKey || '')) __r1123Window.plays++;
        return play.apply(this, args);
      };
      window.__r1123Sample = () => {
        const voices = __r1123Media.filter(a => a.dataset.sukSilentCarrier !== '1' && /^(esma|berhet):/.test(a._sukunRecordingKey || a.dataset.sukLockKey || '') && !a.paused && !a.ended && a.readyState >= 2);
        const w = __r1123Window; w.samples++; w.peak = Math.max(w.peak, voices.length);
        if (voices.length > 1 && w.violations.length < 10) w.violations.push({at: performance.now(), ids: voices.map(a => a.__r1123Id)});
      };
      window.__r1123SampleTimer = setInterval(__r1123Sample, 25);
      document.addEventListener('click', e => { const b = e.target.closest?.('button'); if (b) __r1123Clicks.push({id: b.id, trusted: e.isTrusted, at: performance.now(), cat: Z.cat, index: Z.idx}); }, true);
    }, wav(30, 330).toString('base64'));
    await tap('.tab[data-t="zkr"]'); await select('esma'); await controls();
    if (!await p.locator('#r920ViewOptions').evaluate(n => n.open)) await tap('#r920ViewOptions > summary');
    await p.locator('#r925WheelMotion').uncheck(); await idle();
    await check('Exact layout/appearance and visible native navigation controls', async () => {
      const presentation = await p.evaluate(() => ({layout: SukunLayoutModes.current(), shell: SukunR716Shell.snapshot(), appearance: SukunShellSkin.getAppearance(), wheelMotion: SukunWheelMotion.snapshot(), build: SUKUN_BUILD}));
      assert.equal(presentation.layout, 'classic'); assert.equal(presentation.shell.enabled, feyz);
      if (feyz) assert.equal(presentation.appearance, 'feyz');
      assert.equal(presentation.wheelMotion.enabled, false); assert.equal(presentation.build, report.build);
      for (const surface of ['wheel', 'lower']) for (const direction of [-1, 1]) {
        assert(await p.locator(button(surface, direction)).isVisible()); assert(await p.locator(button(surface, direction)).isEnabled());
      }
      return presentation;
    });
    for (const cat of ['esma', 'berhet']) {
      for (const phase of ['stopped', 'running', 'paused']) for (const surface of ['wheel', 'lower']) for (const direction of [-1, 1]) {
        await check(`${cat} count0 ${phase} ${surface} ${direction === 1 ? 'next' : 'previous'}`, async () => {
          const before = await setup(cat, phase); return navigate(cat, surface, direction, phase, before);
        });
      }
      for (const surface of ['wheel', 'lower']) {
        await check(`${cat} ${surface} count1 -> next -> count0 -> next -> previous`, async () => {
          await setup(cat, 'stopped'); await tap('#r920Counter');
          await p.waitForFunction(() => Z.count === 1 && SukunSessionState.snapshot().count === 1);
          const counted = await state(), first = await navigate(cat, surface, 1, 'stopped', counted);
          const second = await navigate(cat, surface, 1, 'stopped', first.after);
          const third = await navigate(cat, surface, -1, 'stopped', second.after);
          unchangedTotal(counted, third.after);
          await tap('.tab[data-t="frq"]'); await tap('.tab[data-t="zkr"]'); await idle();
          const returned = await state(); noPlayback(returned); unchangedTotal(counted, returned);
          assert.equal(returned.selected.index, third.after.selected.index); assert.equal(returned.selected.count, 0);
          assert.equal(returned.resume.contexts.zikir?.status, 'continue');
          return {counted, steps: [first, second, third], returned};
        });
        await check(`${cat} ${surface} rapid navigation then visible Stop remains terminal`, async () => {
          const before = await setup(cat, 'running');
          const start = await p.evaluate(() => __r1123Clicks.length);
          // No artificial cleanup await between these trusted UI commands.
          for (const selector of [button(surface, 1), button(surface, 1), button(surface, -1), '#r932EasyStop']) {
            assert(await p.locator(selector).isVisible());
            await p.locator(selector).evaluate(el => SukunViewportPolicy.scrollTo(el, {block: 'center', behavior: 'instant'}, 'r1123-native-burst'));
            await p.locator(selector).click({timeout: 15000});
          }
          await p.waitForFunction(() => !SukunR698Transport.snapshot().pendingStop && !SukunTabOwner.snapshot().pending && !SukunTabOwner.snapshot().releasing && !Z.auto);
          await p.waitForTimeout(1200);
          const after = await state(); noPlayback(after); unchangedTotal(before, after);
          assert.equal(after.selected.index, 5, 'Every trusted navigation changes the native selection exactly once');
          assert.equal(after.selected.count, 0); assert.equal(after.command.action, 'stop'); assert.equal(after.command.accepted, true);
          const clicks = await p.evaluate(from => __r1123Clicks.slice(from), start);
          const trusted = clicks.filter(x => x.trusted && [button(surface, 1).slice(1), button(surface, -1).slice(1), 'r932EasyStop'].includes(x.id));
          assert.deepEqual(trusted.map(x => x.id), [button(surface, 1).slice(1), button(surface, 1).slice(1), button(surface, -1).slice(1), 'r932EasyStop']);
          const stoppedPlays = after.monitor.plays;
          await p.waitForTimeout(800); const later = await state();
          noPlayback(later); unchangedTotal(before, later); assert.equal(later.monitor.plays, stoppedPlays, 'No delayed continuation can replay after Stop');
          return {before, after, later, clicks, trustedBurstMs: trusted.at(-1).at - trusted[0].at};
        });
        await check(`${cat} ${surface} idle navigation preserves unrelated native frequency and ambience`, async () => {
          await setup(cat, 'stopped');
          await p.evaluate(() => {
            ac(); const def = AMBIENT_DEFS.find(x => x.id === 'stream') || AMBIENT_DEFS[0];
            chOn(def); frStart(); window.__r1123Background = {id: def.id, ambience: AMB[def.id], frequency: FR.E};
          });
          await p.waitForFunction(() => FR.playing && !!AMB[__r1123Background.id] && ctx.state === 'running');
          await monitor(); const before = await state();
          const first = await navigate(cat, surface, 1, 'stopped', before);
          const second = await navigate(cat, surface, -1, 'stopped', first.after);
          assert.equal(second.after.frequency, true); assert.deepEqual(second.after.ambience, before.ambience); assert.equal(second.after.context, 'running');
          assert(await p.evaluate(() => FR.E === __r1123Background.frequency && AMB[__r1123Background.id] === __r1123Background.ambience));
          return {before, steps: [first, second]};
        });
      }
    }
    await check('All clicks use shipped controls; served hashes and runtime integrity are clean', async () => {
      await reset(); const evidence = f.evidence();
      assert.match(report.commit || '', /^[0-9a-f]{40}$/, 'Exact checkout HEAD must be captured');
      for (const name of ['nero.html', 'assets/runtime/session-r919.js', 'assets/runtime/interface-r920.js']) assert(evidence.served[name], 'Required app source must have been served: ' + name);
      for (const [name, row] of Object.entries(evidence.served)) assert.equal(row.sha256, hash(fs.readFileSync(path.join(root, name))), 'Served bytes changed: ' + name);
      for (const [name, expected] of Object.entries(report.sourceHashes)) assert.equal(hash(fs.readFileSync(path.join(root, name))), expected, 'Checkout changed during suite: ' + name);
      assert.deepEqual(evidence.pageErrors, []);
      assert(!evidence.consoleErrors.some(x => /integrity|digest|syntaxerror|referenceerror|typeerror/i.test(x)), evidence.consoleErrors.join('\n'));
      assert.deepEqual(evidence.failedRequests.filter(x => !/^net::ERR_ABORTED$/.test(x.error || '')), []);
      const clicks = await p.evaluate(() => __r1123Clicks);
      for (const cat of ['esma', 'berhet']) for (const surface of ['wheel', 'lower']) for (const direction of [-1, 1]) assert(clicks.some(x => x.cat === cat && x.id === button(surface, direction).slice(1) && x.trusted));
      profile.evidence = evidence; return {trustedClicks: clicks.filter(x => x.trusted).length, servedFiles: Object.keys(evidence.served).length};
    });
  } finally {
    profile.evidence = profile.evidence || f.evidence();
    profile.finalState = await state().catch(() => null);
    await f.close(); f = null;
  }
}
(async () => {
  try {
    for (const feyz of [false, true]) await run(feyz);
    assert.equal(report.checks.length, report.expectedChecks, 'Every required profile/case must run');
  }
  catch (error) { report.fatal = error.stack || String(error); }
  finally {
    if (f) { profile.evidence = f.evidence(); await f.close().catch(() => {}); }
    report.finishedAt = new Date().toISOString(); save();
    console.log(JSON.stringify({passed: report.passed, total: report.total, allPassed: report.allPassed, fatal: report.fatal, output}));
    if (!report.allPassed) process.exitCode = 1;
  }
})();
