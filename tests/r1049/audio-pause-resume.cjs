'use strict';
// Actual playRecording, native journey, session Pause/Resume and slider handlers.
// Storage, media events and time are synthetic; this does not assert device audibility.
const assert=require('node:assert/strict');
const {harness,between}=require('../r1048/audio-volume-preview.cjs');
const results=[];
async function test(name,fn){try{await fn();results.push({name,passed:true})}catch(e){results.push({name,passed:false,error:e.message})}}
function fixture(){
 const h=harness();let now=100000,next=1;const intervals=new Map();
 h.c.Date.now=()=>now;h.c.setInterval=(fn)=>{const id=next++;intervals.set(id,fn);return id};h.c.clearInterval=id=>intervals.delete(id);
 Object.assign(h.c,{_kesintiVardi:false,_kesintiOsHoldAt:0});
 // Represent native EventTarget's once behavior, which the older general
 // media fixture intentionally omitted. Resume is a second playing event.
 const create=h.document.createElement.bind(h.document);
 h.document.createElement=tag=>{const a=create(tag);if(tag!=='audio')return a;
  const add=a.addEventListener.bind(a),remove=a.removeEventListener.bind(a),once=new Map();
  a.addEventListener=(type,fn,opt)=>{if(!opt?.once){add(type,fn);return;}const wrapped=event=>{remove(type,wrapped);once.delete(fn);fn.call(a,event)};once.set(fn,[type,wrapped]);add(type,wrapped)};
  a.removeEventListener=(type,fn)=>{const item=once.get(fn);if(item){remove(item[0],item[1]);once.delete(fn)}else remove(type,fn)};return a;
 };
 return {...h,tick(ms){now+=ms;for(const fn of [...intervals.values()])fn()},elapsed(ms){now+=ms},now:()=>now};
}
async function cleanup(h,a,p){h.c.sesDurdur('test-cleanup');await p;assert.equal(h.c.SES.ler.size,0);assert.equal(a._sukunRefreshVolume,null)}
(async()=>{
 for(const at of [0,6,12])for(const latest of [0,.5,.8])await test(`raw pause at ${at} ms then resume restores intended ${latest}`,async()=>{
  const h=fixture(),{a,p}=await h.start({step:.4,gain:1.5});await h.advance(at);h.c.sesDuraklat();
  // Set the user's preference without triggering a volume refresh. This also
  // covers a persisted/control-independent edit while this source is paused.
  h.c.ZVOL=latest;const source=a.src,position=a.currentTime;
  h.c.sesSurdur();a.dispatch('playing');await h.advance(40);
  assert(Math.abs(a.volume-latest*.4*1.5)<1e-12,`expected ${latest*.4*1.5}, got ${a.volume}`);
  assert.equal(a.src,source);assert.equal(a.currentTime,position);assert.equal(a.plays,2);
  await cleanup(h,a,p);
 });
 for(const native of [false,true])for(const hidden of [false,true])for(const tickWhilePaused of [false,true])await test(`${native?'native journey':'raw'} ${hidden?'hidden':'visible'} long pause survives ${tickWhilePaused?'pause tick':'throttled timers'}`,async()=>{
  const h=fixture();h.document.hidden=hidden;const {a,p}=await h.start({native});await h.advance(40);a.dispatch('playing');a.currentTime=.7;h.tick(1);
  h.c.sesDuraklat();const source=a.src,position=a.currentTime;
  if(tickWhilePaused){h.tick(30000);assert(h.c.SES.ler.has(a),'paused recording was retired by stalled watchdog')}
  else h.elapsed(30000);
  assert.equal(a.plays,1,'pause may not restart audio');assert.equal(a.paused,true);
  h.c.sesSurdur();a.dispatch('playing');h.tick(1);
  assert(h.c.SES.ler.has(a),'resume inherited the long paused watchdog deadline');
  assert.equal(a.src,source);assert.equal(a.currentTime,position);assert.equal(a.plays,2);
  // Freshly resumed real media movement retains completion authority.
  a.currentTime=1;h.tick(1000);a.dispatch('ended');const r=await p;assert.equal(r.ok,true);
  assert.equal(h.c.SES.ler.size,0);
 });
 for(const native of [false,true])for(const hidden of [false,true])await test(`${native?'native journey':'raw'} ${hidden?'hidden':'visible'} true advancing-state stall still fails`,async()=>{
  const h=fixture();h.document.hidden=hidden;const {a,p}=await h.start({native});await h.advance(40);h.tick(1);h.tick(hidden?24001:6501);
  const r=await p;assert.equal(r.ok,false);assert.equal(r.reason,'playback-stalled');assert.equal(h.c.SES.ler.size,0);assert.equal(a.paused,true);
 });
 for(const native of [false,true])await test(`${native?'native journey':'raw'} Stop during long pause remains terminal`,async()=>{
  const h=fixture(),{a,p}=await h.start({native});await h.advance(40);h.c.sesDuraklat();h.elapsed(30000);h.c.sesDurdur('user-stop');h.tick(1);h.c.sesSurdur();const r=await p;
  assert.equal(r.ok,false);assert.equal(r.reason,'user-stop');assert.equal(h.c.SES.ler.size,0);assert.equal(a.plays,1);
 });
 await test('raw retired onset cannot be restored by a late playing event',async()=>{
  const h=fixture(),{a,p}=await h.start({step:.4,gain:1.5});await h.advance(6);h.c.sesDuraklat();h.c.sesDurdur('user-stop');await p;const volume=a.volume;a.dispatch('playing');await h.advance(40);assert.equal(a.volume,volume);assert.equal(a.plays,1);
 });
 await test('raw resumed source preserves mute',async()=>{
  const h=fixture(),{a,p}=await h.start({step:.4,gain:1.5});await h.advance(6);h.c.sesDuraklat();a.muted=true;h.c.sesSurdur();a.dispatch('playing');await h.advance(40);assert.equal(a.muted,true);assert(Math.abs(a.volume-.48)<1e-12);await cleanup(h,a,p);
 });
 for(const kind of ['manager','backup','library'])for(const phase of ['analysis','handoff'])await test(`${kind} Pause cancels pending ${phase} before media start`,async()=>{
  const h=fixture();let finish;
  if(phase==='analysis')h.c.SukunRecordingQuality={analyse:()=>new Promise(r=>finish=r)};
  else h.c.sukunSoftStopRecordings=()=>new Promise(r=>finish=r);
  h.previewClick(kind);await h.flush();assert.equal(h.audios.length,0);h.c.sesDuraklat();finish(phase==='analysis'?{gain:1}:true);await h.flush();
  assert.equal(h.audios.length,0,'late prepared preview created audio');assert.equal(h.c.SES.ler.size,0);
 });
 for(const native of [false,true])await test(`${native?'native journey':'raw'} accepted preview Pause retains its same media attempt`,async()=>{
  const h=fixture();const p=h.c.sukunRecordingPreview('esma:0:nida','preview-phase',{backgroundNative:native});await h.flush();await h.advance(40);const a=h.audios.at(-1);assert(a);a.dispatch('playing');h.c.sesDuraklat();h.tick(30000);
  assert(h.c.SES.ler.has(a));h.c.sesSurdur();a.dispatch('playing');h.tick(1);a.currentTime=1;h.tick(1000);a.dispatch('ended');assert.equal(await p,true);assert.equal(a.plays,2);
 });
 for(const native of [false,true])await test(`${native?'native journey':'raw'} Pause retires a preview whose native start is still pending`,async()=>{
  const h=fixture();let accept;h.c.pendingMediaPlay={promise:new Promise(r=>accept=r)};let outcome;const p=h.c.sukunRecordingPreview('esma:0:nida','preview-pending',{backgroundNative:native}).then(v=>{outcome=v;return v});await h.flush();const a=h.audios.at(-1);assert(a);h.c.sesDuraklat();accept();await h.flush();assert.equal(outcome,false,'pending preview must settle as canceled');assert.equal(h.c.SES.ler.size,0);assert.equal(a.paused,true);assert.equal(a.plays,1);
 });
 await test('Stop still cancels pending analysis',async()=>{
  const h=fixture();let finish;h.c.SukunRecordingQuality={analyse:()=>new Promise(r=>finish=r)};h.previewClick('manager');await h.flush();h.c.sesDurdur('user-stop');finish({gain:1});await h.flush();assert.equal(h.audios.length,0);
 });
 for(const native of [false,true])for(const stale of ['selection','voice','intent'])await test(`${native?'native journey':'raw'} paused ${stale} change still retires old ownership`,async()=>{
  const h=fixture(),{a,p}=await h.start({native});await h.advance(40);a.dispatch('playing');h.c.sesDuraklat();
  if(stale==='selection')h.c.Z.idx++;if(stale==='voice')h.voiceChange();if(stale==='intent')h.c.AudioLife._userIntentSeq++;
  h.tick(1);assert.equal(h.c.SES.ler.has(a),false,'paused lifetime must still validate ownership');const r=await p;assert.equal(r.ok,false);assert.equal(r.reason,'stale-sequence');assert.equal(a.plays,1);
 });
 for(const native of [false,true])await test(`${native?'native journey':'raw'} repeated pause/resume resets each real resumed playing deadline`,async()=>{
  const h=fixture(),{a,p}=await h.start({native});await h.advance(40);a.dispatch('playing');a.currentTime=.2;h.tick(1);
  for(let i=0;i<3;i++){h.c.sesDuraklat();h.elapsed(30000);h.c.sesSurdur();a.dispatch('playing');h.tick(1);assert(h.c.SES.ler.has(a));a.currentTime+=.2;h.tick(1000)}
  assert.equal(a.plays,4);a.dispatch('ended');assert.equal((await p).ok,true);assert.equal(h.c.SES.ler.size,0);
 });
 for(const native of [false,true])for(const phase of ['analysis','first-play'])await test(`${native?'native journey':'raw'} direct reader Pause cancels nested dua pending ${phase}`,async()=>{
  const h=fixture();h.c.DUAREC={attempt:null};h.run(between('function duaRecBegin(id,onCancel){','function duaRecFailure(id){'));const attempt=h.c.duaRecBegin('test');let finish,outcome;
  h.c.SukunRecordingQuality={analyse:phase==='analysis'?()=>new Promise(r=>finish=r):async()=>({gain:1})};
  if(phase==='first-play')h.c.pendingMediaPlay={promise:new Promise(r=>finish=r)};
  const p=h.c.playRecording(new Blob(['synthetic'],{type:'audio/wav'}),'dua:test',{detail:true,resume:false,backgroundNative:native,isCurrent:attempt.current}).then(v=>{outcome=v;return v});await h.flush();const a=h.audios.at(-1);h.c.sesDuraklat();finish(phase==='analysis'?{gain:1}:undefined);await h.flush();
  assert.equal(outcome?.ok,false,'direct Pause must settle pending recording as canceled');
  if(phase==='analysis')assert.equal(h.audios.length,0);else{assert.equal(a.plays,1);assert.equal(a.paused,true)}
  assert.equal(h.c.SES.ler.size,0);await p;
 });
 await test('direct reader Pause fences actual duaRecPlay pending storage read',async()=>{
  const h=fixture(),clip=new Blob(['synthetic'],{type:'audio/wav'});h.c.DUAREC={attempt:null,defs:{test:{key:'dua:test'}},has:{test:true},blobCache:{},readError:{}};
  h.run(between('function duaRecBegin(id,onCancel){','function duaRecFailure(id){'));h.run(between('async function duaRecPlay(id,opt={}){','async function duaRecDelete(id){'));
  let read;h.c.duaRecAvailable=()=>true;h.c.duaRecSyncUI=()=>{};h.c.duaRecReadState=()=>new Promise(r=>read=r);
  let outcome;const attempt=h.c.duaRecBegin('test'),p=h.c.duaRecPlay('test',{isCurrent:attempt.current}).then(v=>{outcome=v;return v});h.c.sesDuraklat();read({ok:true,blob:clip});await h.flush();assert.equal(outcome,false,'pending storage read must settle as canceled');assert.equal(h.audios.length,0);await p;
 });
 const report={method:'Actual production handlers; controlled media, storage and timer events. No physical Android lock screen or audible device validation.',passed:results.filter(r=>r.passed).length,total:results.length,results};console.log(JSON.stringify(report,null,2));if(report.passed!==report.total)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
