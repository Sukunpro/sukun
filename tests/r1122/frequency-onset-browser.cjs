#!/usr/bin/env node
'use strict';
// Real HTMLMediaElement admission, with default Chromium autoplay policy.
// Controlled PCM/confirmation boundaries do not model acoustic Android output.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),{createRequire}=require('node:module');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const output=path.resolve(process.argv[3]||path.join(__dirname,'evidence/frequency-onset-browser.json'));
const fixturePath=path.join(root,'tests/r1064/browser-fixture.cjs');
const fixtureOriginal=fs.readFileSync(fixturePath,'utf8');
const autoplay="'--autoplay-policy=no-user-gesture-required',";
assert.equal(fixtureOriginal.split(autoplay).length-1,1,'Exactly one autoplay override removed');
const fixtureSource=fixtureOriginal.replace(autoplay,'');
const fixtureModule={exports:{}};
vm.runInNewContext(fixtureSource,{require:createRequire(fixturePath),module:fixtureModule,exports:fixtureModule.exports,__dirname:path.dirname(fixturePath),process,console,Buffer,setTimeout,clearTimeout,URL},{filename:fixturePath});
const {fixture,wav,hash}=fixtureModule.exports;
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const controllerPath=html.match(/src="\.\/(assets\/runtime\/background-mix-r\d+\.js)\?/)?.[1];assert(controllerPath);
const controllerSource=fs.readFileSync(path.join(root,controllerPath),'utf8');
const report={suite:'r1122 native frequency onset and admission',startedAt:new Date().toISOString(),browserExecuted:false,testSha256:hash(fs.readFileSync(__filename)),fixtureSha256:hash(fixtureOriginal),controllerPath,sourceHashes:Object.fromEntries(['index.html','nero.html',controllerPath].map(p=>[p,hash(fs.readFileSync(path.join(root,p)))])),checks:[],limitations:[
'Disposable Linux Chromium under default autoplay policy, not Android, physical screen lock, Bluetooth, OS audio focus, audible listening or acoustic-level acceptance.',
'Production controller bytes are injected unchanged into an isolated page with native AudioContext and HTMLMediaElement. Its renderer boundary returns a six-second synthetic audible WAV; deferred/rejected play promises are deliberate fault injection.',
'The shared app fixture has only its no-user-gesture-required launch flag removed. Spatial tests inspect production PannerNode construction in the full app; they do not measure HRTF acoustics.'
]};
let f;
function save(){report.total=report.checks.length;report.passed=report.checks.filter(x=>x.passed).length;report.allPassed=report.browserExecuted&&!report.fatal&&report.total>0&&report.passed===report.total;fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');}
async function check(name,run){try{report.checks.push({name,passed:true,evidence:await run()})}catch(error){report.checks.push({name,passed:false,error:error.stack})}save();console.log(JSON.stringify({name,passed:report.checks.at(-1).passed}));}
async function isolated(run){const p=await f.context.newPage();try{
 await p.goto('about:blank');await p.setContent('<button id="start">Start frequency</button><button id="resume">Resume frequency</button><button id="stop">Stop frequency</button>');
 await p.evaluate(({base64})=>{
  const c=new AudioContext(),out=c.createGain(),osc=c.createOscillator();out.gain.value=0;osc.frequency.value=180;osc.connect(out);out.connect(c.destination);osc.start();
  const bytes=Uint8Array.from(atob(base64),x=>x.charCodeAt(0));
  const T=window.__onset={c,out,playing:false,held:false,master:.7,liveMuted:false,mode:'normal',events:[],release:null};
  window.SukunBackgroundMixRenderer={render:async()=>({blob:new Blob([bytes],{type:'audio/wav'}),duration:6,sampleRate:8000,channels:1,peak:.016,rms:.01})};
  const original=HTMLMediaElement.prototype.play;
  T.observe=label=>{const a=document.getElementById('sukunBackgroundMixAudio');if(a&&a.dataset.sukSilentCarrier==='0')T.events.push({label,muted:a.muted,paused:a.paused,volume:a.volume,liveMuted:T.liveMuted,liveGain:out.gain.value,nativeTime:a.currentTime});};
  document.addEventListener('playing',()=>T.observe('playing-event'),true);
  HTMLMediaElement.prototype.play=function(...args){
   if(this.dataset.sukBackgroundMix!=='1'||this.dataset.sukSilentCarrier==='1')return original.apply(this,args);
   if(T.mode==='reject')return Promise.reject(new DOMException('Deliberate admission rejection','NotAllowedError'));
   const result=original.apply(this,args);
   return result.then(()=>{T.observe('native-play-resolved');if(T.mode==='hold')return new Promise(resolve=>{T.release=resolve});});
  };
 },{base64:wav(6,180).toString('base64')});
 await p.addScriptTag({content:controllerSource});
 await p.evaluate(()=>{
  const T=__onset;
  SukunBackgroundMix.bind({snapshot:()=>({ambiences:[],frequency:{playing:T.playing,c:180,b:8,mode:'bin',vol:.5},eq:{},sampleRate:8000}),held:()=>T.held,volume:()=>T.master,muteLive(value){T.liveMuted=value;T.out.gain.value=T.playing&&!value?.05*T.master:0;},resumeLive:()=>T.c.resume(),withContext:(_c,fn)=>fn()});
  document.getElementById('start').onclick=()=>{T.playing=true;T.out.gain.value=.05*T.master;T.c.resume();SukunBackgroundMix.changed('visible-start',{gesture:true});};
  document.getElementById('resume').onclick=()=>{T.c.resume();SukunBackgroundMix.resume('visible-resume');};
  document.getElementById('stop').onclick=()=>{T.playing=false;T.out.gain.value=0;SukunBackgroundMix.changed('visible-stop',{immediate:true});};
 });
 return await run(p);
 }finally{await p.close();}}
async function ready(p){await p.waitForFunction(()=>SukunBackgroundMix.snapshot().ready,null,{timeout:15000});}
async function flowing(p){const at=await p.evaluate(()=>document.getElementById('sukunBackgroundMixAudio').currentTime);await p.waitForFunction(t=>{const a=document.getElementById('sukunBackgroundMixAudio');return !a.paused&&!a.muted&&a.volume>0&&a.currentTime>t+.05},at,{timeout:5000});}
async function state(p){return p.evaluate(()=>({background:SukunBackgroundMix.snapshot(),liveMuted:__onset.liveMuted,liveGain:__onset.out.gain.value,events:__onset.events,audio:(()=>{const a=document.getElementById('sukunBackgroundMixAudio');return a?{paused:a.paused,muted:a.muted,volume:a.volume,time:a.currentTime}:null})()}));}
function noOverlap(s){assert(s.events.length>0,'Observe actual native playing');assert(s.events.every(x=>x.muted||x.paused||x.volume===0||x.liveMuted||x.liveGain===0),'No simultaneous audible native/live ownership');}
(async()=>{try{
 f=await fixture(root,{seed:{'sukun.obDone':'1','sukun.onboardSeen':'1','sukun.obSeenBuild':JSON.stringify('2026-08-06-r3'),'sukun.theme':'"feyz"'}});report.browser=f.browser.version();report.browserExecuted=true;
 await check('Fresh native admission is muted until live retirement, then native clock advances',()=>isolated(async p=>{await p.locator('#start').click();await ready(p);await flowing(p);const s=await state(p);noOverlap(s);assert(s.liveMuted&&!s.audio.muted&&!s.audio.paused);return s;}));
 await check('Native browser pause and visible Resume use one audible route',()=>isolated(async p=>{await p.locator('#start').click();await ready(p);await p.evaluate(()=>{__onset.events=[];const a=document.getElementById('sukunBackgroundMixAudio');a._sukunBackgroundPauseIntent=null;a.pause()});await p.waitForFunction(()=>!__onset.liveMuted);await p.locator('#resume').click();await ready(p);await flowing(p);const s=await state(p);noOverlap(s);return s;}));
 await check('Delayed fresh play confirmation cannot overlap or be unmuted by sync',()=>isolated(async p=>{await p.evaluate(()=>__onset.mode='hold');await p.locator('#start').click();await p.waitForFunction(()=>!!__onset.release);await p.evaluate(()=>SukunBackgroundMix.sync());const pending=await state(p);assert(pending.audio.muted&&!pending.liveMuted&&pending.liveGain>0);noOverlap(pending);await p.evaluate(()=>{__onset.mode='normal';__onset.release()});await ready(p);await flowing(p);return{pending,after:await state(p)};}));
 await check('Pending resume survives concurrent prepare, changed, sync and resume without silence',()=>isolated(async p=>{await p.locator('#start').click();await ready(p);await p.evaluate(()=>{const a=document.getElementById('sukunBackgroundMixAudio');a._sukunBackgroundPauseIntent=null;a.pause()});await p.waitForFunction(()=>!__onset.liveMuted);await p.evaluate(()=>{__onset.mode='hold';__onset.events=[]});await p.locator('#resume').click();await p.waitForFunction(()=>!!__onset.release);await p.evaluate(()=>{SukunBackgroundMix.prepare();SukunBackgroundMix.changed('same-key');SukunBackgroundMix.sync();SukunBackgroundMix.resume('concurrent')});const pending=await state(p);assert(pending.audio.muted&&!pending.liveMuted&&pending.liveGain>0);noOverlap(pending);await p.evaluate(()=>{__onset.mode='normal';__onset.release()});await ready(p);await flowing(p);return{pending,after:await state(p)};}));
 await check('Rejected native admission retains live graph and no native playback',()=>isolated(async p=>{await p.evaluate(()=>__onset.mode='reject');await p.locator('#start').click();await p.waitForFunction(()=>SukunBackgroundMix.snapshot().state==='ERROR');const s=await state(p);assert(!s.liveMuted&&s.liveGain>0&&s.audio.paused);return s;}));
 await check('Stop before delayed native confirmation prevents late revival',()=>isolated(async p=>{await p.evaluate(()=>__onset.mode='hold');await p.locator('#start').click();await p.waitForFunction(()=>!!__onset.release);await p.locator('#stop').click();await p.evaluate(()=>__onset.release());await p.waitForTimeout(250);const s=await state(p);assert(!s.background.active&&!s.background.playing&&s.liveGain===0&&s.audio.paused);return s;}));
 await check('Zero master remains digitally muted after admission',()=>isolated(async p=>{await p.evaluate(()=>__onset.master=0);await p.locator('#start').click();await ready(p);const s=await state(p);assert(s.liveMuted&&s.liveGain===0&&s.audio.volume===0);return s;}));
 await check('Production spatial panner has orbit position before graph connection',async()=>{
  const p=f.page;await p.waitForFunction(()=>!!window.SukunFrequencyR1120&&!!window.SukunBackgroundMix);
  const evidence=await p.evaluate(()=>{
   frStop();ac();const original=ctx.createPanner.bind(ctx),events=[];
   ctx.createPanner=function(){const node=original(),connect=node.connect.bind(node);node.connect=function(...args){events.push({x:node.positionX.value,y:node.positionY.value,z:node.positionZ.value,rolloff:node.rolloffFactor,ref:node.refDistance});return connect(...args)};return node;};
   try{const E=makeEnv();FR.uzam=true;FR.playing=false;const out=ctx.createGain();uzamKur(E,out);uzamDurdur();E.kill(0);FR.uzam=false;return events;}finally{ctx.createPanner=original;}
  });assert.equal(evidence.length,1);assert.equal(evidence[0].x,0);assert.equal(evidence[0].y,0);// Native AudioParam stores this position as Float32; retain exact equality.
  assert.equal(evidence[0].z,Math.fround(1.6));return evidence;
 });
 report.fixture=f.evidence();assert.equal(report.fixture.served['nero.html']?.sha256,report.sourceHashes['nero.html']);assert.equal(report.fixture.served[controllerPath]?.sha256,report.sourceHashes[controllerPath]);
}catch(error){report.fatal=error.stack;}finally{report.finishedAt=new Date().toISOString();if(f){report.fixture=f.evidence();await f.close()}save();console.log(JSON.stringify({output,passed:report.passed,total:report.total,allPassed:report.allPassed,fatal:report.fatal}));if(!report.allPassed)process.exitCode=1;}})();
