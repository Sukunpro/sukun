'use strict';
// Isolated source/VM evidence only. No production mutations, browser actions,
// report-file writes, device-audibility claims, or synthetic media permission.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const {createFixture, fire} = require('../r1037/intro-fixture.cjs');
const root = path.resolve(process.argv[2] || path.join(__dirname, '../..'));
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const code = fs.readFileSync(path.join(root, 'assets/runtime/startup-intro-r1027.js'), 'utf8');
const clock = html.match(/<script id="sukun-auto-intro-clock">([\s\S]*?)<\/script>/)[1];
const sectionStart = html.indexOf('function r476SilentWav(){');
const sectionEnd = html.indexOf('function r476Prime(){', sectionStart);
assert(sectionStart >= 0 && sectionEnd > sectionStart, 'Production carrier source markers');
const carrierCode = html.slice(sectionStart, sectionEnd);
const silentURL = 'blob:https://sukun.test/known-digital-zero';
const otherURL = 'blob:https://sukun.test/other-audio';
const results = [];
let pcmEvidence = null;

async function test(name, fn) {
  try { await fn(); results.push({name, status: 'PASS'}); }
  catch (error) { results.push({name, status: 'FAIL', error: error.stack}); }
}

// Execute the actual WAV generator, carrier constructor and identity helper.
// The private lexical references are not reconstructed by a mock classifier.
function identityFixture() {
  const blobs = [], appended = [];
  const sandbox = {
    window: {}, Blob, ArrayBuffer, DataView,
    URL: {createObjectURL(blob) { blobs.push(blob); return silentURL; }},
    document: {
      createElement(tag) {
        assert.equal(tag, 'audio');
        return {dataset: {}, style: {}, srcObject: null, currentSrc: '',
          paused: false, ended: false, setAttribute() {}};
      },
      body: {appendChild(element) { appended.push(element); }}
    }
  };
  vm.createContext(sandbox);
  vm.runInContext('let _r476LockAudio=null, _r476SilentUrl="";\n' + carrierCode +
    '\nwindow.testControls={create:r476Audio,' +
    'setReference(value){_r476LockAudio=value;},setURL(value){_r476SilentUrl=value;}};', sandbox);
  const controls = sandbox.window.testControls;
  const carrier = controls.create();
  // Simulate the browser selecting the explicitly assigned source.
  carrier.currentSrc = carrier.src;
  return {carrier, controls, blobs, appended, api: sandbox.window.SukunSilentCarrierIdentity};
}

function fixture(identity, options = {}, runtime = code) {
  const f = createFixture(runtime, clock, {audioUnitWindow: true, ...options});
  if (identity) f.window.SukunSilentCarrierIdentity = identity.api;
  return f;
}
async function run(f) { f.runClock(); f.run(); await f.flush(); }
function playing(f) {
  assert.equal(f.contexts.length, 1);
  const context = f.contexts[0], source = context.buffers[0];
  assert.equal(context.buffers.length, 1);
  assert.equal(context.oscillators.length, 0);
  assert.equal(source.starts.length, 1);
  assert.equal(source.stops.length, 1);
  assert(Math.abs(source.stops[0] - source.starts[0] - 3) < 1e-8);
  assert.equal(source.buffer.duration, 3);
  assert.equal(source.playbackRate.value, 1);
  assert.equal(source.loop, false);
  assert.equal(context.gains[0].gain.value, 1);
  assert.equal(source.disconnected, false);
  assert.equal(f.root.dataset.audioOutcome, 'scheduled');
  assert.equal(f.root.dataset.audioSourcesScheduled, '1');
  assert.notEqual(f.root.dataset.audioCompleted, '1');
  return {context, source};
}
function silent(f) {
  assert(f.contexts.every(c => c.buffers.every(s => s.starts.length === 0)));
  assert.equal(f.root.dataset.audioSourcesScheduled, '0');
}
async function cleanup(f) {
  await f.advance(7000);
  assert.equal(f.jobs.size, 0);
  assert(f.contexts.every(c => c.gains.every(g => g.disconnected)));
  assert(f.contexts.every(c => c.buffers.every(s => s.disconnected)));
}
async function blockedAtStart(name, mutate) {
  await test(name, async () => {
    const i = identityFixture();
    const media = mutate(i) || i.carrier;
    assert.equal(i.api.isSilent(media), false);
    const f = fixture(i, {media: [media]});
    await run(f); silent(f);
    assert.equal(f.root.dataset.audioOutcome, 'unsafe-audio');
    assert.equal(f.root.dataset.audioSafetyReason, 'media-active');
    await cleanup(f);
  });
}

(async () => {
  await test('Actual carrier WAV is mono unsigned 8-bit digital zero', async () => {
    const i = identityFixture();
    assert.equal(i.blobs.length, 1);
    assert.equal(i.blobs[0].type, 'audio/wav');
    const bytes = Buffer.from(await i.blobs[0].arrayBuffer());
    assert.equal(bytes.length, 9644);
    assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
    assert.equal(bytes.toString('ascii', 8, 12), 'WAVE');
    assert.equal(bytes.toString('ascii', 12, 16), 'fmt ');
    assert.equal(bytes.readUInt32LE(4), bytes.length - 8);
    assert.equal(bytes.readUInt32LE(16), 16);
    assert.equal(bytes.readUInt16LE(20), 1);
    assert.equal(bytes.readUInt16LE(22), 1);
    assert.equal(bytes.readUInt32LE(24), 8000);
    assert.equal(bytes.readUInt32LE(28), 8000);
    assert.equal(bytes.readUInt16LE(32), 1);
    assert.equal(bytes.readUInt16LE(34), 8);
    assert.equal(bytes.toString('ascii', 36, 40), 'data');
    assert.equal(bytes.readUInt32LE(40), 9600);
    assert(bytes.subarray(44).every(sample => sample === 128));
    pcmEvidence = {bytes: bytes.length, frames: 9600, sampleRate: 8000,
      channels: 1, bits: 8, allUnsignedSamples: 128, normalizedPeak: 0,
      sha256: crypto.createHash('sha256').update(bytes).digest('hex')};
  });
  await test('Actual constructor owns one exact carrier and frozen classifier', () => {
    const i = identityFixture();
    assert(Object.isFrozen(i.api));
    assert.equal(i.controls.create(), i.carrier);
    assert.equal(i.appended.length, 1);
    assert.equal(i.appended[0], i.carrier);
    assert.equal(i.carrier.src, silentURL);
    assert.equal(i.api.isSilent(i.carrier), true);
    assert.equal(i.api.isSilent(null), false);
    assert.equal(i.api.isSilent(undefined), false);
  });

  const invalid = [
    ['Same ID and flag on another object', i => ({...i.carrier, dataset: {...i.carrier.dataset}})],
    ['Different ID on another object', i => ({...i.carrier, id: 'ordinary-audio'})],
    ['Missing element identity', i => { i.controls.setReference(null); }],
    ['No ID or private identity on external object', i => { const x = {...i.carrier}; delete x.id; return x; }],
    ['Missing silent flag', i => { delete i.carrier.dataset.sukSilentCarrier; }],
    ['Wrong silent flag', i => { i.carrier.dataset.sukSilentCarrier = '0'; }],
    ['Boolean silent flag', i => { i.carrier.dataset.sukSilentCarrier = true; }],
    ['Numeric silent flag', i => { i.carrier.dataset.sukSilentCarrier = 1; }],
    ['Missing dataset', i => { delete i.carrier.dataset; }],
    ['Unknown empty carrier URL', i => { i.controls.setURL(''); }],
    ['Non-string carrier URL', i => { i.controls.setURL({}); }],
    ['Non-Blob carrier URL', i => { const u = 'https://sukun.test/sound.wav'; i.controls.setURL(u); i.carrier.src = i.carrier.currentSrc = u; }],
    ['Different Blob source despite stale flag', i => { i.carrier.src = i.carrier.currentSrc = otherURL; }],
    ['src changed while currentSrc remains silent', i => { i.carrier.src = otherURL; }],
    ['currentSrc changed while src remains silent', i => { i.carrier.currentSrc = otherURL; }],
    ['currentSrc not ready', i => { i.carrier.currentSrc = ''; }],
    ['A recording MediaStream is attached', i => { i.carrier.srcObject = {getTracks() { return []; }}; }],
    ['Missing srcObject evidence', i => { delete i.carrier.srcObject; }],
    ['Throwing currentSrc getter', i => { Object.defineProperty(i.carrier, 'currentSrc', {get() { throw Error('unavailable'); }}); }]
  ];
  for (const [name, mutate] of invalid) await blockedAtStart(name, mutate);

  for (const age of [0, 1779]) await test('Verified carrier preserves complete 3s source at onset age ' + age, async () => {
    const i = identityFixture(), f = fixture(i, {media: [i.carrier]});
    f.runClock(); f.setNow(1000 + age); f.run(); await f.flush();
    const {source, context} = playing(f);
    await f.advance(3019); playing(f);
    assert.equal(context.closeCalls, 0);
    await f.advance(1); playing(f);
    // Fixture has no native audio clock, so dispatch natural completion only
    // after 20ms lead + complete 3000ms PCM window.
    source.onended(); await f.flush();
    assert.equal(f.root.dataset.audioCompleted, '1');
    assert.equal(f.root.dataset.audioPlaybackElapsedMs, '3020');
    assert.equal(f.root.dataset.audioOutcome, 'scheduled');
    assert.equal(source.disconnected, true);
    assert.equal(context.closeCalls, 1);
    source.onended(); f.run(); fire(f.document, 'click');
    await cleanup(f);
    assert.equal(source.starts.length, 1);
    assert.equal(context.closeCalls, 1);
  });
  await test('Carrier does not widen strict 1780ms onset boundary', async () => {
    const i = identityFixture(), f = fixture(i, {media: [i.carrier]});
    f.runClock(); f.setNow(2780); f.run(); await f.flush();
    silent(f); await cleanup(f);
  });
  await test('A carrier starting at 900ms does not cancel the playing intro', async () => {
    const i = identityFixture(), f = fixture(i);
    await run(f); const {source} = playing(f);
    await f.advance(900); f.options.media = [i.carrier];
    fire(f.document, 'play', {target: i.carrier}); playing(f);
    await f.advance(2120); playing(f); source.onended();
    assert.equal(f.root.dataset.audioCompleted, '1'); await cleanup(f);
  });
  await test('r1037 raw-scan control reproduces false cancellation at 900ms', async () => {
    const newPredicate = '!media[m].paused&&!media[m].ended&&!knownSilentCarrier(media[m])';
    assert(code.includes(newPredicate));
    // Revert only the predicate in memory; no production or older source writes.
    const oldScan = code.replace(newPredicate, '!media[m].paused&&!media[m].ended');
    const i = identityFixture(), f = fixture(i, {}, oldScan);
    await run(f); const {source} = playing(f);
    await f.advance(900); f.options.media = [i.carrier];
    fire(f.document, 'play', {target: i.carrier});
    assert.equal(f.root.dataset.audioOutcome, 'unsafe-audio');
    assert.equal(f.root.dataset.audioSafetyReason, 'media-active');
    assert(source.disconnected); assert.notEqual(f.root.dataset.audioCompleted, '1');
    await cleanup(f);
  });

  for (const [name, api] of [
    ['missing', undefined], ['empty', {}], ['non-function', {isSilent: true}],
    ['throws', {isSilent() { throw Error('unknown'); }}],
    ['truthy number', {isSilent: () => 1}], ['truthy string', {isSilent: () => 'true'}],
    ['unknown return', {isSilent: () => undefined}], ['false', {isSilent: () => false}]
  ]) await test('Unknown carrier API fails closed: ' + name, async () => {
    const i = identityFixture(), f = fixture(null, {media: [i.carrier]});
    f.window.SukunSilentCarrierIdentity = api;
    await run(f); silent(f);
    assert.equal(f.root.dataset.audioSafetyReason, 'media-active'); await cleanup(f);
  });
  await test('Throwing API property fails closed', async () => {
    const i = identityFixture(), f = fixture(null, {media: [i.carrier]});
    Object.defineProperty(f.window, 'SukunSilentCarrierIdentity', {get() { throw Error('unknown'); }});
    await run(f); silent(f); assert.equal(f.root.dataset.audioSafetyReason, 'media-active'); await cleanup(f);
  });
  await test('Missing carrier API does not prohibit a genuinely idle page', async () => {
    const f = fixture(null); await run(f); playing(f); await cleanup(f);
  });
  for (const mode of ['removed', 'throws']) await test('Carrier API becomes ' + mode + ' during playback', async () => {
    const i = identityFixture(), f = fixture(i, {media: [i.carrier]});
    await run(f); const {source} = playing(f); await f.advance(900);
    if (mode === 'removed') delete f.window.SukunSilentCarrierIdentity;
    else f.window.SukunSilentCarrierIdentity = {isSilent() { throw Error('unavailable'); }};
    await f.advance(25);
    assert.equal(f.root.dataset.audioSafetyReason, 'media-active');
    assert(source.disconnected); assert.notEqual(f.root.dataset.audioCompleted, '1');
    await cleanup(f);
  });

  for (const [name, mutate] of invalid) await test('Playing intro stops when carrier trust changes: ' + name, async () => {
    const i = identityFixture(), f = fixture(i, {media: [i.carrier]});
    await run(f); const {source, context} = playing(f); await f.advance(900);
    const media = mutate(i) || i.carrier; f.options.media = [media];
    fire(f.document, 'play', {target: media});
    assert.equal(f.root.dataset.audioOutcome, 'unsafe-audio');
    assert.equal(f.root.dataset.audioSafetyReason, 'media-active');
    assert.equal(context.gains[0].gain.value, 0); assert(source.disconnected);
    assert.notEqual(f.root.dataset.audioCompleted, '1');
    // Returning to idle cannot replay the already-cancelled signature.
    f.options.media = []; f.run(); fire(f.document, 'click'); await cleanup(f);
    assert.equal(source.starts.length, 1);
  });
  await test('Real recording transition with stale flag is caught by 25ms guard without events', async () => {
    const i = identityFixture(), f = fixture(i, {media: [i.carrier]});
    await run(f); const {source} = playing(f); await f.advance(900);
    i.carrier.src = i.carrier.currentSrc = otherURL;
    await f.advance(25);
    assert.equal(f.root.dataset.audioSafetyReason, 'media-active');
    assert(source.disconnected); await cleanup(f);
  });
  for (const tag of ['audio', 'video']) for (const flagged of [false, true])
    await test('Other playing ' + tag + ' remains blocked, silent flag ' + flagged, async () => {
      const i = identityFixture();
      const other = {tagName: tag.toUpperCase(), paused: false, ended: false,
        dataset: flagged ? {sukSilentCarrier: '1'} : {}, src: silentURL,
        currentSrc: silentURL, srcObject: null};
      const f = fixture(i, {media: [i.carrier, other]});
      await run(f); silent(f); assert.equal(f.root.dataset.audioSafetyReason, 'media-active'); await cleanup(f);
    });

  const owner = {owned: false, pending: false, blocked: false, maintenance: false, retiring: false, recoveryRequired: false};
  const safety = [
    ['lifecycle busy', {busy: true}, 'unsafe-audio', 'lifecycle-busy'],
    ['tick recording', {tickRecording: true}, 'unsafe-audio', 'tick-recording'],
    ['physical recording', {recording: true}, 'unsafe-audio', 'physical-recording'],
    ['session playing', {phase: 'PLAYING'}, 'unsafe-audio', 'session-non-idle'],
    ['aggregate paused', {aggregate: {paused: true, mixCaptured: false, providerIds: []}}, 'unsafe-audio', 'aggregate-active'],
    ['aggregate captured', {aggregate: {paused: false, mixCaptured: true, providerIds: []}}, 'unsafe-audio', 'aggregate-active'],
    ['aggregate provider', {aggregate: {paused: false, mixCaptured: false, providerIds: ['real-player']}}, 'unsafe-audio', 'aggregate-active'],
    ['stored owner', {owner: 'another-tab'}, 'unsafe-owner'],
    ['unknown owner', {ownerState: {}}, 'unavailable'],
    ['unknown aggregate', {aggregate: {}}, 'unavailable'],
    ...Object.keys(owner).map(key => ['owner ' + key, {ownerState: {...owner, [key]: true}}, 'unsafe-owner'])
  ];
  for (const [name, options, outcome, reason] of safety) {
    await test('Silent carrier cannot bypass startup ' + name, async () => {
      const i = identityFixture(), f = fixture(i, {...options, media: [i.carrier]});
      await run(f); silent(f); assert.equal(f.root.dataset.audioOutcome, outcome);
      if (reason) assert.equal(f.root.dataset.audioSafetyReason, reason);
      await cleanup(f);
    });
    await test('Silent carrier cannot bypass newly active ' + name, async () => {
      const i = identityFixture(), f = fixture(i, {media: [i.carrier]});
      await run(f); const {source} = playing(f); await f.advance(900);
      Object.assign(f.options, options); fire(f.window, 'sukun:audiostate');
      assert.equal(f.root.dataset.audioOutcome, outcome);
      if (reason) assert.equal(f.root.dataset.audioSafetyReason, reason);
      assert(source.disconnected); await cleanup(f);
    });
  }
  for (const event of ['pointerdown', 'keydown', 'click', 'visibilitychange', 'pagehide'])
    await test('Verified carrier preserves cancellation on ' + event, async () => {
      const i = identityFixture(), f = fixture(i, {media: [i.carrier]});
      await run(f); const {source} = playing(f); await f.advance(900);
      if (event === 'visibilitychange') f.document.hidden = true;
      fire(event === 'pagehide' ? f.window : f.document, event);
      assert(source.disconnected); assert.notEqual(f.root.dataset.audioCompleted, '1');
      await cleanup(f);
    });
  await test('Carrier exemption cannot unlock suspended context with a later click', async () => {
    const i = identityFixture(), f = fixture(i, {media: [i.carrier], state: 'suspended'});
    await run(f); await f.advance(1780); silent(f);
    assert.equal(f.root.dataset.audioOutcome, 'resume_timeout');
    fire(f.document, 'click'); f.resolveResume(); await f.flush(); f.run();
    silent(f); await cleanup(f);
  });
  const report = {total: results.length, passed: results.filter(x => x.status === 'PASS').length,
    failed: results.filter(x => x.status === 'FAIL').length,
    scope: 'Production-source identity and digital-zero PCM proof; synthetic lifecycle only, not device audibility.',
    pcmEvidence, results};
  console.log(JSON.stringify(report, null, 2));
  if (report.failed) process.exitCode = 1;
})().catch(error => { console.error(error); process.exitCode = 1; });
