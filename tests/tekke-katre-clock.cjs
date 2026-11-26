'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

test('Tekke does not replay missed Katre beats and counts after a stall', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'nero.html'), 'utf8');
  const start = html.indexOf('function katStart(){');
  const end = html.indexOf('\n\n', start);
  assert.ok(start >= 0 && end > start);

  let now = 0;
  let alarm;
  const events = [];
  const clock = {
    running: true, katOn: true, muted: false, bpm: 60, ummanEvery: 4,
    katT: null, beat: 0, nextBeat: 0,
    performance: {now: () => now},
    setTimeout: (callback, delay) => (alarm = {callback, delay}),
    clearTimeout: () => { alarm = null; },
    katreSnd: accent => events.push(['sound', accent]),
    hapticBeat: accent => events.push(['haptic', accent]),
    onKatre: accent => events.push(['counter', accent]),
  };
  const fire = time => {
    now = time;
    alarm.callback();
    for (let i = 0; i < 12 && alarm?.delay === 0; i++) alarm.callback();
  };
  vm.runInNewContext(html.slice(start, end), clock);

  clock.katStart();
  assert.equal(alarm.delay, 500);
  fire(500);
  assert.equal(alarm.delay, 1000);
  fire(1504);
  assert.equal(alarm.delay, 996, 'Small delays preserve the beat clock');

  const beforeStall = events.length;
  fire(6020);
  assert.deepEqual(events.slice(beforeStall), [['sound', false], ['haptic', false], ['counter', false]]);
  assert.equal(alarm.delay, 1000);

  fire(7020);
  assert.deepEqual(events.slice(-3), [['sound', true], ['haptic', true], ['counter', true]]);
  clock.katStop();
  assert.equal(alarm, null);
});
