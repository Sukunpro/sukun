'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const code = fs.readFileSync(path.join(__dirname, '..', 'nero.html'), 'utf8');

function extract(start, end) {
  const first = code.indexOf(start);
  const last = code.indexOf(end, first);
  assert.ok(first >= 0 && last > first, `Expected source between ${start} and ${end}`);
  return code.slice(first, last);
}

function fixture(noiseEnabled) {
  const switches = new Map();
  const saved = new Map([['tekke.noise', noiseEnabled]]);
  const gain = value => ({
    gain: {value, targets: [], setTargetAtTime(...target) { this.targets.push(target); }},
    connect() {}
  });
  const sources = [];
  const graphNode = () => ({frequency: {}, outputs: [], connect(output) { this.outputs.push(output); }});
  const ctx = vm.createContext({
    ctx: {currentTime: 10},
    S: {get: (key, fallback) => saved.get(key) ?? fallback, set: (key, value) => saved.set(key, value)},
    ac() {},
    makeEnv: () => ({n: node => node, play: node => node, kill() {}}),
    g: gain,
    osc: (frequency, type) => ({...graphNode(), frequency, type}),
    flt: graphNode,
    src: kind => {
      const node = {...graphNode(), kind};
      sources.push(node);
      return node;
    },
    master: {},
    wetIn: {},
    NEY: null,
    CH: {},
    running: true,
    vol: () => 0,
    bindSw: (id, handler) => switches.set(id, handler)
  });
  vm.runInContext(
    extract('let TKNOISE=', '/* ════════ 2) SES ÇEKİRDEĞİ — mağara') +
    extract('/* Nefesle canlı HÛ katmanı', 'function huLevel') +
    extract("bindSw('tkNoiseTgl'", "$('#patSel').addEventListener('change'"),
    ctx
  );
  return {
    start: ctx.huStart,
    stop: ctx.huStop,
    state: () => vm.runInContext('HU', ctx),
    switchNoise: switches.get('tkNoiseTgl'),
    noise: () => sources.at(-1),
    saved
  };
}

test('Hû starts with silent pink noise when Tekke noise texture is off', () => {
  const f = fixture(false);
  f.start();
  const {E, amp} = f.state();
  assert.ok(E && amp);
  assert.equal(f.noise().kind, 'pink');
  assert.equal(f.noise().outputs[0].outputs[0].gain.value, 0);
});

test('Tekke noise toggles Hû hiss during playback without restarting the Hû tone', () => {
  const f = fixture(false);
  f.start();
  const {amp} = f.state();
  const gain = f.noise().outputs[0].outputs[0].gain;
  f.switchNoise(true);
  f.switchNoise(false);
  assert.deepEqual(gain.targets, [[.04, 10, .18], [0, 10, .18]]);
  assert.equal(f.state().amp, amp);
  assert.equal(f.saved.get('tekke.noise'), false);
});

test('Hû inherits the selected noise texture after stop and restart', () => {
  const f = fixture(true);
  f.start();
  const firstGain = f.noise().outputs[0].outputs[0].gain;
  assert.equal(firstGain.value, .04);
  f.stop();
  f.switchNoise(false);
  assert.deepEqual(firstGain.targets, []);
  f.start();
  const restartedGain = f.noise().outputs[0].outputs[0].gain;
  assert.notEqual(restartedGain, firstGain);
  assert.equal(restartedGain.value, 0);
});
