'use strict';
// Exercise the shipped legacy repair modules against the native owner's hold.
// Controlled clocks/providers verify authority and races, not physical devices.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const html=fs.readFileSync(process.env.SUKUN_TEST_HTML||path.join(root,'index.html'),'utf8');
const ids={machine:'r656-unified-journey-audio-machine',repair:'r645-journey-pause-repair'};
const sources=Object.fromEntries(Object.entries(ids).map(([key,id])=>{const source=html.split(`<script id="${id}">`)[1]?.split('</script>')[0];assert.ok(source,id);return[key,source]}));
function deferred(){let resolve;const promise=new Promise(r=>{resolve=r});return{promise,resolve}}
function fixture({kind='28',hidden=true,v2Active=true,phase='INTERRUPTED',blocked=false,preparing=false,lockRecoveryPending=false,modules=['machine'],revive,requestRecover}={}){
  let now=10000,nextId=0;const timers=new Map(),events=new Map();
  const state={run:false,paused:true,systemHold:true,i:6,rep:310,totalDone:1600,lastFailure:'native-lease-blocked'};
  const bg={active:true,owner:'journey',phase,blocked,preparing,lockRecoveryPending};
  const calls={resume:0,revive:0,requestRecover:0,prepare:0};
  const hub=()=>({addEventListener(name,fn){const list=events.get(name)||[];list.push(fn);events.set(name,list)},dispatchEvent(e){for(const fn of events.get(e.type)||[])fn(e)}});
  const document={...hub(),hidden,readyState:'loading',body:{dataset:{}}};
  const life={userPaused:false,state:'interrupted',lastUserAction:null,snapshot:()=>({...life}),reconcileUserPaused(){},set(){},requestRecover(){calls.requestRecover++;return requestRecover?requestRecover():Promise.resolve(true)}};
  const resume=()=>{calls.resume++;state.run=true;state.paused=false;state.systemHold=false;life.state='playing'};
  const callRevive=()=>{calls.revive++;return revive?revive():Promise.resolve(false)};
  const window={...hub(),AudioLife:life,SukunAudioHub:{userPaused:false},
    SukunBackgroundAudioOwner:{snapshot:()=>({...bg})},
    SukunAudioSessionRegistry:{aggregateSnapshot:()=>({paused:false}),reconcilePauseGate(){},sync(){}},
    SukunForegroundArbiter:{snapshot:()=>null},
    SukunAudioTruth:{snapshot:()=>({state:life.state,playing:state.run,paused:false,userPaused:false,life:{state:life.state}})},
    SukunLockJourneyTransportV2:{snapshot:()=>({active:v2Active,playing:false}),revive:callRevive},
    SukunLockContinuousTransport:{snapshot:()=>({nativeKey:kind==='28'?'berhet:6':'esma:6:nida'}),revive:callRevive},
    SukunVoiceSessionCoordinator:{prepareJourney(){calls.prepare++}},
    [kind==='28'?'SukunBerhetiyyeSeyir':'SukunEsma99Seyir']:{state:()=>({...state}),resume}
  };
  const clock={now:()=>now};
  const context={window,document,Date:clock,Promise,Math,String,Object,Set,CustomEvent:class{constructor(type,options={}){this.type=type;this.detail=options.detail}},
    setTimeout(fn,delay=0){const id=++nextId;timers.set(id,{fn,at:now+Number(delay)});return id},clearTimeout(id){timers.delete(id)}};
  for(const module of modules)vm.runInNewContext(sources[module],context,{filename:ids[module]});
  const flush=async()=>{for(let i=0;i<12;i++)await Promise.resolve()};
  async function advance(ms){const end=now+ms;let iterations=0;await flush();while(true){let pick;for(const entry of timers)if(entry[1].at<=end&&(!pick||entry[1].at<pick[1].at))pick=entry;if(!pick)break;assert.ok(++iterations<200,'timer loop must remain bounded');now=pick[1].at;timers.delete(pick[0]);pick[1].fn();await flush()}now=end;await flush()}
  return{window,document,state,bg,calls,advance,flush,life,machine:window.SukunJourneyAudioMachine,repair:window.SukunJourneyPauseRepair};
}
const results=[];
async function check(name,fn){try{await fn();results.push({name,passed:true})}catch(error){results.push({name,passed:false,error:error.message})}}
function retained(f){assert.equal(f.calls.resume,0,'Native hold must not create a new journey caller');assert.equal(f.state.systemHold,true);assert.equal(f.state.rep,310);assert.equal(f.state.totalDone,1600)}
(async()=>{
  for(const kind of ['28','99']){
    for(const [label,flags] of Object.entries({interrupted:{},blocked:{phase:'BLOCKED',blocked:true},preparing:{phase:'PREPARING',preparing:true},pending:{phase:'PLAYING',lockRecoveryPending:true}})){
      await check(`${kind}: hidden ${label} is owned only by native recovery`,async()=>{const f=fixture({kind,...flags,modules:['repair','machine']});f.machine.refresh('test',true);await f.advance(14000);retained(f);assert.equal(f.calls.revive,0,'Legacy repair must not compete with native recovery');assert.equal(f.calls.prepare,0)});
    }
    await check(`${kind}: visible return resumes held journey once`,async()=>{const f=fixture({kind,modules:['repair','machine']});f.machine.refresh('hidden',true);await f.advance(300);f.document.hidden=false;f.machine.refresh('visible',true);await f.advance(4000);assert.equal(f.calls.resume,1);assert.equal(f.state.systemHold,false);assert.equal(f.state.rep,310);assert.equal(f.state.totalDone,1600)});
    for(const intent of ['pause','stop'])await check(`${kind}: explicit ${intent} prevents visible recovery`,async()=>{const f=fixture({kind});f.machine.intent(intent,'user');f.document.hidden=false;f.machine.refresh('visible',true);await f.advance(3000);retained(f)});
    await check(`${kind}: machine rechecks native hold after hidden revive`,async()=>{const d=deferred(),f=fixture({kind,phase:'PLAYING',revive:()=>d.promise});f.machine.refresh('test',true);await f.advance(180);assert.equal(f.calls.revive,1);f.bg.phase='INTERRUPTED';d.resolve(false);await f.flush();await f.advance(3000);retained(f);assert.equal(f.calls.revive,1)});
    await check(`${kind}: machine rechecks native hold after visible await`,async()=>{const d=deferred(),f=fixture({kind,hidden:false,phase:'PLAYING',requestRecover:()=>d.promise});f.machine.refresh('test',true);await f.advance(120);assert.equal(f.calls.requestRecover,1);f.document.hidden=true;f.bg.phase='INTERRUPTED';d.resolve(false);await f.flush();await f.advance(3000);retained(f)});
    await check(`${kind}: inactive V2 legacy repair respects hidden hold`,async()=>{const f=fixture({kind,v2Active:false,modules:['repair']});assert.equal(await f.repair.repair('test'),false);await f.advance(6000);retained(f);assert.equal(f.calls.revive,0)});
    await check(`${kind}: legacy repair rechecks native hold after revive`,async()=>{const d=deferred(),f=fixture({kind,v2Active:false,phase:'PLAYING',modules:['repair'],revive:()=>d.promise});const pending=f.repair.repair('test');assert.equal(f.calls.revive,1);f.bg.phase='INTERRUPTED';d.resolve(false);await pending;await f.advance(3000);retained(f);assert.equal(f.calls.revive,1)});
    await check(`${kind}: legacy repair rechecks hold after visible await`,async()=>{const d=deferred(),f=fixture({kind,hidden:false,v2Active:false,phase:'PLAYING',modules:['repair'],requestRecover:()=>d.promise});const pending=f.repair.repair('test');assert.equal(f.calls.requestRecover,1);f.document.hidden=true;f.bg.phase='INTERRUPTED';d.resolve(false);await pending;await f.advance(3000);retained(f)});
    await check(`${kind}: legacy visible recovery remains available`,async()=>{const f=fixture({kind,hidden:false,v2Active:false,modules:['repair']});assert.equal(await f.repair.repair('visible'),true);assert.equal(f.calls.resume,1);assert.equal(f.state.rep,310)});
  }
  const failed=results.filter(x=>!x.passed);console.log(JSON.stringify({suite:'r1247 recovery owner integration',total:results.length,passed:results.length-failed.length,failed:failed.length,scope:'Exact shipped repair modules in Node VM; controlled clocks and native owner snapshots, no native-device/audio claim.',results},null,2));if(failed.length)process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1});
