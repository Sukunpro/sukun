'use strict';
// The production prepare, handoff and media-ledger functions run against a
// synthetic recording. The controlled decode can finish late, fail or stall.
const assert = require('node:assert/strict');
const {fixture, cut, deferred} = require('../r1076/protective-original-contract.cjs');
const results = [];

function setup() {
  const h = fixture({cat:'berhet', index:16, duration:3, tempo:1});
  const c = h.c;
  const fx = deferred();
  const blob = new Blob(['synthetic frame data'], {type:'audio/wav'});
  Object.assign(c.Z, {count:49, total:49, target:154});
  Object.assign(c, {
    R1007_PREPARE_TIMEOUT:45000, r1007ReadRecording:async key => ({key, blob, revision:0}),
    r476ProbeDuration:async () => 3000, r953CadenceTrack:async () => null,
    r477RenderLockTrack:() => { h.renders++; return fx.promise; }
  });
  h.renders = 0;
  h.run(cut('function r476Prepare(){', 'function r1007ReadRecording('));
  return {...h, c, fx, renders:() => h.renders};
}
const packed = {url:'blob:packed-recording', sig:'selected-fx', cycleMs:3500,
  durationMs:3000, unitMediaSec:3.5, repeatCycles:12, playRate:1};

async function start(h, lockBeforeDeadline = false) {
  // Both visible start and lock share the live production prepare task.
  const foreground = h.c.r476Prepare();
  await h.flush();
  const firstStart = h.c.r476BeginHidden(true);
  if (lockBeforeDeadline) h.document.hidden = true;
  await h.advance(3001);
  assert.equal(await foreground, true);
  let hiddenStart = firstStart;
  if (!lockBeforeDeadline) {
    assert.equal(await firstStart, false, 'Before the pack is ready, use the visible fallback');
    h.document.hidden = true;
    hiddenStart = h.c.r476BeginHidden();
  }
  await h.flush();
  return {hiddenStart};
}
async function check(name, fn) {
  try { await fn(); results.push({name, passed:true}); }
  catch (err) { results.push({name, passed:false, error:String(err.message)}); }
}
(async () => {
  for (const lockBefore of [false,true]) {
    await check('Playable delayed source with lock '+(lockBefore ? 'before' : 'after')+' original deadline', async () => {
      const h = setup();
      const {hiddenStart} = await start(h, lockBefore);
      h.fx.resolve(packed);
      const ok = await hiddenStart;
      assert.equal(ok, true, 'Delayed native handoff failed: '+JSON.stringify(h.holds));
      assert.equal(h.renders(), 1);
      assert.equal(h.a.src, packed.url);
      assert.equal(h.a.plays, 1);
      assert.equal(h.holds.length, 0);
      assert.deepEqual([h.c.Z.count,h.c.Z.total], [49,49]);
      const loop = h.c._r476Hidden;
      await h.advance(5000);
      assert.equal(h.c.r838EarnedRepeats(loop), 0, 'Wall time must never credit a reading');
      h.a.duration = 42;
      h.a.currentTime = 3.5;
      await h.advance(3500);
      assert.equal(h.c.r838EarnedRepeats(loop), 1);
      assert.equal(h.c.r838EarnedRepeats(loop), 0, 'One media boundary cannot count twice');
    });
  }
  for (const change of ['stop','selection','owner','revision','voice']) {
    await check('Late completion cannot start the old recording after '+change, async () => {
      const h = setup();
      const {hiddenStart} = await start(h);
      if (change === 'stop') {
        h.c.Z.auto = false;
        h.c.r476CancelPrepare('stop');
        h.c._r1007HiddenStartSeq++;
      }
      if (change === 'selection') h.c.Z.idx++;
      if (change === 'owner') h.owner.intent++;
      if (change === 'voice') h.voiceChange();
      if (change === 'revision') h.c.REC_DB.revision = () => 1;
      h.fx.resolve(packed);
      assert.equal(await hiddenStart, false);
      assert.equal(h.a.plays || 0, 0);
      assert.equal(h.c._r476Hidden, null);
      assert.deepEqual([h.c.Z.count,h.c.Z.total], [49,49]);
    });
  }
  await check('Unusable original stays blocked when both pack paths fail', async () => {
    const h = setup();
    const {hiddenStart} = await start(h);
    h.fx.resolve(null);
    assert.equal(await hiddenStart, false);
    assert.equal(h.holds.at(-1)?.code, 'native-format-unavailable');
    assert.equal(h.a.plays || 0, 0);
    assert.equal(h.c.Z.count, 49);
  });
  await check('Hung hidden render times out; late completion cannot restart it', async () => {
    const h = setup();
    const {hiddenStart} = await start(h);
    await h.advance(45000);
    assert.equal(await hiddenStart, false);
    assert.equal(h.failures.at(-1)?.code, 'prepare-timeout');
    h.fx.resolve(packed);
    await h.flush();
    assert.equal(h.a.plays || 0, 0);
    assert.equal(h.c.Z.count, 49);
  });
  console.log(JSON.stringify({total:results.length, passed:results.filter(r => r.passed).length, results},null,2));
  if (results.some(r => !r.passed)) process.exitCode = 1;
})().catch(error => { console.error(error); process.exitCode = 1; });
