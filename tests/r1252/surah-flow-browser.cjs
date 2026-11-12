'use strict';
// Real bundled MP3s and genuine media ended events. No seek/synthetic ended.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const {fixture}=require(path.join(root,'tests/r1064/browser-fixture.cjs'));
const output=path.resolve(process.argv[3]||'r1252-surah-flow-browser.json');
const report={checks:[],limitations:['Disposable Chromium; controlled device TTS from the shared fixture. Actual full bundled MP3s run at normal speed. No audible/physical-phone guarantee. This suite can take about 15 minutes.']};
let f,p;
const save=()=>{report.total=report.checks.length;report.passed=report.checks.filter(x=>x.passed).length;fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2))};
async function check(name,fn){const evidence=await fn();report.checks.push({name,passed:true,evidence});save()}
async function waitIdle(){await p.waitForFunction(()=>!window.SukunInteractionGateR732?.active?.())}
async function select(idx,reps){
 await p.evaluate(({idx,reps})=>{
  R170.Player.stop(true);Z.cat='sure';Z.idx=idx;renderZikir(false);zUI();
  SukunSmartSessionUIR1082.open({reveal:false});
  R170.Player.set([],'Sûre kabul testi');SukunSessionEditor.render();
 },{idx,reps});
 await waitIdle();await p.locator('#r170CurrentAdd').click();
 await p.waitForFunction(idx=>R170.Player.queue.length===1&&R170.Player.queue[0].cat==='sure'&&R170.Player.queue[0].idx===idx,idx);
 await p.evaluate(reps=>{R170.Player.queue[0].reps=reps;R170.Player.queue[0].gap=300;R170.Player.queue[0].repeatMode='fixed';R170.Player.save();SukunSessionEditor.render();window.__surahTrace.length=0},reps);
}
async function start(){await waitIdle();await p.locator('#r170StartSession').click()}
async function playing(key){await p.waitForFunction(key=>window.__surahMedia.some(a=>a._sukunRecordingKey==='bundled:r1065:'+key&&!a.paused&&!a.ended&&a.currentTime>.1),key,{timeout:45000})}
(async()=>{try{
 f=await fixture(root,{width:390,height:900});p=f.page;
 await p.evaluate(async()=>{
  await SukunVoiceSettings.setMode('auto');NIYET.on=false;NIYET.spk=false;niyetSave();__r1064SpeechFixture.setAuto(true);
  window.__surahTrace=[];window.__surahMedia=[];const seen=new WeakSet(),original=HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play=function(...args){
   if(!seen.has(this)){seen.add(this);__surahMedia.push(this);for(const type of ['playing','pause','ended','error'])this.addEventListener(type,e=>__surahTrace.push({type,trusted:e.isTrusted,key:this._sukunRecordingKey||this.dataset.sukLockKey||'',time:this.currentTime,duration:this.duration,at:performance.now(),completed:+R170.Player._r982CompletedReps||0,playing:R170.Player.playing,paused:R170.Player.paused,token:R170.Player.token}));}
   return original.apply(this,args);
  };
 });
 await check('Both full surahs selectable in the Vird/Terkip source dropdown',async()=>{
  return p.evaluate(()=>{virdFillSelect();const choices=[...document.querySelectorAll('#virdSel option')].filter(o=>/^sure:[01]$/.test(o.value)).map(o=>({value:o.value,text:o.textContent}));if(choices.length!==2)throw Error('Missing Vird choices');return choices});
 });
 for(const [idx,key,seconds] of [[0,'abese',246.75265],[1,'tarik',117.054675]]){
  await select(idx,2);
  await check(key+' chosen full-surah step is added by the existing visible Akış button',async()=>{const step=await p.evaluate(()=>R170.Player.queue[0]);assert.equal(step.cat,'sure');assert.equal(step.idx,idx);assert.equal(step.reps,2);return step});
  await start();await playing(key);
  await check(key+' native bundled source starts without a credited repetition',async()=>{const x=await p.evaluate(key=>{const a=__surahMedia.find(a=>a._sukunRecordingKey==='bundled:r1065:'+key&&!a.paused);return{duration:a.duration,completed:+R170.Player._r982CompletedReps||0,source:a._sukunRecordingKey,time:a.currentTime}},key);assert(Math.abs(x.duration-seconds)<.25);assert.equal(x.completed,0);return x});
  // New run, pause before the first complete reading and cancel while paused.
  await select(idx,2);await start();await playing(key);
  await p.evaluate(()=>PlaybackController.pause('smart-session'));
  await p.waitForFunction(()=>R170.Player.paused&&!R170.Player.playing);
  await check(key+' pause keeps the smart owner and credits no partial surah',async()=>{const x=await p.evaluate(key=>({completed:+R170.Player._r982CompletedReps||0,ended:__surahTrace.filter(e=>e.type==='ended'&&e.key==='bundled:r1065:'+key).length,paused:R170.Player.paused} ),key);assert.equal(x.completed,0);assert.equal(x.ended,0);assert.equal(x.paused,true);return x});
  await p.evaluate(()=>PlaybackController.resume('smart-session'));await playing(key);
  await check(key+' resume retains the same step with no partial credit',async()=>{const x=await p.evaluate(()=>({cat:R170.Player.queue[R170.Player.i].cat,idx:R170.Player.queue[R170.Player.i].idx,completed:+R170.Player._r982CompletedReps||0,playing:R170.Player.playing}));assert.equal(x.cat,'sure');assert.equal(x.idx,idx);assert.equal(x.completed,0);assert.equal(x.playing,true);return x});
  await p.evaluate(()=>PlaybackController.stop('smart-session'));
  await p.waitForFunction(()=>!R170.Player.playing&&!R170.Player.paused);
  await check(key+' stop cancels the owner; no stale next-repeat start',async()=>{
   const stamp=await p.evaluate(()=>({token:R170.Player.token,plays:__surahTrace.filter(e=>e.type==='playing'&&e.key.startsWith('bundled:r1065:')).length}));
   // Count actual bundled recitation, not the independent silent keepalive carrier.
   // Negative liveness assertion requires an observation window beyond retry/gap timers.
   await p.waitForTimeout(1200);
   const x=await p.evaluate(()=>({token:R170.Player.token,plays:__surahTrace.filter(e=>e.type==='playing'&&e.key.startsWith('bundled:r1065:')).length,playing:R170.Player.playing,completed:+R170.Player._r982CompletedReps||0,activeSurahs:__surahMedia.filter(a=>String(a._sukunRecordingKey||'').startsWith('bundled:r1065:')&&!a.paused&&!a.ended).length}));
   console.log('stop-observation',JSON.stringify({key,stamp,after:x,events:await p.evaluate(()=>__surahTrace.slice(-15))}));
   assert.equal(x.token,stamp.token);assert.equal(x.plays,stamp.plays);assert.equal(x.playing,false);assert.equal(x.completed,0);assert.equal(x.activeSurahs,0);return x;
  });
  // Complete playback runs after short lifecycle checks, so failures report promptly.
  await select(idx,2);await start();await playing(key);
  await check(key+' two complete native readings credit in order without early completion',async()=>{
   await p.waitForFunction(key=>__surahTrace.filter(e=>e.key==='bundled:r1065:'+key&&e.type==='ended').length===2,key,{timeout:Math.ceil(seconds*2*1000+120000)});
   const events=await p.evaluate(key=>__surahTrace.filter(e=>e.key==='bundled:r1065:'+key),key),ends=events.filter(e=>e.type==='ended'),starts=events.filter(e=>e.type==='playing');
   assert.equal(ends.length,2);assert(ends.every(e=>e.trusted&&e.time>=e.duration-.1));assert(starts.length>=2);assert(starts[1].at>ends[0].at);assert.equal(starts[1].completed,1);
   await p.waitForFunction(()=>!R170.Player.playing);return{starts,ends};
  });

 }
 assert.equal(f.errors.length,0,f.errors.join('\n'));assert(!f.consoleErrors.some(x=>/integrity|syntaxerror|referenceerror|typeerror/i.test(x)),f.consoleErrors.join('\n'));
 report.evidence=f.evidence();
}catch(error){report.checks.push({name:'surah flow acceptance',passed:false,error:error.stack});process.exitCode=1}
finally{if(f)await f.close();save();console.log(JSON.stringify(report))}})();
