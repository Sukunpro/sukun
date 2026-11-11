'use strict';
// Exact shipped app + real Chromium native media. The controlled seam delivers
// the captured production watchdog at a trusted native loop seek, with the
// transient seeking/HAVE_METADATA observation from the device report. It does
// not replace a caller, transport, counter, source, clock or play implementation.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {fixture,wav,hash}=require('../r1064/browser-fixture.cjs');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const output=path.resolve(process.argv[3]||'/tmp/r1248-browser-buffering.json');
const report={suite:'r1248 native loop buffering watchdog continuity',sourceSha256:hash(fs.readFileSync(path.join(root,'index.html'))),testSha256:hash(fs.readFileSync(__filename)),startedAt:new Date().toISOString(),checks:[],limitations:[
 'App files are served byte-for-byte in isolated Chromium profiles using generated WAV audio; device speech uses the existing controlled fixture.',
 'Visibility is simulated. Native playback, currentTime, loop seeking events and subsequent media progression are real. No physical Android screen-lock or audible-output claim is made.',
 'A timer observer captures the actual production watchdog callback and delivers it early at a trusted native seeking event. Only during that call, the real element reports seeking=true and readyState=1; the native descriptors are immediately restored.',
 'Stop coverage deliberately delivers the already-cancelled callback once to model a queued deadline. The real app decides whether that callback still has authority.',
 'A permanent decoder stall is not synthesized by freezing a fake media clock here; bounded permanent-stall expiry is covered by the production-code watchdog unit suite.'
]};
function save(){report.total=report.checks.length;report.passed=report.checks.filter(x=>x.passed).length;report.allPassed=report.total===5&&report.passed===5;fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');}
async function idle(p){await p.waitForFunction(()=>!window.SukunInteractionGateR732?.active?.());await p.waitForTimeout(100);}
async function tap(p,selector){await idle(p);assert(await p.locator(selector).isVisible(),'Visible control '+selector);await p.locator(selector).evaluate(el=>SukunViewportPolicy.scrollTo(el,{block:'center',behavior:'instant'},'r1248-buffering-control'));await p.waitForTimeout(250);await p.locator(selector).click({timeout:15000});await p.waitForTimeout(60);}
async function installTimerObserver(p,kind){
 await p.evaluate(kind=>{
  const schedule=window.setTimeout,cancel=window.clearTimeout,entries=[];
  const seam=window.__r1248Buffering={kind,entries,ops:[],boundary:null,hiddenAt:0,error:null};
  window.setTimeout=function(fn,delay,...args){
   const body=typeof fn==='function'?Function.prototype.toString.call(fn):'';
   if(!body.includes('ownsProgress')||!body.includes('journey'+kind))return schedule.call(this,fn,delay,...args);
   const row={fn,args,delay:Number(delay),id:0,active:true,status:'scheduled',createdAt:performance.now(),deliveries:0};entries.push(row);
   row.id=schedule.call(this,function(...actualArgs){row.active=false;row.status='natural-delivery';row.deliveries++;return fn(...actualArgs);},delay,...args);
   return row.id;
  };
  window.clearTimeout=function(id){const row=entries.find(x=>x.id===id);if(row&&row.active){row.active=false;row.status='cancelled-by-app';}return cancel.call(this,id);};
  seam.deliver=(row,reason)=>{if(!row)throw Error('No production watchdog captured');cancel.call(window,row.id);row.active=false;row.status=reason;row.deliveries++;row.deliveredAt=performance.now();return row.fn(...row.args);};
 },kind);
}
async function setup(p,kind){
 if(await p.locator('#dailyCard').isVisible())await p.keyboard.press('Escape');await p.locator('#dailyCard').waitFor({state:'hidden'});
 await p.evaluate(async()=>{KLT_AC('r1248-isolated-fixture');NIYET.on=NIYET.spk=NIYET.devir=false;ZA.kapali=true;SPK.on=true;Z.tick=Z.vib=Z.adv=false;KAYIT.yankiMik=0;KAYIT.mekan=false;await SukunVoiceSettings.setContent('legacy');await SukunVoiceSettings.setMode('personal');SukunR698VoiceIntent.explicit(true);});
 await p.evaluate(async({key,tone})=>{await REC_DB.set(key,new Blob([Uint8Array.from(atob(tone),c=>c.charCodeAt(0))],{type:'audio/wav'}));RECKEYS.add(key);},{key:kind===28?'berhet:0':'esma:0:nida',tone:wav(8,440).toString('base64')});
 await tap(p,'.tab[data-t="zkr"]');
 const selected=await p.evaluate(kind=>SukunSessionState.command('select',{mode:kind===28?'berhet':'esma',journeyKind:String(kind),index:0}),kind);assert.equal(selected.accepted,true,JSON.stringify(selected));
 await idle(p);if(await p.locator('#r938PanelToggle').getAttribute('aria-expanded')!=='true')await tap(p,'#r938PanelToggle');await p.locator('#r938PanelBody').waitFor({state:'visible'});
 if(!await p.locator('#r920JourneySettings').evaluate(n=>n.open))await tap(p,'#r920JourneySettings > summary');
 await p.locator('#r920RepeatMode').focus();await p.keyboard.press('End');await p.keyboard.press('Tab');await idle(p);assert.equal(await p.locator('#r920RepeatMode').inputValue(),'custom');
 await p.locator('#r920RepeatCustom').focus();await p.keyboard.press('Control+A');await p.keyboard.type('50');await p.keyboard.press('Tab');await idle(p);
 await p.locator('#r920RepeatGap').focus();await p.keyboard.press('Home');await p.keyboard.press('Tab');await idle(p);
 const settings=await p.evaluate(kind=>{const prefix=kind===28?'bs':'es99';return{mode:document.getElementById(prefix+'Mode').value,repeats:+document.getElementById(prefix+'Custom').value};},kind);assert.equal(settings.mode,'custom');assert.equal(settings.repeats,50);
 await installTimerObserver(p,kind);
 await p.waitForFunction(()=>!SukunTabOwner.snapshot().releasing&&!SukunTabOwner.snapshot().pending);await tap(p,'#r932EasyPlay');
 await p.waitForFunction(kind=>{const a=window.__sukJourneyNative?.a,j=(kind===28?SukunBerhetiyyeSeyir:SukunEsma99Seyir).state();return j.run&&!j.paused&&j.i===0&&a instanceof HTMLAudioElement&&!a.paused&&!a.ended&&!a.seeking&&a.readyState>=2&&a.currentTime>.2&&SukunBackgroundAudioOwner.snapshot().playing&&SukunLockJourneyTransportV2.snapshot().active&&window.__r1248Buffering.entries.some(x=>x.active);},kind,{timeout:18000,polling:50});
 await p.evaluate(kind=>{
  const s=window.__r1248Buffering,j=window.__sukJourneyNative,a=j.a;s.audio=a;s.source=j.playUrl;s.finish=a._sukunFinish;
  const state=()=>({at:performance.now(),time:a.currentTime,duration:a.duration,paused:a.paused,ended:a.ended,seeking:a.seeking,readyState:a.readyState,count:Z.count,total:Z.total,journey:(kind===28?SukunBerhetiyyeSeyir:SukunEsma99Seyir).state(),owner:SukunBackgroundAudioOwner.snapshot(),transport:SukunLockJourneyTransportV2.snapshot(),sameElement:window.__sukJourneyNative.a===a,sameSource:window.__sukJourneyNative.playUrl===s.source&&a.currentSrc===s.source,sameFinish:a._sukunFinish===s.finish});
  s.state=state;s.initial=state();
  for(const op of ['play','pause','load']){const native=a[op];a[op]=function(...args){s.ops.push({op,at:performance.now()});return native.apply(this,args);};}
 },kind);
}
async function state(p){return p.evaluate(()=>{const s=window.__r1248Buffering;if(!s)return null;return{current:s.state?.(),initial:s.initial,boundary:s.boundary,hiddenAt:s.hiddenAt,error:s.error,ops:s.ops,speech:__r1064SpeechFixture.log.length,phase:SukunSessionState.snapshot().phase,stopResult:s.stopResult,beforeStop:s.beforeStop,lateDelivery:s.lateDelivery,deep:s.deep,timers:s.entries.map(({id,delay,active,status,deliveries})=>({id,delay,active,status,deliveries}))};});}
async function bufferingBoundary(p){
 await p.evaluate(()=>{
  const s=window.__r1248Buffering,a=s.audio;
  const seek=e=>{
   if(s.boundary||!e.isTrusted||!document.hidden||performance.now()-s.hiddenAt<1500||a.currentTime>=.075||a.paused||!a.loop)return;
   a.removeEventListener('seeking',seek);
   const row=s.entries.slice().reverse().find(x=>x.active),ready=Object.getOwnPropertyDescriptor(a,'readyState'),seeking=Object.getOwnPropertyDescriptor(a,'seeking');
   s.boundary={trusted:e.isTrusted,nativeReady:a.readyState,nativeSeeking:a.seeking,before:s.state(),timerDelay:row?.delay,after:null,nextDelay:null};
   try{
    Object.defineProperty(a,'readyState',{configurable:true,get:()=>1});Object.defineProperty(a,'seeking',{configurable:true,get:()=>true});
    s.boundary.controlled={readyState:a.readyState,seeking:a.seeking};
    s.deliver(row,'delivered-at-native-seek');
    s.boundary.after=s.state();s.queued=s.entries.slice().reverse().find(x=>x.active);s.boundary.nextDelay=s.queued?.delay??null;
   }catch(error){s.error=String(error?.stack||error);}
   finally{if(ready)Object.defineProperty(a,'readyState',ready);else delete a.readyState;if(seeking)Object.defineProperty(a,'seeking',seeking);else delete a.seeking;}
  };
  a.addEventListener('seeking',seek);s.hiddenAt=performance.now();
  Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});Object.defineProperty(document,'visibilityState',{configurable:true,get:()=>'hidden'});document.dispatchEvent(new Event('visibilitychange'));
 });
 await p.waitForFunction(()=>window.__r1248Buffering?.boundary?.after||window.__r1248Buffering?.error,null,{timeout:23000,polling:20});
 const evidence=await state(p),b=evidence.boundary;assert(!evidence.error,evidence.error||'');assert(b?.trusted,'The boundary must be a genuine native seeking event');assert.equal(b.controlled.readyState,1);assert.equal(b.controlled.seeking,true);const physicalAge=b.before.transport.lastPhysicalProgressAgeMs;assert(typeof physicalAge==='number'&&Number.isFinite(physicalAge)&&physicalAge>=0&&physicalAge<6500,'The actual native loop supplied recent physical progress');
 assert.equal(b.after.journey.attemptSeq,b.before.journey.attemptSeq,'Buffering must not retire the current caller');assert(b.after.sameElement&&b.after.sameSource&&b.after.sameFinish,'Exact element, source and pending reader survive');assert.equal(b.after.paused,false,'The watchdog must not pause a live buffering source');assert.equal(b.after.owner.lease,b.before.owner.lease);assert.equal(b.after.count,b.before.count);assert.equal(b.after.total,b.before.total);assert.equal(b.after.journey.rep,b.before.journey.rep);assert.equal(b.nextDelay,5000,'Recent physical progress extends the production watchdog without a recovery or ambiguous-loop probe');assert.deepEqual(evidence.ops,[],'The observation invokes no play/pause/load operation');return evidence;
}
async function nativeProgress(p){
 await p.waitForFunction(()=>{const s=window.__r1248Buffering,a=s?.audio;return a&&!a.paused&&!a.ended&&!a.seeking&&a.readyState>=2&&a.currentTime>.25;},null,{timeout:6000,polling:25});
 const first=await state(p);await p.waitForTimeout(300);const after=await state(p),a=after.current,b=first.current;
 assert((a.time-b.time+a.duration)%a.duration>.08,'Genuine native media time advances after the controlled observation');assert(a.sameElement&&a.sameSource&&a.sameFinish);assert.equal(a.journey.attemptSeq,after.initial.journey.attemptSeq);assert(a.journey.run&&!a.journey.paused);assert.equal(a.owner.lease,after.initial.owner.lease);assert.equal(after.phase,'PLAYING');assert.equal(after.speech,0);assert.deepEqual(after.ops,[]);return{first,after};
}
async function stopDuringGrace(p){
 await p.evaluate(async()=>{const s=window.__r1248Buffering;s.beforeStop=s.state();s.stopResult=await SukunSessionState.command('stop');});
 await p.waitForTimeout(250);
 await p.evaluate(()=>{const s=window.__r1248Buffering;if(!s.queued)throw Error('Missing follow-up production deadline');s.lateDelivery={before:s.state(),statusBefore:s.queued.status};s.deliver(s.queued,'deliberately-delivered-after-stop');s.lateDelivery.after=s.state();});
 await p.waitForTimeout(500);const evidence=await state(p),a=evidence.current;assert.equal(evidence.stopResult.accepted,true);assert.equal(a.journey.run,false);assert.equal(a.journey.paused,false);assert.equal(evidence.phase,'IDLE');assert(a.paused||a.ended);assert.equal(a.total,evidence.beforeStop.total);assert.equal(a.count,evidence.beforeStop.count);assert.equal(evidence.lateDelivery.after.journey.attemptSeq,evidence.lateDelivery.before.journey.attemptSeq,'A queued stale watchdog cannot invalidate another attempt');assert.equal(evidence.lateDelivery.statusBefore,'cancelled-by-app','Stop cancels its production follow-up timer');assert(!evidence.timers.some(x=>x.active));assert(!evidence.ops.some(x=>x.op==='play'||x.op==='load'));assert.equal(evidence.speech,0);return evidence;
}
async function deepContinuity(p){
 await p.evaluate(async()=>{const s=window.__r1248Buffering;s.deep={before:s.state(),results:[]};const results=await SukunDiagnostics.runDeep();s.deep.results=results.map(x=>({area:x.area,name:x.name,status:x.status,ms:x.ms}));s.deep.after=s.state();});
 const evidence=await state(p),d=evidence.deep;assert(d.results.some(x=>x.area==='AUDIO-DEEP'),'The real public Deep Test ran');assert.equal(d.after.journey.attemptSeq,d.before.journey.attemptSeq);assert(d.after.sameElement&&d.after.sameSource&&d.after.sameFinish);assert.equal(d.after.owner.lease,d.before.owner.lease);assert(!d.after.paused&&!d.after.ended);assert.deepEqual(evidence.ops,[],'Deep Test must not operate on the live native media');return{diagnostics:evidence,progress:await nativeProgress(p)};
}
const cases=[...[28,99].flatMap(kind=>[false,true].map(stop=>({kind,stop,deep:false,name:`${kind}: native buffering deadline ${stop?'retains Stop cancellation':'preserves caller and genuine media progression'}`}))),{kind:28,stop:false,deep:true,name:'28: public Deep Test preserves a live native source'}];
(async()=>{
 for(const test of cases){let f,p;console.log(JSON.stringify({name:test.name,status:'starting'}));
  try{
   f=await fixture(root,{seed:{'sukun.kilitAcik':'true','sukun.onboardSeen':'1','sukun.obDone':'1','sukun.obSeenBuild':'"2026-08-06-r3"','sukun.zikir.quickControls.focus.v1':'1','sukun.r920.focus':'0'}});p=f.page;await setup(p,test.kind);
   let evidence;if(test.deep)evidence=await deepContinuity(p);else{const boundary=await bufferingBoundary(p);evidence={boundary,result:test.stop?await stopDuringGrace(p):await nativeProgress(p)};}
   const browserEvidence=f.evidence();for(const [file,row]of Object.entries(browserEvidence.served))assert.equal(row.sha256,hash(fs.readFileSync(path.join(root,file))),'Exact served bytes '+file);assert.deepEqual(browserEvidence.pageErrors,[]);assert(!browserEvidence.consoleErrors.some(x=>/integrity|digest|syntaxerror|referenceerror|typeerror/i.test(x)),browserEvidence.consoleErrors.join('\n'));assert.deepEqual(browserEvidence.failedRequests.filter(x=>!/^net::ERR_ABORTED$/.test(x.error||'')),[]);
   report.checks.push({name:test.name,passed:true,evidence,browser:f.browser.version(),servedFiles:Object.keys(browserEvidence.served).length});
  }catch(error){const row={name:test.name,passed:false,error:error.stack||String(error),state:p?await state(p).catch(()=>null):null};if(f)row.browserEvidence=f.evidence();report.checks.push(row);}
  finally{if(f)await f.close();save();console.log(JSON.stringify({name:test.name,passed:report.checks.at(-1).passed}));}
 }
 report.finishedAt=new Date().toISOString();save();console.log(JSON.stringify({passed:report.passed,total:report.total,allPassed:report.allPassed,output}));if(!report.allPassed)process.exitCode=1;
})().catch(error=>{report.fatal=error.stack||String(error);save();console.error(report.fatal);process.exitCode=1;});
