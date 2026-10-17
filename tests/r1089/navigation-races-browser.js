'use strict';
// Native companion to the controlled generation tests. Commands intentionally
// share one task for the race matrix; a separate case uses trusted dock clicks.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {fixture,wav,hash}=require('../r1064/browser-fixture.cjs');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const output=path.resolve(process.argv[3]||'/tmp/r1089-navigation-races-browser.json');
const requiredHash=process.env.SUKUN_QA_SOURCE_SHA256||'';
const selected=(process.env.SUKUN_QA_CASES||'').split(',').filter(Boolean);
const report={suite:'r1089 native smart navigation generations and terminal commands',startedAt:new Date().toISOString(),sourceSha256:hash(fs.readFileSync(path.join(root,'nero.html'))),testSha256:hash(fs.readFileSync(__filename)),checks:[],limitations:[
 'Disposable Linux Chromium, Classic/Feyz at 390×844 CSS pixels. No physical Samsung, Android screen-lock, real-device autoplay or audible recitation quality claim.',
 'Generated two-second PCM tones occupy disposable personal-recording keys. Native HTMLMediaElement clocks, currentTime, play, pause and ended are not replaced; application progress is observed after native completion.',
 'The four sub-60ms command races and rapid-navigation cases call actual production Player methods within one page.evaluate task. They establish the API/command boundary, not physical fast taps or interaction-gate behavior.',
 'The separately labelled dock case uses trusted Playwright click events through actual visible production controls. Programmatic queue preparation is not counted as UI input.',
 'Production source files are served byte-for-byte with service workers blocked. Audio observation wrappers only log native calls/events and return the original results.'
]};
let f,p;
const queue=()=>[0,1,2].map(idx=>({type:'zikir',cat:'koruma',idx,reps:7,gap:0,repeatMode:'fixed',advance:'auto'}));
function save(){report.total=report.checks.length;report.passed=report.checks.filter(c=>c.passed).length;report.allPassed=report.total>0&&report.total===report.passed;fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2))}
async function state(){return p.evaluate(()=>{const P=R170.Player;return{at:performance.now(),i:P.i,token:P.token,playing:P.playing,paused:P.paused,completed:P._r982CompletedReps||0,name:P.name,ids:P.queue.map(s=>s._r1082Id),smart:SukunSmartSessionR1082.snapshot(),current:currentZikirState.snapshot(),session:SukunSessionState.snapshot(),journal:SukunProgressJournal.read()?.smart||null,checkpoint:JSON.parse(localStorage.getItem('sukun.session.player.v2')||'null'),media:__r1089Media.map(a=>({id:a.__r1089Id,key:a._sukunRecordingKey||a.dataset.sukLockKey||'',time:a.currentTime,duration:a.duration,paused:a.paused,ended:a.ended})),events:__r1089Events.slice(),clicks:__r1089Clicks.slice(),speech:__r1064SpeechFixture.log.slice()}})}
async function check(name,fn){try{report.checks.push({name,passed:true,evidence:await fn()})}catch(error){report.checks.push({name,passed:false,error:error.stack||String(error),state:p?await state().catch(()=>null):null})}save();console.log(JSON.stringify({name,passed:report.checks.at(-1).passed}))}
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
async function races(){for(const nav of ['next','prev'])for(const terminal of ['pause','stop'])await check('Direct production '+nav+' then '+terminal+' remains held for four seconds with no late native playback or credit',async()=>{
 const before=await prepare(nav+' '+terminal+' generation',nav==='prev'?1:0);
 const command=await p.evaluate(({nav,terminal})=>{const P=R170.Player,at=performance.now();P[nav]();P[terminal]();return{at:performance.now(),elapsedMs:performance.now()-at,i:P.i,token:P.token,playing:P.playing,paused:P.paused,completed:P._r982CompletedReps||0,ids:P.queue.map(s=>s._r1082Id),speech:__r1064SpeechFixture.log.length,route:'direct production Player API; no DOM click'}},{nav,terminal});
 assert.equal(command.playing,false);assert.equal(command.paused,terminal==='pause');const samples=await holdSamples();assertHeld(samples,command,terminal);return{before,command,samples};
 })}
async function navigation(){
 for(const nav of ['next','prev'])await check('Legitimate '+nav+' keeps automatic continuation and enters exactly the selected native reading',async()=>{
  const before=await prepare('Legitimate '+nav,nav==='prev'?1:0),expected=nav==='next'?1:0;
  const command=await p.evaluate(nav=>{const at=performance.now();R170.Player[nav]();return{at,i:R170.Player.i,token:R170.Player.token}},nav);assert.equal(command.i,expected);
  await nativeAt(expected);const after=await state();assert.equal(after.i,expected);assert.equal(after.playing,true);assert.equal(after.paused,false);assert.deepEqual(after.ids,before.ids);assert.equal(readings(after).length,1);assert.equal(readings(after)[0].key,'koruma:'+expected);assert(late(after,command.at,'playing').some(e=>e.key==='koruma:'+expected));assert.equal(after.current.target,7);return{before,command,after};
 });
 for(const actions of [['next','next'],['next','prev','next']])await check('Rapid '+actions.join(' → ')+' preserves the latest selection and starts only that continuation',async()=>{
  const before=await prepare('Latest '+actions.join('-'));const command=await p.evaluate(actions=>{const at=performance.now(),P=R170.Player;for(const action of actions)P[action]();return{at,i:P.i,token:P.token}},actions);
  const expected=actions.length===2?2:1;assert.equal(command.i,expected);await nativeAt(expected);const after=await state();assert.equal(after.i,expected);assert.equal(after.playing,true);assert.equal(after.paused,false);assert.deepEqual(after.ids,before.ids);assert.equal(readings(after).length,1);assert.equal(readings(after)[0].key,'koruma:'+expected);assert(late(after,command.at,'playing').every(e=>e.key==='koruma:'+expected));assert.equal(after.current.target,7);return{before,command,after};
 });
}
async function dormant(){for(const mode of ['paused','idle'])await check('Navigation from an already '+mode+' session never creates an automatic continuation',async()=>{
 const before=await prepare('Dormant navigation '+mode);
 const command=await p.evaluate(mode=>{const P=R170.Player;mode==='paused'?P.pause():P.stop();P.next();return{at:performance.now(),i:P.i,token:P.token,playing:P.playing,paused:P.paused,completed:P._r982CompletedReps||0,speech:__r1064SpeechFixture.log.length}},mode);
 assert.equal(command.i,1);assert.equal(command.playing,false);assert.equal(command.paused,mode==='paused');await p.waitForTimeout(1250);const after=await state();assert.equal(after.i,1);assert.equal(after.token,command.token);assert.equal(after.playing,false);assert.equal(after.paused,mode==='paused');assert.equal(after.completed,command.completed);assert.equal(after.speech.length,command.speech);assert.deepEqual(readings(after),[]);assert.deepEqual(late(after,command.at,'playing'),[]);assert.deepEqual(late(after,command.at,'ended'),[]);return{before,command,after};
 })}
async function trustedDock(){await check('Trusted visible dock Next then Stop follows production UI handlers and remains stopped',async()=>{
 // The full matrix can legitimately reach Kandil's 60s idle screen between
 // API-only cases. Exercise its production show/close path without DOM edits.
 const overlay=await p.evaluate(()=>({at:performance.now(),shown:SukunKandil.show(),state:SukunKandil.snapshot()}));
 const before=await prepare('Trusted dock controls',0,{ui:true});
 if(overlay.shown){assert(before.clicks.some(c=>c.id==='kandil'&&c.trusted&&c.at>=overlay.at));assert.equal(await p.evaluate(()=>SukunKandil.snapshot().on),false)}
 await tap('#r1082StageNav [data-r1082-stage="listen"]');await tap('#r920DockNext');await nativeAt(1);const navigated=await state();assert.equal(navigated.i,1);
 await tap('#r588Stop');const held=await state(),command={at:held.at,i:held.i,token:held.token,completed:held.completed,ids:held.ids,speech:held.speech.length,checkpointUnfinished:!!held.checkpoint?.unfinished,journalUnfinished:!!held.journal?.unfinished};const samples=await holdSamples();assertHeld(samples,command,'stop',{retainedDraft:true});
 const clicks=samples.at(-1).clicks.filter(c=>c.at>before.at&&['r920DockNext','r588Stop'].includes(c.id));assert(clicks.some(c=>c.id==='r920DockNext'&&c.trusted));assert(clicks.some(c=>c.id==='r588Stop'&&c.trusted));return{route:'trusted Playwright visible production dock clicks; not physical Samsung taps',draftPolicy:'Global dock Stop may retain an inactive unfinished queue through P.stop(false); assert its draft flag stays unchanged while active remains false.',overlay,before,navigated,command,samples,clicks};
 })}
async function exact({group=true}={}){const verify=async()=>{
 const evidence=f.evidence();assert.deepEqual(evidence.pageErrors,[]);assert.deepEqual(evidence.failedRequests,[]);assert(!evidence.consoleErrors.some(e=>/integrity|digest|syntaxerror|referenceerror|typeerror/i.test(e)),evidence.consoleErrors.join('\n'));
 for(const [name,row]of Object.entries(evidence.served))assert.equal(row.sha256,hash(fs.readFileSync(path.join(root,name))),name+' changed after source freeze');assert.equal(hash(fs.readFileSync(path.join(root,'nero.html'))),report.sourceSha256);assert.equal(hash(fs.readFileSync(path.join(root,'index.html'))),report.sourceSha256);return{browser:f.browser.version(),servedFiles:Object.keys(evidence.served).length,evidence};
 };if(group)await check('Classic/Feyz native profile served authoritative unchanged source bytes without JavaScript or request failures',verify);else report.sourceVerification=await verify()}
(async()=>{await boot();if(!selected.length||selected.includes('matrix'))await races();if(!selected.length||selected.includes('navigation'))await navigation();if(!selected.length||selected.includes('dormant'))await dormant();if(!selected.length||selected.includes('ui'))await trustedDock();await exact({group:!(selected.length===1&&selected[0]==='ui')})})().catch(error=>{report.fatal=error.stack||String(error);console.error(error)}).finally(async()=>{if(f){report.finalState=await state().catch(()=>null);report.fixture=f.evidence();await f.close()}report.finishedAt=new Date().toISOString();report.testSha256=hash(fs.readFileSync(__filename));save();console.log(JSON.stringify({passed:report.passed,total:report.total,fatal:report.fatal,output}));if(!report.allPassed||report.fatal)process.exitCode=1});
