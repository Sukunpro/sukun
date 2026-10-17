'use strict';
// Execute shipping projection/restart functions with controlled state.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..')),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const a=html.indexOf('const currentZikirState=(()=>{'),b=html.indexOf('window.currentZikirState=currentZikirState;',a);assert(a>=0&&b>a);
const Z={cat:'berhet',idx:0,target:622,count:11,devir:2,targetMode:'ebced',total:87555};
const step={type:'zikir',cat:'koruma',idx:0,reps:7,gap:0,repeatMode:'duration',repeatForMs:30000,_r1082Id:'current'},P={queue:[step],i:0,playing:true,paused:false};
let projected=null;const ctx={Z,FR:{playing:false},ZIKIR:{koruma:{items:[{tr:'Felâk'}]},berhet:{items:[{tr:'Berhetîhin',eb:622}]}},R170:{Player:P},console,CustomEvent:class{},dispatchEvent(){},document:{body:{classList:{contains:()=>false}}}};ctx.window=ctx;ctx.SukunProgressJournal={stepIdentity:s=>JSON.stringify(s||null)};ctx.SukunSmartSessionR1082={progress:()=>projected};vm.createContext(ctx);vm.runInContext(html.slice(a,b)+'window.currentZikirState=currentZikirState;',ctx);
let passed=0;function check(fn){fn();passed++}const refresh=()=>ctx.currentZikirState.refresh('r1082-test',true);const budget=()=>({stepId:step._r1082Id,signature:ctx.SukunProgressJournal.stepIdentity(step),elapsedMs:12000,completed:3});
projected=budget();let s=refresh();check(()=>assert.equal(s.target,0));check(()=>assert.equal(s.count,3));check(()=>assert.equal(s.session.elapsedMs,12000));check(()=>assert.equal(s.session.remainingMs,18000));check(()=>assert.equal(Z.target,622));
projected={...budget(),stepId:'other'};s=refresh();check(()=>assert.equal(s.count,0));check(()=>assert.equal(s.session.elapsedMs,0));check(()=>assert.equal(s.session.remainingMs,30000));
projected={...budget(),signature:'wrong'};s=refresh();check(()=>assert.equal(s.count,0));check(()=>assert.equal(s.session.elapsedMs,0));
delete step._r1082Id;projected=budget();s=refresh();check(()=>assert.equal(s.count,0));check(()=>assert.equal(s.session.elapsedMs,0));step._r1082Id='current';
projected={...budget(),completed:NaN,elapsedMs:-10};s=refresh();check(()=>assert.equal(s.count,0));check(()=>assert.equal(s.session.elapsedMs,0));
step.repeatMode='manual';projected=budget();s=refresh();check(()=>assert.equal(s.count,3));check(()=>assert.equal(s.session.remainingMs,null));check(()=>assert.equal(s.targetMode,'manual'));
P.repeatIndex=99;projected=null;P.runtimeProgress=null;check(()=>assert.equal(refresh().count,0));
P.runtimeProgress=budget();check(()=>assert.equal(refresh().count,3));
P.playing=false;P.paused=true;check(()=>assert.equal(refresh().count,3));check(()=>assert.equal(refresh().session.paused,true));
P.paused=false;s=refresh();check(()=>assert.equal(s.source,'direct'));check(()=>assert.equal(s.target,622));
const restartA=html.indexOf('async function restartSmart(){'),restartB=html.indexOf('\nfunction actionText',restartA);assert(restartA>=0&&restartB>restartA);const restart=html.slice(restartA,restartB);
(async()=>{for(const playing of [false,true]){let plays=0,saves=0,clears=0;const q={playing,paused:!playing,token:1,_r982CompletedReps:4,_r982RepIndex:0,_r982RepStep:step,_r982RepSignature:'old',repeatIndex:5,stepStarted:9,runtimeProgress:{elapsedMs:12000,completed:3},pause(){this.playing=false;this.paused=true;this.token++},play(){plays++;this.playing=true;this.paused=false},save(){saves++}};const w={R170:{Player:q},SukunSmartSessionR1082:{clearStep(){clears++;q.runtimeProgress=null}}};const sandbox={window:w,smartActive:()=>true,setTimeout:f=>{f();return 1}};vm.createContext(sandbox);vm.runInContext(restart,sandbox);
 const ok=await sandbox.restartSmart();check(()=>assert.equal(ok,true));check(()=>assert.equal(q._r982CompletedReps,0));check(()=>assert.equal(q._r982RepIndex,-1));check(()=>assert.equal(q._r982RepStep,null));check(()=>assert.equal(q._r982RepSignature,''));check(()=>assert.equal(q.runtimeProgress,null));check(()=>assert.equal(q.stepStarted,0));check(()=>assert.equal(q.repeatIndex,0));check(()=>assert.equal(clears,1));check(()=>assert.equal(saves,1));check(()=>assert.equal(plays,playing?1:0));}
 console.log(JSON.stringify({suite:'r1082 projection and explicit restart',passed}));})().catch(e=>{console.error(e);process.exitCode=1});
