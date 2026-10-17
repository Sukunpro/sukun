'use strict';
// Exact complete app. Device voices/completion are controlled; native personal
// recording playback, media time and ended events are Chromium's real APIs.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {fixture,wav,hash}=require('../r1064/browser-fixture.cjs');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const output=path.resolve(process.argv[3]||'/tmp/r1092-smart-source-policy.json');
const report={suite:'r1092 smart-session explicit audio-source fidelity',startedAt:new Date().toISOString(),checks:[],profiles:[],limitations:['Isolated Chromium Classic/Feyz; synthetic device voices/completion and generated personal .9-second WAV. Real native media playback/currentTime/ended are not replaced. No physical Android lock test or speaker audibility claim.']};
let f,p;
function save(){report.total=report.checks.length;report.passed=report.checks.filter(x=>x.passed).length;fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2))}
async function state(){return p.evaluate(()=>({mode:SukunVoiceSettings.getMode(),fallback:SukunSmartSessionSource.describeFallback(R170.Player.queue[0]),speech:__r1064SpeechFixture.snapshot(),smart:SukunSmartSessionR1082.snapshot(),playing:R170.Player.playing,paused:R170.Player.paused,count:R170.Player._r982CompletedReps||0,voice:SukunVoiceSource.snapshot(),events:__policyEvents||[],clicks:__policyClicks||[]}))}
async function check(name,fn){try{report.checks.push({name,passed:true,evidence:await fn()})}catch(error){report.checks.push({name,passed:false,error:error.stack||String(error),state:await state().catch(()=>null)})}save();console.log(JSON.stringify({name,passed:report.checks.at(-1).passed}))}
async function boot(voices='both'){
 if(f){report.profiles.push(f.evidence());await f.close()}
 f=await fixture(root,{voices});p=f.page;
 await p.evaluate(()=>{window.__policyEvents=[];window.__policyClicks=[];const play=HTMLMediaElement.prototype.play,seen=new WeakSet();HTMLMediaElement.prototype.play=function(...args){if(!seen.has(this)){seen.add(this);for(const type of ['playing','ended','pause','error'])this.addEventListener(type,()=>__policyEvents.push({type,key:this._sukunRecordingKey||this.dataset.sukLockKey||'',time:this.currentTime,duration:this.duration,at:performance.now()}))}return play.apply(this,args)};document.addEventListener('click',event=>{if(event.target.closest('#r170StartSession'))__policyClicks.push({trusted:event.isTrusted})},true);});
 await p.locator('.tab[data-t="zkr"]').click();
}
async function prepare({source='auto',record=false,gender='auto',content='legacy'}={}){
 await p.evaluate(async ({source,record,gender,content,b64})=>{
  PlaybackController.stop('smart-session');NIYET.on=false;NIYET.spk=false;SPK.on=true;SukunR698VoiceIntent.explicit(true);
  await SukunVoiceSettings.setMode(source);await SukunVoiceSettings.setContent(content);
  if(record){const blob=new Blob([Uint8Array.from(atob(b64),c=>c.charCodeAt(0))],{type:'audio/wav'});await REC_DB.set('esma:0:nida',blob);RECKEYS.add('esma:0:nida')}
  else{const emptyFixture=new Blob([Uint8Array.from(atob(b64),c=>c.charCodeAt(0))],{type:'audio/wav'});await REC_DB.set('esma:0:nida',emptyFixture);await REC_DB.del('esma:0:nida');RECKEYS.delete('esma:0:nida')}
  __r1064SpeechFixture.reset();__r1064SpeechFixture.setAuto(true);__policyEvents.length=0;__policyClicks.length=0;
  R170.Player.set([{type:'zikir',cat:'esma',idx:0,reps:1,gap:0,repeatMode:'fixed',advance:'auto',_r472SourceMode:gender}],'Source policy QA');SukunSmartSessionUIR1082.open({reveal:false});SukunSessionEditor.render();SukunSmartSessionUIR1082.refresh();
 },{source,record,gender,content,b64:wav(.9,330).toString('base64')});
 await p.waitForFunction(()=>!SukunInteractionGateR732.active());
}
async function start(){await p.locator('#r170StartSession').click();await p.waitForFunction(()=>SukunSmartSessionR1082.snapshot().result.status==='completed'||!!SukunSmartSessionR1082.snapshot().failed,null,{timeout:20000});return state()}
const contentBlobStarts=s=>s.speech.mediaLog.filter(x=>x.op==='play'&&/^blob:/.test(x.requestedSrc||x.src)&&!x.silentCarrier);
(async()=>{try{
 await boot();
 await check('Read-only policy planning and source preview never resolve/save voices or write storage; normal policy retains resolution',async()=>{
  await prepare({source:'arabic'});
  const r=await p.evaluate(()=>{const cat=SukunVoiceCatalog,oldResolve=cat.resolve,oldSave=cat.save,oldSet=Storage.prototype.setItem,counts={resolve:0,save:0,writes:0};cat.resolve=function(...args){counts.resolve++;return oldResolve.apply(this,args)};cat.save=function(...args){counts.save++;return oldSave.apply(this,args)};Storage.prototype.setItem=function(...args){counts.writes++;return oldSet.apply(this,args)};let readonly,normal,preview,afterReadonly,afterNormal;try{readonly=SukunReadingPolicy.plan(ZIKIR.esma.items[0],{cat:'esma',index:0,readOnly:true});preview=SukunSmartSessionSource.describeFallback(R170.Player.queue[0]);afterReadonly={...counts};normal=SukunReadingPolicy.plan(ZIKIR.esma.items[0],{cat:'esma',index:0});afterNormal={...counts}}finally{cat.resolve=oldResolve;cat.save=oldSave;Storage.prototype.setItem=oldSet}return{readonly:{ok:readonly.ok,text:readonly.text,lang:readonly.lang},normal:{ok:normal.ok,text:normal.text,lang:normal.lang},preview,afterReadonly,afterNormal}});
  assert.deepEqual(r.afterReadonly,{resolve:0,save:0,writes:0});assert.equal(r.afterNormal.resolve,1);assert.deepEqual(r.normal,r.readonly);assert.equal(r.preview.lang,'ar-SA');assert.equal(r.preview.available,true);return r;
 });
 for(const record of [false,true])await check('Explicit Arabic '+(record?'with an existing personal WAV':'without recordings')+' speaks the verified original using the selected Arabic voice',async()=>{
  await prepare({source:'arabic',record,gender:'tts-f',content:'meaning'});const before=await state(),s=await start();
  assert.equal(s.smart.result.status,'completed');assert.equal(s.speech.log.length,1);const u=s.speech.log[0];assert.equal(u.lang,'ar-SA');assert.equal(u.voice.lang,'ar-SA');assert.equal(u.voice.name,'Maged');assert(/\p{Script=Arabic}/u.test(u.text));assert(!/[A-Za-z]/.test(u.text));assert.equal(contentBlobStarts(s).length,0);assert.equal(s.events.filter(x=>x.key==='esma:0:nida'&&x.type==='playing').length,0);assert.equal(s.clicks.length,1);assert.equal(s.clicks[0].trusted,true);assert.equal(before.fallback.available,true);assert.equal(before.fallback.voice.lang,u.lang);assert.equal(before.fallback.content,'arabic');return {before:before.fallback,utterance:u,result:s.smart.result,nativeEvents:s.events,clicks:s.clicks};
 });
 await check('Explicit Turkish bypasses a personal WAV and retains the selected Turkish voice regardless of per-step gender fallback',async()=>{
  await prepare({source:'turkish',record:true,gender:'tts-f'});const before=await state(),s=await start();assert.equal(s.speech.log.length,1);assert.equal(s.speech.log[0].text,'Yâ Rahmân');assert.equal(s.speech.log[0].voice.name,'Tolga');assert.equal(s.speech.log[0].lang,'tr-TR');assert.equal(contentBlobStarts(s).length,0);assert.equal(s.smart.result.status,'completed');assert.equal(before.fallback.voice.lang,'tr-TR');return {before:before.fallback,utterance:s.speech.log[0],result:s.smart.result};
 });
 for(const source of ['personal','generic'])await check(source+' only refuses TTS and disallowed personal fallback when the selected bank lacks a recording',async()=>{
  await prepare({source,record:source==='generic'});const before=await state(),s=await start();assert.equal(s.paused,true);assert(s.smart.failed);assert.equal(s.count,0);assert.equal(s.speech.log.length,0);assert.equal(contentBlobStarts(s).length,0);assert.equal(before.fallback.available,false);assert.match(before.fallback.reason,/recording-required/);return {before:before.fallback,result:s.smart,utterances:s.speech.log,contentBlobStarts:contentBlobStarts(s)};
 });
 await check('Legacy automatic mode retains the per-step female device fallback after confirmed recording absence',async()=>{
  await p.evaluate(()=>__r1064SpeechFixture.setVoices([{name:'Tolga',lang:'tr-TR',voiceURI:'synthetic-tr-male',localService:true,default:true},{name:'Ayşe',lang:'tr-TR',voiceURI:'synthetic-tr-female',localService:true,default:false},{name:'Maged',lang:'ar-SA',voiceURI:'synthetic-ar-male',localService:true,default:false}]));
  await prepare({source:'auto',record:false,gender:'tts-f',content:'arabic'});const before=await state(),s=await start();assert.equal(s.smart.result.status,'completed');assert.equal(s.speech.log.length,1);assert.equal(s.speech.log[0].voice.name,'Ayşe');assert.equal(s.speech.log[0].lang,'tr-TR');assert.equal(s.speech.log[0].text,'Yâ Rahmân');assert.equal(before.fallback.content,'legacy');return {preview:before.fallback,utterance:s.speech.log[0],result:s.smart.result};
 });
 await check('Legacy automatic recording priority plays one exact native personal WAV to its genuine end without any device speech',async()=>{
  await prepare({source:'auto',record:true,gender:'tts-f'});const s=await start();assert.equal(s.smart.result.status,'completed');assert.equal(s.speech.log.length,0);const started=s.events.filter(x=>x.key==='esma:0:nida'&&x.type==='playing'),ended=s.events.filter(x=>x.key==='esma:0:nida'&&x.type==='ended');assert.equal(started.length,1);assert.equal(ended.length,1);assert.equal(ended[0].duration,.9);assert(ended[0].time>=.89);assert(ended[0].at-started[0].at>=800);return {nativeStarts:started,nativeEnds:ended,result:s.smart.result};
 });
 await boot('tr');
 await check('Unavailable Arabic device voice holds the uncredited step with no Turkish or personal-recording substitution',async()=>{
  await prepare({source:'arabic',record:true});const before=await state(),s=await start();assert.equal(before.fallback.available,false);assert.equal(before.fallback.reason,'arabic-voice-unavailable');assert.equal(s.paused,true);assert(s.smart.failed);assert.equal(s.count,0);assert.equal(s.speech.log.length,0);assert.equal(contentBlobStarts(s).length,0);return {preview:before.fallback,result:s.smart,speech:s.speech.log,contentBlobStarts:contentBlobStarts(s)};
 });
 for(const evidence of [...report.profiles,f.evidence()]){assert.equal(evidence.pageErrors.length,0,evidence.pageErrors.join('\n'));assert(!evidence.consoleErrors.some(x=>/syntaxerror|referenceerror|typeerror|integrity/i.test(x)),evidence.consoleErrors.join('\n'))}
 }catch(error){report.fatal=error.stack||String(error)}finally{if(f){report.profiles.push(f.evidence());await f.close()}report.finishedAt=new Date().toISOString();report.sourceSha256=hash(fs.readFileSync(path.join(root,'nero.html')));report.testSha256=hash(fs.readFileSync(__filename));save();console.log(JSON.stringify({report:output,passed:report.passed,total:report.total,fatal:report.fatal}));if(report.fatal||report.passed!==report.total)process.exitCode=1}})();
