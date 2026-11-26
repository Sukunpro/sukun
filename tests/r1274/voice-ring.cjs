'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(process.argv[2] || path.join(__dirname, '../..'));
const html = fs.readFileSync(path.join(root, 'nero.html'), 'utf8');

function section(start, end) {
  const first = html.indexOf(start);
  const last = html.indexOf(end, first + start.length);
  assert.ok(first >= 0 && last > first, 'Source section for ' + start);
  return html.slice(first, last);
}

const source = [
  section('let REC_CAPTURE=null;', 'let _REC_AKTIF=null;'),
  section('async function sukunOpenMicrophone', 'function sukunRecordingFailure('),
  section('function sukunRecordingFailure(', '\n}') + '\n}',
  section('const VH={', 'async function vhLoadStored()'),
].join('\n');

function setup(fault = '') {
  const tracks = [];
  const requests = [];
  const recorders = [];
  const events = [];
  const writes = [];
  const controls = new Map();
  function $(selector) {
    if (!controls.has(selector)) {
      controls.set(selector, {textContent: '', classList: {add() {}, remove() {}, toggle() {}}});
    }
    return controls.get(selector);
  }
  const mediaDevices = {
    getUserMedia() {
      const track = {readyState: 'live', stop() { this.readyState = 'ended'; }};
      tracks.push(track);
      const stream = {getTracks: () => [track]};
      if (fault === 'permission pending') return new Promise(resolve => requests.push(() => resolve(stream)));
      return Promise.resolve(stream);
    },
  };
  class Recorder {
    constructor() {
      if (fault === 'constructor') throw new DOMException('Encoder unavailable', 'NotSupportedError');
      this.state = 'inactive';
      this.mimeType = 'audio/webm';
      recorders.push(this);
    }
    start() {
      if (fault === 'start') throw new DOMException('Encoder unavailable', 'NotSupportedError');
      this.state = 'recording';
    }
    stop() {
      if (this.state !== 'recording') throw new DOMException('Recorder inactive', 'InvalidStateError');
      this.state = 'inactive';
      events.push(async () => {
        this.ondataavailable?.({data: new Blob(['voice sample'])});
        await this.onstop?.();
      });
    }
  }
  const ctx = vm.createContext({
    $, console, Blob, URL, DOMException, MediaRecorder: Recorder,
    document: {hidden: false}, navigator: {mediaDevices}, location: {origin: 'https://appassets.androidplatform.net'},
    FileReader: class { readAsDataURL() { this.result = 'data:audio/webm;base64,YQ=='; this.onload(); } },
    Audio: class { addEventListener() {} },
    S: {set(key, value) { writes.push({key, value}); }},
    ac() {}, ctx: {decodeAudioData: async () => ({duration: 1})}, vhStop() {},
    micKisit() { return {audio: true}; }, micHazirla: async () => {},
    recSessionBegin(_label, _seconds, stop) { return {bitir() { return 0; }, stop}; },
  });
  ctx.window = ctx;
  vm.runInContext(source + '\nglobalThis.record=vhRecord;globalThis.state=VH;', ctx);
  return {ctx, tracks, requests, recorders, events, writes, $};
}

async function verify() {
  for (const fault of ['constructor', 'start']) {
    const run = setup(fault);
    await run.ctx.record();
    assert.deepEqual(run.tracks.map(x => x.readyState), ['ended'], fault + ' releases the granted microphone');
    assert.equal(run.ctx.state.rec, null, fault + ' clears the recorder for retry');
    assert.match(run.$('#vhStat').textContent, /ses kaydı oluşturulamadı/, fault + ' reports the encoder error');
    assert.equal(run.writes.length, 0);
  }
  {
    const run = setup('permission pending');
    const first = run.ctx.record();
    const second = run.ctx.record();
    assert.equal(run.requests.length, 1, 'Second tap cancels the pending recording');
    run.requests[0]();
    await Promise.all([first, second]);
    assert.deepEqual(run.tracks.map(x => x.readyState), ['ended']);
    assert.equal(run.recorders.length, 0);
    assert.equal(run.ctx.state.rec, null);
  }
  {
    const run = setup();
    await run.ctx.record();
    assert.equal(run.ctx.state.rec.state, 'recording');
    await run.ctx.record();
    await run.events[0]();
    assert.deepEqual(run.tracks.map(x => x.readyState), ['ended']);
    assert.equal(run.ctx.state.rec, null);
    assert.equal(await run.ctx.state.blob.text(), 'voice sample');
    assert.equal(run.writes.length, 1);
    assert.equal(run.writes[0].key, 'sukun.voice');
  }
  {
    const run = setup();
    const previous = new Blob(['previous recording']);
    run.ctx.state.blob = previous;
    await run.ctx.record();
    run.recorders[0].onerror?.({error: new DOMException('Interrupted', 'NotReadableError')});
    // Browsers may emit final data and stop even after the error.
    if (run.recorders[0].state !== 'inactive') run.recorders[0].stop();
    await run.events[0]();
    assert.equal(run.ctx.state.blob, previous);
    assert.deepEqual(run.tracks.map(x => x.readyState), ['ended']);
    assert.equal(run.ctx.state.rec, null);
    assert.equal(run.writes.length, 0);
  }
  console.log('PASS voice-ring capture: encoder construction/start failures, pending cancellation, save and interrupted recording');
}

verify().catch(error => { console.error(error); process.exitCode = 1; });
