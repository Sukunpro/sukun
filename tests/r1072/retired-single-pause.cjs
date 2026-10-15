'use strict';
// Production registry + mini pause + transport + navigation/session boundaries.
// Source-function harness controls spoken endpoints, browser clock and audio.
// No personal report or recording contents are part of this regression.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
process.argv[2]=root;
const {harness}=require('../r1047/frequency-pause-fixture.cjs');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const sessionSource=fs.readFileSync(path.join(root,'assets/runtime/session-r919.js'),'utf8');
const results=[];
const extract=(start,end)=>{const a=html.indexOf(start),b=html.indexOf(end,a);assert(a>=0&&b>a,'production boundary: '+start);return html.slice(a,b);};
const flush=async()=>{for(let i=0;i<30;i++)await Promise.resolve();};

async function fixture(options={}){
 const h=harness(),c=h.c,calls=h.calls;
 await h.advance(600);
 Object.assign(c.Z,{cat:'esma',idx:0,count:16,target:298,total:79000,devir:0,auto:true});
 c.queueMicrotask=queueMicrotask;c.location={search:''};c.URLSearchParams=URLSearchParams;
 c.ZIKIR={esma:{items:[{tr:'Synthetic A'},{tr:'Synthetic B'},{tr:'Synthetic C'}]},berhet:{items:[{},{}]}};
 c.SukunJourneyController={target:()=> 'single'};c.SukunSecretPolicy={unlocked:()=>true};c.SukunVoiceSettings={checkReady:()=>true};
 c.currentZikirState={snapshot:()=>({...c.Z,active:c.Z.auto,name:c.ZIKIR[c.Z.cat].items[c.Z.idx]?.tr||'Synthetic',length:3,session:{active:false,playing:false,paused:false}}),refresh(){}};
 c.SukunAudioTruth={snapshot:()=>({playing:c.Z.auto,paused:!!c.MINI.paused,source:c.Z.auto?'auto-zikir':'idle',owner:c.Z.auto?{type:'auto-zikir'}:null,life:{state:c.AudioLife.state||'idle'},issues:[]})};
 c.FR2={E:null,on:false};c.SukunBackgroundMix={snapshot:()=>({active:false,preparing:false,playing:false,prepared:false,state:'IDLE'})};
 c.AudioLife._userIntentSeq=0;c.AudioLife.snapshot=()=>({userIntentSeq:c.AudioLife._userIntentSeq,state:c.AudioLife.state,userPaused:c.AudioLife.userPaused});
 const markPlay=c.AudioLife.markUserPlay;
 c.AudioLife.markUserPlay=function(...args){this._userIntentSeq++;this._terminalIntent=false;return markPlay.apply(this,args);};
 c.AudioLife.reconcileUserPaused=function(value,reason){this.userPaused=!!value;calls.push(['life.reconcile',!!value,reason]);return !!value;};
 c.autoStart=()=>{calls.push('auto.start');c.Z.auto=true;c.Z.count++;return true;};
 c.autoStop=()=>{calls.push('auto.stop');c.Z.auto=false;return true;};
 c.SukunDirectZikirTransportR698={
  state:()=>({auto:c.Z.auto,paused:false,starting:false,cat:c.Z.cat,idx:c.Z.idx,count:c.Z.count,target:c.Z.target}),
  stop:()=>c.autoStop(),start:()=>c.autoStart(),primeGesture:()=>true,clearStale:()=>false
 };
 c.currentItems=()=>c.ZIKIR[c.Z.cat].items;c.stopZikirVoice=()=>calls.push('voice.stop');
 c.zHedefSecimeUyarla=c.renderZikir=c.zUI=c.persistZero=c.resetSpecialJourneys=()=>{};
 c.r639RouteJourneyNavigation=()=>false;c.SukunSectionIdentityCommit={commit(){}};
 h.run(extract('async function restartDirect(){','/* Smart-session navigation'),'production-direct-navigation');
 c.renderCats=c.saveSettings=c.secmeSesi=c.tozSac=()=>{};c.sukunTerkipAllowed=()=>true;
 const selection={},query=c.$;
 c.$=id=>({addEventListener(type,handler){selection[id]=handler;}});
 h.run(extract("$('#zCats').addEventListener('click'","$('#tapBtn').onclick=sukunManualRep;"),'production-native-selection');c.$=query;
 c.__SUKUN_FLOW_NAV_OPS__={navigateDirect:c.navigateDirect,restartDirect:c.restartDirect};
 const nav=html.match(/<script\b[^>]*id="r508-flow-navigation"[^>]*>([\s\S]*?)<\/script>/);assert(nav,'production flow navigation');h.run(nav[1],'production-flow-navigation');
 h.run(sessionSource,'production-session-boundary');
 if(options.frequency)c.FR.playing=true;
 if(options.secondary)c.FR2.E={retained:true};
 if(options.ambience)c.AMB.synthetic={retained:true};
 if(options.halo)c.VH={playing:{retained:true}};
 if(options.native)c.SukunBackgroundMix={snapshot:()=>({active:true,preparing:false,playing:false,prepared:true,state:'PAUSED'}),resume(){calls.push('background.resume');return true;}};
 if(options.provider)c.SukunAudioSessionRegistry.register('synthetic-reader',{getState:()=> 'playing',pause(){calls.push('reader.pause');this.getState=()=> 'paused';},resume(){calls.push('reader.resume');this.getState=()=> 'playing';},stop(){this.getState=()=> 'idle';}});
 c.SukunAudioSessionRegistry.pauseAll('ui:main');await flush();await h.advance(600);
 assert.equal(c.Z.auto,false,'production miniPause must stop the single scheduler');
 assert.equal(c.MINI.paused,true);assert.equal(c.MINI.wasAuto,true);
 assert.equal(c.SukunAudioSessionRegistry.aggregateSnapshot().paused,true);
 const startCalls=()=>calls.filter(x=>x==='auto.start').length;
 const soundCalls=()=>calls.filter(x=>x==='tts.resume'||x==='ctx.resume'||x==='auto.start').length;
 const requireApi=()=>assert.equal(typeof c.SukunAudioSessionRegistry.retireSinglePauseGate,'function','registry must expose canonical retired-single cleanup');
 const retire=reason=>{requireApi();return c.SukunAudioSessionRegistry.retireSinglePauseGate(reason);};
 const nativeSelect=(kind,index)=>selection[kind==='category'?'#zCats':'#zList']({target:{closest:()=>({dataset:kind==='category'?{c:index}:{i:String(index)}})}});
 return {...h,requireApi,retire,startCalls,soundCalls,nativeSelect};
}
async function test(name,work){try{await work();results.push({name,status:'PASS'});}catch(error){results.push({name,status:'FAIL',error:error.stack});}}

(async()=>{
 await test('Pure single global Pause → Next retires old capture; fresh Start is accepted once',async()=>{
  const h=await fixture();const c=h.c,total=c.Z.total,sounds=h.soundCalls();
  await c.navigateDirect(1);await flush();await h.advance(600);
  assert.equal(c.Z.idx,1);assert.equal(c.Z.count,0);assert.equal(c.Z.total,total);assert.equal(c.MINI.wasAuto,false);assert.equal(c.MINI.paused,false);
  assert.equal(c.SukunAudioSessionRegistry.aggregateSnapshot().paused,false);assert.equal(c.AudioLife.userPaused,false);assert.equal(h.soundCalls(),sounds,'retiring a selected name must not play any source');
  const out=await c.SukunSessionState.command('start');await flush();assert.equal(out.accepted,true);assert.equal(h.startCalls(),1);assert.equal(c.Z.auto,true);assert.equal(c.Z.idx,1);assert.equal(c.Z.count,1);
 });
 await test('Actual wheel/session Next after pure single global Pause reaches the selected dhikr navigation',async()=>{
  const h=await fixture(),c=h.c,sounds=h.soundCalls();const out=await c.SukunSessionState.command('next');await flush();await h.advance(600);
  assert.equal(out.accepted,true);assert.equal(c.Z.idx,1,'paused mix must not consume dhikr Next');assert.equal(c.MINI.wasAuto,false);assert.equal(c.MINI.paused,false);assert.equal(c.SukunAudioSessionRegistry.aggregateSnapshot().paused,false);assert.equal(h.soundCalls(),sounds);
  const start=await c.SukunSessionState.command('start');await flush();assert.equal(start.accepted,true);assert.equal(h.startCalls(),1);assert.equal(c.Z.idx,1);
 });
 for(const action of ['previous','restart'])await test(`Actual session ${action} retires captured single pause in the selected dhikr context`,async()=>{
  const h=await fixture(),c=h.c,sounds=h.soundCalls();const out=await c.SukunSessionState.command(action);await flush();await h.advance(600);
  assert.equal(out.accepted,true);assert.equal(c.Z.idx,action==='previous'?2:0);assert.equal(c.Z.count,0);assert.equal(c.MINI.wasAuto,false);assert.equal(c.MINI.paused,false);assert.equal(c.SukunAudioSessionRegistry.aggregateSnapshot().paused,false);assert.equal(h.soundCalls(),sounds);
 });
 for(const action of ['next','previous','restart'])await test(`Active smart-session ${action} retains its navigation authority despite an old single capture`,async()=>{
  const h=await fixture(),c=h.c,current=c.currentZikirState.snapshot;c.confirm=()=>true;
  c.currentZikirState.snapshot=()=>({...current(),session:{active:true,playing:false,paused:true,name:'Synthetic smart',stepIndex:0,stepTotal:2}});
  c.__SUKUN_FLOW_NAV_OPS__.navigateSmart=delta=>{h.calls.push(['smart.navigate',delta]);return true;};c.__SUKUN_FLOW_NAV_OPS__.restartSmart=()=>{h.calls.push('smart.restart');return true;};c.currentFlowState.refresh('fixture-smart-owner',true);
  const out=await c.SukunSessionState.command(action);await flush();await h.advance(600);assert.equal(out.accepted,true);assert.equal(c.Z.idx,0);assert.equal(c.Z.count,16);assert.equal(c.MINI.wasAuto,true);assert.equal(h.startCalls(),0);
  assert(action==='restart'?h.calls.includes('smart.restart'):h.calls.some(x=>Array.isArray(x)&&x[0]==='smart.navigate'&&x[1]===(action==='next'?1:-1)),'smart native endpoint receives the action');
 });
 await test('Pure single global Pause → local Finish clears orphan without sound/count change',async()=>{
  const h=await fixture();const c=h.c,count=c.Z.count,total=c.Z.total,sounds=h.soundCalls();
  const out=await c.SukunSessionState.command('stop');await flush();await h.advance(600);
  assert.equal(out.accepted,true);assert.equal(c.MINI.wasAuto,false);assert.equal(c.MINI.paused,false);assert.equal(c.AudioLife.userPaused,false);assert.equal(c.SukunAudioSessionRegistry.aggregateSnapshot().paused,false);
  assert.equal(c.Z.count,count);assert.equal(c.Z.total,total);assert.equal(h.soundCalls(),sounds);assert.notEqual(c.SukunSessionState.snapshot().phase,'PAUSED');
 });
 await test('Pure single Restart clears old capture and waits for explicit fresh Start',async()=>{
  const h=await fixture();const c=h.c,total=c.Z.total,sounds=h.soundCalls();await c.restartDirect();await flush();await h.advance(600);
  assert.equal(c.Z.idx,0);assert.equal(c.Z.count,0);assert.equal(c.Z.total,total);assert.equal(c.MINI.wasAuto,false);assert.equal(c.SukunAudioSessionRegistry.aggregateSnapshot().paused,false);assert.equal(h.soundCalls(),sounds);
 });
 for(const kind of ['name','category'])await test(`Native ${kind} selection retires the old capture without starting a voice`,async()=>{
  const h=await fixture(),c=h.c,total=c.Z.total,voiceStarts=()=>h.calls.filter(x=>x==='auto.start'||x==='tts.resume').length,sounds=voiceStarts();h.nativeSelect(kind,kind==='category'?'berhet':1);await flush();await h.advance(600);
  // Existing explicit name-selection ac()/selection chime may resume ctx;
  // retirement must never launch dhikr or replay paused speech.
  assert.equal(c.MINI.wasAuto,false);assert.equal(c.MINI.paused,false);assert.equal(c.SukunAudioSessionRegistry.aggregateSnapshot().paused,false);assert.equal(c.AudioLife.userPaused,false);assert.equal(c.Z.auto,false);assert.equal(c.Z.total,total);assert.equal(voiceStarts(),sounds);
  assert.equal(kind==='category'?c.Z.cat:c.Z.idx,kind==='category'?'berhet':1);
  const out=await c.SukunSessionState.command('start');await flush();assert.equal(out.accepted,true);assert.equal(h.startCalls(),1);
 });
 await test('Retirement is idempotent and cannot change a genuine same-selection global Pause',async()=>{
  const h=await fixture();h.requireApi();const c=h.c;
  const out=await c.SukunSessionState.command('resume');await flush();assert.equal(out.accepted,false);assert.equal(c.MINI.wasAuto,true);assert.equal(c.SukunAudioSessionRegistry.aggregateSnapshot().paused,true);
  h.retire('explicit-test-retirement');const sounds=h.soundCalls();h.retire('explicit-test-retirement-again');assert.equal(h.soundCalls(),sounds);assert.equal(c.MINI.wasAuto,false);assert.equal(c.SukunAudioSessionRegistry.aggregateSnapshot().paused,false);
 });
 for(const [name,options]of [['primary frequency',{frequency:true}],['secondary frequency',{secondary:true}],['ambience',{ambience:true}],['native background',{native:true}],['paused provider',{provider:true}],['Voice Halo',{halo:true}]]){
  await test(`${name}: Next retires only old single capture; global hold and deferred background Resume survive`,async()=>{
   const h=await fixture(options);const c=h.c,sounds=h.soundCalls();await c.navigateDirect(1);await flush();await h.advance(600);
   assert.equal(c.MINI.wasAuto,false);assert.equal(c.MINI.paused,true);assert.equal(c.SukunAudioSessionRegistry.aggregateSnapshot().paused,true);assert.equal(c.AudioLife.userPaused,true);assert.equal(h.soundCalls(),sounds);assert.equal(c.Z.auto,false);
   const out=await c.SukunSessionState.command('start');await flush();assert.equal(out.accepted,false,'local Start must retain independent global hold');
   c.SukunAudioSessionRegistry.resumeAll();await flush();await h.advance(600);assert.equal(h.startCalls(),0,'global Resume cannot start the retired name or the new selection');assert.equal(c.Z.auto,false);assert.equal(c.Z.idx,1);assert.equal(c.SukunAudioSessionRegistry.aggregateSnapshot().paused,false);
   assert.equal(c.ctx.state,'running','the original global Resume must still reach its captured mix');
   if(options.native)assert(h.calls.includes('background.resume'),'global Resume must reach the retained native background');
   if(options.provider)assert(h.calls.includes('reader.resume'),'global Resume must reach the retained paused reader');
  });
  await test(`${name}: local Finish preserves independent global pause`,async()=>{
   const h=await fixture(options);const c=h.c,count=c.Z.count,total=c.Z.total,sounds=h.soundCalls();await c.SukunSessionState.command('stop');await flush();await h.advance(600);
   assert.equal(c.MINI.wasAuto,false);assert.equal(c.MINI.paused,true);assert.equal(c.AudioLife.userPaused,true);assert.equal(c.SukunAudioSessionRegistry.aggregateSnapshot().paused,true);assert.equal(c.Z.count,count);assert.equal(c.Z.total,total);assert.equal(h.soundCalls(),sounds);
  });
  for(const kind of ['name','category'])await test(`${name}: native ${kind} selection preserves the real global background hold`,async()=>{
   const h=await fixture(options),c=h.c,sounds=h.soundCalls();h.nativeSelect(kind,kind==='category'?'berhet':1);await flush();await h.advance(600);
   assert.equal(c.MINI.wasAuto,false);assert.equal(c.MINI.paused,true);assert.equal(c.AudioLife.userPaused,true);assert.equal(c.SukunAudioSessionRegistry.aggregateSnapshot().paused,true);assert.equal(c.ctx.state,'suspended');assert.equal(c.Z.auto,false);assert.equal(h.soundCalls(),sounds,'selection cue must not resume a held shared graph');
   c.SukunAudioSessionRegistry.resumeAll();await flush();await h.advance(600);assert.equal(c.ctx.state,'running');assert.equal(c.Z.auto,false);assert.equal(h.startCalls(),0);assert.equal(c.SukunAudioSessionRegistry.aggregateSnapshot().paused,false);
   if(options.native)assert(h.calls.includes('background.resume'));if(options.provider)assert(h.calls.includes('reader.resume'));
  });
 }
 for(const failure of ['throwing-mix','malformed-mix','throwing-layers','unknown-layer','unknown-provider'])await test(`Unknown ${failure} fails closed without keeping a retired single restart`,async()=>{
  const h=await fixture();h.requireApi();const c=h.c,sounds=h.soundCalls();
  if(failure==='throwing-mix')c.SukunBackgroundMix.snapshot=()=>{throw Error('controlled snapshot failure');};
  if(failure==='malformed-mix')c.SukunBackgroundMix.snapshot=()=>null;
  if(failure==='throwing-layers')c.miniPlayingInfo=()=>{throw Error('controlled layers failure');};
  if(failure==='unknown-layer')c.miniPlayingInfo=()=>({active:true,tam:[{tur:'unknown'}]});
  if(failure==='unknown-provider')c.SukunAudioSessionRegistry.register('synthetic-unknown',{getState:()=> 'unknown'});
  h.retire('explicit-test-retirement');await flush();assert.equal(c.MINI.wasAuto,false);assert.equal(c.MINI.paused,true);assert.equal(c.SukunAudioSessionRegistry.aggregateSnapshot().paused,true);assert.equal(c.AudioLife.userPaused,true);assert.equal(h.soundCalls(),sounds);
 });
 await test('Retirement with no old single capture preserves any existing hold unchanged',async()=>{
  const h=await fixture({frequency:true});h.requireApi();const c=h.c;c.MINI.wasAuto=false;const before={paused:c.MINI.paused,aggregate:c.SukunAudioSessionRegistry.aggregateSnapshot().paused,userPaused:c.AudioLife.userPaused,sounds:h.soundCalls()};
  h.retire('explicit-test-no-single');assert.deepEqual({paused:c.MINI.paused,aggregate:c.SukunAudioSessionRegistry.aggregateSnapshot().paused,userPaused:c.AudioLife.userPaused,sounds:h.soundCalls()},before);
 });
 const failed=results.filter(x=>x.status==='FAIL');console.log(JSON.stringify({scope:'production source-function regression; controlled endpoints, not physical Android audio',total:results.length,passed:results.length-failed.length,failed:failed.length,results},null,2));if(failed.length)process.exitCode=1;
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
