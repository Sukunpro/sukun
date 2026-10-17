'use strict';
// The real bundled Ya-Sin request is held only to expose its preparation seam.
// Entitlement is a labelled fixture; production readers and native media remain real.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {fixture,hash}=require('../r1064/browser-fixture.cjs');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const output=path.resolve(process.argv[3]||path.join(root,'qa-r1089/gate/state-browser.json'));
const report={suite:'r1089 independent-reader preparation and revoked gate state',checks:[],limitations:[
  'Exact production shell, portal and reader with native bundled Ya-Sin and invitation MP3, Classic/Feyz at390×844 in disposable Linux Chromium.',
  'A real same-origin Ya-Sin request is deliberately held to expose the existing preparation state. Native media methods, clocks, completions and AudioContext are not replaced or fabricated.',
  'Only a labelled entitlement adapter and standard fixture device-speech adapter are synthetic. Physical Samsung/Android locking, remote entitlement, audible recitation quality and full Ya-Sin completion are not measured.'
]};
let f,p,held,baseline;
function save(){report.total=report.checks.length;report.passed=report.checks.filter(x=>x.passed).length;report.allPassed=!!report.total&&report.total===report.passed;fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2));}
async function state(){return p.evaluate(()=>{
 const a=window.__sukJourneyNative?.a,v=window.__r1089Invitation;
 return{reader:SukunReadingAudioR1064.snapshot(),ownsCurrentDhikr:SukunReadingAudioR1064.ownsCurrentDhikr(),canonical:SukunSessionState.peek(),gate:SukunBerhetGate.snapshot(),voiceDisabled:document.querySelector('#sukunBerhetGate [data-act="voice"]')?.disabled,voiceText:document.querySelector('#sukunBerhetGate [data-act="voice"]')?.textContent,
  media:a?{src:a.currentSrc||a.src,key:a._sukunRecordingKey||a.dataset?.sukLockKey||'',time:a.currentTime,duration:a.duration,paused:a.paused,ended:a.ended,volume:a.volume,muted:a.muted,rate:a.playbackRate,dry:a._kuru?.gain?.value,wet:a._wet?.gain?.value,member:SES.ler.has(a)}:null,
  invitation:v?{src:v.currentSrc||v.src,time:v.currentTime,paused:v.paused,ended:v.ended,duration:v.duration}:null,
  invitationCalls:__r1064SpeechFixture.mediaLog.filter(x=>/\/invitation-tr\.mp3(?:[?#]|$)/.test(x.src||x.requestedSrc||'')),
  calls:a?__r1064SpeechFixture.mediaLog.filter(x=>x.src===a.src||x.requestedSrc===a.src):[],events:window.__r1089NativeEvents||[],speech:__r1064SpeechFixture.log.length,cancels:__r1064SpeechFixture.cancelLog.length,
  selected:{cat:zKat(),index:zIdx(),count:Z.count,target:Z.target,total:Z.total},smart:{playing:R170.Player.playing,paused:R170.Player.paused,token:R170.Player.token,index:R170.Player.i},settings:{echo:KAYIT.yankiMik,spatial:KAYIT.mekan,speaker:SPK.on,speakerVolume:SPK.vol,tick:Z.tick,vibration:Z.vib},access:{...__r1089Access}};
 });}
async function check(name,work){try{report.checks.push({name,passed:true,evidence:await work()});}catch(error){report.checks.push({name,passed:false,error:error.stack||String(error),state:await state().catch(()=>null)});}save();console.log(JSON.stringify({name,passed:report.checks.at(-1).passed}));}
async function idle(){await p.waitForFunction(()=>!SukunInteractionGateR732.active());await p.waitForTimeout(100);}
async function tap(selector){await idle();await p.locator(selector).click();await idle();}
async function openDoor(){const entry=p.locator('#r1080BerhetEntry');if(!await entry.isVisible()){const selector='#r986Sections [aria-controls="zmgOkumalar"]';if(await p.locator(selector).isVisible())await tap(selector);else await p.evaluate(()=>SukunPracticeUI.openSection('zmgOkumalar'));}await p.evaluate(()=>SukunBerhetGate.configure({adapter:__r1089Adapter}));await tap('#r1080BerhetEntry');await p.waitForFunction(()=>SukunBerhetGate.snapshot().phase==='ready');}
async function closeDoor(){await p.keyboard.press('Escape');await p.waitForFunction(()=>!SukunBerhetGate.snapshot().open);await p.waitForTimeout(150);}
function keepsReader(s,prior=baseline){
 // Verse/progress/time advance naturally; the reader's identity and transport
 // must stay fixed while a door action runs alongside the same native source.
 for(const key of ['version','id','title','kind','phase','content','source','sourceKind','part','total','reason','queue'])assert.deepEqual(s.reader[key],baseline.reader[key],'reader.'+key+' remains unchanged');
 for(const key of ['selected','smart','settings','speech','cancels','calls','events'])assert.deepEqual(s[key],baseline[key],key+' remains owned by the actual reader');
 assert(s.media&&s.media.member);for(const key of ['src','key','duration','volume','muted','rate','dry','wet','member'])assert.equal(s.media[key],baseline.media[key],key+' remains unchanged');
 assert.equal(s.media.paused,false);assert.equal(s.media.ended,false);assert(s.media.time>=prior.media.time&&s.media.time<s.media.duration);
}
function noOverlap(s){assert.equal(s.gate.invitation.playing,false);assert.equal(s.voiceDisabled,true);assert.equal(s.gate.audio.mix,.32);}
(async()=>{try{
 f=await fixture(root,{width:390,height:844});p=f.page;
 await p.evaluate(async()=>{
  NIYET.on=false;NIYET.spk=false;NIYET.devir=false;KAYIT.yankiMik=.17;KAYIT.mekan=false;Z.tick=false;Z.vib=false;
  await SukunVoiceSettings.setMode('auto');await SukunVoiceSettings.setContent('arabic');
  const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(...args){if(/\/invitation-tr\.mp3(?:[?#]|$)/.test(this.src))window.__r1089Invitation=this;return play.apply(this,args);};
  window.__r1089Access={grant:true,enters:0,ends:0};const a=__r1089Access;
  window.__r1089Adapter={isUnlocked:()=>a.grant,getLanguage:()=> 'tr',getContextText:()=>'',enter:()=>{a.enters++;},endSession:()=>{a.ends++;a.grant=false;}};
  window.SukunBerhetGateAccess=__r1089Adapter;SukunBerhetGate.configure({adapter:__r1089Adapter});
 });
 await tap('.tab[data-t="zkr"]');
 await check('Idle gate defaults to its own full-level effect bus',async()=>{await openDoor();await p.waitForFunction(()=>SukunBerhetGate.snapshot().audio.enabled);const s=await state();assert.equal(await p.evaluate(()=>SukunLayoutModes.current()),'classic');assert.equal(await p.evaluate(()=>SukunShellSkin.getAppearance()),'feyz');assert.equal(s.reader.phase,'idle');assert.equal(s.gate.audio.mix,1);assert.equal(s.voiceDisabled,false);return s;});
 await check('Idle invitation uses the real shipped MP3 and a native advancing clock',async()=>{await tap('#sukunBerhetGate [data-act="voice"]');await p.waitForFunction(()=>__r1089Invitation&&!__r1089Invitation.paused&&__r1089Invitation.currentTime>.1&&__r1089Invitation.readyState>=2);const s=await state();assert(s.gate.invitation.playing);assert(s.invitation.duration>1);assert.match(s.invitation.src,/invitation-tr\.mp3/);return s;});
 await f.context.route('**/assets/audio/arabic-r1065/yasin.mp3*',route=>{held=route;});
 await check('Independent modern reader preparation immediately retires only the owned invitation',async()=>{
  await p.evaluate(()=>{window.__r1089ReadingTask=SukunReadingAudioR1064.play({id:'reading:yasin',content:'arabic',source:'auto'});return true;});
  await p.waitForFunction(()=>SukunReadingAudioR1064.snapshot().phase==='preparing');
  for(let n=0;n<100&&!held;n++)await p.waitForTimeout(30);
  assert(held,'The genuine same-origin Ya-Sin request is held');
  await p.waitForFunction(()=>!SukunBerhetGate.snapshot().invitation.playing&&SukunBerhetGate.snapshot().audio.mix===.32);
  const s=await state();assert.equal(s.reader.phase,'preparing');assert.equal(s.ownsCurrentDhikr,false);assert.equal(s.canonical.phase,'IDLE');noOverlap(s);assert.equal(s.invitation.paused,true);assert.equal(s.invitation.time,0);return s;
 });
 await check('Reopening during canonical-IDLE preparation never admits a new invitation or shared TTS',async()=>{
  const before=await state();await closeDoor();await openDoor();const s=await state();
  assert.equal(s.reader.phase,'preparing');assert.equal(s.ownsCurrentDhikr,false);assert.equal(s.canonical.phase,'IDLE');noOverlap(s);
  assert.deepEqual(s.invitationCalls,before.invitationCalls);assert.equal(s.speech,before.speech);assert.equal(s.cancels,before.cancels);assert.deepEqual(s.settings,before.settings);return{before,after:s};
 });
 await check('Releasing the real request starts native bundled Ya-Sin with no invitation overlap',async()=>{
  const route=held;held=null;await route.continue();
  await p.waitForFunction(()=>SukunReadingAudioR1064.snapshot().phase==='playing'&&window.__sukJourneyNative?.a&&!__sukJourneyNative.a.paused&&__sukJourneyNative.a.currentTime>.2&&__sukJourneyNative.a.readyState>=2,null,{timeout:25000});
  await p.evaluate(()=>{window.__r1089NativeEvents=[];const a=__sukJourneyNative.a;for(const type of ['play','playing','pause','ended','seeking'])a.addEventListener(type,()=>__r1089NativeEvents.push({type,time:a.currentTime}));});
  baseline=await state();assert.equal(baseline.reader.sourceKind,'bundled');assert.equal(baseline.reader.id,'reading:yasin');assert(baseline.media.duration>1200);noOverlap(baseline);keepsReader(baseline);return baseline;
 });
 await check('Door replay and local mute preserve the native independent reader source, clock and settings',async()=>{
  await tap('#sukunBerhetGate [data-act="replay"]');await p.waitForFunction(()=>SukunBerhetGate.snapshot().phase==='ready');const replay=await state();keepsReader(replay);noOverlap(replay);
  await tap('#sbgAudioToggle');const muted=await state();keepsReader(muted,replay);assert.equal(muted.gate.audio.enabled,false);
  await tap('#sbgAudioToggle');await p.waitForFunction(()=>SukunBerhetGate.snapshot().audio.enabled);const enabled=await state();keepsReader(enabled,muted);noOverlap(enabled);return{replay,muted,enabled};
 });
 await check('Private-access revocation seals a ready door without stopping or replacing Ya-Sin',async()=>{
  await p.evaluate(()=>{__r1089Access.grant=false;window.dispatchEvent(new CustomEvent('sukun:secretaccesschange',{detail:{unlocked:false}}));});
  await p.waitForFunction(()=>SukunBerhetGate.snapshot().phase==='locking');const locking=await state();keepsReader(locking);assert.equal(locking.gate.reason,'revoked');assert.equal(locking.gate.authenticated,false);assert.equal(locking.gate.invitation.playing,false);
  assert.equal(await p.locator('#sbgEnter').count(),0);await p.waitForFunction(()=>SukunBerhetGate.snapshot().phase==='sealed');const sealed=await state();keepsReader(sealed,locking);assert.equal(sealed.gate.reason,'revoked');assert.equal(sealed.gate.authenticated,false);assert.equal(sealed.access.enters,0);assert.equal(sealed.access.ends,0);
  await closeDoor();const after=await state();keepsReader(after,sealed);assert.equal(after.gate.audio.voices||0,0);assert.equal(after.gate.audio.retiring||0,0);return{locking,sealed,after};
 });
 await check('Production source bytes stay exact; native playback advances without errors or fabricated completion',async()=>{
  const s=await state();keepsReader(s);assert(s.media.time>baseline.media.time+5);const e=f.evidence();assert.deepEqual(e.pageErrors,[]);assert.deepEqual(e.failedRequests,[]);assert(!e.consoleErrors.some(x=>/integrity|digest|syntaxerror|referenceerror|typeerror/i.test(x)),e.consoleErrors.join('\n'));
  for(const [name,row]of Object.entries(e.served))assert.equal(row.sha256,hash(fs.readFileSync(path.join(root,name))),'Production bytes changed during test '+name);
  return{elapsedNativeSeconds:s.media.time-baseline.media.time,servedFiles:Object.keys(e.served).length,hashes:Object.fromEntries(['nero.html','assets/berhetiyye-gate/portal-r1080.js','assets/runtime/reading-audio-r1064.js'].map(x=>[x,hash(fs.readFileSync(path.join(root,x)))]))};
 });
 report.browser=f.browser.version();
}catch(error){report.fatal=error.stack||String(error);if(p)report.lastState=await state().catch(()=>null);}
finally{if(p)await p.evaluate(()=>{SukunBerhetGate.close({fromHistory:true});SukunReadingAudioR1064.stop('r1089-test-finished');}).catch(()=>{});if(held)await held.abort().catch(()=>{});if(f)await f.close();save();console.log(JSON.stringify({passed:report.passed,total:report.total,output,fatal:report.fatal},null,2));if(!report.allPassed||report.fatal)process.exitCode=1;}
})();
