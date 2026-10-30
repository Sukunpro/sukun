#!/usr/bin/env node
'use strict';
// Targeted synthetic DSP stress, not an acoustic/hearing-safety claim.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {fixture,hash}=require('../r1064/browser-fixture.cjs');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const output=path.resolve(process.argv[3]||path.join(__dirname,'evidence/headroom-matrix-browser.json'));
const source=fs.readFileSync(path.join(root,'index.html'));
const base={mode:'bin',c:180,b:8,vol:1,pink:false,harmonik:0,harmSeri:'dogal',uzam:false,uzamHiz:22,wave:'sine',balL:1,balR:1,noise:'off',noiseVol:0,filterOn:false,lpf:2000,hpf:80,levelProfile:'balanced',secondary:{on:false,c:100,b:2.5}};
const stacked={harmonik:4,noise:'white',noiseVol:1,pink:true,secondary:{on:true,c:100,b:2.5}};
const cases=[
 ['legacy-bin-sine',{levelProfile:'legacy'}],['balanced-bin-sine',{}],
 ['stack-bin-square',{...stacked,wave:'square',mode:'bin'}],
 ['stack-mono-square',{...stacked,wave:'square',mode:'mono'}],
 ['stack-iso-square',{...stacked,wave:'square',mode:'iso'}],
 ['stack-mix-square',{...stacked,wave:'square',mode:'mix'}],
 ['stack-iso-sawtooth',{...stacked,wave:'sawtooth',mode:'iso'}],
 ['stack-iso-triangle',{...stacked,wave:'triangle',mode:'iso'}],
 ['octave-high-frequency',{...stacked,c:1100,harmSeri:'oktav'}],
 ['lp-resonant-sine',{mode:'iso',c:141.421356,filterOn:true,lpf:200,hpf:20}],
 ['lp-resonant-stack',{...stacked,mode:'mono',wave:'square',c:141.421356,filterOn:true,lpf:200,hpf:20}],
 ['hp-resonant-stack',{...stacked,mode:'iso',wave:'square',c:2828.42712,filterOn:true,lpf:8000,hpf:2000}],
 ['narrow-band-stack',{...stacked,mode:'mix',wave:'sawtooth',c:1900,filterOn:true,lpf:2000,hpf:1800}],
 ['upper-lp-resonance',{...stacked,mode:'iso',wave:'sine',c:5656.8542,filterOn:true,lpf:8000,hpf:20}],
 ['legacy-iso-stack',{...stacked,mode:'iso',wave:'square',levelProfile:'legacy'}]
].map(([id,v])=>({id,settings:{...base,...v}}));
const report={suite:'r1120 targeted live/offline headroom stress',build:fs.readFileSync(path.join(root,'version.txt'),'utf8').trim(),startedAt:new Date().toISOString(),browserExecuted:false,sourceSha256:hash(source),testSha256:hash(fs.readFileSync(__filename)),rendererSha256:hash(fs.readFileSync(path.join(root,'assets/runtime/background-mix-render-r1059.js'))),plannedCases:cases.length,cases:[],checks:[],limitations:[
 'Native Linux Chromium AudioContext and shipped OfflineAudioContext renderer. Synthetic full-scale settings and unity master; no user recordings, microphone, physical speakers/headphones, audible listening, SPL, clinical or hearing-safety measurement.',
 'Live measurements intentionally deny only background HTMLMediaElement admission with NotAllowedError to keep the fallback graph measurable. Offline render runs the exact shipped renderer with the same captured gain settings and a minimal synchronous context adapter; it includes the shipped limiter, warmup, seam and 0.95 peak normalization.',
 'Live left/right sample peaks/RMS use independent channel-split analyser taps for a 1-second sampled observation after settling, not an exhaustive phase search or inter-sample true-peak measurement. Offline metrics cover a 48-second stereo loop. Noise is native randomly generated, so live/offline RMS are not bitwise comparators.',
 'Frequency bus peak is reported separately from combined protected output. Passing the limiter ceiling does not prove every upstream bus is below full scale or establish safe device volume. Filter cases deliberately probe native Q response; live/offline filter parity is reported, not assumed.'
]};
let f,p;
function save(){report.total=report.cases.length+report.checks.length;report.passed=report.cases.filter(x=>x.passed).length+report.checks.filter(x=>x.passed).length;report.allPassed=!report.fatal&&report.cases.length===cases.length&&report.total===report.passed;fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n')}
async function measure(){return p.evaluate(async()=>{
 const inputs={frequency:FR.out,preLimiter:tizKes,postLimiter:limiter},taps={};
 for(const[key,node]of Object.entries(inputs)){
  const splitter=ctx.createChannelSplitter(2);node.connect(splitter);
  const channels=[0,1].map(ch=>{const a=ctx.createAnalyser();a.fftSize=4096;a.smoothingTimeConstant=0;splitter.connect(a,ch);return {a,buffer:new Float32Array(a.fftSize),peak:0,sum:0,count:0,finite:true}});
  taps[key]={node,splitter,channels};
 }
 // A newly connected analyser starts with an empty 4096-frame history. Wait
 // for native audio time to fill it before comparing independent profiles;
 // wall-clock scheduling under CI load otherwise biases the first profile.
 const tapWarmupFrames=4096,warmupAudioStart=ctx.currentTime,warmupWallStart=performance.now();
 while(ctx.currentTime-warmupAudioStart<tapWarmupFrames/ctx.sampleRate){
  if(performance.now()-warmupWallStart>5000)throw new Error('Native analyser history did not fill within 5 s');
  await new Promise(r=>setTimeout(r,15));
 }
 const tapWarmup={frames:tapWarmupFrames,audioSeconds:ctx.currentTime-warmupAudioStart,wallMs:performance.now()-warmupWallStart};
 let frames=0;const started=performance.now();
 while(performance.now()-started<1000){
  for(const tap of Object.values(taps))for(const t of tap.channels){t.a.getFloatTimeDomainData(t.buffer);for(const x of t.buffer){t.peak=Math.max(t.peak,Math.abs(x));t.sum+=x*x;t.count++;t.finite=t.finite&&Number.isFinite(x)}}
  frames++;await new Promise(r=>setTimeout(r,15));
 }
 const result={frames,tapWarmup,elapsedMs:performance.now()-started,sampleRate:ctx.sampleRate,limiterReduction:limiter.reduction,headroom:frHeadroom(),gain:frOutputLevel(),master:master.gain.value};
 for(const[k,t]of Object.entries(taps)){
  const count=t.channels.reduce((n,c)=>n+c.count,0),sum=t.channels.reduce((n,c)=>n+c.sum,0);
  result[k]={peak:Math.max(...t.channels.map(c=>c.peak)),rms:Math.sqrt(sum/count),finite:t.channels.every(c=>c.finite),samples:count,channels:t.channels.map((c,i)=>({channel:i===0?'left':'right',peak:c.peak,rms:Math.sqrt(c.sum/c.count),finite:c.finite,samples:c.count}))};
  t.node.disconnect(t.splitter);t.splitter.disconnect();t.channels.forEach(c=>c.a.disconnect());
 }
 return result;
})}
async function offline(){return p.evaluate(async()=>{const settings=SukunFrequencyR1120.capture();const snapshot={ambiences:[],frequency:{...settings,playing:true,harmonicRatios:(HARM_SERI[FR.harmSeri]||[]).slice(0,FR.harmonik),outputLevel:frOutputLevel(),pinkLevel:frAuxLevel(.12),secondaryLevel:frAuxLevel(.22),secondary:{playing:FR2.on,c:FR2.c,b:FR2.b}},eq:{bas:0,orta:0,tiz:0,komp:false},spatial:false,sampleRate:ctx.sampleRate};const result=await SukunBackgroundMixRenderer.render(snapshot,{withContext(next,fn){const previous=ctx;ctx=next;try{return fn()}finally{ctx=previous}},noise:type=>NOISE.get(type)});return {duration:result.duration,sampleRate:result.sampleRate,channels:result.channels,peak:result.peak,rms:result.rms,scaledBy:result.scaledBy,bytes:result.blob.size,nodes:result.nodes,virtualEvents:result.virtualEvents,frequency:result.frequency,secondary:result.secondaryFrequency,snapshot}})}
(async()=>{try{
 f=await fixture(root,{seed:{'sukun.obDone':'1','sukun.onboardSeen':'1','sukun.obSeenBuild':JSON.stringify('2026-08-06-r3'),'sukun.theme':'"feyz"'}});p=f.page;report.browser=f.browser.version();report.browserExecuted=true;if(await p.locator('#dailyCard').isVisible())await p.keyboard.press('Escape');await p.locator('#dailyCard').waitFor({state:'hidden'});await p.waitForFunction(()=>!window.SukunInteractionGateR732?.active?.());await p.locator('.tab[data-t="frq"]').click();await p.waitForFunction(()=>!!window.SukunFrequencyR1120);
 await p.evaluate(()=>{const original=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(...args){if(this.dataset.sukBackgroundMix==='1')return Promise.reject(new DOMException('Controlled matrix live-DSP observation','NotAllowedError'));return original.apply(this,args)}});
 for(const entry of cases){const row={...entry};try{
  await p.evaluate(async()=>{SukunAudioSessionRegistry.stopAll('r1120-headroom-reset');await SukunR698Transport.whenStopped()});await p.waitForTimeout(850);const applied=await p.evaluate(settings=>SukunFrequencyR1120.apply(settings),entry.settings);assert(applied.ok);
  await p.waitForFunction(()=>!window.SukunInteractionGateR732?.active?.());await p.locator('#frToggle').click();await p.waitForFunction(()=>FR.playing&&ctx.state==='running');await p.evaluate(()=>{document.querySelector('#masterVol').value=1;master.gain.value=1});await p.waitForTimeout(2400);row.live=await measure();row.offline=await offline();
  for(const key of ['frequency','preLimiter','postLimiter'])assert(row.live[key].finite&&row.live[key].rms>0,key+' finite audible signal');assert(row.live.postLimiter.peak<1,'Combined live protected sample peak below digital full scale');assert(row.offline.peak>0&&row.offline.peak<=.950001);assert(row.offline.rms>0&&Number.isFinite(row.offline.rms));assert(row.offline.scaledBy>0&&row.offline.scaledBy<=1);assert.equal(row.offline.channels,2);assert.equal(row.offline.duration,48);row.liveFrequencyBusBelowFullScale=row.live.frequency.peak<1;row.liveOfflineRmsRatio=row.live.postLimiter.rms/row.offline.rms;row.passed=true;
 }catch(e){row.passed=false;row.error=e.stack}report.cases.push(row);save();console.log(JSON.stringify({case:row.id,passed:row.passed,livePeak:row.live?.postLimiter.peak,offlinePeak:row.offline?.peak,offlineScale:row.offline?.scaledBy,error:row.error}))}
 try{const a=report.cases.find(c=>c.id==='legacy-bin-sine'),b=report.cases.find(c=>c.id==='balanced-bin-sine');assert(a.passed&&b.passed);const gainRatio=b.live.gain/a.live.gain,rmsRatio=b.live.frequency.rms/a.live.frequency.rms;assert.equal(gainRatio,2);assert(rmsRatio>1.9&&rmsRatio<=2.04);report.checks.push({name:'Measured simple balanced profile preserves the 2× target bound',passed:true,evidence:{gainRatio,rmsRatio}})}catch(e){report.checks.push({name:'Measured simple balanced profile preserves the 2× target bound',passed:false,error:e.stack})}
 try{const evidence=f.evidence();assert.deepEqual(evidence.pageErrors,[]);assert.deepEqual(evidence.failedRequests,[]);assert(!evidence.consoleErrors.some(x=>/integrity|digest|syntaxerror|referenceerror|typeerror/i.test(x)));for(const[name,row]of Object.entries(evidence.served))assert.equal(row.sha256,hash(fs.readFileSync(path.join(root,name))),name);assert.equal(report.sourceSha256,hash(fs.readFileSync(path.join(root,'index.html'))));assert.equal(report.testSha256,hash(fs.readFileSync(__filename)));report.checks.push({name:'Exact source and served resource provenance',passed:true,evidence:{servedFiles:Object.keys(evidence.served).length,pageErrors:evidence.pageErrors,failedRequests:evidence.failedRequests}})}catch(e){report.checks.push({name:'Exact source and served resource provenance',passed:false,error:e.stack})}
 }catch(e){report.fatal=e.stack;console.error(e)}finally{await f?.close();report.finishedAt=new Date().toISOString();save();console.log(JSON.stringify({passed:report.passed,total:report.total,cases:report.cases.length,allPassed:report.allPassed,output}));if(!report.allPassed)process.exitCode=1}})();
