'use strict';
// Native production recording/clock exercise. Only the explicitly labelled
// entitlement adapter is synthetic; native media/audio methods keep their work.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const {fixture, hash} = require('../r1064/browser-fixture.cjs');
const root = path.resolve(process.argv[2] || path.join(__dirname, '../..'));
const output = path.resolve(process.argv[3] || path.join(__dirname, 'evidence/gate-audio-browser.json'));
const invitationPath = 'assets/berhetiyye-gate/invitation-tr.mp3';
const invitationDuration = Number(execFileSync('ffprobe', ['-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1', path.join(root, invitationPath)], {encoding:'utf8'}).trim());
assert(invitationDuration > 0 && Number.isFinite(invitationDuration));
const report = {suite:'r1088 default door effects and exclusive recitation isolation', checks:[], invitation:{path:invitationPath,sha256:hash(fs.readFileSync(path.join(root,invitationPath))),duration:invitationDuration}, limitations:[
  'Disposable Linux Chromium 390×844, Classic/Feyz. The actual shipped 128-second Ayatul MP3 is observed during an incomplete first repeat. No playback clock, completion, native media transport or AudioContext method is replaced with a fake.',
  'A labelled synthetic entitlement adapter provides successful/wrong credentials and door-session grant/revocation only. Real remote entitlement is not measured.',
  'The existing speech fixture controls device TTS; the tested recitation and invitation are real shipped MP3 files. Physical Samsung/Android locking, perceptual loudness and audible recitation quality are not measured.',
  'No service worker, microphone, user profile or personal recording is involved. The invitation observer calls through to the existing original native play observer.'
]};
let f, p, baseline;
function save() {
  report.total=report.checks.length; report.passed=report.checks.filter(c=>c.passed).length;
  report.allPassed=!!report.total && report.passed===report.total;
  fs.mkdirSync(path.dirname(output), {recursive:true}); fs.writeFileSync(output,JSON.stringify(report,null,2));
}
async function state() {
  return p.evaluate(()=>{
    const a=window.__r1088NativeAudio, v=window.__r1088InvitationAudio;
    return {
      gate:SukunBerhetGate.snapshot(),
      invitation:v?{time:v.currentTime,duration:v.duration,paused:v.paused,ended:v.ended,ready:v.readyState,volume:v.volume,src:v.currentSrc||v.src}:null,
      invitationCalls:__r1064SpeechFixture.mediaLog.filter(r=>/\/invitation-tr\.mp3(?:[?#]|$)/.test(r.src||r.requestedSrc||'')),
      preferences:JSON.parse(localStorage.getItem('sukun.berhetGate.presentation.v1')||'{}'),
      theme:SukunSceneEngine.snapshot().selectionTheme.family,
      selected:{cat:zKat(),index:zIdx()},
      current:{source:currentZikirState.snapshot().source,target:currentZikirState.snapshot().target,count:currentZikirState.snapshot().count},
      total:Z.total,
      settings:{speaker:SPK.on,speakerVolume:SPK.vol,closed:ZA.kapali,echo:KAYIT.yankiMik,spatial:KAYIT.mekan,tick:Z.tick,vibration:Z.vib},
      smart:{playing:R170.Player.playing,paused:R170.Player.paused,token:R170.Player.token,index:R170.Player.i,completed:+R170.Player._r982CompletedReps||0,repeatIndex:R170.Player.repeatIndex,repeatTotal:R170.Player.repeatTotal,queue:R170.Player.queue.map(({type,cat,idx,reps,repeatMode,protectionPlan})=>({type,cat,idx,reps,repeatMode,protectionPlan}))},
      media:a?{sameElement:[...SES.ler].includes(a),src:a.src,currentSrc:a.currentSrc,key:a._sukunRecordingKey||'',time:a.currentTime,duration:a.duration,paused:a.paused,ended:a.ended,rate:a.playbackRate,volume:a.volume,muted:a.muted,dry:a._kuru?.gain?.value,wet:a._wet?.gain?.value,master:typeof master==='undefined'?null:master?.gain?.value}:null,
      calls:a?__r1064SpeechFixture.mediaLog.filter(r=>r.src===a.src||r.requestedSrc===a.src):[],
      events:window.__r1088NativeEvents||[],speech:__r1064SpeechFixture.log.length,cancels:__r1064SpeechFixture.cancelLog.length
    };
  });
}
async function check(name,fn) {
  try { report.checks.push({name,passed:true,evidence:await fn()}); }
  catch(error) { report.checks.push({name,passed:false,error:error.stack||String(error),state:await state().catch(()=>null)}); }
  save(); console.log(JSON.stringify({name,passed:report.checks.at(-1).passed}));
}
async function idle() { await p.waitForFunction(()=>!SukunInteractionGateR732.active()); await p.waitForTimeout(100); }
async function tap(selector) { await idle(); await p.locator(selector).click(); await idle(); }
async function phase(value) { await p.waitForFunction(value=>SukunBerhetGate.snapshot().phase===value,value); }
async function closeDoor() { await p.keyboard.press('Escape'); await p.waitForFunction(()=>!SukunBerhetGate.snapshot().open); await p.waitForTimeout(120); }
async function configureObservation() {
  await p.evaluate(()=>{
    const observedPlay=HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play=function(...args) {
      if(/\/invitation-tr\.mp3(?:[?#]|$)/.test(this.src))window.__r1088InvitationAudio=this;
      return observedPlay.apply(this,args);
    };
    window.__r1088Access={grant:false,member:true,commit:0,end:0};
    const access=__r1088Access;
    window.__r1088Adapter={
      isUnlocked:()=>access.grant,verify:value=>Promise.resolve({ok:value==='fixture-valid'}),
      sessionOpened:({signal})=>{if(!signal.aborted){access.grant=true;access.commit++;}},
      enter:()=>{},endSession:()=>{access.grant=false;access.end++;}
    };
    window.SukunBerhetGateAccess=__r1088Adapter;
    SukunBerhetGate.configure({adapter:__r1088Adapter});
  });
}
async function openDoor() {
  const entry=p.locator('#r1080BerhetEntry');
  if(!await entry.isVisible()) {
    const nav=p.locator('#r986Sections [aria-controls="zmgOkumalar"]');
    if(await nav.isVisible())await tap('#r986Sections [aria-controls="zmgOkumalar"]');
    else await p.evaluate(()=>SukunPracticeUI.openSection('zmgOkumalar'));
  }
  await entry.waitFor({state:'visible'});
  await p.evaluate(()=>SukunBerhetGate.configure({adapter:__r1088Adapter}));
  await tap('#r1080BerhetEntry');
}
function continues(s,prior=baseline) {
  for(const key of ['theme','selected','current','total','settings','smart','speech','cancels'])assert.deepEqual(s[key],baseline[key],key+' remains owned by the running recitation');
  assert(s.media && s.media.sameElement);
  for(const key of ['src','currentSrc','key','duration','rate','volume','muted','dry','wet','master'])assert.equal(s.media[key],baseline.media[key],key+' remains unchanged');
  assert.equal(s.media.paused,false); assert.equal(s.media.ended,false);
  assert(s.media.time>=prior.media.time && s.media.time<s.media.duration);
  assert.deepEqual(s.calls,baseline.calls,'Door does not play or pause the current recitation');
  assert.deepEqual(s.events,baseline.events,'Door causes no native recitation transport event');
}
function mixed(s) {
  assert.equal(s.gate.audio.enabled,true);
  assert(Math.abs(s.gate.audio.mix-.32)<1e-6,'Only the door bus is reduced while recitation is active');
}
function verifyServed() {
  const evidence=f.evidence();
  assert.deepEqual(evidence.pageErrors,[]);
  assert(!evidence.consoleErrors.some(x=>/integrity|digest|syntaxerror|referenceerror|typeerror/i.test(x)),evidence.consoleErrors.join('\n'));
  assert.deepEqual(evidence.failedRequests,[]);
  for(const [name,row]of Object.entries(evidence.served))assert.equal(row.sha256,hash(fs.readFileSync(path.join(root,name))),'Production bytes changed during test: '+name);
  return {files:Object.keys(evidence.served).length,failed:evidence.failedRequests,source:hash(fs.readFileSync(path.join(root,'nero.html'))),audio:hash(fs.readFileSync(path.join(root,'assets/berhetiyye-gate/audio-r1080.js'))),portal:hash(fs.readFileSync(path.join(root,'assets/berhetiyye-gate/portal-r1080.js')))};
}
(async()=>{try {
  f=await fixture(root,{width:390,height:844}); p=f.page;
  assert(await p.evaluate(()=>!!window.SukunBerhetGate),'The final production shell loads the portal');
  await configureObservation();
  await tap('.tab[data-t="zkr"]');
  await check('A fresh door opens with effects on after the entry gesture',async()=>{
    await openDoor(); await p.waitForFunction(()=>SukunBerhetGate.snapshot().audio.enabled);
    const s=await state(); assert.equal(s.gate.audio.available,true);assert.equal(s.gate.audio.ready,true);
    assert.equal(s.gate.audio.mix,1); assert.equal(await p.locator('#sbgAudioToggle').getAttribute('aria-pressed'),'true');return s;
  });
  await check('Explicit mute survives closing and reopening',async()=>{
    await tap('#sbgAudioToggle');assert.equal((await state()).gate.audio.enabled,false);
    await closeDoor();await openDoor();await p.waitForTimeout(150);const s=await state();assert.equal(s.gate.audio.enabled,false);return s;
  });
  await check('Explicit mute survives a real reload and can be enabled again',async()=>{
    await closeDoor();await p.reload({waitUntil:'load'});await p.waitForFunction(()=>!!window.SukunBerhetGate);await p.waitForTimeout(1000);await configureObservation();await tap('.tab[data-t="zkr"]');
    await openDoor();assert.equal((await state()).gate.audio.enabled,false);
    await tap('#sbgAudioToggle');await p.waitForFunction(()=>SukunBerhetGate.snapshot().audio.enabled);const s=await state();assert.equal(s.gate.audio.mix,1);await closeDoor();return s;
  });
  await p.evaluate(async()=>{
    NIYET.on=false;NIYET.spk=false;NIYET.devir=false;ZA.kapali=true;Z.tick=false;Z.vib=false;Z.adv=false;
    KAYIT.yankiMik=.17;KAYIT.mekan=false;
    await SukunVoiceSettings.setMode('auto');await SukunVoiceSettings.setContent('legacy');
    SPK.on=true;SukunR698VoiceIntent.explicit(true);
  });
  const selected=await p.evaluate(()=>SukunSessionState.command('select',{mode:'koruma',index:4,journeyKind:'single'}));assert.equal(selected.accepted,true);await idle();
  if(await p.locator('#r1078PlanOpen').getAttribute('aria-expanded')!=='true')await tap('#r1078PlanOpen');
  await tap('#r1078PlanPrepare');await tap('#r170StartSession');
  await p.waitForFunction(()=>R170.Player.playing&&[...SES.ler].some(a=>a._sukunRecordingKey==='bundled:r1065:ayatul-kursi'&&!a.paused&&!a.ended&&a.currentTime>.2&&a.duration>128),null,{timeout:15000});
  await p.evaluate(()=>{
    window.__r1088NativeAudio=[...SES.ler].find(a=>a._sukunRecordingKey==='bundled:r1065:ayatul-kursi'&&!a.paused&&!a.ended);
    window.__r1088NativeEvents=[];
    for(const type of ['play','playing','pause','ended'])__r1088NativeAudio.addEventListener(type,()=>__r1088NativeEvents.push({type,time:__r1088NativeAudio.currentTime}));
  });
  baseline=await state();
  await check('Actual 128-second bundled original starts through the smart player',async()=>{
    assert.equal(await p.evaluate(()=>SukunLayoutModes.current()),'classic');assert.equal(await p.evaluate(()=>SukunShellSkin.getAppearance()),'feyz');
    assert.equal(baseline.smart.playing,true);assert.equal(baseline.smart.paused,false);assert.equal(baseline.current.count,0);assert.equal(baseline.current.target,7);assert.equal(baseline.current.source,'smart');
    assert(baseline.media.duration>128&&baseline.media.duration<129);assert.equal(baseline.media.key,'bundled:r1065:ayatul-kursi');continues(baseline);return baseline;
  });
  await check('Default-on door and knock preserve the same source, native clock, token and gains',async()=>{
    await openDoor();await p.waitForFunction(()=>SukunBerhetGate.snapshot().audio.enabled);await tap('#sukunBerhetGate [data-act="knock"]');await p.waitForSelector('#sbgPassword');
    const s=await state();continues(s);mixed(s);assert(s.media.time>baseline.media.time);return s;
  });
  await check('Successful mechanical sequence remains quietly mixed on its own bus',async()=>{
    await p.locator('#sbgPassword').fill('fixture-valid');await p.locator('#sbgPassword').press('Enter');await phase('unlocking');const unlock=await state();continues(unlock);mixed(unlock);
    await phase('opening');const opening=await state();continues(opening,unlock);mixed(opening);
    await phase('ready');const ready=await state();continues(ready,opening);mixed(ready);
    assert(ready.media.time-unlock.media.time>=4);return{unlock,opening,ready};
  });
  await check('Spoken invitation cannot overlap a recitation; no extra media or TTS is started',async()=>{
    assert.equal((await state()).gate.invitation.available,true);
    const button=p.locator('#sukunBerhetGate [data-act="voice"]');assert.equal(await button.count(),1);
    const before=await state();
    if(await button.isEnabled())await tap('#sukunBerhetGate [data-act="voice"]');
    const after=await state();continues(after,before);mixed(after);
    assert.equal(after.gate.invitation.playing,false);assert.deepEqual(after.invitationCalls,before.invitationCalls);
    assert.match(await p.locator('#sukunBerhetGate').innerText(),/okuma|zikir|reading|dhikr/i);return{before,after,voiceDisabled:!await button.isEnabled()};
  });
  await check('Door volume and mute never change recitation gain, echo, count or transport',async()=>{
    await p.locator('#sbgAudioLevel').focus();await p.keyboard.press('Home');for(let i=0;i<4;i++)await p.keyboard.press('ArrowRight');
    const volume=await state();continues(volume);mixed(volume);assert(Math.abs(volume.gate.audio.volume-.2)<.001);
    await tap('#sbgAudioToggle');const muted=await state();continues(muted,volume);assert.equal(muted.gate.audio.enabled,false);
    await tap('#sbgAudioToggle');await p.waitForFunction(()=>SukunBerhetGate.snapshot().audio.enabled);const enabled=await state();continues(enabled,muted);mixed(enabled);return{volume,muted,enabled};
  });
  await check('Closing releases only door effects and keeps its explicit preference',async()=>{
    await closeDoor();const s=await state();continues(s);assert.equal(s.gate.audio.voices||0,0);assert.equal(s.gate.audio.retiring||0,0);assert.equal(s.gate.invitation.playing,false);
    assert.equal(await p.evaluate(()=>__r1088Access.grant),true);return s;
  });
  await check('Lock-and-exit seals and releases only the door grant',async()=>{
    await openDoor();await phase('ready');await tap('#sukunBerhetGate [data-act="lock-exit"]');await phase('closing');const closing=await state();continues(closing);mixed(closing);
    await p.waitForFunction(()=>!SukunBerhetGate.snapshot().open);await p.waitForTimeout(100);const closed=await state();continues(closed,closing);
    assert.equal(await p.evaluate(()=>__r1088Access.grant),false);assert.equal(await p.evaluate(()=>__r1088Access.member),true);return{closing,closed};
  });
  await check('Wrong-password impact and sadness play without touching ongoing protective audio',async()=>{
    await openDoor();await p.waitForFunction(()=>SukunBerhetGate.snapshot().audio.enabled);await tap('#sukunBerhetGate [data-act="knock"]');await p.waitForSelector('#sbgPassword');
    await p.locator('#sbgPassword').fill('fixture-wrong');await p.locator('#sbgPassword').press('Enter');await phase('locking');const locking=await state();continues(locking);mixed(locking);assert.equal(locking.gate.audio.cue,'rejected');
    await p.waitForTimeout(1250);const impact=await state();continues(impact,locking);mixed(impact);assert.equal(impact.gate.audio.cue,'rejected');
    await phase('sealed');const sealed=await state();continues(sealed,impact);mixed(sealed);assert.equal(sealed.gate.reason,'wrong');assert.equal(sealed.gate.audio.cue,'sadness');
    await closeDoor();await p.waitForTimeout(300);const after=await state();continues(after,sealed);assert.equal(after.gate.audio.voices||0,0);assert.equal(after.gate.audio.retiring||0,0);return{locking,impact,sealed,after};
  });
  await check('Incomplete native playback advances without fabricated progress or runtime failures',async()=>{
    const s=await state();continues(s);assert(s.media.time>baseline.media.time+10);assert.equal(s.smart.completed,0);return{elapsed:s.media.time-baseline.media.time,...verifyServed()};
  });
  await check('Idle invitation is genuine native MP3, then a new recitation retires only that invitation',async()=>{
    await p.evaluate(()=>PlaybackController.stop('smart-session'));await p.waitForFunction(()=>!R170.Player.playing&&!R170.Player.paused);
    await p.evaluate(()=>{__r1088Access.grant=true;});await openDoor();
    // A previous wrong-password locally locks the door; perform fresh verification.
    if((await state()).gate.phase!=='opening'&&(await state()).gate.phase!=='ready') {
      const knock=p.locator('#sbgKnock');await p.waitForFunction(()=>{const b=document.getElementById('sbgKnock');return b&&!b.disabled;},null,{timeout:12000});await knock.click();await p.waitForSelector('#sbgPassword');await p.locator('#sbgPassword').fill('fixture-valid');await p.locator('#sbgPassword').press('Enter');
    }
    await phase('ready');await p.waitForFunction(()=>SukunBerhetGate.snapshot().audio.mix===1);
    await tap('#sukunBerhetGate [data-act="voice"]');await p.waitForFunction(()=>__r1088InvitationAudio&&!__r1088InvitationAudio.paused&&__r1088InvitationAudio.currentTime>.1&&__r1088InvitationAudio.readyState>=2);
    const playing=await state();assert.equal(playing.gate.invitation.playing,true);assert(Math.abs(playing.invitation.duration-invitationDuration)<.2);
    assert.match(playing.invitation.src,/invitation-tr\.mp3/);assert(Math.abs(playing.invitation.volume-.2)<.001);
    await p.evaluate(()=>PlaybackController.play('smart-session'));
    await p.waitForFunction(()=>R170.Player.playing&&[...SES.ler].some(a=>a._sukunRecordingKey==='bundled:r1065:ayatul-kursi'&&!a.paused&&!a.ended&&a.currentTime>.1));
    await p.waitForFunction(()=>!SukunBerhetGate.snapshot().invitation.playing&&SukunBerhetGate.snapshot().audio.mix===.32);
    const interrupted=await state();assert.equal(interrupted.invitation.paused,true);assert.equal(interrupted.invitation.time,0);assert.equal(interrupted.gate.invitation.playing,false);
    const active=await p.evaluate(()=>[...SES.ler].filter(a=>!a.paused&&!a.ended).map(a=>({key:a._sukunRecordingKey,time:a.currentTime,duration:a.duration})));
    assert(active.some(a=>a.key==='bundled:r1065:ayatul-kursi'&&a.time>0&&a.time<a.duration));
    await closeDoor();return{playing,interrupted,active,...verifyServed()};
  });
  report.browser=f.browser.version();
} catch(error) { report.fatal=error.stack||String(error);if(p)report.lastState=await state().catch(()=>null); }
finally {
  if(p)await p.evaluate(()=>{SukunBerhetGate.close();PlaybackController.stop('smart-session');}).catch(()=>{});
  if(f)await f.close();save();console.log(JSON.stringify({passed:report.passed,total:report.total,output,fatal:report.fatal},null,2));
  if(!report.allPassed||report.fatal)process.exitCode=1;
}})();
