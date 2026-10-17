'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {fixture,wav,hash}=require('../r1064/browser-fixture.cjs');
async function setup(root,{width=390,height=844,toneSeconds=2}={}){
 if(process.env.SUKUN_QA_TRACE)console.log('fixture-start');const f=await fixture(root,{width,height});const p=f.page;if(process.env.SUKUN_QA_TRACE)console.log('fixture-ready');
 await p.evaluate(async tone=>{
  NIYET.on=false;NIYET.spk=false;NIYET.devir=false;ZA.kapali=true;
  await SukunVoiceSettings.setContent('legacy');await SukunVoiceSettings.setMode('personal');
  SPK.on=true;SukunR698VoiceIntent.explicit(true);Z.adv=false;Z.tick=false;Z.vib=false;KAYIT.yankiMik=0;KAYIT.mekan=false;
  const bytes=Uint8Array.from(atob(tone),x=>x.charCodeAt(0)),blob=new Blob([bytes],{type:'audio/wav'});
  for(const key of ['koruma:0','koruma:1','koruma:2','koruma:3','koruma:4','esma:0']){await REC_DB.set(key,blob);RECKEYS.add(key)}
  window.__r1082Media=[];window.__r1082Events=[];window.__r1082Clicks=[];
  const observed=new WeakSet(),original=HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play=function(...args){if(!observed.has(this)){observed.add(this);window.__r1082Media.push(this);for(const type of ['playing','ended','pause','error'])this.addEventListener(type,()=>window.__r1082Events.push({type,key:this._sukunRecordingKey||'',time:this.currentTime,duration:this.duration,at:Date.now()}))}return original.apply(this,args)};
  document.addEventListener('click',e=>{const b=e.target.closest('button');if(b)__r1082Clicks.push({id:b.id,action:b.dataset.a||'',trusted:e.isTrusted,at:Date.now()})},true);
  window.__r1082BaselineTarget={target:Z.target,count:Z.count};Z.target=622;Z.count=11;Z.targetMode='fixed';zUI();
 },wav(toneSeconds,330).toString('base64'));
 await p.evaluate(()=>{window.__r1082Completions=[];const old=SukunResumePolicy.complete;SukunResumePolicy.complete=function(...args){__r1082Completions.push({args,at:Date.now()});return old.apply(this,args)}});
 await p.locator('.tab[data-t="zkr"]').click();if(process.env.SUKUN_QA_TRACE)console.log('setup-ready');
 const idle=async()=>{await p.waitForFunction(()=>!SukunInteractionGateR732.active());await p.waitForTimeout(100)};
 const tap=async s=>{await idle();await p.locator(s).click();await idle()};
 const stop=async()=>{if(process.env.SUKUN_QA_TRACE)console.log('stop-start');await p.evaluate(()=>PlaybackController.stop('smart-session'));await idle();await p.waitForFunction(()=>!R170.Player.playing&&!R170.Player.paused)};
 const setQueue=async(q,name='r1082 QA transport')=>{await stop();if(process.env.SUKUN_QA_TRACE)console.log('queue-start '+name);await p.evaluate(({q,name})=>{R170.Player.set(q,name);SukunSessionEditor.render()}, {q,name});await idle()};
 const play=async(index=0)=>{await p.evaluate(()=>PlaybackController.play('smart-session'));await p.waitForFunction(i=>R170.Player.playing&&R170.Player.i===i&&(window.__r1082Media||[]).some(a=>a._sukunRecordingKey===R170.Player.queue[i].cat+':'+R170.Player.queue[i].idx&&!a.paused&&!a.ended&&a.currentTime>.03),index,{timeout:15000});await idle()};
 const state=async()=>p.evaluate(()=>({smart:{i:R170.Player.i,token:R170.Player.token,playing:R170.Player.playing,paused:R170.Player.paused,completed:R170.Player._r982CompletedReps,conditional:R170.Player.runtimeProgress,failures:R170.Player.failures,lastSource:R170.Player.lastSource,queue:R170.Player.queue.map(s=>({...s}))},current:currentZikirState.snapshot(),session:SukunSessionState.snapshot(),completedSessions:__r1082Completions.slice(),events:__r1082Events.slice(),media:__r1082Media.map(a=>({key:a._sukunRecordingKey||'',time:a.currentTime,duration:a.duration,paused:a.paused,ended:a.ended})),selected:{target:Z.target,count:Z.count},ui:window.SukunSmartSessionUIR1082?.snapshot?.(),engine:window.SukunSmartSessionR1082?.snapshot?.(),journal:SukunProgressJournal.snapshot(),errors:SukunSessionEditor.errors.map(e=>({...e})),speech:__r1064SpeechFixture.log.length,clicks:__r1082Clicks.slice(),text:Object.fromEntries(['r1082SessionSummary','r1082Failure','r1082FocusStrip','r588ProgressText','r588Remain','r920Count','r920Target','r920Remaining','r920Percent'].map(id=>[id,document.getElementById(id)?.textContent||'']))}));
 const exposeEditor=async()=>{await p.evaluate(()=>{SukunPracticeUI.openSection('zmgAraclar',{reveal:false});for(const id of ['zmgAkis','r170SessionHub']){const el=document.getElementById(id);if(el)el.open=true}SukunSessionEditor.render();window.SukunSmartSessionUIR1082?.refresh?.()});await idle()};
 await idle();return{f,p,idle,tap,stop,setQueue,play,state,exposeEditor};
}
function makeReport(suite,root,output){
 const report={suite,checks:[],limitations:['Isolated disposable Linux Chromium profiles, Classic/Feyz at listed CSS viewport sizes. Physical Samsung/Android locking, audible recitation quality and real-device autoplay restrictions are not measured.','Generated two-second PCM tones occupy disposable personal-recording keys only. Native HTMLMediaElement play/currentTime/ended events and clocks remain unmodified; controlled failure injections are labelled per case.']};
 const save=()=>{report.total=report.checks.length;report.passed=report.checks.filter(c=>c.passed).length;report.allPassed=report.total>0&&report.passed===report.total;fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2))};
 const check=async(name,fn,state)=>{try{if(process.env.SUKUN_QA_TRACE)console.log('check-start '+name);report.checks.push({name,passed:true,evidence:await fn()})}catch(error){report.checks.push({name,passed:false,error:error.stack||String(error),state:state?await state().catch(()=>null):null})}save();console.log(JSON.stringify({name,passed:report.checks.at(-1).passed}))};
 return{report,save,check};
}
module.exports={setup,makeReport,hash,assert,fs,path};
