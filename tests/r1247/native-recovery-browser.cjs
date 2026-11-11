'use strict';
// Full shipped app and real Chromium HTMLMediaElement. The only interruption
// seams are simulated document visibility and pause() after a trusted native
// loop seek. No caller, lease, timer, counter or transport state is replaced.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {fixture,wav,hash}=require('../r1064/browser-fixture.cjs');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const output=path.resolve(process.argv[3]||'/tmp/r1247-native-recovery.json');
const report={suite:'r1247 full-app native loop interruption recovery',sourceSha256:hash(fs.readFileSync(path.join(root,'index.html'))),testSha256:hash(fs.readFileSync(__filename)),startedAt:new Date().toISOString(),checks:[],limitations:[
 'Production files are served byte-for-byte in isolated Chromium profiles with generated WAV recordings. Device speech uses the existing controlled fixture.',
 'The document visibility property/event is simulated. The test waits for a genuine native HTMLMediaElement loop seek, then deliberately calls native pause() to model a late media interruption.',
 'The application owns recovery timing, play promises, journey state and counters. A designated Stop case calls the public session command while a real recovery timer is pending.',
 'This is browser integration coverage, not physical Samsung screen-lock, Bluetooth routing, OS audio focus or subjective audibility acceptance.'
]};
function save(){report.total=report.checks.length;report.passed=report.checks.filter(x=>x.passed).length;report.allPassed=report.total===4&&report.passed===4;fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');}
async function idle(p){await p.waitForFunction(()=>!window.SukunInteractionGateR732?.active?.());await p.waitForTimeout(100);}
async function tap(p,selector){await idle(p);assert(await p.locator(selector).isVisible(),'Visible control '+selector);await p.locator(selector).evaluate(el=>SukunViewportPolicy.scrollTo(el,{block:'center',behavior:'instant'},'r1247-native-control'));await p.waitForTimeout(250);await p.locator(selector).click({timeout:15000});await p.waitForTimeout(60);}
async function setup(p,kind){
 if(await p.locator('#dailyCard').isVisible())await p.keyboard.press('Escape');await p.locator('#dailyCard').waitFor({state:'hidden'});
 await p.evaluate(async()=>{KLT_AC('r1247-isolated-fixture');NIYET.on=NIYET.spk=NIYET.devir=false;ZA.kapali=true;SPK.on=true;Z.tick=Z.vib=Z.adv=false;KAYIT.yankiMik=0;KAYIT.mekan=false;await SukunVoiceSettings.setContent('legacy');await SukunVoiceSettings.setMode('personal');SukunR698VoiceIntent.explicit(true);});
 await p.evaluate(async({key,tone})=>{await REC_DB.set(key,new Blob([Uint8Array.from(atob(tone),c=>c.charCodeAt(0))],{type:'audio/wav'}));RECKEYS.add(key);},{key:kind===28?'berhet:0':'esma:0:nida',tone:wav(8,440).toString('base64')});
 await tap(p,'.tab[data-t="zkr"]');
 const selected=await p.evaluate(kind=>SukunSessionState.command('select',{mode:kind===28?'berhet':'esma',journeyKind:String(kind),index:0}),kind);assert.equal(selected.accepted,true,JSON.stringify(selected));
 await idle(p);if(await p.locator('#r938PanelToggle').getAttribute('aria-expanded')!=='true')await tap(p,'#r938PanelToggle');await p.locator('#r938PanelBody').waitFor({state:'visible'});
 if(!await p.locator('#r920JourneySettings').evaluate(n=>n.open))await tap(p,'#r920JourneySettings > summary');
 await p.locator('#r920RepeatMode').focus();await p.keyboard.press('End');await p.keyboard.press('Tab');await idle(p);assert.equal(await p.locator('#r920RepeatMode').inputValue(),'custom');
 await p.locator('#r920RepeatCustom').focus();await p.keyboard.press('Control+A');await p.keyboard.type('50');await p.keyboard.press('Tab');await idle(p);
 await p.locator('#r920RepeatGap').focus();await p.keyboard.press('Home');await p.keyboard.press('Tab');await idle(p);
 const settings=await p.evaluate(kind=>{const prefix=kind===28?'bs':'es99';return{mode:document.getElementById(prefix+'Mode').value,repeats:+document.getElementById(prefix+'Custom').value};},kind);assert.equal(settings.mode,'custom');assert.equal(settings.repeats,50);
 await p.waitForFunction(()=>!SukunTabOwner.snapshot().releasing&&!SukunTabOwner.snapshot().pending);await tap(p,'#r932EasyPlay');
 await p.waitForFunction(kind=>{const a=window.__sukJourneyNative?.a,s=(kind===28?SukunBerhetiyyeSeyir:SukunEsma99Seyir).state();return s.run&&!s.paused&&s.i===0&&a instanceof HTMLAudioElement&&!a.paused&&!a.ended&&!a.seeking&&a.readyState>=2&&a.currentTime>.2&&SukunBackgroundAudioOwner.snapshot().playing;},kind,{timeout:18000,polling:50});
}
async function state(p,kind){return p.evaluate(kind=>{const j=window.__sukJourneyNative,a=j?.a,seam=window.__r1247LoopSeam;return{journey:(kind===28?SukunBerhetiyyeSeyir:SukunEsma99Seyir).state(),phase:SukunSessionState.snapshot().phase,count:Z.count,total:Z.total,owner:SukunBackgroundAudioOwner.snapshot(),transport:SukunLockJourneyTransportV2.snapshot(),speech:__r1064SpeechFixture.log.length,media:a?{native:a instanceof HTMLAudioElement,paused:a.paused,ended:a.ended,seeking:a.seeking,time:a.currentTime,duration:a.duration,ready:a.readyState,loop:a.loop,sameElement:a===seam?.audio,sameSource:j.playUrl===seam?.source&&a.currentSrc===seam?.source}:null,seam:seam?{hiddenAt:seam.hiddenAt,pausedAt:seam.pausedAt,seek:seam.seek,atPause:seam.atPause,pending:seam.pending,stopResult:seam.stopResult,error:seam.error,events:seam.events}:null};},kind);}
async function interrupt(p,kind,stop){
 await p.evaluate(({kind,stop})=>{
  const a=window.__sukJourneyNative.a,api=kind===28?SukunBerhetiyyeSeyir:SukunEsma99Seyir;
  const seam=window.__r1247LoopSeam={audio:a,source:window.__sukJourneyNative.playUrl,hiddenAt:performance.now(),events:[],seek:null,pausedAt:null,pending:null,atPause:null,stopResult:null,error:null};
  const evidence=()=>({time:a.currentTime,count:Z.count,total:Z.total,journey:api.state(),owner:SukunBackgroundAudioOwner.snapshot()});
  const seeking=e=>{if(!e.isTrusted||!document.hidden||performance.now()-seam.hiddenAt<1800||a.currentTime>=.075||!a.loop||a.paused)return;seam.seek={trusted:e.isTrusted,time:a.currentTime,at:performance.now(),owner:SukunBackgroundAudioOwner.snapshot()};};
  const seeked=e=>{
   if(seam.pausedAt!==null||!seam.seek||!e.isTrusted||a.currentTime>=.075||a.readyState<2)return;
   a.removeEventListener('seeking',seeking);a.removeEventListener('seeked',seeked);
   seam.pausedAt=performance.now();seam.atPause=evidence();a.pause();
  };
  window.addEventListener('sukun:backgroundownerchange',e=>{
   const d=e.detail;if(!d||d.owner!=='journey')return;
   seam.events.push({reason:d.reason,phase:d.phase,at:performance.now(),lease:d.lease,pending:d.lockRecoveryPending,kind:d.backgroundRecoveryKind,loopRecoveries:d.loopPauseRecoveries});
   if(seam.events.length>30)seam.events.shift();
   if(seam.pausedAt!==null&&d.phase==='INTERRUPTED'&&d.lockRecoveryPending&&!seam.pending){
    seam.pending=evidence();
    if(stop)Promise.resolve(SukunSessionState.command('stop')).then(r=>{seam.stopResult=r;},e=>{seam.error=String(e?.message||e);});
   }
  });
  a.addEventListener('seeking',seeking);a.addEventListener('seeked',seeked);
  Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});
  Object.defineProperty(document,'visibilityState',{configurable:true,get:()=>'hidden'});
  document.dispatchEvent(new Event('visibilitychange'));
 },{kind,stop});
 await p.waitForFunction(()=>window.__r1247LoopSeam?.pending,null,{timeout:25000,polling:20});
}
(async()=>{
 for(const kind of [28,99])for(const stop of [false,true]){
  const name=`${kind}: ${stop?'explicit Stop cancels pending loop recovery':'late native loop pause recovers the same source and caller'}`;
  console.log(JSON.stringify({name,status:'starting'}));let f,p;
  try{
   f=await fixture(root,{seed:{'sukun.kilitAcik':'true','sukun.onboardSeen':'1','sukun.obDone':'1','sukun.obSeenBuild':'"2026-08-06-r3"','sukun.zikir.quickControls.focus.v1':'1','sukun.r920.focus':'0'}});p=f.page;
   await setup(p,kind);await interrupt(p,kind,stop);
   if(stop){
    await p.waitForFunction(()=>window.__r1247LoopSeam?.stopResult,null,{timeout:6000});await p.waitForTimeout(900);
    const after=await state(p,kind);assert.equal(after.seam.stopResult.accepted,true,JSON.stringify(after.seam.stopResult));assert.equal(after.journey.run,false);assert.equal(after.journey.paused,false);assert.equal(after.phase,'IDLE');assert(after.media.paused||after.media.ended);assert.equal(after.owner.loopPauseRecoveries,after.seam.atPause.owner.loopPauseRecoveries);assert.equal(after.total,after.seam.pending.total);assert.equal(after.speech,0);assert(!after.seam.error);
    report.checks.push({name,passed:true,evidence:after});
   }else{
    await p.waitForFunction(kind=>{const s=window.__r1247LoopSeam,a=window.__sukJourneyNative?.a,j=(kind===28?SukunBerhetiyyeSeyir:SukunEsma99Seyir).state(),b=SukunBackgroundAudioOwner.snapshot();return s?.pending&&a===s.audio&&window.__sukJourneyNative.playUrl===s.source&&a.currentSrc===s.source&&!a.paused&&!a.ended&&!a.seeking&&a.readyState>=2&&a.currentTime>.2&&j.run&&!j.paused&&b.playing&&b.loopPauseRecoveries===s.atPause.owner.loopPauseRecoveries+1;},kind,{timeout:6000,polling:25});
    const first=await state(p,kind);await p.waitForTimeout(250);const after=await state(p,kind);
    assert(after.media.time>first.media.time+.05,'Same real native media cursor advances after recovery');assert(after.media.sameElement&&after.media.sameSource);assert.equal(after.journey.attemptSeq,after.seam.atPause.journey.attemptSeq);assert.equal(after.owner.lease,after.seam.atPause.owner.lease);assert.equal(after.journey.i,0);assert.equal(after.journey.rep,after.seam.pending.journey.rep);assert.equal(after.total,after.seam.pending.total);assert.equal(after.speech,0);assert(after.seam.pausedAt-after.seam.hiddenAt>1500,'Pause occurs after the lock-transition recovery window');assert.equal(after.seam.seek.trusted,true);assert(after.seam.events.some(e=>e.reason==='loop-boundary-recovered'),'Native owner reports completed recovery');assert(!after.seam.error);
    report.checks.push({name,passed:true,evidence:{first,after}});
   }
   const e=f.evidence();for(const [file,row]of Object.entries(e.served))assert.equal(row.sha256,hash(fs.readFileSync(path.join(root,file))),'Exact served bytes '+file);assert.deepEqual(e.pageErrors,[]);assert(!e.consoleErrors.some(x=>/integrity|digest|syntaxerror|referenceerror|typeerror/i.test(x)),e.consoleErrors.join('\n'));assert.deepEqual(e.failedRequests.filter(x=>!/^net::ERR_ABORTED$/.test(x.error||'')),[]);report.checks.at(-1).browser=f.browser.version();report.checks.at(-1).servedFiles=Object.keys(e.served).length;
  }catch(error){
   const row={name,passed:false,error:error.stack||String(error),state:p?await state(p,kind).catch(()=>null):null};if(report.checks.at(-1)?.name===name)report.checks[report.checks.length-1]=row;else report.checks.push(row);if(f)row.browserEvidence=f.evidence();
  }finally{if(f)await f.close();save();console.log(JSON.stringify({name,passed:report.checks.at(-1).passed}));}
 }
 report.finishedAt=new Date().toISOString();save();console.log(JSON.stringify({passed:report.passed,total:report.total,allPassed:report.allPassed,output}));if(!report.allPassed)process.exitCode=1;
})().catch(error=>{report.fatal=error.stack||String(error);save();console.error(report.fatal);process.exitCode=1;});
