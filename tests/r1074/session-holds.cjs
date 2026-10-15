'use strict';
// Production-source contract tests. The complete session module and the exact
// shipped sfx function run in node:vm; DOM, native Stop, providers, and the shared
// AudioContext are controlled seams. This does not measure device audio, a full
// application event graph, Android lifecycle, or real browser media clocks.
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const sourcePath=path.join(root,'assets/runtime/session-r919.js');
const sessionSource=fs.readFileSync(sourcePath,'utf8');
const sha256=value=>crypto.createHash('sha256').update(value).digest('hex');
const results=[];
const sourceHashes={'assets/runtime/session-r919.js':sha256(sessionSource)};
const flush=async()=>{for(let i=0;i<12;i++)await Promise.resolve();};
async function test(name,run){
 try{await run();results.push({name,passed:true});}
 catch(error){results.push({name,passed:false,error:error.stack||String(error)});}
}

function cueFixture(entry){
 const html=fs.readFileSync(path.join(root,entry),'utf8');
 sourceHashes[entry]=sha256(html);
 const start=html.indexOf('function sfx(kind){');
 const end=html.indexOf('\nfunction mrClose(',start);
 assert(start>=0&&end>start,'production sfx boundary in '+entry);
 const calls={ac:0,resume:0,notes:0};
 const gate={registry:false,life:false};
 const noop=()=>{};
 const c={
  SukunAudioSessionRegistry:{aggregateSnapshot:()=>({paused:gate.registry})},
  AudioLife:{userPaused:false},
  ctx:{currentTime:0,state:'suspended',resume(){calls.resume++;this.state='running';return Promise.resolve();},
   createOscillator(){calls.notes++;return{frequency:{value:0},connect:noop,start:noop,stop:noop};}},
  master:{},wetIn:{},
  g:()=>({gain:{setValueAtTime:noop,linearRampToValueAtTime:noop,exponentialRampToValueAtTime:noop},connect:noop})
 };
 c.window=c;
 c.ac=()=>{calls.ac++;if(c.ctx.state==='suspended')c.ctx.resume();};
 vm.createContext(c);
 vm.runInContext(html.slice(start,end),c,{filename:entry+':production-sfx'});
 return{c,calls,gate,setHolds(registry,life){gate.registry=registry;c.AudioLife.userPaused=life;}};
}

function sessionFixture({kind='28',registry=false,life=false,pending=true}={}){
 const calls={primeGesture:0,markUserPlay:0,whenStopped:0,play:0,resume:0,intent:0};
 const gate={registry,life};
 const native={pendingStop:pending,intentEpoch:7};
 const current={cat:kind==='28'?'berhet':'esma',idx:0,count:13,total:145,target:100,auto:false};
 const journey={run:false,paused:false,systemHold:false,i:0,rep:13};
 const events=[];
 let resolveStop;
 const stopPromise=new Promise(resolve=>{resolveStop=resolve;});
 const noop=()=>{};
 const c={
  console,Promise,Object,String,Number,Math,Date,Set,Map,queueMicrotask,URLSearchParams,
  location:{search:''},navigator:{},SUKUN_BUILD:'r1074',
  CustomEvent:class{constructor(type,options){this.type=type;this.detail=options?.detail;}},
  addEventListener:noop,dispatchEvent(event){events.push(event);return true;},
  document:{readyState:'loading',visibilityState:'visible',addEventListener:noop,querySelector:()=>null,
   body:{classList:{contains:()=>false}}},
  currentZikirState:{snapshot:()=>({...current,name:'Synthetic selected name',length:kind==='28'?28:99,session:{active:false}})},
  SukunJourneyController:{target:()=>kind},
  SukunSecretPolicy:{unlocked:()=>true},
  SukunVoiceSettings:{checkReady:()=>true},
  SukunForegroundArbiter:{snapshot:()=>({owner:journey.run?{type:'journey'+kind}:null})},
  SukunAudioSessionRegistry:{aggregateSnapshot:()=>({paused:gate.registry})},
  SukunJourneyAudioMachine:{intent(){calls.intent++;}},
  SukunDirectZikirTransportR698:{primeGesture(){calls.primeGesture++;return true;}},
  SukunR698Transport:{snapshot:()=>({...native,direct:{auto:false,paused:false,starting:false}}),presentation:()=>({}),
   whenStopped(){calls.whenStopped++;return stopPromise;}},
  AudioLife:{get userPaused(){return gate.life;},_terminalIntent:false,snapshot:()=>({state:gate.life?'paused':'idle'}),
   markUserPlay(){calls.markUserPlay++;gate.life=false;return true;}},
  ZIKIR:{berhet:{items:[{}]},esma:{items:[{}]}}
 };
 const api={state:()=>({...journey}),display:()=>({index:0,name:'Synthetic journey',count:journey.rep,target:100}),
  play(){calls.play++;journey.run=true;return true;},resume(){calls.resume++;journey.run=true;journey.paused=false;return true;}};
 c[kind==='28'?'SukunBerhetiyyeSeyir':'SukunEsma99Seyir']=api;
 c.window=c;
 vm.createContext(c);
 vm.runInContext(sessionSource,c,{filename:sourcePath});
 return{c,calls,gate,native,journey,current,events,
  releaseStop(ok=true){native.pendingStop=false;resolveStop(ok);},
  diagnostic:()=>c.SukunSessionState.commandDiagnostics()};
}

(async()=>{
 for(const entry of ['index.html','nero.html']){
  for(const [name,registry,life]of [['registry hold',true,false],['lifecycle hold',false,true],['both global holds',true,true]]){
   await test(entry+': selection tick leaves shared audio asleep under '+name,async()=>{
    const h=cueFixture(entry);h.setHolds(registry,life);h.c.sfx('tick');await flush();
    assert.deepEqual(h.calls,{ac:0,resume:0,notes:0});
    assert.equal(h.c.ctx.state,'suspended');
    assert.equal(h.gate.registry,registry);assert.equal(h.c.AudioLife.userPaused,life);
   });
  }
  await test(entry+': tick plays normally after the explicit global hold is released',async()=>{
   const h=cueFixture(entry);h.setHolds(true,true);h.c.sfx('tick');
   h.setHolds(false,false);h.c.sfx('tick');await flush();
   assert.equal(h.calls.ac,1);assert.equal(h.calls.resume,1);assert.equal(h.calls.notes,1);
  });
 }
 for(const kind of ['28','99']){
  for(const [name,registry,life]of [['registry hold',true,false],['lifecycle hold',false,true],['both global holds',true,true]]){
   await test(kind+': pending-Stop Start is rejected before gesture priming under '+name,async()=>{
    const h=sessionFixture({kind,registry,life}),before={...h.current};
    const command=h.c.SukunSessionState.command('start');
    assert.equal(h.calls.primeGesture,0,'a rejected local Start must not unlock the shared graph');
    assert.equal(h.calls.markUserPlay,0,'a rejected local Start cannot clear lifecycle pause');
    h.releaseStop();const result=await command;await flush();
    assert.equal(result.accepted,false);assert.equal(h.diagnostic().reason,'global-pause');
    assert.equal(h.calls.play,0);assert.equal(h.calls.resume,0);assert.equal(h.calls.intent,0);
    assert.equal(h.gate.registry,registry);assert.equal(h.gate.life,life);
    assert.deepEqual(h.current,before);assert.equal(h.journey.run,false);
   });
  }
  await test(kind+': isolated released Start primes once, waits for Stop, then starts one owner',async()=>{
   const h=sessionFixture({kind}),before={...h.current};
   const command=h.c.SukunSessionState.command('start');
   assert.equal(h.calls.primeGesture,1);assert.equal(h.calls.markUserPlay,1);
   assert.equal(h.calls.whenStopped,1);assert.equal(h.calls.play,0,'native cleanup owns the stop barrier');
   h.releaseStop();const result=await command;await flush();
   assert.equal(result.accepted,true);assert.equal(h.calls.primeGesture,1);assert.equal(h.calls.markUserPlay,1);
   assert.equal(h.calls.play,1);assert.equal(h.calls.resume,0);assert.equal(h.journey.run,true);
   assert.deepEqual(h.current,before,'Start does not synthesize repeat credit or selection');
  });
  await test(kind+': a newly acquired global hold blocks a previously primed waiting Start',async()=>{
   const h=sessionFixture({kind}),command=h.c.SukunSessionState.command('start');
   assert.equal(h.calls.primeGesture,1);h.gate.registry=true;h.gate.life=true;
   h.releaseStop();const result=await command;await flush();
   assert.equal(result.accepted,false);assert.equal(h.diagnostic().reason,'global-pause');
   assert.equal(h.calls.play,0);assert.equal(h.journey.run,false);
   assert.equal(h.gate.registry,true);assert.equal(h.gate.life,true);
  });
  await test(kind+': cancelled pending native Stop cannot start a primed journey',async()=>{
   const h=sessionFixture({kind}),command=h.c.SukunSessionState.command('start');
   assert.equal(h.calls.primeGesture,1);h.native.intentEpoch++;
   h.releaseStop();const result=await command;await flush();
   assert.equal(result.accepted,false);assert.equal(h.diagnostic().reason,'superseded-command');
   assert.equal(h.calls.play,0);assert.equal(h.journey.run,false);
  });
 }
 const passed=results.filter(x=>x.passed).length;
 console.log(JSON.stringify({suite:'r1074 session global-pause source contracts',scope:'Exact production session module and extracted selection-cue function; controlled DOM/audio/provider/Stop endpoints. No native browser or physical-device result is claimed.',sourceHashes,total:results.length,passed,failed:results.length-passed,results},null,2));
 if(passed!==results.length)process.exitCode=1;
})().catch(error=>{console.error(error.stack||error);process.exitCode=1;});
