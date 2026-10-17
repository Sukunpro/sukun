'use strict';
// Exact shipped application in an isolated browser. Private recordings are
// never read: only the personal slots populated below contain generated WAVs.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {fixture,wav,hash}=require('../r1064/browser-fixture.cjs');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const selected=(process.env.SUKUN_QA_CASES||'').toLowerCase().split(',').filter(Boolean);
const requiredHash=process.env.SUKUN_QA_SOURCE_SHA256||'';
const output=path.resolve(process.argv[3]||'/tmp/r1090-direct-restart-browser.json');
const report={suite:'r1090 native single-name restart final-command ownership',root,build:fs.readFileSync(path.join(root,'version.txt'),'utf8').trim(),sourceIndexSha256:hash(fs.readFileSync(path.join(root,'index.html'))),testSha256:hash(fs.readFileSync(__filename)),startedAt:new Date().toISOString(),checks:[],limitations:[
 'Exact Classic/Feyz application scripts, normal visual CSS, and genuine Chromium native media clocks at 384×691. Generated six-second tones occupy three isolated personal recording slots; no user recordings, images, browser profile or health report is read.',
 'Race matrix calls actual production exported navigation and SukunSessionState command APIs within one browser task. This establishes command ownership, not physical fast tap timing. A genuine native personal recording is observed through unchanged media clocks.',
 'The engineering fixture controls device TTS, which is forbidden for these personal recording scenarios. Service workers are blocked; physical Android screen locking, speaker audibility, OS audio focus and SW activation are not measured.',
 'The separate Node command-scope suite verifies independently paused background providers. This browser run focuses on the sole single-name captured mix that previously stranded the wheel controls.'
]};
fs.mkdirSync(path.dirname(output),{recursive:true});
let f,p;
function save(){report.total=report.checks.length;report.passed=report.checks.filter(x=>x.passed).length;report.allPassed=report.total>0&&report.total===report.passed;fs.writeFileSync(output,JSON.stringify(report,null,2));}
async function state(){return p.evaluate(()=>window.__r1072SinglePauseState())}
async function check(name,fn){if(selected.length&&!selected.some(k=>name.toLowerCase().includes(k)))return;try{report.checks.push({name,passed:true,evidence:await fn()})}catch(error){report.checks.push({name,passed:false,error:error.stack||String(error),state:await state().catch(()=>null)})}save();console.log(JSON.stringify({name,passed:report.checks.at(-1).passed}));}
async function idle(){await p.waitForFunction(()=>!window.SukunInteractionGateR732?.active?.(),null,{timeout:5000});await p.waitForTimeout(80);}
async function tap(selector){
 await idle();await p.locator(selector).evaluate(el=>SukunViewportPolicy.scrollTo(el,{block:'center',behavior:'instant'},'r1072-browser-placement'));await p.waitForTimeout(120);
 const point=await p.locator(selector).evaluate(el=>{const r=el.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2,hit=document.elementFromPoint(x,y);return{x,y,width:r.width,height:r.height,inViewport:x>0&&x<innerWidth&&y>0&&y<innerHeight,hit:!!hit&&(hit===el||el.contains(hit)),hitId:hit?.id||hit?.tagName,disabled:!!el.disabled};});
 assert(point.width>0&&point.height>0&&point.inViewport&&point.hit&&!point.disabled,selector+' is not an enabled native hit target: '+JSON.stringify(point));
 const before=await p.evaluate(()=>__r1072NativeClicks.length);await p.mouse.click(point.x,point.y);await p.waitForTimeout(80);
 const clicks=await p.evaluate(n=>__r1072NativeClicks.slice(n),before);assert(clicks.some(x=>x.id===selector.slice(1)&&x.trusted),'Native trusted click missing for '+selector+': '+JSON.stringify(clicks));
 return{selector,point,clicks};
}
async function reset(index=0){
 await p.evaluate(async index=>{SukunAudioSessionRegistry.stopAll();await SukunR698Transport.whenStopped();SukunForegroundArbiter.clearQueue('r1072-browser-reset');SukunRecordingFailure.clearForRetry();await SukunSessionState.command('select',{mode:'esma',journeyKind:'single',index});Object.assign(Z,{target:999,targetMode:'manual',adv:false,tempo:1,tick:false,vib:false});renderZikir(false);},index);
 await p.waitForFunction(()=>!SukunTabOwner.snapshot().releasing&&!SukunTabOwner.snapshot().pending&&!SukunR698Transport.snapshot().pendingStop,null,{timeout:10000});await idle();
}
async function ready(index){
 await p.waitForFunction(index=>{const s=SukunSessionState.snapshot(),a=SukunLockAudio.snapshot();return s.activeMode==='esma'&&s.activeIndex===index&&Z.auto&&s.phase==='PLAYING'&&s.sourceOrigin==='personal'&&a.sourceKind==='baked'&&a.playing&&a.readyState>=2&&a.currentTime>.12},index,{timeout:20000});
 const a=await state();await p.waitForTimeout(180);const b=await state();assert.equal(b.session.activeIndex,index);assert.equal(b.session.sourceOrigin,'personal');assert.equal(b.lock.playing,true);assert(b.lock.currentTime>a.lock.currentTime,'The genuine native personal recording clock must progress');return{before:a,after:b};
}
async function globalPause(){
 assert.equal(await p.evaluate(()=>SukunAudioSessionRegistry.pauseAll('media-session-pause')),true);
 await p.waitForFunction(()=>SukunSessionState.snapshot().phase==='PAUSED'&&SukunAudioSessionRegistry.aggregateSnapshot().paused,null,{timeout:6000});
 const held=await state();assert.equal(held.aggregate.mixCaptured,true);assert.deepEqual(held.aggregate.providerIds,[]);assert.equal(held.mini.paused,true);assert.equal(held.mini.wasAuto,true);assert.equal(held.life.userPaused,true);assert.equal(held.life.terminalIntent,false);assert.equal(held.lock.paused,true);return held;
}
function assertRetired(s,index){assert.equal(s.session.activeIndex,index);assert.equal(s.z.auto,false);assert.equal(s.session.phase,'IDLE','Explicit single-name retirement must settle to IDLE');assert.equal(s.aggregate.paused,false,'Sole retired dhikr must release its stale global capture');assert.equal(s.aggregate.mixCaptured,false);assert.deepEqual(s.aggregate.providerIds,[]);assert.equal(s.mini.paused,false);assert.equal(s.mini.wasAuto,false,'Global Resume must not retain a captured old automatic restart');assert.equal(s.life.userPaused,false);assert.equal(s.transport.pendingStart,false);assert.equal(s.transport.pendingStop,false);}
async function main(){
 assert.equal(hash(fs.readFileSync(path.join(root,'nero.html'))),report.sourceIndexSha256);assert.equal(hash(fs.readFileSync(path.join(root,'index.html'))),report.sourceIndexSha256);if(requiredHash)assert.equal(report.sourceIndexSha256,requiredHash);
 f=await fixture(root,{width:384,height:691,seed:{'sukun.wheel.navigation':'1'}});p=f.page;report.browser=f.browser.version();report.initialServed=f.evidence().served;
 await p.locator('.tab[data-t="zkr"]').click();
 await p.evaluate(async tone=>{
  const blob=()=>new Blob([Uint8Array.from(atob(tone),c=>c.charCodeAt(0))],{type:'audio/wav'});
  for(const key of ['esma:0:nida','esma:1:nida','esma:2:nida']){await REC_DB.set(key,blob());RECKEYS.add(key);}
  NIYET.on=false;NIYET.spk=false;NIYET.devir=false;ZA.kapali=true;await SukunVoiceSettings.setContent('legacy');await SukunVoiceSettings.setMode('personal');SPK.on=true;SukunR698VoiceIntent.explicit(true);
  const focus=document.getElementById('r920Focus');focus.checked=false;focus.dispatchEvent(new Event('change',{bubbles:true}));
  window.__r1072NativeClicks=[];document.addEventListener('click',event=>{const button=event.target.closest?.('button');if(button&&/^(r920|r959|r932)/.test(button.id))__r1072NativeClicks.push({id:button.id,trusted:event.isTrusted,at:performance.now()})},true);
  window.__r1072SinglePauseState=()=>({z:{cat:Z.cat,idx:Z.idx,count:Z.count,total:Z.total,auto:Z.auto},session:SukunSessionState.snapshot(),transport:SukunR698Transport.snapshot(),lock:SukunLockAudio.snapshot(),aggregate:SukunAudioSessionRegistry.aggregateSnapshot(),mini:{paused:MINI.paused,wasAuto:MINI.wasAuto},life:{...AudioLife.snapshot(),terminalIntent:!!AudioLife._terminalIntent},tab:SukunTabOwner.snapshot(),arbiter:SukunForegroundArbiter.snapshot(),speechCount:__r1064SpeechFixture.log.length});
 },wav(6,440).toString('base64'));

 for(const terminal of ['pause','stop','selection'])await check('Direct restart then '+terminal,async()=>{
  await reset(0);await p.evaluate(()=>SukunSessionState.command('start'));await ready(0);
  const command=await p.evaluate(async terminal=>{
   const restart=__SUKUN_FLOW_NAV_OPS__.restartDirect();window.__r1090Restart=restart;
   const result=terminal==='selection'?await SukunSessionState.command('select',{mode:'esma',journeyKind:'single',index:1}):await SukunSessionState.command(terminal);
   return{at:performance.now(),terminal,result,state:__r1072SinglePauseState()};
  },terminal);
  await p.waitForTimeout(3000);const after=await state();assert.equal(after.z.auto,false);assert.equal(after.lock.playing,false);assert.equal(after.z.count,command.state.z.count);assert.equal(after.z.total,command.state.z.total);assert.equal(after.z.idx,terminal==='selection'?1:0);return{command,after};
 });

 await check('Legitimate direct restart resumes selected native personal recording from zero',async()=>{await reset(0);await p.evaluate(()=>SukunSessionState.command('start'));const before=await ready(0);const result=await p.evaluate(()=>__SUKUN_FLOW_NAV_OPS__.restartDirect());const after=await ready(0);assert.equal(result,true,'Accepted restart must agree with actual native admission');assert.equal(after.after.z.count,0);assert.equal(after.after.z.idx,0);assert.equal(after.after.speechCount,0);return{before,result,after};});
 await check('Direct restart after global Pause preserves the hold without autoplay',async()=>{await reset(1);await p.evaluate(()=>SukunSessionState.command('start'));await ready(1);const held=await globalPause();await p.evaluate(()=>__SUKUN_FLOW_NAV_OPS__.restartDirect());await p.waitForTimeout(1250);const after=await state();assert.equal(after.z.auto,false);assert.equal(after.lock.playing,false);assert.equal(after.z.count,0);return{held,after};});
 await check('Rapid direct restart then Next resumes only the new selected native recording',async()=>{await reset(0);await p.evaluate(()=>SukunSessionState.command('start'));await ready(0);await p.evaluate(()=>{window.__r1090Restart=__SUKUN_FLOW_NAV_OPS__.restartDirect();window.__r1090Next=__SUKUN_FLOW_NAV_OPS__.navigateDirect(1);return true});const after=await ready(1);assert.equal(after.after.z.idx,1);assert.equal(after.after.speechCount,0);return after;});
 await check('Source bytes and native app remain free of missing/SRI/JS faults',async()=>{const e=f.evidence();for(const[name,row]of Object.entries(e.served))assert.equal(row.sha256,hash(fs.readFileSync(path.join(root,name))),name);assert.deepEqual(e.pageErrors,[]);assert.deepEqual(e.failedRequests,[]);assert(!e.consoleErrors.some(x=>/integrity|digest|syntaxerror|referenceerror|typeerror/i.test(x)));return{servedFiles:Object.keys(e.served).length,e};});
 report.finishedAt=new Date().toISOString();report.sourceUnchanged=hash(fs.readFileSync(path.join(root,'nero.html')))===report.sourceIndexSha256;save();
}
main().catch(error=>{report.fatal=error.stack||String(error);save();console.error(error);process.exitCode=1}).finally(async()=>{if(f){report.evidence=f.evidence();save();await f.close()}console.log(JSON.stringify({passed:report.passed,total:report.total,output,fatal:report.fatal}));if(!report.allPassed)process.exitCode=1});
