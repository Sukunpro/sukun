'use strict';
// Complete application / real Chromium HTMLMediaElement media clocks.
// Synthetic WAVs stand in for a private intention recording and three Names.
// TTS is controlled by the shared fixture but is forbidden in these scenarios.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {fixture,wav,hash}=require('../r1064/browser-fixture.cjs');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const reportFile=path.resolve(process.argv[3]||path.join(root,'../qa-r1069/native-transition-browser.json'));
const baseline=process.argv.includes('--baseline');
const report={suite:'r1069 full-app native intention / next Name sequencing',baseline,root,startedAt:new Date().toISOString(),checks:[],passed:0,total:0,limitations:['Exact shipped HTML, scripts and SRI in isolated Chromium Classic/Feyz. Three personal Name slots and intention slot contain generated WAV tones, never user recordings.','Native HTMLMediaElement playing/ended/currentTime are observed without clock seeking, synthetic ended events or fast-forwarding. Device speech is a controlled fixture seam and is forbidden during the personal-recording test.','Physical Android screen locking, operating-system audio policy and speaker audibility are not measured.']};
fs.mkdirSync(path.dirname(reportFile),{recursive:true});
const save=()=>{report.total=report.checks.length;report.passed=report.checks.filter(x=>x.passed).length;report.allPassed=report.total>0&&report.total===report.passed;fs.writeFileSync(reportFile,JSON.stringify(report,null,2))};
let f,p;
async function state(){return p.evaluate(()=>__r1069State())}
async function check(name,run){try{report.checks.push({name,passed:true,...await run()})}catch(error){report.checks.push({name,passed:false,error:error.stack||String(error),state:await state().catch(()=>null)})}save()}
async function main(){
 f=await fixture(root);p=f.page;
 try{
  await check('Exact application initializes Classic/Feyz before generated personal audio is installed',async()=>{const x=await p.evaluate(()=>({build:document.querySelector('meta[name="sukun-build"]').content,appearance:SukunShellSkin.getAppearance(),shell:localStorage.getItem('sukun.ui.shellMode')}));assert.equal(x.build,fs.readFileSync(path.join(root,'version.txt'),'utf8').trim());assert.equal(x.appearance,'feyz');assert.equal(x.shell,'classic');return x});
  const intention=wav(3,770);intention.fill(0,44,44+Math.round(.65*8000)*2);intention.fill(0,44+Math.round(2.25*8000)*2);
  const tone={name:wav(.85,330).toString('base64'),intention:intention.toString('base64')};
  await p.evaluate(async tone=>{
   const blob=s=>new Blob([Uint8Array.from(atob(s),c=>c.charCodeAt(0))],{type:'audio/wav'});
   for(const key of ['esma:0:nida','esma:1:nida','esma:2:nida']){await REC_DB.set(key,blob(tone.name));RECKEYS.add(key)}
   await REC_DB.set('niyet:core',blob(tone.intention));RECKEYS.add('niyet:core');NIYET_BLOB=blob(tone.intention);NIYET_HAS_REC=true;window.__r1069Quality=await SukunRecordingQuality.analyse(NIYET_BLOB);
   NIYET.on=true;NIYET.spk=true;NIYET.devir=true;ZA.kapali=true;
   await SukunVoiceSettings.setContent('legacy');await SukunVoiceSettings.setMode('personal');SPK.on=true;SukunR698VoiceIntent.explicit(true);
   Object.assign(Z,{cat:'esma',idx:0,form:'nida',count:0,devir:0,target:1,targetMode:'manual',adv:true,tempo:.6,tick:false,vib:false});renderZikir(false);
   window.__r1069Trace=[];window.__r1069State=()=>({cat:Z.cat,idx:Z.idx,count:Z.count,total:Z.total,auto:Z.auto,intention:SukunIntention.snapshot(),hidden:_r476Hidden?{mode:_r476Hidden.mode,key:_r476Hidden.preparedKey}:null,session:SukunSessionState.snapshot()});
   window.__r1069Note=(op,extra={})=>__r1069Trace.push({op,at:performance.now(),...extra,state:__r1069State()});
   const identity=a=>({key:a._sukunRecordingKey||a.dataset.sukLockKey||'',ad:a._sukunAd||'',time:a.currentTime,duration:a.duration,source:a.currentSrc||a.src});
   const play=HTMLMediaElement.prototype.play,pause=HTMLMediaElement.prototype.pause;
   HTMLMediaElement.prototype.play=function(...args){
    if(!this.__r1069Bound){this.__r1069Bound=true;for(const type of ['playing','ended','pause','error','emptied','seeking','seeked'])this.addEventListener(type,()=>{const id=identity(this);if(id.key||id.ad)__r1069Note('native:'+type,id)},{capture:true})}
    const id=identity(this);if(id.key||id.ad)__r1069Note('play',id);return play.apply(this,args);
   };
   HTMLMediaElement.prototype.pause=function(...args){const id=identity(this);if(id.key||id.ad)__r1069Note('pause',id);return pause.apply(this,args)};
   window.addEventListener('sukun:zikirtransaction',e=>__r1069Note('transaction',{detail:e.detail}));
   window.__r1069SpeechBefore=__r1064SpeechFixture.log.length;window.__r1069TotalBefore=Z.total;
   __r1069Note('start');SukunDirectZikirTransportR698.start();
  },tone);
  await check('Generated intention has measurable quiet edges in real quality analysis',async()=>{const q=await p.evaluate(()=>__r1069Quality);assert(q&&q.trimStart>.3&&q.tailTrim>.3,JSON.stringify(q));return{analysis:q,leadingSilenceSeconds:.65,trailingSilenceSeconds:.75}});
  await check('Initial intention opens a genuine native three-second WAV and receives no repeat credit',async()=>{await p.waitForFunction(()=>__r1069Trace.some(x=>x.op==='native:playing'&&x.ad==='niyet'),null,{timeout:15000});const a=await p.evaluate(()=>__r1069Trace.find(x=>x.op==='native:playing'&&x.ad==='niyet'));assert.equal(a.duration,3);assert.equal(a.state.idx,0);assert.equal(a.state.count,0);assert.equal(a.state.total,await p.evaluate(()=>__r1069TotalBefore));assert.equal(a.state.intention.pending,true);return{nativeEvent:a}});
  if(baseline){
   await check('r1068 baseline seeks past the native intention beginning and ends before its tail',async()=>{await p.waitForFunction(()=>__r1069Trace.some(x=>x.ad==='niyet'&&x.op==='native:pause'&&x.time>1&&x.time<2.9),null,{timeout:10000});const x=await p.evaluate(()=>({events:__r1069Trace.filter(x=>x.ad==='niyet'),quality:__r1069Quality}));assert(x.events.some(e=>e.op==='native:seeking'&&e.time>.3));assert(!x.events.some(e=>e.op==='native:ended'));assert(x.events.some(e=>e.op==='native:pause'&&e.time<3));return{observedHeadAndTailTrim:true,events:x.events,analysis:x.quality}});
  }else{
  await check('Initial intention reaches native ended with its full media duration before first Name playback',async()=>{await p.waitForFunction(()=>__r1069Trace.some(x=>x.op==='native:ended'&&x.ad==='niyet'),null,{timeout:10000});const a=await p.evaluate(()=>__r1069Trace.find(x=>x.op==='native:ended'&&x.ad==='niyet'));assert.equal(a.time,3);const seeks=await p.evaluate(at=>__r1069Trace.filter(x=>x.ad==='niyet'&&x.op==='native:seeking'&&x.time>.04&&x.at<at),a.at);assert.equal(seeks.length,0,JSON.stringify(seeks));assert.equal(a.state.total,await p.evaluate(()=>__r1069TotalBefore));const competing=await p.evaluate(at=>__r1069Trace.filter(x=>x.op==='play'&&/^esma:/.test(x.key)&&x.at<at),a.at);assert.equal(competing.length,0,JSON.stringify(competing));return{nativeEvent:a}});
  }
  await check('First completed Name advances exactly once to the next Name',async()=>{await p.waitForFunction(()=>Z.idx===1,null,{timeout:12000});const x=await state();assert.equal(x.cat,'esma');assert.equal(x.idx,1);assert.equal(x.count,0);assert.equal(x.total,await p.evaluate(()=>__r1069TotalBefore+1));return{state:x}});
  if(baseline){
   await check('r1068 baseline exposes native next-name intention bypass while counter continues',async()=>{await p.waitForFunction(()=>Z.idx>=2,null,{timeout:12000});const x=await p.evaluate(()=>({trace:__r1069Trace,state:__r1069State(),before:__r1069TotalBefore}));assert.equal(x.trace.filter(e=>e.op==='play'&&e.ad==='niyet').length,1);assert.equal(x.state.intention.doneKey,'esma:0:0');assert(x.state.total>=x.before+2);assert(x.trace.some(e=>e.op==='play'&&e.key==='esma:1:nida'));return{observedBypass:true,state:x.state}});
  }else{
   await check('Next Name waits behind its own native intention with no premature repeat credit',async()=>{await p.waitForFunction(()=>__r1069Trace.some(x=>x.op==='native:playing'&&x.ad==='niyet'&&x.state.idx===1),null,{timeout:15000});const a=await p.evaluate(()=>__r1069Trace.find(x=>x.op==='native:playing'&&x.ad==='niyet'&&x.state.idx===1));assert.equal(a.duration,3);assert.equal(a.state.count,0);assert.equal(a.state.total,await p.evaluate(()=>__r1069TotalBefore+1));assert.equal(a.state.intention.pending,true);await p.waitForTimeout(450);const x=await state();assert.equal(x.idx,1);assert.equal(x.count,0);assert.equal(x.total,a.state.total);return{nativeEvent:a}});
   await check('Next intention completes its full native duration before the next Name can play',async()=>{await p.waitForFunction(()=>__r1069Trace.some(x=>x.op==='native:ended'&&x.ad==='niyet'&&x.state.idx===1),null,{timeout:10000});const a=await p.evaluate(()=>__r1069Trace.find(x=>x.op==='native:ended'&&x.ad==='niyet'&&x.state.idx===1));assert.equal(a.time,3);const seeks=await p.evaluate(at=>__r1069Trace.filter(x=>x.ad==='niyet'&&x.op==='native:seeking'&&x.time>.04&&x.at<at),a.at);assert.equal(seeks.length,0,JSON.stringify(seeks));assert.equal(a.state.total,await p.evaluate(()=>__r1069TotalBefore+1));const competing=await p.evaluate(at=>__r1069Trace.filter(x=>x.op==='play'&&x.key==='esma:1:nida'&&x.at<at),a.at);assert.equal(competing.length,0,JSON.stringify(competing));return{nativeEvent:a}});
   await check('Second completed Name receives one credit and advances after its own intention',async()=>{await p.waitForFunction(()=>Z.idx===2,null,{timeout:10000});const x=await state();assert.equal(x.total,await p.evaluate(()=>__r1069TotalBefore+2));assert.equal(x.count,0);assert.equal(x.intention.doneKey,'esma:1:1');return{state:x}});
  }
  await check('Personal native transition path emits no controlled TTS fallback',async()=>{assert.equal(await p.evaluate(()=>__r1064SpeechFixture.log.length-__r1069SpeechBefore),0);return{utterances:0}});
  await p.evaluate(()=>SukunDirectZikirTransportR698.stop());
  await check('Stop retires the pending next intention and creates no late repeat credit',async()=>{const before=await state();await p.waitForTimeout(600);const after=await state();assert.equal(after.auto,false);assert.equal(after.total,before.total);assert.equal(after.intention.pending,false);return{before,after}});
  await check('Every served application byte matches disk and SRI reports no script error',async()=>{const e=f.evidence();for(const [name,row]of Object.entries(e.served))assert.equal(row.sha256,hash(fs.readFileSync(path.join(root,name))),'Source changed: '+name);assert.equal(e.pageErrors.length,0,e.pageErrors.join('\n'));assert(!e.consoleErrors.some(x=>/integrity|digest|syntaxerror|referenceerror|typeerror/i.test(x)),e.consoleErrors.join('\n'));assert.equal(e.failedRequests.length,0,JSON.stringify(e.failedRequests));report.evidence=e;return{servedFiles:Object.keys(e.served).length}});
 }finally{report.trace=await p.evaluate(()=>window.__r1069Trace||[]).catch(()=>[]);report.finalState=await state().catch(()=>null);report.evidence=report.evidence||f.evidence();save();await f.close()}
 console.log(JSON.stringify({suite:report.suite,baseline,passed:report.passed,total:report.total,report:reportFile}));if(!report.allPassed)process.exitCode=1;
}
main().catch(error=>{report.fatal=error.stack||String(error);save();console.error(error);process.exitCode=1});
