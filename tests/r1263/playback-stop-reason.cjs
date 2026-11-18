'use strict';

const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

const root = path.resolve(process.argv[2] || path.join(__dirname, '../..'));
const source = readFileSync(path.join(root, 'assets/runtime/playback-stop-reason-r1263.js'), 'utf8');

function fixture(values = new Map()) {
  const window = new EventTarget();
  const document = new EventTarget();
  const updates = [];
  const state = { phase: 'PLAYING', activeMode: 'esma', journeyKind: 'single', epoch: 4, requestId: 6 };
  const sessionStorage = {
    getItem(key) { return values.get(key) ?? null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); }
  };
  Object.assign(window, { document, sessionStorage, SukunSessionState: { peek: () => state } });
  window.addEventListener('sukun:playbackstopreason', event => updates.push(event.detail));
  vm.runInNewContext(source, { window, document, sessionStorage, Date, CustomEvent, Object, Number, setTimeout, clearTimeout });
  const emit = (name, detail) => window.dispatchEvent(new CustomEvent(name, { detail }));
  const record = () => JSON.parse(JSON.stringify(window.SukunPlaybackStopReason.snapshot()));
  return { values, updates, state, record, emit,
    stop: detail => emit('sukun:playbackstopped', detail),
    native: detail => emit('sukun:backgroundownerchange', detail) };
}

test('empty state and passive device, visibility and individual item signals', () => {
  const f = fixture();
  for (const name of ['visibilitychange','devicechange','pause','ended','sukun:playbackchange']) f.emit(name, {});
  f.native({ reason: 'ended', owner: 'journey', lease: 1, phase: 'ENDED', active: true, ended: true });
  f.emit('sukun:journey-complete', { kind: '28', totalItems: 1 });
  assert.equal(f.record(), null);
  assert.equal(f.updates.length, 0);
});

test('last stop is local, survives refresh and contains only time, reason and scope', () => {
  const f = fixture();
  f.stop({ code: 'sleep-timer', scope: 'all', source: 'PRIVATE_TITLE', uri: '/private.mp3' });
  const saved = f.record();
  assert.deepEqual(Object.keys(saved).sort(), ['at','code','scope']);
  assert.equal(saved.code, 'sleep-timer');
  assert.equal(saved.scope, 'all');
  assert(Number.isFinite(saved.at));
  assert.equal(f.updates.length, 1);
  assert.deepEqual(fixture(f.values).record(), saved);
  assert.doesNotMatch(JSON.stringify([...f.values]), /PRIVATE_TITLE|private\.mp3/);
});

test('late command receipts and malformed input cannot replace a more recent reason', () => {
  const f = fixture();
  const at = Date.now();
  f.stop({ code:'user-stopped', scope:'all', at });
  for (const detail of [
    { code:'user-paused', scope:'all', at:at-10000 },
    { code:'bluetooth-unplugged', scope:'all' },
    { code:'media-error', scope:'unrecognized-owner' } 
  ]) f.stop(detail);
  assert.equal(f.record().code, 'user-stopped');
  assert.equal(f.updates.length, 1);
});

test('only the complete journey is recorded as complete', () => {
  const f = fixture();
  for (const kind of ['28','99']) {
    f.emit('sukun:journey-complete', { kind, totalItems:Number(kind), at:Date.now() });
    assert.equal(f.record().code, 'completed');
    assert.equal(f.record().scope, 'journey');
  }
});

test('a confirmed unexpected pause keeps its cause unknown and ignores recovered or stale leases', () => {
  const f = fixture();
  const active = { owner:'single', lease:11, active:true, hidden:true, readyState:4, ended:false };
  f.native({ ...active, reason:'playing', phase:'PLAYING', playing:true, paused:false });
  const pause = { ...active, reason:'pause', phase:'INTERRUPTED', playing:false, paused:true, lockRecoveryReason:'pause-outside-lock-window' };
  f.native({ ...pause, lease:10 });
  f.native({ ...pause, lockRecoveryPending:true, lockRecoveryReason:'screen-lock-transition' });
  assert.equal(f.record(), null);
  f.native(pause);
  assert.equal(f.record().code, 'unknown');
  assert.equal(f.record().scope, 'recording');
});

test('a media error belongs only to the owner that was observed playing', () => {
  const f = fixture();
  const lease = { owner:'journey', lease:8, active:true, readyState:4, ended:false };
  const error = { ...lease, reason:'error', phase:'BLOCKED', blocked:true, playing:false, error:'MediaError' };
  f.native(error);
  assert.equal(f.record(), null);
  f.native({ ...lease, reason:'playing', phase:'PLAYING', playing:true, paused:false });
  f.native(error);
  assert.equal(f.record().code, 'media-error');
  assert.equal(f.record().scope, 'recording');
});

test('rejected and superseded session pause commands do not attribute a stop', () => {
  const f = fixture();
  const command = { action:'pause', requestId:7, epoch:4 };
  for (const result of [{accepted:false, stale:false}, {accepted:true, stale:true}]) {
    f.emit('sukun:sessioncommand', command);
    f.emit('sukun:sessioncommandresult', {...command, ...result});
  }
  f.emit('sukun:sessioncommandresult', { ...command, requestId:8, accepted:true, stale:false });
  assert.equal(f.record(), null);
});
