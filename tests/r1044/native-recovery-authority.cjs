'use strict';
// Actual owner, journey caller, VoiceAttempt, SES cancellation and V2 transport.
// Browser-like pause mode queues events only on a real paused-state transition.
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||process.env.SUKUN_ROOT||path.join(__dirname,'../..'));
let header=fs.readFileSync(path.join(__dirname,'../r1043/background-interruption.cjs'),'utf8').split('const results=[];')[0];
header=header.replace('return{window,document,a,owner,events,jobs,fire,tick,claim,start,hide,visible,pause};','return{window,document,a,owner,events,jobs,fire,tick,claim,start,hide,visible,pause,context,media};');
const fixture=Function('require','__dirname',header+'\nreturn fixture;')(require,path.join(__dirname,'../r1043'));
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const journey=html.slice(html.indexOf('async function sukunJourneyNativeRecording('),html.indexOf('/* r1043: an accepted raw recording'));
const stops=html.slice(html.indexOf('function sesDuraklat('),html.indexOf('/* Bütün metin okuyucularını'));
const voice=html.slice(html.indexOf('window.SukunVoiceAttempt=Object.freeze('),html.indexOf('window.SukunRecordingFailure=(()=>'));
const transport=html.split('<script id="r648-lock-journey-transport-v2">')[1].split('</script>')[0];
const flush=async()=>{for(let i=0;i<10;i++)await Promise.resolve()};
const results=[];
async function test(name,fn){try{await fn();results.push({name,status:'PASS'})}catch(e){results.push({name,status:'FAIL',error:e.stack||e.message})}}
function setup({queued=true,withTransport=false}={}){
 const f=fixture(),c=f.context,a=f.a;
 if(queued)a.pause=function(){this.pauseCalls++;const changed=!this.paused;this.paused=true;if(changed)c.setTimeout(()=>f.fire(this,'pause'),0)};
 a.style={};a.dataset={};a.setAttribute=()=>{};a.load=()=>{a.currentSrc=a.src};a.currentTime=0;a.duration=3;a.playbackRate=1;
 f.document.createElement=()=>a;f.document.body={appendChild:()=>{}};f.document.getElementById=()=>({value:'100'});
 f.window.SukunTabOwner.snapshot=()=>({epoch:1,intent:1});f.window.AudioLife._userIntentSeq=1;
 f.raw={run:true,paused:false,i:1,rep:0,totalDone:0};
 f.window.ESMA99_SEYIR=f.raw;f.window.SukunEsma99Seyir={state:()=>f.raw};
 f.window.SukunForegroundArbiter={snapshot:()=>({owner:{id:'journey99',type:'journey99',identity:'journey99'},observed:{spokenOwners:['journey99']}})};
 Object.assign(c,{SES:{ad:null,ler:new Set()},RECPLAYING:false,KAYIT:{yankiMik:0,mekan:false},ZVOL:1,Z:{cat:'esma',idx:1,auto:false},
   URL:{createObjectURL:()=> 'blob:test',revokeObjectURL:()=>{}},sukunJourneyGapMs:()=>0,sukunRecordingKeyFrom:()=> 'esma:1:nida',r957Volume:x=>x==null?1:x,sukunVoiceOverlapGuard:()=>{},duaRecCancel:()=>{},
   setInterval:c.setTimeout,clearInterval:c.clearTimeout,navigator:{},localStorage:{getItem:()=>null,setItem:()=>{}}});
 const preview=html.match(/let _r1048RecordingPreviewSeq=[\s\S]*?(?=\/\* Kayıttan çalan sesi)/);if(preview)vm.runInContext(preview[0],c);vm.runInContext(voice+'\n'+journey+'\n'+stops+(withTransport?'\n'+transport:''),c);
 f.valid=true;
 f.begin=()=>c.sukunJourneyNativeRecording({size:10,type:'audio/webm'},'journey',{detail:true,isCurrent:f.window.SukunVoiceAttempt.capture({isCurrent:()=>f.valid})},null);
 f.drainPause=()=>f.tick(0);
 f.stop=()=>c.sesDurdur('test-cleanup');
 return f;
}
(async()=>{
 for(const queued of [false,true]){
  const eventMode=queued?'queued pause':'synchronous pause';
  await test(`Actual sesDurdur navigation cannot replay removed journey (${eventMode})`,async()=>{
   const f=setup({queued});const done=f.begin();await flush();assert.equal(f.a.playCalls,1);f.hide();f.valid=false;
   f.context.sesDurdur('navigation');f.drainPause();assert.equal((await done).reason,'navigation');assert.equal(f.context.SES.ler.has(f.a),false);f.tick(120);await flush();
   assert.equal(f.a.playCalls,1);assert.equal(f.a.paused,true);assert.equal(f.owner.snapshot().lockRecoveryPending,false);
  });
  await test(`Live production journey really recovers once (${eventMode})`,async()=>{
   const f=setup({queued});const done=f.begin();await flush();f.hide();f.pause();f.drainPause();assert.equal(f.owner.snapshot().lockRecoveryEligible,true);
   f.tick(120);await flush();assert.equal(f.a.playCalls,2);assert.equal(f.a.paused,false);assert.equal(f.context.SES.ler.has(f.a),true);
   f.pause();f.drainPause();f.tick(1300);await flush();assert.equal(f.a.playCalls,2);f.stop();await done;
  });
 }
 for(const kind of ['caller-token','voice-intent','selection','prepare-sequence','session-membership','finish-handler']){
  await test(`Delayed replay revalidates ${kind}`,async()=>{
   const f=setup();const done=f.begin();await flush();f.hide();f.pause();f.drainPause();assert.equal(f.owner.snapshot().lockRecoveryPending,true);
   const finish=f.a._sukunFinish;
   if(kind==='caller-token')f.valid=false;
   if(kind==='voice-intent')f.window.AudioLife._userIntentSeq++;
   if(kind==='selection')f.context.Z.idx++;
   if(kind==='prepare-sequence')f.window.__sukJourneyNative.prepareSeq++;
   if(kind==='session-membership')f.context.SES.ler.delete(f.a);
   if(kind==='finish-handler')f.a._sukunFinish=()=>{};
   f.tick(120);await flush();assert.equal(f.a.playCalls,1);assert.equal(f.a.paused,true);finish(false,'test-cleanup');await done;
  });
 }
 await test('App pause is retired before asynchronous pause dispatch',async()=>{
  const f=setup();const done=f.begin();await flush();f.hide();f.context.sesDuraklat();
  assert.equal(f.owner.snapshot().lockRecoveryEligible,false);f.drainPause();f.tick(120);await flush();assert.equal(f.a.playCalls,1);assert.equal(f.a.paused,true);f.stop();await done;
 });
 await test('App cancellation after a recovery was scheduled cancels it synchronously',async()=>{
  const f=setup();const done=f.begin();await flush();f.hide();f.pause();f.drainPause();assert.equal(f.owner.snapshot().lockRecoveryPending,true);
  f.context.sesUnut(f.a,'removed');assert.equal(f.owner.snapshot().lockRecoveryPending,false);f.tick(120);await flush();assert.equal(f.a.playCalls,1);await done;
 });
 await test('Actual lock V2 reclaims preserve current journey recovery authority',async()=>{
  const f=setup({withTransport:true});const done=f.begin();await flush();f.tick(0);
  const id=f.owner.snapshot().lease;assert.equal(f.window.SukunLockJourneyTransportV2.snapshot().active,true);assert.ok(f.a._r648Lease);assert.equal(f.a.loop,true);
  f.hide();f.tick(20);assert.equal(f.owner.snapshot().lease,id);f.pause();f.drainPause();f.tick(120);await flush();
  assert.equal(f.a.playCalls,2);assert.equal(f.a.paused,false);assert.equal(f.owner.snapshot().lease,id);assert.equal(f.window.SukunLockJourneyTransportV2.snapshot().playing,true);
  assert.equal(f.raw.rep,0);assert.equal(f.raw.totalDone,0);f.stop();await done;
 });
 await test('New visible attempt on same lease cannot inherit canceled authority, and old cleanup cannot retire it',async()=>{
  const f=setup();let oldAuthority,newAuthority;
  f.window.SukunBackgroundAudioOwner={...f.owner,claim(...args){if(args[3]){if(!oldAuthority)oldAuthority=args[3];else newAuthority=args[3]}return f.owner.claim(...args)}};
  const first=f.begin();await flush();const id=f.owner.snapshot().lease,oldFinish=f.a._sukunFinish;f.context.sesDurdur('navigation');await first;
  const second=f.begin();await flush();assert.equal(f.owner.snapshot().lease,id);assert.notEqual(oldAuthority,newAuthority);assert.equal(f.a.playCalls,2);
  f.drainPause();oldFinish(false,'late-cleanup');assert.equal(f.owner.holdRecovery(f.a,'stale-cleanup',id,oldAuthority),false);
  f.hide();f.pause();f.drainPause();f.tick(120);await flush();assert.equal(f.a.playCalls,3);assert.equal(f.a.paused,false);f.stop();await second;
 });
 await test('A canceled hidden same-source attempt cannot reopen the spent start lease',async()=>{
  const f=setup();const first=f.begin();await flush();f.hide();f.stop();await first;f.drainPause();
  const second=f.begin();await flush();assert.equal((await second).ok,false);f.tick(120);await flush();assert.equal(f.a.playCalls,1);assert.equal(f.a.paused,true);
 });
 await test('Rejected source stays blocked when a new caller presents the same URL',async()=>{
  const f=setup();f.a.mode='reject';const first=f.begin();await flush();assert.equal((await first).reason,'play-rejected');assert.equal(f.owner.snapshot().blocked,true);
  f.a.mode='playing';const second=f.begin();await flush();assert.equal((await second).ok,false);assert.equal(f.owner.snapshot().blocked,true);assert.equal(f.a.playCalls,1);
 });
 for(const kind of ['user-pause','terminal-stop','journey-pause','journey-stop','aggregate-pause','microphone','microphone-preparing','foreground-owner','foreground-observed','mini-pause','application-pause-stamp']){
  await test(`Independent ${kind} blocks scheduled production journey recovery`,async()=>{
   const f=setup();const done=f.begin();await flush();f.hide();f.pause();f.drainPause();
   if(kind==='user-pause')f.window.AudioLife.userPaused=true;
   if(kind==='terminal-stop')f.window.AudioLife._terminalIntent=true;
   if(kind==='journey-pause'||kind==='journey-stop')f.window.SukunJourneyAudioMachine={intentBlocked:()=>true};
   if(kind==='aggregate-pause')f.window.SukunAudioSessionRegistry={aggregateSnapshot:()=>({paused:true,reason:'ui:pause'})};
   if(kind==='microphone')f.window.SukunItemRecording={snapshot:()=>({phase:'recording',preparing:false})};
   if(kind==='microphone-preparing')f.window.SukunItemRecording={snapshot:()=>({phase:'permission',preparing:true})};
   if(kind==='foreground-owner')f.window.SukunForegroundArbiter={snapshot:()=>({owner:{id:'other',type:'journey28',identity:'journey28'},observed:{spokenOwners:['journey28']}})};
   if(kind==='foreground-observed')f.window.SukunForegroundArbiter={snapshot:()=>({owner:{id:'journey99',type:'journey99',identity:'journey99'},observed:{spokenOwners:['journey99','single']}})};
   if(kind==='mini-pause')f.a._miniDurdu=1;
   if(kind==='application-pause-stamp')f.a._sukunAppPauseAt=Date.now();
   f.tick(120);await flush();assert.equal(f.a.playCalls,1);assert.equal(f.a.paused,true);f.stop();await done;
  });
 }
 for(const foregroundType of ['auto-zikir','terkip',null]){
  await test(`A live ${foregroundType} native caller is not held by an old journey Stop`,async()=>{
   const f=setup();f.window.SukunForegroundArbiter={snapshot:()=>foregroundType?({owner:{id:foregroundType,type:foregroundType,identity:'terkip:test'},observed:{spokenOwners:[foregroundType]}}):null};
   f.window.SukunJourneyAudioMachine={intentBlocked:()=>true};
   const done=f.begin();await flush();f.hide();f.pause();f.drainPause();f.tick(120);await flush();assert.equal(f.a.playCalls,2);assert.equal(f.a.paused,false);f.stop();await done;
  });
 }
 await test('A pre-existing paused journey observation does not block accepted temporary solo recovery',async()=>{
  const f=setup();f.window.SukunForegroundArbiter={snapshot:()=>({owner:{id:'solo-1',type:'single',identity:'esma:1'},observed:{spokenOwners:['single','journey99']}})};
  f.window.SukunJourneyAudioMachine={intentBlocked:()=>true};const done=f.begin();await flush();f.hide();f.pause();f.drainPause();f.tick(120);await flush();assert.equal(f.a.playCalls,2);f.stop();await done;
 });
 await test('Tekke owner remains eligible and retains its explicit pause/release contract',async()=>{
  const f=fixture();const id=f.owner.claim('tekke-imge',f.a,'tekke-url');await f.owner.play(id);f.hide();f.pause();f.tick(120);await flush();assert.equal(f.a.playCalls,2);
  f.owner.userPause(id);f.pause();f.tick(120);assert.equal(f.a.playCalls,2);f.owner.release('tekke-imge','stop');assert.equal(f.owner.snapshot().active,false);
 });
 await test('Single native recovery does not require journey SES membership',async()=>{
  const f=fixture();f.context.SES={ler:new Set()};f.a._sukunLockEpoch=7;f.window.SukunForegroundArbiter={snapshot:()=>({owner:{id:'auto-1',type:'auto-zikir',identity:'esma:1'},observed:{spokenOwners:['auto-zikir']}})};
  await f.start();f.hide();f.pause();f.tick(120);await flush();assert.equal(f.a.playCalls,2);assert.equal(f.context.SES.ler.has(f.a),false);
 });
 await test('Changing a single native attempt epoch blocks retained-source recovery',async()=>{
  const f=fixture();f.a._sukunLockEpoch=1;await f.start();f.hide();f.pause();f.a._sukunLockEpoch++;f.tick(120);await flush();assert.equal(f.a.playCalls,1);
 });
 await test('Journey lease without its production caller authority cannot auto-recover',async()=>{
  const f=fixture();const id=f.owner.claim('journey',f.a,'retained-url');await f.owner.play(id);f.hide();f.pause();f.tick(120);await flush();assert.equal(f.a.playCalls,1);
 });
 const failed=results.filter(r=>r.status==='FAIL');console.log(JSON.stringify({root,total:results.length,passed:results.length-failed.length,failed:failed.length,scope:'Production-code event/timer fixtures; not a browser or physical phone/audible-output test.',results},null,2));if(failed.length)process.exitCode=1;
})();
