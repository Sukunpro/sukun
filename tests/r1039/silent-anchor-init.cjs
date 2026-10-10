'use strict';
// Production-source integration in a deterministic browser boundary fixture.
// This executes the real ac/SesCapa/AudioLife/AudioHub/session functions, not a
// fabricated list of playing media. Native DOM/audio timing remains simulated.
// No report writes, app-state writes, publication or device-audibility claim.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const {createFixture, fire, hub} = require('../r1037/intro-fixture.cjs');
const root = path.resolve(process.argv[2] || path.join(__dirname, '../..'));
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const intro = fs.readFileSync(path.join(root, 'assets/runtime/startup-intro-r1027.js'), 'utf8');
const sessionPath = process.argv[3] || path.join(root, 'assets/runtime/session-r919.js');
const session = fs.readFileSync(sessionPath, 'utf8');
const clock = html.match(/<script id="sukun-auto-intro-clock">([\s\S]*?)<\/script>/)[1];
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const pieces = {};
function extract(name, start, end) {
  const a = html.indexOf(start), b = html.indexOf(end, a + start.length);
  assert(a >= 0 && b > a, 'Missing production source boundary: ' + name);
  return pieces[name] = html.slice(a, b);
}
const ac = extract('mainAudioInit', 'function ac(){', '/* ── Günlük manevi söz');
const engine = extract('mainEngineAPI', 'window.SUKUN={ctx:', 'const SesCapa=window.SesCapa=');
const anchor = extract('silentAnchor', 'const SesCapa=window.SesCapa=', 'function makeIR(dur,decay){');
const makeIR = extract('reverbGenerator', 'function makeIR(dur,decay){', '/* Kısa düğüm fabrikaları */');
const life = extract('audioLife', 'const AudioLife=window.AudioLife={', 'function lifeHidden(src){');
const audioHub = extract('audioHub', 'const Hub=window.SukunAudioHub={', '/* Oturum günlüğü:');
const hookAnchor = extract('anchorHook', 'function hookSesCapa(){', '/* ── 2) TTS');
const hookMedia = extract('mediaHook', 'function hookMedia(){', '/* ── 3) ANDROID');
const poll = extract('audioLifePoll', 'function audioLifePoll(){', 'let _audioLifeTO=');
const carriers = extract('carrierIdentity', 'function r476SilentWav(){', 'function r476Prime(){');
const anchorLiteral = anchor.match(/const silentAnchorSource='([^']+)'/)[1];
const sessionSRI = html.match(/<script[^>]+src="\.\/assets\/runtime\/session-r919\.js[^>]+integrity="(sha256-[^"]+)"/)[1];
const results = [];
async function test(name, fn) {
  try { await fn(); results.push({name, status: 'PASS'}); }
  catch (error) { results.push({name, status: 'FAIL', error: error.stack}); }
}

function setup(options = {}) {
  const acceptedAnchor = "if(window.SesCapa&&typeof window.SesCapa.isSilentCarrier==='function'&&window.SesCapa.isSilentCarrier(element)===true)return true;";
  assert(carriers.includes(acceptedAnchor));
  const productionCarriers = options.oldGuard ? carriers.replace(acceptedAnchor, '') : carriers;
  const init = `(function(){
    const platform=window.testPlatform, navigator=platform.navigator,
      CustomEvent=platform.CustomEvent, HTMLMediaElement=window.HTMLMediaElement,
      queueMicrotask=platform.queueMicrotask, Blob=platform.Blob,
      ArrayBuffer=platform.ArrayBuffer,DataView=platform.DataView,URL=platform.URL;
    const BUILD='test-source-integration',now=()=>performance.now(),
      emit=(name,detail)=>window.dispatchEvent(new CustomEvent(name,{detail})),diag=()=>{};
    const Journal={event(){},save(){}},Watch={last:'fixture'},PRERR={push(){}};
    const FR=window.testAppState.FR,Z=window.testAppState.Z,AMB=window.testAppState.AMB,
      VH=window.testAppState.VH,SES=window.testAppState.SES,MINI={paused:false,wasAuto:false};
    let ctx=null,master=null,wetIn=null,limiter=null,tizKes=null,guardIn=null,
      eqBas=null,eqOrta=null,eqTiz=null,komp=null,kompIn=null,kompOut=null,_acFailed=false;
    let _r476LockAudio=null,_r476SilentUrl='',_kesintiVardi=false;
    const $=()=>({value:'.7'}),EQ={uygulaEt(){}},dashUpdate=()=>{};
    function sesKilitAc(){} function kesintiIzlemeBaslat(){} function kesintiBagla(){}
    function hardStopAll(){throw Error('unexpected application stop');}
    function alert(message){throw Error('main audio init failed: '+message);}
    ${ac}
    ${engine}
    ${anchor}
    ${makeIR}
    ${life}
    ${audioHub}
    ${hookAnchor}
    ${hookMedia}
    ${poll}
    ${productionCarriers}
    ${session}
    hookSesCapa();hookMedia();
    window.testInit={ac,poll:audioLifePoll,lock:r476Audio,mainContext:()=>ctx,
      anchor:()=>window.SesCapa,initialSnapshot:()=>window.SukunSessionState.snapshot()};
    if(window.testInitBefore)ac();
  })();\n${intro}`;
  const f = createFixture(init, clock, {audioUnitWindow: true, ...options});
  const media = [], actions = [];
  // Real production hooks below wrap this browser-boundary class; the test
  // does not append a mock media record after starting the intro.
  class NativeMedia {
    constructor() {
      Object.assign(this, hub());
      Object.assign(this, {tagName: 'AUDIO', id: '', dataset: {}, style: {},
        src: '', currentSrc: '', srcObject: null, paused: true, ended: false,
        volume: 1, currentTime: 0, loop: false});
    }
    setAttribute() {}
    play() {
      actions.push({type: 'play', element: this, at: f.now});
      this.currentSrc = this.src; this.paused = false; this.ended = false;
      fire(f.document, 'play', {target: this, isTrusted: false});
      return Promise.resolve();
    }
    pause() { actions.push({type: 'pause', element: this, at: f.now}); this.paused = true; }
    load() { this.currentSrc = this.src; }
  }
  f.window.HTMLMediaElement = NativeMedia;
  f.window.testAppState = {FR: {playing: false}, Z: {auto: false}, AMB: {}, VH: {playing: false}, SES: {ler: new Set()}};
  f.window.testInitBefore = !!options.initBefore;
  f.window.testPlatform = {
    Blob, ArrayBuffer, DataView, queueMicrotask,
    CustomEvent: class {constructor(type, options = {}) {this.type = type; this.detail = options.detail; this.isTrusted = false;}},
    navigator: {mediaSession: {setActionHandler() {}, playbackState: 'none'}},
    URL: {createObjectURL: () => 'blob:https://sukun.test/exact-lock-silence'}
  };
  f.document.createElement = tag => { assert.equal(tag, 'audio'); return new NativeMedia(); };
  f.document.body = {classList: {contains: () => false}, appendChild(a) {media.push(a);}};
  f.document.readyState = 'loading'; f.document.visibilityState = 'visible';
  f.document.querySelector = () => null;
  f.document.getElementById = id => id === 'sukun-auto-intro' ? f.root : null;
  const originalQuery = f.document.querySelectorAll;
  f.document.querySelectorAll = selector => selector === 'audio,video' ? media : originalQuery(selector);
  const proto = f.window.AudioContext.prototype;
  const node = () => ({connect() {}, disconnect() {}, frequency: {value: 0}, Q: {value: 0}, gain: {value: 0},
    threshold: {value: 0}, knee: {value: 0}, ratio: {value: 0}, attack: {value: 0}, release: {value: 0}});
  proto.createDynamicsCompressor = node; proto.createBiquadFilter = node; proto.createConvolver = node;
  proto.sampleRate = 8000;
  proto.createBuffer = (channels, length, rate) => {
    const data = Array.from({length: channels}, () => new Float32Array(length));
    return {numberOfChannels: channels, duration: length / rate, getChannelData: i => data[i]};
  };
  f.media = media; f.mediaActions = actions;
  return f;
}
async function boot(f) { f.runClock(); f.run(); await f.flush(); }
function playing(f) {
  const context = f.contexts.find(c => c.buffers.length), source = context?.buffers[0];
  assert(context && source); assert.equal(source.starts.length, 1);
  assert.equal(source.stops.length, 1); assert.equal(source.disconnected, false);
  assert.equal(source.buffer.duration, 3); assert.equal(source.loop, false);
  assert.equal(source.playbackRate.value, 1);
  assert(Math.abs(source.stops[0] - source.starts[0] - 3) < 1e-8);
  assert.equal(f.root.dataset.audioOutcome, 'scheduled');
  assert.equal(f.root.dataset.audioSourcesScheduled, '1');
  return {context, source};
}
function stoppedForMedia(f) {
  assert.equal(f.root.dataset.audioOutcome, 'unsafe-audio');
  assert.equal(f.root.dataset.audioSafetyReason, 'media-active');
  assert(f.contexts.filter(c => c.buffers.length).every(c => c.buffers[0].disconnected));
  assert.notEqual(f.root.dataset.audioCompleted, '1');
}
async function finish(f) {
  await f.advance(7000); assert.equal(f.jobs.size, 0);
  for (const c of f.contexts.filter(c => c.buffers.length)) {
    assert(c.buffers[0].disconnected); assert.equal(c.closeCalls, 1);
  }
}

(async () => {
  await test('Actual session dependency matches production HTML SRI', () => {
    assert.equal('sha256-' + crypto.createHash('sha256').update(session).digest('base64'), sessionSRI);
    assert.equal(hash(session), '659c21f0e122a18b34870ebefd89a86d1d8c28556c4746d8c3c1db44a8c21c16');
  });
  await test('Actual SesCapa literal is mono 8kHz PCM8 digital zero', () => {
    const data = Buffer.from(anchorLiteral.split(',')[1], 'base64');
    assert.equal(data.length, 1644); assert.equal(data.readUInt16LE(20), 1);
    assert.equal(data.readUInt16LE(22), 1); assert.equal(data.readUInt32LE(24), 8000);
    assert.equal(data.readUInt16LE(34), 8); assert.equal(data.readUInt32LE(40), 1600);
    assert.equal(data.toString('ascii', 0, 4), 'RIFF');
    assert.equal(data.toString('ascii', 8, 12), 'WAVE');
    assert(data.subarray(44).every(x => x === 128));
    assert.equal(hash(data), '55006117b5f1c40e8a7f00497ea6bfb14a433eb19c32cb74fd09d853c1aa81ee');
  });
  for (const initBefore of [false, true]) await test('Actual ac/anchor/hooks/session/poll preserve whole intro; initBefore=' + initBefore, async () => {
    const f = setup({initBefore}); await boot(f); const {source} = playing(f);
    assert.equal(f.window.SukunSessionState.version, 'r919');
    assert.equal(f.window.SukunSessionState.snapshot().phase, 'IDLE');
    if (!initBefore) { await f.advance(1808); f.window.SUKUN.ctx(); await f.flush(); }
    const a = f.media[0];
    assert.equal(f.media.length, 1); assert.equal(a.src, anchorLiteral);
    assert.equal(a.dataset.sukSilentAnchor, '1'); assert.equal(a.dataset.sukSilentCarrier, undefined);
    assert.equal(a.paused, false); assert.equal(f.window.SesCapa.isSilentCarrier(a), true);
    assert.equal(f.window.SukunSilentCarrierIdentity.isSilent(a), true);
    assert.equal(f.window.AudioLife.busy(), false);
    assert.equal(f.window.SukunSessionState.snapshot().phase, 'IDLE');
    // Existing AudioHub behavior is deliberately preserved: the anchor may
    // still be listed there, while the independent AudioLife predicate is idle.
    assert.equal(f.window.SukunAudioHub.mediaActive.has(a), true);
    playing(f);
    f.window.testInit.poll(); await f.flush();
    assert.equal(a.paused, true); assert.equal(f.window.SesCapa.isActive(), false);
    assert.equal(f.window.AudioLife.state, 'idle'); playing(f);
    await f.advance(initBefore ? 3020 : 1212); playing(f);
    source.onended(); await f.flush();
    assert.equal(f.root.dataset.audioCompleted, '1');
    assert.equal(f.root.dataset.audioPlaybackElapsedMs, '3020');
    assert.equal(f.window.testInit.mainContext().closeCalls, 0);
    await finish(f);
  });
  await test('Actual legacy initialization reproduces r1038 cancellation at 1808ms', async () => {
    const f = setup({oldGuard: true}); await boot(f); playing(f);
    await f.advance(1808); f.window.SUKUN.ctx(); await f.flush();
    assert.equal(f.media.length, 1); assert.equal(f.media[0].src, anchorLiteral);
    stoppedForMedia(f); assert.equal(f.root.dataset.audioPlaybackElapsedMs, '1808');
    await finish(f);
  });
  await test('An idle poll before ac cannot prevent later main-context carrier initialization', async () => {
    const f = setup(); await boot(f); f.window.testInit.poll();
    assert.equal(f.media.length, 0);
    await f.advance(900); f.window.SUKUN.ctx(); await f.flush(); playing(f);
    assert.equal(f.media[0].paused, false); assert.equal(f.window.AudioLife.busy(), false);
    await f.advance(2120); const {source} = playing(f); source.onended(); await finish(f);
  });
  await test('Repeated ac calls reuse one main context and one anchor', async () => {
    const f = setup(); await boot(f);
    f.window.SUKUN.ctx(); f.window.SUKUN.ctx(); f.window.SUKUN.bus(); await f.flush();
    assert.equal(f.contexts.length, 2); assert.equal(f.media.length, 1);
    assert.equal(f.mediaActions.filter(x => x.type === 'play').length, 1);
    playing(f); await finish(f);
  });
  const bad = [
    ['different source', a => { a.src = 'blob:https://sukun.test/recording'; }],
    ['different currentSrc', a => { a.currentSrc = 'blob:https://sukun.test/recording'; }],
    ['same recording in both sources', a => { a.src = a.currentSrc = 'blob:https://sukun.test/recording'; }],
    ['empty currentSrc', a => { a.currentSrc = ''; }],
    ['missing dedicated flag', a => { delete a.dataset.sukSilentAnchor; }],
    ['incorrect dedicated flag', a => { a.dataset.sukSilentAnchor = true; }],
    ['generic flag alone', a => { delete a.dataset.sukSilentAnchor; a.dataset.sukSilentCarrier = '1'; }],
    ['live srcObject', a => { a.srcObject = {}; }],
    ['missing srcObject', a => { delete a.srcObject; }],
    ['throwing source', a => { Object.defineProperty(a, 'currentSrc', {get() {throw Error('unknown');}}); }]
  ];
  for (const [name, mutate] of bad) await test('Actual initialized anchor loses certification: ' + name, async () => {
    const f = setup(); await boot(f); await f.advance(900); f.window.SUKUN.ctx(); await f.flush();
    const a = f.media[0]; playing(f); mutate(a);
    assert.equal(f.window.SesCapa.isSilentCarrier(a), false);
    assert.equal(f.window.SukunSilentCarrierIdentity.isSilent(a), false);
    await f.advance(25); stoppedForMedia(f);
    // Intro cleanup owns only its context; it must not pause the changed real source.
    assert.equal(a.paused, false); assert.equal(f.window.testInit.mainContext().closeCalls, 0);
    await finish(f);
  });
  for (const mode of ['missing', 'throws', 'truthy']) await test('Unavailable dedicated classifier fails closed: ' + mode, async () => {
    const f = setup(); await boot(f); f.window.SUKUN.ctx(); await f.flush(); playing(f);
    if (mode === 'missing') delete f.window.SesCapa.isSilentCarrier;
    if (mode === 'throws') f.window.SesCapa.isSilentCarrier = () => {throw Error('unknown');};
    if (mode === 'truthy') f.window.SesCapa.isSilentCarrier = () => 1;
    await f.advance(25); stoppedForMedia(f); await finish(f);
  });
  await test('A clone with exact zero-WAV bytes and flag has no private anchor identity', async () => {
    const f = setup(); await boot(f); f.window.SUKUN.ctx(); await f.flush(); playing(f);
    const copy = f.document.createElement('audio'); copy.src = anchorLiteral; copy.dataset.sukSilentAnchor = '1';
    f.document.body.appendChild(copy); await copy.play(); await f.flush();
    assert.equal(f.window.SesCapa.isSilentCarrier(copy), false); stoppedForMedia(f); await finish(f);
  });
  for (const volume of [1, .0025, 0]) await test('Another actual media player remains blocking at volume ' + volume, async () => {
    const f = setup(); await boot(f); f.window.SUKUN.ctx(); await f.flush();
    const other = f.document.createElement('audio'); other.src = 'blob:https://sukun.test/real-journey';
    other.volume = volume; f.document.body.appendChild(other); await other.play(); await f.flush();
    stoppedForMedia(f); assert.equal(other.paused, false); await finish(f);
  });
  await test('Both verified digital-zero carriers can coexist through the full source window', async () => {
    const f = setup(); await boot(f); await f.advance(900); f.window.SUKUN.ctx();
    const lock = f.window.testInit.lock(); await lock.play(); await f.flush();
    assert.equal(f.media.length, 2); assert.equal(f.window.SukunSilentCarrierIdentity.isSilent(lock), true);
    playing(f); await f.advance(2120); const {source} = playing(f); source.onended(); await finish(f);
  });
  for (const busy of ['FR', 'Z', 'AMB', 'VH', 'provider']) await test('Actual AudioLife ' + busy + ' still stops intro with a certified anchor', async () => {
    const f = setup(); await boot(f); f.window.SUKUN.ctx(); await f.flush(); playing(f);
    const s = f.window.testAppState;
    if (busy === 'FR') s.FR.playing = true;
    if (busy === 'Z') s.Z.auto = true;
    if (busy === 'AMB') s.AMB.active = {};
    if (busy === 'VH') s.VH.playing = true;
    if (busy === 'provider') f.window.AudioLife.register('real-player', () => true);
    assert.equal(f.window.AudioLife.busy(), true);
    fire(f.window, 'sukun:audiostate');
    assert.equal(f.root.dataset.audioSafetyReason, 'lifecycle-busy'); await finish(f);
  });
  for (const key of ['recording', 'tickRecording', 'owner']) await test('Existing ' + key + ' guard survives actual anchor initialization', async () => {
    const f = setup(); await boot(f); f.window.SUKUN.ctx(); await f.flush(); playing(f);
    f.options[key] = key === 'owner' ? 'other-tab' : true;
    fire(f.window, key === 'owner' ? 'storage' : 'sukun:itemrecordingchange');
    assert.equal(f.root.dataset.audioOutcome, key === 'owner' ? 'unsafe-owner' : 'unsafe-audio');
    assert.equal(f.media[0].paused, false); await finish(f);
  });
  await test('Actual session state becomes PLAYING and blocks even when legacy AudioLife is idle', async () => {
    const f = setup(); await boot(f); f.window.SUKUN.ctx(); await f.flush(); playing(f);
    f.window.currentZikirState = {snapshot: () => ({auto: true, cat: 'esma', idx: 0})};
    assert.equal(f.window.AudioLife.busy(), false);
    assert.equal(f.window.SukunSessionState.snapshot().phase, 'PLAYING');
    fire(f.window, 'sukun:audiostate');
    assert.equal(f.root.dataset.audioSafetyReason, 'session-non-idle'); await finish(f);
  });
  const report = {total: results.length, passed: results.filter(x => x.status === 'PASS').length,
    failed: results.filter(x => x.status === 'FAIL').length,
    scope: 'Actual source init/hooks/poll/session integration; simulated browser boundary, not whole-page or hardware audibility.',
    provenance: {htmlSHA256: hash(html), introSHA256: hash(intro), sessionSHA256: hash(session), sessionSRI,
      extractedSHA256: Object.fromEntries(Object.entries(pieces).map(([k, v]) => [k, hash(v)]))}, results};
  console.log(JSON.stringify(report, null, 2));
  if (report.failed) process.exitCode = 1;
})().catch(error => {console.error(error); process.exitCode = 1;});
