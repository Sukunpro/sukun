'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(process.argv[2] || path.join(__dirname, '../..'));
const harnessDir = path.join(__dirname, '../r1044');
const harness = fs.readFileSync(path.join(harnessDir, 'native-recovery-authority.cjs'), 'utf8');
const setup = Function('require', '__dirname', harness.split('(async()=>{')[0] + '\nreturn setup;')(require, harnessDir);
const runtime = fs.readFileSync(path.join(root, 'assets/runtime/reading-audio-r1064.js'), 'utf8');

async function verifyRetry(id, key) {
  const f = setup();
  const c = f.context;
  const w = f.window;
  const blob = { size: 200, type: 'audio/mpeg' };
  w.SukunForegroundArbiter = undefined;
  w.SukunReadingSourcesR1064 = { get: () => ({ id, title: id }) };
  w.SukunReadingPolicy = {
    permissions: () => ({}),
    unavailable: reason => ({ ok: false, reason }),
  };
  w.SukunBundledArabicR1065 = { find: async () => ({ blob, key, bundled: true }) };
  c.sukunRecordingKeyFrom = (_title, opt) => opt.recordingKey;
  c.playRecording = (source, title, opt) => c.sukunJourneyNativeRecording(source, title, opt, null);
  vm.runInContext(runtime, c);

  const reader = w.SukunReadingAudioR1064;
  const options = { id, content: 'arabic', source: 'auto' };
  f.a.mode = 'reject';
  const first = await reader.play(options);
  assert.equal(first.ok, false);
  f.tick(12000);
  assert.equal(f.a.playCalls, 1, 'A failed reader must wait for the next explicit play');

  f.a.mode = 'playing';
  const retry = reader.play(options);
  for (let i = 0; i < 15; i++) await Promise.resolve();
  assert.equal(f.a.playCalls, 2, 'A retired failure must not block the same recording on the next play');
  assert.equal(f.a.paused, false);
  assert.equal(f.a._sukunRecordingKey, key);
  assert.equal(first.reason, 'recording-playback-failed');
  assert.equal(reader.snapshot().sourceKind, 'bundled');
  f.a.onended();
  assert.equal((await retry).ok, true);
  console.log(`${id}: the next explicit play retries the same source`);
}

(async () => {
  await verifyRetry('reading:yasin', 'bundled:r1065:yasin');
  await verifyRetry('reading:ayetelkursi', 'bundled:r1065:ayatul-kursi');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
