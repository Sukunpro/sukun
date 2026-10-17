'use strict';
// Native companion to the controlled generation tests. Commands intentionally
// share one task for the race matrix; native media clocks remain unchanged.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {fixture,wav,hash}=require('../r1064/browser-fixture.cjs');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const output=path.resolve(process.argv[3]||'/tmp/r1090-deferred-continuation-browser.json');
const requiredHash=process.env.SUKUN_QA_SOURCE_SHA256||'';
const selected=(process.env.SUKUN_QA_CASES||'').split(',').filter(Boolean);
const report={suite:'r1090 native shared jump/restart continuation ownership',startedAt:new Date().toISOString(),sourceSha256:hash(fs.readFileSync(path.join(root,'nero.html'))),testSha256:hash(fs.readFileSync(__filename)),checks:[],limitations:[
 'Disposable Linux Chromium, Classic/Feyz at 390×844 CSS pixels. No physical Samsung, Android screen-lock, real-device autoplay or audible recitation quality claim.',
 'Generated two-second PCM tones occupy disposable personal-recording keys. Native HTMLMediaElement clocks, currentTime, play, pause and ended are not replaced; application progress is observed after native completion.',
 'Race cases call actual production timeline onclick/exported restart and terminal APIs within one page.evaluate task. Separate canonical cases call SukunSessionState.command and assert accepted:true. These measure command boundaries, not physical fast tap timing.',
 'Preparation cases hold an actual reads-only readwrite transaction in disposable sukunRec/clips and observe real pending readonly requests after source admission; exact r422 pre-admission receipt timing is covered separately by controlled source tests. Mixed cases run shipped rain and both WebAudio frequencies with unchanged context clocks.',
 'Production source files are served byte-for-byte with service workers blocked. Audio observation wrappers only log native calls/events and return the original results.'
]};
let f,p;
const queue=()=>[0,1,2].map(idx=>({type:'zikir',cat:'koruma',idx,reps:7,gap:0,repeatMode:'fixed',advance:'auto'}));
function save(){report.total=report.checks.length;report.passed=report.checks.filter(c=>c.passed).length;report.allPassed=report.total>0&&report.total===report.passed;fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2))}
async function state(){return p.evaluate(()=>{const P=R170.Player;return{at:performance.now(),i:P.i,token:P.token,playing:P.playing,paused:P.paused,completed:P._r982CompletedReps||0,name:P.name,ids:P.queue.map(s=>s._r1082Id),smart:SukunSmartSessionR1082.snapshot(),current:currentZikirState.snapshot(),session:SukunSessionState.snapshot(),journal:SukunProgressJournal.read()?.smart||null,checkpoint:JSON.parse(localStorage.getItem('sukun.session.player.v2')||'null'),media:__r1089Media.map(a=>({id:a.__r1089Id,key:a._sukunRecordingKey||a.dataset.sukLockKey||'',time:a.currentTime,duration:a.duration,paused:a.paused,ended:a.ended})),events:__r1089Events.slice(),clicks:__r1089Clicks.slice(),speech:__r1064SpeechFixture.log.slice()}})}
async function check(name,fn){if(selected.length&&!selected.some(k=>name.toLowerCase().includes(k.toLowerCase())))return;try{report.checks.push({name,passed:true,evidence:await fn()})}catch(error){report.checks.push({name,passed:false,error:error.stack||String(error),state:p?await state().catch(()=>null):null})}save();console.log(JSON.stringify({name,passed:report.checks.at(-1).passed}))}
async function idle(){await p.waitForFunction(()=>!SukunInteractionGateR732.active());await p.waitForTimeout(100)}
async function tap(selector){await idle();if(await p.locator('#kandil.on').isVisible()){await p.locator('#kandil.on').click({position:{x:20,y:20}});await idle()}await p.locator(selector).click();await idle()}
function readings(s){return s.media.filter(a=>/^koruma:/.test(a.key)&&!a.paused&&!a.ended)}
function late(s,at,type){return s.events.filter(e=>e.at>at&&e.type===type&&/^koruma:/.test(e.key)&&(type!=='playing'||!e.paused&&!e.ended))}
async function nativeAt(index){await p.waitForFunction(i=>R170.Player.playing&&!R170.Player.paused&&R170.Player.i===i&&__r1089Media.some(a=>a._sukunRecordingKey==='koruma:'+i&&!a.paused&&!a.ended&&a.currentTime>.04),index,{timeout:20000})}
async function prepare(name,index=0,{ui=false}={}){
 await p.evaluate(()=>PlaybackController.stop('smart-session'));await idle();
 await p.evaluate(({q,name,index})=>{R170.Player.set(q,name);R170.Player.i=index;R170.Player.save();SukunSessionEditor.render();SukunSmartSessionUIR1082.refresh()}, {q:queue(),name,index});await idle();
 if(ui){await p.evaluate(()=>{SukunSmartSessionUIR1082.open({reveal:false});SukunSessionEditor.render()});await tap('#r170StartSession')}
 else await p.evaluate(()=>PlaybackController.play('smart-session'));
 await nativeAt(index);return state();
}
async function holdSamples(){const samples=[];for(const ms of [1250,2750]){await p.waitForTimeout(ms);samples.push(await state())}return samples}
function assertHeld(samples,command,terminal,{retainedDraft=false}={}){for(const s of samples){
 assert.equal(s.playing,false);assert.equal(s.paused,terminal==='pause');assert.equal(s.token,command.token);assert.equal(s.completed,command.completed);assert.equal(s.i,command.i);assert.deepEqual(s.ids,command.ids);
 assert.deepEqual(readings(s),[]);assert.deepEqual(late(s,command.at,'playing'),[]);assert.deepEqual(late(s,command.at,'ended'),[]);assert.equal(s.speech.length,command.speech);
 assert.equal(!!s.current.session?.active,terminal==='pause');assert.equal(!!s.current.session?.playing,false);assert.equal(s.session.playing,false);
 assert.equal(s.checkpoint?.playing,false);assert.equal(s.checkpoint?.paused,terminal==='pause');assert.equal(s.checkpoint?.unfinished,retainedDraft?command.checkpointUnfinished:terminal==='pause');
 assert.equal(!!s.journal?.active,terminal==='pause');assert.equal(!!s.journal?.unfinished,retainedDraft?command.journalUnfinished:terminal==='pause');
 if(terminal==='pause'){assert.equal(s.current.target,7);assert.equal(s.current.count,command.completed);assert.equal(s.smart.pauseReason,'user')}
 }}
async function boot(){
 if(requiredHash)assert.equal(report.sourceSha256,requiredHash,'authoritative source hash changed before boot');
 assert.equal(hash(fs.readFileSync(path.join(root,'index.html'))),report.sourceSha256,'index and nero differ');
 f=await fixture(root,{width:390,height:844,seed:{'sukun.theme':'"feyz"'}});p=f.page;
 await p.waitForFunction(()=>!!window.SukunSmartSessionR1082&&!!window.SukunSmartSessionUIR1082);
 await p.evaluate(async bytes=>{
  NIYET.on=false;NIYET.spk=false;NIYET.devir=false;ZA.kapali=true;SPK.on=true;SukunR698VoiceIntent.explicit(true);Z.adv=false;Z.tick=false;Z.vib=false;KAYIT.yankiMik=0;KAYIT.mekan=false;
  await SukunVoiceSettings.setContent('legacy');await SukunVoiceSettings.setMode('personal');
  const blob=new Blob([Uint8Array.from(atob(bytes),v=>v.charCodeAt(0))],{type:'audio/wav'});for(const key of ['koruma:0','koruma:1','koruma:2']){await REC_DB.set(key,blob);RECKEYS.add(key)}
  window.__r1089Media=[];window.__r1089Events=[];window.__r1089Clicks=[];let serial=0;
  const seen=new WeakSet(),play=HTMLMediaElement.prototype.play,pause=HTMLMediaElement.prototype.pause;
  const note=(type,a)=>__r1089Events.push({type,id:a.__r1089Id,key:a._sukunRecordingKey||a.dataset.sukLockKey||'',time:a.currentTime,duration:a.duration,paused:a.paused,ended:a.ended,at:performance.now(),token:R170.Player.token,i:R170.Player.i,completed:R170.Player._r982CompletedReps||0});
  HTMLMediaElement.prototype.play=function(...args){if(!seen.has(this)){seen.add(this);this.__r1089Id=++serial;__r1089Media.push(this);for(const type of ['playing','ended','pause','error'])this.addEventListener(type,()=>note(type,this))}note('play-call',this);return play.apply(this,args)};
  HTMLMediaElement.prototype.pause=function(...args){if(this.__r1089Id)note('pause-call',this);return pause.apply(this,args)};
  document.addEventListener('click',e=>{const b=e.target.closest?.('button,#kandil');if(b)__r1089Clicks.push({id:b.id,trusted:e.isTrusted,at:performance.now(),i:R170.Player.i,playing:R170.Player.playing,paused:R170.Player.paused})},true);
 },wav(2,330).toString('base64'));
 await tap('.tab[data-t="zkr"]');report.presentation=await p.evaluate(()=>({layout:SukunLayoutModes.current(),appearance:SukunShellSkin.getAppearance()}));
 assert.equal(report.presentation.layout,'classic');assert.equal(report.presentation.appearance,'feyz');
}

async function command(method,terminal,boundary=false){return p.evaluate(({method,terminal,boundary})=>{
 const P=R170.Player;if(method==='timeline')document.querySelector('[data-jump="1"]').onclick();else window.__r1090RestartTask=__SUKUN_FLOW_NAV_OPS__.restartSmart();
 if(boundary)window.__r1090TerminalCommand=SukunSessionState.command(terminal);else if(terminal==='set')P.set([{type:'zikir',cat:'koruma',idx:2,reps:3,gap:0}],'Replacement');else P[terminal]();
 return{at:performance.now(),i:P.i,token:P.token,playing:P.playing,paused:P.paused,completed:P._r982CompletedReps||0,ids:P.queue.map(s=>s._r1082Id),speech:__r1064SpeechFixture.log.length,checkpointUnfinished:JSON.parse(localStorage.getItem('sukun.session.player.v2')||'null')?.unfinished,journalUnfinished:!!JSON.parse(localStorage.getItem('sukun.session.player.v2')||'null')?.unfinished,boundary,route:'actual production timeline onclick or exported restart operation, then Player terminal command in one evaluate task'};
 },{method,terminal,boundary})}
async function terminalCases(){for(const method of ['timeline','restart'])for(const terminal of ['pause','stop','set'])await check('Production '+method+' then '+terminal+' remains held with no late native playback or credit',async()=>{
 const before=await prepare(method+' '+terminal);await p.waitForFunction(()=>!!document.querySelector('[data-jump="1"]'));
 const cmd=await command(method,terminal),samples=await holdSamples();assertHeld(samples,cmd,terminal==='pause'?'pause':'stop');return{before,cmd,samples};
 })}
async function boundaryCases(){for(const method of ['timeline','restart'])for(const terminal of ['pause','stop'])await check('Actual session command '+method+' then '+terminal+' is accepted and remains authoritative',async()=>{
 const before=await prepare('Canonical '+method+' '+terminal),cmd=await command(method,terminal,true),result=await p.evaluate(()=>__r1090TerminalCommand);assert.equal(result.accepted,true);const samples=await holdSamples();assertHeld(samples,cmd,terminal,{retainedDraft:terminal==='stop'});return{before,cmd,result,samples};
 })}
async function selectionCases(){for(const method of ['timeline','restart'])await check('Actual selection during '+method+' retires pending smart continuation',async()=>{
 await prepare('Selection '+method);const cmd=await p.evaluate(async method=>{if(method==='timeline')document.querySelector('[data-jump="1"]').onclick();else window.__r1090RestartTask=__SUKUN_FLOW_NAV_OPS__.restartSmart();const result=await SukunSessionState.command('select',{mode:'esma',journeyKind:'single',index:2});return{at:performance.now(),token:R170.Player.token,result}},method);assert.equal(cmd.result.accepted,true);const samples=await holdSamples();for(const after of samples){assert.equal(after.playing,false);assert.equal(after.paused,false);assert.equal(after.token,cmd.token);assert.equal(after.current.cat,'esma');assert.equal(after.current.idx,2);assert.deepEqual(late(after,cmd.at,'playing'),[]);assert.equal(after.completed,0)}return{cmd,samples};
 })}
async function preparedCases(){for(const terminal of ['pause','stop'])await check('Actual canonical '+terminal+' while admitted source waits on a real IndexedDB transaction stays authoritative',async()=>{
 await prepare('Admitted storage preparation '+terminal);
 await p.evaluate(()=>new Promise((resolve,reject)=>{
  const original=IDBObjectStore.prototype.get,hold=window.__r1090ReadHold={active:true,expired:false,requests:[],original};
  IDBObjectStore.prototype.get=function(key){const request=original.call(this,key);if(this.name==='clips'&&this.transaction.db.name==='sukunRec'&&/^koruma:/.test(String(key))){const row={key:String(key),at:performance.now(),completed:false};hold.requests.push(row);request.addEventListener('success',()=>{row.completed=true;row.completedAt=performance.now()},{once:true});request.addEventListener('error',()=>{row.error=request.error?.name||'error'},{once:true})}return request};
  const open=indexedDB.open('sukunRec',1);open.onerror=()=>reject(open.error);open.onsuccess=()=>{
   const db=open.result,tx=db.transaction('clips','readwrite'),store=tx.objectStore('clips');hold.done=new Promise(done=>{tx.oncomplete=()=>{clearTimeout(hold.timer);db.close();done(true)};tx.onabort=()=>{clearTimeout(hold.timer);db.close();done(false)}});
   hold.release=()=>{hold.active=false;return hold.done};hold.timer=setTimeout(()=>{hold.expired=true;hold.active=false},6000);
   let announced=false;const keep=()=>{const request=store.get('r1090-disposable-read-hold');request.onsuccess=()=>{if(!announced){announced=true;resolve(true)}if(hold.active)keep()}};keep();
  };
 }));
 try{
  await p.evaluate(()=>document.querySelector('[data-jump="1"]').onclick());
  await p.waitForFunction(()=>__r1090ReadHold.requests.some(r=>r.key==='koruma:1'&&!r.completed)&&R170.Player.playing&&SukunSessionState.snapshot().phase==='PREPARING',null,{timeout:5000});
  const pending=await state(),readReceipt=await p.evaluate(()=>({requests:__r1090ReadHold.requests.map(r=>({...r})),expired:__r1090ReadHold.expired}));assert.equal(readReceipt.expired,false);assert.equal(pending.playing,true);assert.equal(pending.session.phase,'PREPARING');assert.equal(pending.completed,0);assert.deepEqual(readings(pending),[]);
  const cmd=await p.evaluate(async terminal=>{const result=await SukunSessionState.command(terminal),P=R170.Player;return{at:performance.now(),i:P.i,token:P.token,completed:P._r982CompletedReps||0,ids:P.queue.map(s=>s._r1082Id),speech:__r1064SpeechFixture.log.length,checkpointUnfinished:JSON.parse(localStorage.getItem('sukun.session.player.v2')||'null')?.unfinished,journalUnfinished:!!JSON.parse(localStorage.getItem('sukun.session.player.v2')||'null')?.unfinished,result}},terminal);assert.equal(cmd.result.accepted,true);
  const released=await p.evaluate(()=>__r1090ReadHold.release());assert.equal(released,true);const samples=await holdSamples();assertHeld(samples,cmd,terminal,{retainedDraft:terminal==='stop'});return{pending,readReceipt,cmd,released,samples,seam:'Native sukunRec/clips readwrite transaction issues only reads and delays real application readonly requests; media clocks, bytes, Promise results and completion events are not substituted',scope:'This is admitted source preparation. Exact pre-admission r422 continuation receipt races are separately covered by controlled source cases and native immediate-handoff commands.'};
 }finally{await p.evaluate(async()=>{const hold=window.__r1090ReadHold;if(hold){await hold.release?.();IDBObjectStore.prototype.get=hold.original}})}
 })}
async function mixedCases(){for(const terminal of ['pause','stop'])await check('Canonical pending '+terminal+' keeps real rain and both frequency graphs running',async()=>{
 await p.evaluate(()=>PlaybackController.stop('smart-session'));await p.evaluate(()=>{chVol.rain=.12;chOn(AMBIENT_DEFS.find(x=>x.id==='rain'));FR.c=180;FR.b=8;frStart();FR2.on=true;FR2.c=136.1;FR2.b=6;fr2Start();window.__r1090Mix={rain:AMB.rain,primary:FR.E,secondary:FR2.E,context:ctx};});await prepare('Mixed pending '+terminal);
 const mix=()=>p.evaluate(()=>({clock:ctx.currentTime,context:ctx.state,rain:!!AMB.rain,fr:FR.playing,secondary:!!FR2.E,sameRain:AMB.rain===__r1090Mix.rain,samePrimary:FR.E===__r1090Mix.primary,sameSecondary:FR2.E===__r1090Mix.secondary,sameContext:ctx===__r1090Mix.context,paused:AudioLife.userPaused,aggregatePaused:SukunAudioSessionRegistry.aggregateSnapshot().paused}));
 const before=await mix();assert.equal((await state()).playing,true);const cmd=await command('timeline',terminal,true),result=await p.evaluate(()=>__r1090TerminalCommand);assert.equal(result.accepted,true);const samples=await holdSamples();assertHeld(samples,cmd,terminal,{retainedDraft:terminal==='stop'});const after=await mix();for(const key of ['rain','fr','secondary','sameRain','samePrimary','sameSecondary','sameContext'])assert.equal(after[key],true,key);assert.equal(after.context,'running');assert.equal(after.paused,false);assert.equal(after.aggregatePaused,false);assert(after.clock>before.clock+2);await p.evaluate(()=>{chOff('rain');frStop();fr2Stop();FR2.on=false});return{before,cmd,result,samples,after};
 })}
async function legal(){for(const method of ['timeline','restart'])await check('Legitimate '+method+' resumes actual selected recording exactly once',async()=>{
 const before=await prepare('Legitimate '+method),cmd=await p.evaluate(method=>{const at=performance.now();if(method==='timeline')document.querySelector('[data-jump="1"]').onclick();else window.__r1090RestartTask=__SUKUN_FLOW_NAV_OPS__.restartSmart();return{at,i:R170.Player.i}},method);
 const index=method==='timeline'?1:0;await nativeAt(index);const after=await state();assert.equal(after.i,index);assert.equal(after.playing,true);assert.equal(after.paused,false);assert.equal(readings(after).length,1);assert.equal(readings(after)[0].key,'koruma:'+index);assert.equal(after.current.target,7);assert.equal(after.completed,0);assert(late(after,cmd.at,'playing').every(e=>e.key==='koruma:'+index));return{before,cmd,after};
 })}
async function rapid(){for(const methods of [['restart','next'],['timeline','restart'],['timeline','timeline']])await check('Rapid '+methods.join(' → ')+' resumes only the latest selected recording',async()=>{
 const before=await prepare('Rapid '+methods.join('-')),cmd=await p.evaluate(methods=>{const at=performance.now();for(const [n,method]of methods.entries()){if(method==='timeline')document.querySelector('[data-jump="'+(n?2:1)+'"]').onclick();else if(method==='restart')window.__r1090RestartTask=__SUKUN_FLOW_NAV_OPS__.restartSmart();else R170.Player[method]()}return{at,i:R170.Player.i}},methods);
 await nativeAt(cmd.i);const after=await state();assert.equal(after.playing,true);assert.equal(after.paused,false);assert.equal(readings(after).length,1);assert.equal(readings(after)[0].key,'koruma:'+cmd.i);assert(late(after,cmd.at,'playing').every(e=>e.key==='koruma:'+cmd.i));return{before,cmd,after};
 })}
async function dormant(){for(const method of ['timeline','restart'])for(const dormantState of ['pause','stop'])await check(method+' while '+dormantState+' does not create autoplay',async()=>{
 await prepare('Dormant '+method+' '+dormantState);const cmd=await p.evaluate(({method,state})=>{const P=R170.Player;P[state]();if(method==='timeline')document.querySelector('[data-jump="1"]').onclick();else window.__r1090RestartTask=__SUKUN_FLOW_NAV_OPS__.restartSmart();return{at:performance.now(),i:P.i,token:P.token,completed:P._r982CompletedReps||0,ids:P.queue.map(s=>s._r1082Id),speech:__r1064SpeechFixture.log.length}},{method,state:dormantState});
 await p.waitForTimeout(1250);const after=await state();assert.equal(after.playing,false);assert.equal(after.completed,cmd.completed);assert.equal(after.token,cmd.token);assert.deepEqual(readings(after),[]);assert.deepEqual(late(after,cmd.at,'playing'),[]);return{cmd,after};
 })}
async function exact(){await check('Byte-exact shipped app and native media remain free of source/SRI/JS errors',async()=>{const e=f.evidence();for(const[name,row]of Object.entries(e.served))assert.equal(row.sha256,hash(fs.readFileSync(path.join(root,name))),name+' changed during run');assert.equal(hash(fs.readFileSync(path.join(root,'nero.html'))),report.sourceSha256);assert.deepEqual(e.pageErrors,[]);assert.deepEqual(e.failedRequests,[]);assert(!e.consoleErrors.some(x=>/integrity|digest|syntaxerror|referenceerror|typeerror/i.test(x)));return{browser:f.browser.version(),servedFiles:Object.keys(e.served).length,evidence:e};})}
(async()=>{try{await boot();await preparedCases();if(report.checks.some(c=>!c.passed))throw Error('Source preparation fixture did not establish its controlled read hold');await terminalCases();await boundaryCases();await selectionCases();await legal();await rapid();await dormant();await mixedCases();await exact();}catch(error){report.fatal=error.stack||String(error)}finally{if(p)await p.evaluate(()=>R170.Player.stop()).catch(()=>{});if(f)await f.close();report.finishedAt=new Date().toISOString();save();console.log(JSON.stringify({passed:report.passed,total:report.total,output,fatal:report.fatal}));if(!report.allPassed||report.fatal)process.exitCode=1}})();
