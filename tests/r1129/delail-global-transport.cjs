'use strict';
// The shipped registry, dock click/action, reading runtime, AudioLife intent
// methods, playRecording/native media path and SES transport run unchanged.
// DOM, provider bytes, native media/clock and unrelated audio engines are
// controlled seams. This does not claim physical Android/lock-screen playback.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const output=process.argv[3]&&path.resolve(process.argv[3]);
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const readerSource=fs.readFileSync(path.join(root,'assets/runtime/reading-audio-r1064.js'),'utf8');
const nativeFixturePath=path.join(root,'tests/r1048/audio-volume-preview.cjs');
// The existing helper binds its source root through argv[2], as this suite does.
const {harness:nativeHarness}=require(nativeFixturePath);
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
function between(start,end){const a=html.indexOf(start),b=html.indexOf(end,a);assert(a>=0&&b>a,start);return html.slice(a,b);}
function script(id){const marker='<script id="'+id+'">';return between(marker,'</script>').slice(marker.length);}
const registrySource=script('r454-audio-session-registry-runtime');
const transportSource=script('r698-transport-authority');
const dockSource=script('r588-single-owner-dock-runtime');
const dockHandler=dockSource.slice(dockSource.indexOf('function onClick(e)'),dockSource.indexOf('function setMode(next'));
const lifeSource=between('  setUserPaused(','  busy(){');
const originalCondition="if(AR?.pauseAll&&(state.auto||(source!=='main'&&!isDirectContext()&&safe(()=>AR.aggregateState?.())==='playing'))){";
const fixedCondition="if(AR?.pauseAll&&(state.auto||safe(()=>AR.aggregateState?.())==='playing')){";
const deferred=()=>{let resolve;const promise=new Promise(yes=>{resolve=yes});return{promise,resolve};};
const noop=()=>{};
function fixture({visibleZikr=false,pendingFetch=false,negativeControl=false}={}){
 const h=nativeHarness(),c=h.c,log=[],listeners=new Map(),classes=new Set(visibleZikr?['sukun-zikir-tab']:[]);
 const node=h.document.getElementById;
 const classList={contains:name=>classes.has(name),add(...names){names.forEach(name=>classes.add(name));},remove(...names){names.forEach(name=>classes.delete(name));},toggle(name,on){const next=on===undefined?!classes.has(name):!!on;next?classes.add(name):classes.delete(name);return next;}};
 Object.assign(c.document,{readyState:'loading',visibilityState:'visible'});
 Object.assign(c.document.body,{classList,dataset:{}});
 c.document.getElementById=id=>h.nodes.get(id)||null;
 for(const id of ['r588Play','r588Stop']){const element=node(id);element.closest=selector=>selector.split(',').some(part=>part.trim()==='#'+id)?element:null;}
 c.requestAnimationFrame=()=>1;c.cancelAnimationFrame=noop;
 c.addEventListener=(type,fn)=>{if(!listeners.has(type))listeners.set(type,new Set());listeners.get(type).add(fn);};
 c.removeEventListener=(type,fn)=>listeners.get(type)?.delete(fn);
 c.dispatchEvent=event=>{for(const fn of [...listeners.get(event.type)||[]])fn(event);return true;};
 c.navigator={};c.MINI={paused:false,wasAuto:false};c.FR={playing:false};c.AMB={};c.VH={playing:false};
 c.miniPlayingInfo=()=>({active:false,tam:[{tur:'okuyucu',ad:'Delail'}]});
 c.miniPause=()=>{log.push('unrelated-mix-pause');};c.miniResume=()=>{log.push('unrelated-mix-resume');};
 c.hardStopAll=()=>{log.push('mix-stop');c.sesDurdur('fixture-global-stop');return true;};
 c.SukunDirectZikirTransportR698={state:()=>({auto:false,paused:false,starting:false}),clearStale:noop,start(){log.push('direct-start');return true;},stop(){log.push('direct-stop');return true;}};
 c.currentZikirState={snapshot:()=>({active:false,auto:false,session:{active:false}})};
 c.SukunJourneyAudioMachine={intent:noop,pauseIntentActive:()=>false};
 c.SukunNowPlayingStore={refresh:noop};
 c.currentFlowState={refresh:noop,snapshot:()=>{const s=c.SukunReadingAudioR1064?.snapshot?.();return{active:['preparing','playing','paused'].includes(s?.phase),context:'delail',playing:s?.phase==='playing',paused:s?.phase==='paused',playback:{id:'reading-r1064',state:s?.phase||'idle'}};}};
 c.AudioLife={_userIntentSeq:0,_terminalIntent:false,_recoverSeq:0,_recoverReasons:new Set(),userPaused:false,_log:noop,set:noop,setOwner:noop};
 h.run('Object.assign(AudioLife,{'+lifeSource+'});');
 c.SukunVoiceSettings={capture:()=>()=>true,epoch:()=>0,getContent:()=> 'arabic',getMode:()=> 'auto',rememberContent:noop};
 c.SukunReadingPolicy={permissions:()=>({generic:false,personal:false}),unavailable:reason=>({ok:false,reason})};
 const entry={id:'reading:delail:acilis',kind:'delail',title:'Opening',recordingKeys:[]};
 c.SukunReadingSourcesR1064={get:id=>id===entry.id?entry:null};
 const fetch=deferred();let fetches=0;
 c.SukunBundledArabicR1065={find:async()=>{fetches++;if(pendingFetch)await fetch.promise;return{blob:new Blob(['controlled Arabic source bytes'],{type:'audio/mpeg'}),key:'bundled:r1128:delail-giles-acilis',bundled:true,preserveOriginal:true};}};
 c.SukunVoiceSource={set:noop,snapshot:()=>({kind:'recording',recordingOrigin:'bundled'})};c.sukunSourceSet=noop;
 h.run(registrySource);h.run(readerSource);
 const transport=negativeControl?transportSource.replace(fixedCondition,originalCondition):transportSource;
 if(negativeControl)assert(transport.includes(originalCondition),'negative control restores exact reported condition');
 h.run(transport);
 h.run('(()=>{const $=id=>document.getElementById(id);const legacyClick=()=>false;'+dockHandler+';window.fixtureDockClick=onClick;})();');
 const click=id=>c.fixtureDockClick({target:h.nodes.get(id),preventDefault:noop,stopPropagation:noop});
 const pause=()=>click('r588Play');
 const start=async()=>{const completion=c.SukunReadingAudioR1064.play({id:entry.id,content:'arabic',source:'auto'});await h.flush();return completion;};
 return{...h,c,log,click,pause,fetch,fetches:()=>fetches,start,reader:()=>c.SukunReadingAudioR1064.snapshot(),media:()=>c.__sukJourneyNative?.a,registry:c.SukunAudioSessionRegistry};
}
const results=[];
async function test(name,work){try{const evidence=await work();results.push({name,passed:true,...evidence&&{evidence}});}catch(error){results.push({name,passed:false,error:error.stack||String(error)});}}
async function started(options){const h=fixture(options);const completion=h.start();await h.flush();const a=h.media();assert(a,'actual native media element created');assert.equal(a.paused,false);assert.equal(h.reader().sourceKind,'bundled');assert(h.c.SES.ler.has(a));return{h,a,completion};}
async function cleanup(h){h.registry.stopAll();await h.flush();}
(async()=>{
 await test('Negative control: original dock condition starts direct zikr instead of pausing live Delail in journeys/zikr view',async()=>{
  const {h,a}=await started({visibleZikr:true,negativeControl:true});h.pause();await h.flush();
  assert(h.log.includes('direct-start'),'original source must reproduce incorrect direct start');assert.equal(a.paused,false);assert.equal(h.reader().phase,'playing');assert.equal(h.registry.aggregateSnapshot().paused,false);await cleanup(h);
  return{incorrectDirectStart:true,nativeMediaKeptPlaying:true};
 });
 for(const visibleZikr of [false,true])await test('Actual dock pauses and resumes the same Delail native element/time in '+(visibleZikr?'journeys/zikr':'reader')+' view',async()=>{
  const {h,a}=await started({visibleZikr});a.currentTime=37;const src=a.src,initialFetches=h.fetches(),elements=h.audios.length;
  h.pause();await h.flush();assert.equal(h.reader().phase,'paused');assert.equal(a.paused,true);assert(h.registry.aggregateSnapshot().providerIds.includes('reading-r1064'));assert(h.c.SES.ler.has(a));assert(!h.log.includes('direct-start'));
  h.pause();await h.flush();assert.equal(h.reader().phase,'playing');assert.equal(a.paused,false);assert.equal(h.media(),a);assert.equal(a.src,src);assert.equal(a.currentTime,37);assert.equal(h.fetches(),initialFetches);assert.equal(h.audios.length,elements);assert.equal(h.registry.aggregateSnapshot().paused,false);await cleanup(h);
  return{sameElement:true,continuedAtSeconds:37,bundleFetches:initialFetches};
 });
 await test('Global dock Stop retires modern reader and native owner; late callbacks and stale global Resume cannot revive it',async()=>{
  const {h,a}=await started({visibleZikr:true});const lateEnd=a.onended,latePlaying=[...(a.listeners.playing||[])];h.click('r588Stop');await h.flush();
  assert.equal(h.reader().phase,'idle');assert.equal(a.paused,true);assert(!h.c.SES.ler.has(a));const plays=a.plays;
  lateEnd?.();for(const fn of latePlaying)fn.call(a,{type:'playing'});h.registry.resumeAll();await h.flush();
  assert.equal(h.reader().phase,'idle');assert.equal(a.paused,true);assert.equal(a.plays,plays);assert.equal(h.fetches(),1);return{retired:true,lateCallbacksIgnored:true};
 });
 await test('Global Pause during asynchronous source preparation holds completed fetch until explicit Resume',async()=>{
  const h=fixture({visibleZikr:true,pendingFetch:true});void h.start();await h.flush();assert.equal(h.reader().phase,'preparing');assert.equal(h.audios.length,0);
  h.pause();await h.flush();assert.equal(h.reader().phase,'paused');h.fetch.resolve();await h.flush();assert.equal(h.audios.length,0,'completed fetch may not create/play media while paused');
  h.pause();await h.flush();assert.equal(h.reader().phase,'playing');assert.equal(h.media().paused,false);assert.equal(h.fetches(),1);await cleanup(h);
 });
 await test('Global Pause during source preparation followed by Stop prevents deferred source revival',async()=>{
  const h=fixture({visibleZikr:true,pendingFetch:true});void h.start();await h.flush();h.pause();h.click('r588Stop');h.fetch.resolve();await h.flush();
  assert.equal(h.reader().phase,'idle');assert.equal(h.audios.length,0);assert.equal(h.registry.aggregateSnapshot().paused,false);
 });
 await test('Global Resume restores captured Delail while a separately paused provider remains paused',async()=>{
  const {h,a}=await started({visibleZikr:true});let phase='paused',resumeCalls=0;
  h.registry.register('independent-paused',{getState:()=>phase,pause:()=>{phase='paused';},resume:()=>{resumeCalls++;phase='playing';},stop:()=>{phase='idle';}});
  h.pause();await h.flush();assert(!h.registry.aggregateSnapshot().providerIds.includes('independent-paused'));h.pause();await h.flush();
  assert.equal(h.reader().phase,'playing');assert.equal(a.paused,false);assert.equal(phase,'paused');assert.equal(resumeCalls,0);await cleanup(h);
 });
 await test('Local wheel/main Play still starts selected zikr without sending unrelated audio a global Pause',async()=>{
  const h=fixture({visibleZikr:true});let phase='playing',pauses=0;
  h.registry.register('independent-playing',{getState:()=>phase,pause:()=>{pauses++;phase='paused';},stop:()=>{phase='idle';}});
  assert.equal(h.c.SukunR698Transport.playPause('main'),true);assert(h.log.includes('direct-start'));assert.equal(pauses,0);assert.equal(phase,'playing');assert.equal(h.registry.aggregateSnapshot().paused,false);await cleanup(h);
 });
 const report={suite:'Delail global dock/native transport',method:'Exact shipped registry, dock onClick and transport, modern reader, AudioLife pause/play intent methods, playRecording, native recording and SES pause/resume/stop. Synthetic DOM/media/clock/source bytes and unrelated engine endpoints; no physical-device/audio acceptance.',passed:results.filter(item=>item.passed).length,total:results.length,allPassed:results.every(item=>item.passed),sourceHashes:{html:hash(html),reader:hash(readerSource),registry:hash(registrySource),transport:hash(transportSource),dockHandler:hash(dockHandler),nativeFixture:hash(fs.readFileSync(nativeFixturePath))},results};
 if(output){fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');}
 console.log(JSON.stringify(report,null,2));if(!report.allPassed)process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1;});
