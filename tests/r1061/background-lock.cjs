'use strict';
// Exercise the shipped controller at browser/OS media-event boundaries. Native
// media and the clock are controlled; this is not a physical Android lock test.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const root = path.resolve(process.argv[2] || path.join(__dirname, '../..'));
const controllerPath = path.join(root, 'assets/runtime/background-mix-r1059.js');
const source = fs.readFileSync(controllerPath, 'utf8');
const results = [];
const deferred = () => { let resolve, reject; const promise = new Promise((a,b) => {resolve=a;reject=b;});return {promise,resolve,reject}; };
const copy = value => JSON.parse(JSON.stringify(value));
class Events {
  constructor(){this.events=new Map();}
  addEventListener(type,fn){if(!this.events.has(type))this.events.set(type,new Set());this.events.get(type).add(fn);}
  removeEventListener(type,fn){this.events.get(type)?.delete(fn);}
  dispatchEvent(event){for(const fn of [...(this.events.get(event.type)||[])])fn.call(this,event);return true;}
}
function fixture(kind='combined', controllerSource=source) {
  let now=1000, serial=0, urlSerial=0, held=false, owns=true, master=.7, mutedLive=false, renderMode='resolved';
  const timers=new Map(), urls=new Map(), revoked=[], media=[], renders=[], muteCalls=[], resumeCalls=[], emitted=[];
  const window=new Events(), document=new Events();document.hidden=false;document.visibilityState='visible';
  const setTimeout=(fn,delay=0)=>{const id=++serial;timers.set(id,{fn,at:now+Math.max(0,Number(delay)||0),period:0});return id;};
  const setInterval=(fn,delay=1)=>{const id=++serial;timers.set(id,{fn,at:now+Math.max(1,Number(delay)||1),period:Math.max(1,Number(delay)||1)});return id;};
  const clearTimeout=id=>timers.delete(id), clearInterval=clearTimeout;
  class NativeAudio extends Events {
    constructor(){super();this.tagName='AUDIO';this.dataset={};this.style={};this.attrs={};this.paused=true;this.ended=false;this.readyState=4;this.networkState=1;this.error=null;this.srcObject=null;this.currentTime=0;this.currentSrc='';this.volume=1;this.muted=false;this.loop=false;this.duration=48;this.playbackRate=1;this.playCalls=0;this.pauseCalls=0;this.mode='resolved';this.pending=[];media.push(this);}
    get src(){return this._src||'';}set src(value){this._src=String(value||'');this.currentSrc=this._src;this.currentTime=0;}
    setAttribute(key,value){this.attrs[key]=String(value);}removeAttribute(key){delete this.attrs[key];if(key==='src')this.src='';}
    load(){this.currentSrc=this.src;}
    play(){this.playCalls++;const accept=()=>{this.paused=false;this.ended=false;this.currentSrc=this.src;this.dispatchEvent({type:'playing',target:this});};
      if(this.mode==='reject')return Promise.reject(Object.assign(new Error('NotAllowedError'),{name:'NotAllowedError'}));
      if(this.mode==='unconfirmed')return Promise.resolve();
      if(this.mode==='pending'){const job=deferred();this.pending.push({job,accept});return job.promise;}
      accept();return Promise.resolve();
    }
    resolvePlay({accept=true}={}){const pending=this.pending.shift();assert(pending,'expected a pending native play');if(accept)pending.accept();pending.job.resolve();}
    rejectPlay(){const pending=this.pending.shift();assert(pending,'expected a pending native play');pending.job.reject(Object.assign(new Error('NotAllowedError'),{name:'NotAllowedError'}));}
    pause(){this.pauseCalls++;const changed=!this.paused;this.paused=true;if(changed)this.dispatchEvent({type:'pause',target:this});}
    osPause(){this.paused=true;this.dispatchEvent({type:'pause',target:this});}
    osPlaying(){this.paused=false;this.ended=false;this.dispatchEvent({type:'playing',target:this});}
    remove(){this.isConnected=false;}
  }
  document.createElement=tag=>tag.toLowerCase()==='audio'?new NativeAudio():{style:{},dataset:{},setAttribute(){},remove(){}};
  document.body={appendChild(node){node.isConnected=true;return node;},dataset:{}};
  document.documentElement={dataset:{}};document.querySelectorAll=()=>media;document.getElementById=()=>null;document.hasFocus=()=>!document.hidden;
  const URL={createObjectURL(blob){const url='blob:lock-test-'+(++urlSerial);urls.set(url,blob);return url;},revokeObjectURL(url){revoked.push(url);urls.delete(url);}};
  const snapshot={ambiences:[],frequency:null,eq:{bass:1,mid:-1,treble:2},spatial:{enabled:true,mode:'8d'},sampleRate:44100};
  if(kind==='ambient'||kind==='combined')snapshot.ambiences=[{id:'sparrow',volume:.35,url:'',def:{id:'sparrow'}},{id:'rain',volume:.25,url:'',def:{id:'rain'}}];
  if(kind!=='ambient'&&kind!=='empty')snapshot.frequency={playing:true,mode:['bin','iso','mono','mix'].includes(kind)?kind:'bin',c:180,b:7.83,vol:.5};
  if(kind==='secondary')snapshot.frequency={playing:false,mode:'bin',c:180,b:7.83,vol:.5,secondary:{playing:true,c:136.1,b:6,mode:'iso',vol:.45}};
  const rendered={blob:new Blob([new Uint8Array([82,73,70,70,1,2,3,4,9,8,7,6])],{type:'audio/wav'}),duration:48,sampleRate:44100,channels:2,peak:.05,rms:.03};
  const renderer={render(state,adapter){const job={state:copy(state),adapter,result:rendered};renders.push(job);if(renderMode==='pending'){job.wait=deferred();return job.wait.promise;}if(renderMode==='reject')return Promise.reject(new Error('SyntheticRenderFailure'));return Promise.resolve(rendered);}};
  window.SukunBackgroundMixRenderer=renderer;window.AudioLife={get userPaused(){return held;},get _terminalIntent(){return held;}};window.SukunTabOwner={owns:()=>owns};window.Audio=NativeAudio;window.HTMLMediaElement=NativeAudio;
  window.addEventListener('sukun:backgroundmix',event=>emitted.push(copy(event.detail)));
  const adapter={snapshot:()=>copy(snapshot),volume:()=>master,held:()=>held,owns:()=>owns,muteLive(value){mutedLive=!!value;muteCalls.push(!!value);},resumeLive(){resumeCalls.push(now);return Promise.resolve(!held);},withContext(ctx,fn){return fn();}};
  const DateClock=class extends Date {static now(){return now;}};
  const context=vm.createContext({window,document,navigator:{mediaSession:{}},Audio:NativeAudio,HTMLMediaElement:NativeAudio,URL,Blob,ArrayBuffer,DataView,Uint8Array,AbortController,Date:DateClock,Math,Number,JSON,Map,Set,WeakSet,Promise,Error,TypeError,performance:{now:()=>now},setTimeout,clearTimeout,setInterval,clearInterval,queueMicrotask,console,CustomEvent:class {constructor(type,options={}){this.type=type;this.detail=options.detail;}},addEventListener:window.addEventListener.bind(window)});
  vm.runInContext(controllerSource,context,{filename:controllerPath});
  const controller=window.SukunBackgroundMix;assert(controller,'production controller export missing');controller.bind(adapter);
  function nativeProgress(ms){for(const audio of media)if(!audio.paused&&!audio.ended){audio.currentTime+=ms/1000*audio.playbackRate;if(audio.loop)audio.currentTime%=audio.duration;}}
  function advance(milliseconds,{freezeJS=false}={}){const target=now+milliseconds;if(freezeJS){nativeProgress(milliseconds);now=target;return;}let count=0;while(true){const next=[...timers].filter(([,job])=>job.at<=target).sort((a,b)=>a[1].at-b[1].at)[0];if(!next)break;assert(++count<1000,'unexpected timer storm');const [id,job]=next;const due=Math.max(now,job.at);nativeProgress(due-now);now=due;if(job.period)job.at=now+job.period;else timers.delete(id);job.fn();}nativeProgress(target-now);now=target;}
  async function flush(){for(let n=0;n<16;n++)await Promise.resolve();}
  async function settle(){for(let n=0;n<5;n++){advance(100);await flush();}}
  function hide(value=true){document.hidden=value;document.visibilityState=value?'hidden':'visible';document.dispatchEvent({type:'visibilitychange'});}
  const audible=()=>media.filter(audio=>!audio.paused&&!audio.ended&&audio.dataset.sukSilentCarrier==='0'&&urls.has(audio.src));
  return {window,document,controller,adapter,snapshot,media,timers,urls,revoked,renders,muteCalls,resumeCalls,emitted,advance,flush,settle,hide,audible,
    get now(){return now;},get mutedLive(){return mutedLive;},set held(value){held=!!value;},set owned(value){owns=!!value;},set volume(value){master=value;},set renderMode(value){renderMode=value;},
    resolveRender(index=renders.length-1){assert(renders[index]?.wait,'expected pending render');renders[index].wait.resolve(renders[index].result);},
    rejectRender(index=renders.length-1){assert(renders[index]?.wait,'expected pending render');renders[index].wait.reject(Object.assign(new Error('StaleOfflineRender'),{name:'AbortError'}));},
    async start(){controller.changed('start',{gesture:true});await settle();assert.equal(audible().length,1,'accepted native route');assert.equal(controller.snapshot().playing,true);assert.equal(emitted.at(-1).ready,true,'completion event must update visible readiness');return audible()[0];}};
}
async function test(name,body){try{await body();results.push({name,status:'PASS'});}catch(error){results.push({name,status:'FAIL',error:error.stack});}}
(async()=>{
  await test('Native pause on accepted visible output is reported as interrupted immediately',async()=>{
    const f=fixture(),audio=await f.start();audio.osPause();const state=f.controller.snapshot();assert.equal(state.playing,false);assert.equal(state.state,'INTERRUPTED');assert.equal(state.native.paused,true);assert.equal(f.emitted.at(-1).playing,false);assert.equal(f.emitted.at(-1).state,'INTERRUPTED');
  });
  for(const kind of ['ambient','bin','iso','mono','mix','combined','secondary'])await test(kind+' recovers one same-source OS pause at five seconds after lock',async()=>{
    const f=fixture(kind),audio=await f.start(),before=copy(f.renders[0].state),url=audio.src,plays=audio.playCalls,renders=f.renders.length;
    f.hide();f.advance(5000,{freezeJS:true});audio.osPause();assert.equal(f.controller.snapshot().state,'INTERRUPTED');assert.equal(f.controller.snapshot().playing,false);f.advance(120);await f.flush();
    assert.equal(audio.paused,false);assert.equal(audio.playCalls,plays+1);assert.equal(audio.src,url);assert.equal(f.renders.length,renders);assert.deepEqual(f.renders[0].state,before);assert.equal(f.controller.snapshot().state,'PLAYING');assert.equal(f.controller.snapshot().playing,true);assert.equal(f.emitted.at(-1).ready,true,'resume completion event cannot leave readiness stale');assert.equal(f.audible().length,1);assert.equal(f.mutedLive,true);
    const elapsed=audio.currentTime;f.advance(120000,{freezeJS:true});assert.equal(audio.paused,false);assert.notEqual(audio.currentTime,elapsed,'native clock progresses while JavaScript is frozen');assert.equal(audio.playCalls,plays+1);
  });
  await test('Ten ambience layers and both frequencies remain intact across lock recovery',async()=>{
    const f=fixture();f.snapshot.ambiences=Array.from({length:10},(_,index)=>({id:'ambient-'+index,volume:.15+index/100,url:'',def:{id:'ambient-'+index}}));f.snapshot.frequency.secondary={playing:true,c:136.1,b:6,mode:'iso',vol:.45};
    const expected=copy(f.snapshot),audio=await f.start(),url=audio.src,renders=f.renders.length;f.hide();f.advance(5000,{freezeJS:true});audio.osPause();f.advance(120);await f.flush();assert.equal(audio.paused,false);assert.equal(audio.src,url);assert.equal(f.renders.length,renders);assert.deepEqual(f.renders[0].state,expected);assert.equal(f.renders[0].state.ambiences.length,10);assert.equal(f.controller.snapshot().ready,true);assert.equal(f.audible().length,1);
  });
  await test('Recovery is bounded to one attempt for one hidden transition',async()=>{
    const f=fixture(),audio=await f.start();f.hide();f.advance(5000,{freezeJS:true});audio.osPause();f.advance(120);await f.flush();const plays=audio.playCalls;
    f.advance(1000);audio.osPause();f.advance(5000);await f.flush();assert.equal(audio.playCalls,plays);assert.equal(audio.paused,true);assert.equal(f.controller.snapshot().state,'INTERRUPTED');assert.equal(f.controller.snapshot().playing,false);
  });
  await test('Repeated hidden notifications cannot grant a second recovery attempt',async()=>{
    const f=fixture(),audio=await f.start();f.hide();f.advance(5000,{freezeJS:true});audio.osPause();f.advance(120);await f.flush();const plays=audio.playCalls;f.hide();audio.osPause();f.advance(2000);await f.flush();assert.equal(audio.playCalls,plays);assert(audio.paused);assert.equal(f.controller.snapshot().playing,false);
  });
  await test('Repeated hidden notifications cannot extend the original twelve-second window',async()=>{
    const f=fixture(),audio=await f.start(),plays=audio.playCalls;f.hide();f.advance(13000,{freezeJS:true});f.hide();audio.osPause();f.advance(1000);await f.flush();assert.equal(audio.playCalls,plays);assert(audio.paused);assert.equal(f.controller.snapshot().playing,false);
  });
  await test('A later OS focus pause outside the lock transition window stays interrupted',async()=>{
    const f=fixture(),audio=await f.start(),plays=audio.playCalls;f.hide();f.advance(13000,{freezeJS:true});audio.osPause();f.advance(2000);await f.flush();assert.equal(audio.playCalls,plays);assert.equal(audio.paused,true);assert.equal(f.controller.snapshot().state,'INTERRUPTED');assert.equal(f.controller.snapshot().playing,false);
  });
  await test('A pause immediately preceding the hidden edge can recover after lock',async()=>{
    const f=fixture(),audio=await f.start(),plays=audio.playCalls;audio.osPause();f.advance(100,{freezeJS:true});f.hide();f.advance(120);await f.flush();assert.equal(audio.playCalls,plays+1);assert.equal(audio.paused,false);assert.equal(f.controller.snapshot().playing,true);
  });
  await test('A stale visible pause cannot be reclassified as a fresh lock interruption',async()=>{
    const f=fixture(),audio=await f.start(),plays=audio.playCalls;audio.osPause();f.advance(1000,{freezeJS:true});f.hide();f.advance(2000);await f.flush();assert.equal(audio.playCalls,plays);assert.equal(audio.paused,true);assert.equal(f.controller.snapshot().playing,false);
  });
  await test('Explicit aggregate Pause cancels a scheduled hidden recovery',async()=>{
    const f=fixture(),audio=await f.start();f.hide();f.advance(5000,{freezeJS:true});audio.osPause();const plays=audio.playCalls;f.held=true;f.window.dispatchEvent({type:'sukun:audioaggregatechange'});f.advance(1000);await f.flush();
    assert.equal(audio.playCalls,plays);assert.equal(audio.paused,true);assert.equal(f.controller.snapshot().state,'PAUSED');assert.equal(f.controller.snapshot().playing,false);f.hide(false);await f.settle();assert.equal(audio.playCalls,plays);assert.equal(audio.paused,true);
  });
  await test('Global Stop cancels hidden recovery and retires the accepted source',async()=>{
    const f=fixture(),audio=await f.start(),url=audio.src;f.hide();f.advance(5000,{freezeJS:true});audio.osPause();const plays=audio.playCalls;f.snapshot.ambiences=[];f.snapshot.frequency=null;f.held=true;f.controller.changed('global-stop');f.advance(1000);await f.flush();
    assert.equal(audio.playCalls,plays);assert.equal(audio.paused,true);assert.equal(f.controller.snapshot().playing,false);assert.equal(f.controller.snapshot().prepared,false);assert.equal(f.audible().length,0);assert(f.revoked.includes(url));assert.equal(f.mutedLive,false);
  });
  await test('Independent ambience can recover after the foreground voice lease has finished',async()=>{
    const f=fixture('ambient'),audio=await f.start();f.hide();f.advance(5000,{freezeJS:true});audio.osPause();const plays=audio.playCalls;f.owned=false;f.advance(1000);await f.flush();assert.equal(audio.playCalls,plays+1);assert.equal(audio.paused,false);assert.equal(f.controller.snapshot().playing,true);
  });
  await test('A selection revision before scheduled recovery cannot replay obsolete media',async()=>{
    const f=fixture(),audio=await f.start();f.hide();f.advance(5000,{freezeJS:true});audio.osPause();const plays=audio.playCalls,renders=f.renders.length;f.snapshot.ambiences[0].volume=.63;f.advance(2000);await f.flush();assert.equal(audio.playCalls,plays);assert.equal(audio.paused,true);assert.equal(f.renders.length,renders);assert.equal(f.controller.snapshot().playing,false);
  });
  await test('Pagehide cancels a scheduled native recovery and unloads the mix',async()=>{
    const f=fixture(),audio=await f.start();f.hide();f.advance(5000,{freezeJS:true});audio.osPause();const plays=audio.playCalls;f.window.dispatchEvent({type:'pagehide'});f.advance(1000);await f.flush();assert.equal(audio.playCalls,plays);assert(audio.paused);assert.equal(f.controller.snapshot().prepared,false);assert.equal(f.controller.snapshot().playing,false);assert.equal(f.audible().length,0);
  });
  await test('Freeze cancels scheduled recovery without creating a background polling timer',async()=>{
    const f=fixture(),audio=await f.start();f.hide();f.advance(5000,{freezeJS:true});audio.osPause();const plays=audio.playCalls;f.document.dispatchEvent({type:'freeze'});f.advance(1000);await f.flush();assert.equal(audio.playCalls,plays);assert.equal(audio.paused,true);assert.equal(f.controller.snapshot().playing,false);assert.equal([...f.timers.values()].filter(job=>job.period).length,0);
  });
  await test('Aggregate Pause protects native playback even if the adapter hold is stale',async()=>{
    const f=fixture(),audio=await f.start();f.hide();f.advance(5000,{freezeJS:true});audio.osPause();const plays=audio.playCalls;f.window.SukunAudioSessionRegistry={aggregateSnapshot:()=>({paused:true})};f.controller.sync();f.advance(2000);await f.flush();assert.equal(audio.playCalls,plays);assert(audio.paused);assert.equal(f.controller.snapshot().state,'PAUSED');
  });
  await test('Explicit global Resume can restart an unchanged held source while still locked',async()=>{
    const f=fixture(),audio=await f.start();f.held=true;f.controller.sync();f.hide();const plays=audio.playCalls;f.held=false;f.controller.sync();await f.flush();assert.equal(audio.playCalls,plays,'ordinary hidden sync cannot resume a held source');
    audio.mode='pending';f.window.dispatchEvent({type:'sukun:audioaggregatechange',detail:{reason:'resumeAll',paused:false}});await f.flush();assert.equal(audio.playCalls,plays+1);assert.equal(audio.pending.length,1);assert.equal(f.controller.snapshot().ready,false);assert.equal(f.controller.snapshot().playing,false);
    f.window.dispatchEvent({type:'sukun:audioaggregatechange',detail:{reason:'resumeAll',paused:false}});await f.flush();assert.equal(audio.playCalls,plays+1,'one pending native resume request');audio.resolvePlay();await f.flush();assert.equal(audio.paused,false);assert.equal(f.controller.snapshot().ready,true);assert.equal(f.emitted.at(-1).ready,true);
  });
  await test('Explicit Resume notification cannot override the actual aggregate Pause gate',async()=>{
    const f=fixture(),audio=await f.start();let aggregatePaused=true;f.window.SukunAudioSessionRegistry={aggregateSnapshot:()=>({paused:aggregatePaused})};f.controller.sync();f.hide();const plays=audio.playCalls;
    f.window.dispatchEvent({type:'sukun:audioaggregatechange',detail:{reason:'resumeAll',paused:false}});await f.flush();assert.equal(audio.playCalls,plays);assert(audio.paused);assert.equal(f.controller.snapshot().ready,false);
    aggregatePaused=false;f.window.dispatchEvent({type:'sukun:audioaggregatechange',detail:{reason:'resumeAll',paused:false}});await f.flush();assert.equal(audio.playCalls,plays+1);assert.equal(audio.paused,false);assert.equal(f.controller.snapshot().ready,true);
  });
  await test('Microphone preparation, permission, recording and saving each cancel lock recovery',async()=>{
    for(const phase of ['permission','preparing','recording','stopping','saving']){
      const f=fixture(),audio=await f.start();f.hide();f.advance(5000,{freezeJS:true});audio.osPause();const plays=audio.playCalls;f.window.SukunItemRecording={snapshot:()=>({phase})};f.controller.sync();f.advance(2000);await f.flush();assert.equal(audio.playCalls,plays,phase+' must not recover');assert(audio.paused);assert.equal(f.controller.snapshot().playing,false);
    }
  });
  await test('A recovery timer delivered after the lock window cannot resume media',async()=>{
    const f=fixture(),audio=await f.start();f.hide();f.advance(5000,{freezeJS:true});audio.osPause();const plays=audio.playCalls;f.advance(8000,{freezeJS:true});f.advance(0);await f.flush();assert.equal(audio.playCalls,plays);assert(audio.paused);assert.equal(f.controller.snapshot().playing,false);
  });
  await test('Lock recovery rejection reports failure and never retries while hidden',async()=>{
    const f=fixture(),audio=await f.start();f.hide();f.advance(5000,{freezeJS:true});audio.mode='reject';audio.osPause();const plays=audio.playCalls;f.advance(120);await f.flush();assert.equal(audio.playCalls,plays+1);assert(audio.paused);assert.equal(f.controller.snapshot().playing,false);assert.equal(f.controller.snapshot().state,'ERROR');assert(f.controller.snapshot().error);f.advance(30000);f.controller.sync();await f.flush();assert.equal(audio.playCalls,plays+1);
  });
  await test('Resolved native play without playing confirmation cannot claim recovery',async()=>{
    const f=fixture(),audio=await f.start();f.hide();f.advance(5000,{freezeJS:true});audio.mode='unconfirmed';audio.osPause();f.advance(120);await f.flush();assert(audio.paused);assert.equal(f.controller.snapshot().playing,false);assert.notEqual(f.controller.snapshot().state,'PLAYING');assert(f.controller.snapshot().error);
  });
  await test('Explicit Pause while recovery play is pending defeats delayed playing acceptance',async()=>{
    const f=fixture(),audio=await f.start();f.hide();f.advance(5000,{freezeJS:true});audio.mode='pending';audio.osPause();f.advance(120);await f.flush();assert.equal(audio.pending.length,1);f.held=true;f.controller.sync();audio.resolvePlay();await f.flush();assert(audio.paused);assert.equal(f.controller.snapshot().playing,false);assert.equal(f.controller.snapshot().state,'PAUSED');
  });
  await test('Global Stop while recovery play is pending defeats delayed playing acceptance',async()=>{
    const f=fixture(),audio=await f.start();f.hide();f.advance(5000,{freezeJS:true});audio.mode='pending';audio.osPause();f.advance(120);await f.flush();assert.equal(audio.pending.length,1);f.snapshot.ambiences=[];f.snapshot.frequency=null;f.held=true;f.controller.changed('global-stop');audio.resolvePlay();await f.flush();assert(audio.paused);assert.equal(f.controller.snapshot().playing,false);assert.equal(f.controller.snapshot().prepared,false);assert.equal(f.audible().length,0);
  });
  await test('Visible cached resume also requires actual native playback confirmation',async()=>{
    const f=fixture(),audio=await f.start();audio.osPause();audio.mode='unconfirmed';await f.controller.prepare();await f.flush();assert(audio.paused);assert.equal(f.controller.snapshot().playing,false);assert.notEqual(f.controller.snapshot().state,'PLAYING');assert(f.controller.snapshot().error);
  });
  await test('Repeated prepare requests cannot duplicate a candidate awaiting native play acceptance',async()=>{
    const f=fixture();f.renderMode='pending';f.controller.changed('selection',{gesture:true});await f.settle();const audio=f.media[0];audio.mode='pending';const plays=audio.playCalls;f.resolveRender();await f.flush();assert.equal(audio.pending.length,1);assert.equal(audio.playCalls,plays+1);assert.equal(f.controller.snapshot().ready,false);
    const requests=[];for(let index=0;index<5;index++)requests.push(f.controller.prepare());await f.flush();assert.equal(audio.pending.length,1);assert.equal(audio.playCalls,plays+1,'same candidate has one native play request');audio.resolvePlay();await Promise.all(requests);await f.flush();assert.equal(f.controller.snapshot().ready,true);assert.equal(f.audible().length,1);assert.equal(f.renders.length,1);assert.equal(f.controller.snapshot().metrics.accepted,1);
  });
  await test('Same-value settings cannot cancel the initial native candidate awaiting play acceptance',async()=>{
    const f=fixture();f.renderMode='pending';f.controller.changed('selection',{gesture:true});await f.settle();const audio=f.media[0];audio.mode='pending';f.resolveRender();await f.flush();assert.equal(audio.pending.length,1);const plays=audio.playCalls,url=audio.src;
    for(let index=0;index<5;index++)f.controller.changed('same-value-setting');f.advance(500);await f.flush();assert.equal(f.renders.length,1);assert.equal(audio.pending.length,1);assert.equal(audio.playCalls,plays);assert.equal(f.renders[0].adapter.isCurrent(),true,'a no-op setting preserves the active preparation authority');assert.equal(f.controller.snapshot().ready,false);
    audio.resolvePlay();await f.flush();assert.equal(audio.src,url);assert.equal(audio.paused,false);assert.equal(f.controller.snapshot().ready,true);assert.equal(f.controller.snapshot().metrics.accepted,1);assert.equal(f.audible().length,1);
  });
  await test('Visible return resumes one unchanged interrupted source without new rendering',async()=>{
    const f=fixture(),audio=await f.start(),url=audio.src,renders=f.renders.length;f.hide();f.advance(13000,{freezeJS:true});audio.osPause();const plays=audio.playCalls;f.hide(false);await f.flush();assert.equal(audio.playCalls,plays+1);assert.equal(audio.src,url);assert.equal(f.renders.length,renders);assert.equal(f.controller.snapshot().playing,true);assert.equal(f.audible().length,1);
  });
  await test('Source URL mismatch is not accepted as playing or replayed at lock',async()=>{
    const f=fixture(),audio=await f.start();audio.src='blob:unrelated-resource';audio.paused=false;assert.equal(f.controller.snapshot().playing,false);const plays=audio.playCalls;f.hide();f.advance(5000,{freezeJS:true});audio.osPause();f.advance(1000);await f.flush();assert.equal(audio.playCalls,plays);assert.equal(f.controller.snapshot().playing,false);
  });
  await test('Hidden edge flushes selection debounce before JavaScript can freeze',async()=>{
    const f=fixture();f.controller.changed('ambience-selection');assert.equal(f.renders.length,0);f.hide();await f.flush();assert.equal(f.renders.length,1);await f.flush();assert.equal(f.controller.snapshot().playing,true);assert.equal(f.audible().length,1);const plays=f.audible()[0].playCalls;f.advance(120000,{freezeJS:true});assert.equal(f.audible().length,1);assert.equal(f.audible()[0].playCalls,plays);
  });
  await test('Unfinished offline preparation never claims native ready while locked',async()=>{
    const f=fixture();f.renderMode='pending';f.controller.changed('selection',{gesture:true});await f.settle();assert.equal(f.renders.length,1);f.hide();await f.flush();const state=f.controller.snapshot();assert.equal(state.prepared,false);assert.equal(state.playing,false);assert.equal(state.ready,false);assert.equal(state.preparing,true);assert.notEqual(state.state,'PLAYING');assert.equal(f.audible().length,0);
    f.resolveRender();await f.flush();assert.equal(f.controller.snapshot().playing,true);assert.equal(f.controller.snapshot().ready,true);assert.equal(f.emitted.at(-1).ready,true,'hidden preparation completion emits real readiness');assert.equal(f.audible().length,1);assert.equal(f.renders.length,1,'no extra offline graph allocated at hide');
  });
  await test('A render accepted shortly after lock can recover within the original lock window',async()=>{
    const f=fixture();f.renderMode='pending';f.controller.changed('selection',{gesture:true});await f.settle();f.hide();f.advance(1000,{freezeJS:true});f.resolveRender();await f.flush();const audio=f.audible()[0];assert(audio);const url=audio.src,plays=audio.playCalls;f.advance(4000,{freezeJS:true});audio.osPause();f.advance(120);await f.flush();assert.equal(audio.playCalls,plays+1);assert.equal(audio.src,url);assert.equal(audio.paused,false);assert.equal(f.renders.length,1);assert.equal(f.controller.snapshot().ready,true);
  });
  await test('A render accepted after the lock window cannot create a new automatic recovery window',async()=>{
    const f=fixture();f.renderMode='pending';f.controller.changed('selection',{gesture:true});await f.settle();f.hide();f.advance(13000,{freezeJS:true});f.resolveRender();await f.flush();const audio=f.audible()[0];assert(audio);const plays=audio.playCalls;audio.osPause();f.advance(1000);await f.flush();assert.equal(audio.playCalls,plays);assert.equal(audio.paused,true);assert.equal(f.renders.length,1);assert.equal(f.controller.snapshot().ready,false);assert.equal(f.controller.snapshot().playing,false);
  });
  await test('A render finishing while hidden respects explicit Pause',async()=>{
    const f=fixture();f.renderMode='pending';f.controller.changed('selection',{gesture:true});await f.settle();f.hide();f.held=true;f.controller.sync();f.resolveRender();await f.flush();assert.equal(f.audible().length,0);assert.equal(f.controller.snapshot().playing,false);assert.equal(f.controller.snapshot().prepared,false);assert.equal(f.renders.length,1);assert.equal(f.mutedLive,false);
  });
  await test('A render finishing while hidden respects global Stop',async()=>{
    const f=fixture();f.renderMode='pending';f.controller.changed('selection',{gesture:true});await f.settle();f.hide();f.snapshot.ambiences=[];f.snapshot.frequency=null;f.held=true;f.controller.changed('global-stop');f.resolveRender();await f.flush();assert.equal(f.audible().length,0);assert.equal(f.controller.snapshot().playing,false);assert.equal(f.controller.snapshot().prepared,false);assert.equal(f.renders.length,1);assert.equal(f.mutedLive,false);
  });
  await test('Muted, zero-volume, unready, ended and failed native media do not auto-replay at lock',async()=>{
    for(const fault of ['muted','zero','unready','ended','error']){
      const f=fixture(),audio=await f.start();f.hide();f.advance(5000,{freezeJS:true});if(fault==='muted')audio.muted=true;else if(fault==='zero'){f.volume=0;f.controller.sync();}else if(fault==='unready')audio.readyState=1;else if(fault==='ended')audio.ended=true;else audio.error={code:3};
      const plays=audio.playCalls;audio.osPause();f.advance(2000);await f.flush();assert.equal(audio.playCalls,plays,fault+' must not replay');assert.equal(f.controller.snapshot().playing,false,fault+' cannot report playing');
    }
  });
  await test('Native waiting/failure events report inactive playback without a retry heartbeat',async()=>{
    const f=fixture(),audio=await f.start();audio.readyState=1;audio.dispatchEvent({type:'waiting',target:audio});assert.notEqual(f.controller.snapshot().state,'PLAYING');assert.equal(f.controller.snapshot().ready,false);const plays=audio.playCalls;audio.error={code:3};audio.dispatchEvent({type:'error',target:audio});assert.equal(f.controller.snapshot().state,'ERROR');assert.equal(f.controller.snapshot().playing,false);assert.equal(f.controller.snapshot().ready,false);assert.equal(f.mutedLive,false);f.hide();f.advance(30000);await f.flush();assert.equal(audio.playCalls,plays);assert.equal([...f.timers.values()].filter(job=>job.period).length,0);
  });
  await test('Retuning does not label the obsolete accepted selection as currently ready',async()=>{
    const f=fixture(),audio=await f.start(),url=audio.src;assert.equal(f.controller.snapshot().ready,true);f.renderMode='pending';f.snapshot.frequency.c=256;f.controller.changed('retune');await f.settle();const state=f.controller.snapshot();assert.equal(audio.src,url);assert.equal(audio.paused,false,'prior native mix can bridge new offline preparation');assert.equal(state.currentSelectionPrepared,false);assert.equal(state.ready,false);assert.equal(state.preparing,true);f.resolveRender();await f.flush();assert.equal(f.controller.snapshot().ready,true);assert.equal(f.controller.snapshot().currentSelectionPrepared,true);assert.notEqual(audio.src,url);
  });
  for(const outcome of ['resolve','reject'])for(const restoreMethod of ['changed','prepare'])await test('Returning to accepted selection via '+restoreMethod+' survives stale render '+outcome,async()=>{
    const f=fixture();f.snapshot.ambiences=Array.from({length:10},(_,index)=>({id:'ambient-'+index,volume:.15+index/100,url:'',def:{id:'ambient-'+index}}));f.snapshot.frequency.secondary={playing:true,c:136.1,b:6,mode:'iso',vol:.45};
    const accepted=copy(f.snapshot),audio=await f.start(),url=audio.src,plays=audio.playCalls,acceptedCount=f.controller.snapshot().metrics.accepted;f.renderMode='pending';f.snapshot.ambiences.pop();f.snapshot.frequency.secondary.playing=false;f.controller.changed('stop-secondary-and-layer');await f.settle();assert.equal(f.renders.length,2);assert(f.renders[1].wait);assert.equal(f.renders[1].adapter.isCurrent(),true);assert.equal(audio.src,url);assert.equal(audio.paused,false);
    Object.assign(f.snapshot,copy(accepted));if(restoreMethod==='changed')f.controller.changed('restore-accepted-selection');else await f.controller.prepare();await f.flush();
    assert.equal(f.renders[1].adapter.isCurrent(),false,'obsolete renderer loses admission authority immediately');assert.equal(f.controller.snapshot().ready,true);assert.equal(f.controller.snapshot().preparing,false);assert.equal(f.controller.snapshot().state,'PLAYING');assert.equal(f.emitted.at(-1).ready,true);
    if(outcome==='resolve')f.resolveRender(1);else f.rejectRender(1);await f.flush();f.advance(500);await f.flush();
    assert.equal(audio.src,url,'accepted PCM remains the native resource');assert.equal(audio.paused,false);assert.equal(audio.playCalls,plays);assert.equal(f.renders.length,2,'obsolete work cannot allocate another graph');assert.equal(f.controller.snapshot().ready,true);assert.equal(f.controller.snapshot().playing,true);assert.equal(f.controller.snapshot().state,'PLAYING');assert.equal(f.controller.snapshot().error,'');assert.equal(f.controller.snapshot().metrics.accepted,acceptedCount);assert.equal(f.revoked.includes(url),false);assert.equal(f.urls.has(url),true);assert.equal(f.urls.size,1);assert.equal(f.audible().length,1);
  });
  await test('A slider returning to its accepted value cancels an unallocated debounce',async()=>{
    const f=fixture(),audio=await f.start(),accepted=copy(f.snapshot),url=audio.src,plays=audio.playCalls,renders=f.renders.length;f.snapshot.frequency.c=400;f.controller.changed('slider-outward');Object.assign(f.snapshot,copy(accepted));f.controller.changed('slider-return');await f.flush();assert.equal(f.controller.snapshot().ready,true);assert.equal(f.controller.snapshot().state,'PLAYING');assert.equal(f.emitted.at(-1).ready,true);f.advance(1000);await f.flush();assert.equal(f.renders.length,renders);assert.equal(audio.playCalls,plays);assert.equal(audio.src,url);assert.equal(audio.paused,false);assert.equal(f.controller.snapshot().ready,true);assert.equal(f.timers.size,0);
  });
  for(const intent of ['Pause','Stop'])for(const outcome of ['resolve','reject'])await test(intent+' after restoring accepted selection fences stale render '+outcome,async()=>{
    const f=fixture(),audio=await f.start(),accepted=copy(f.snapshot),url=audio.src;f.renderMode='pending';f.snapshot.frequency.c=256;f.controller.changed('retune');await f.settle();assert.equal(f.renders.length,2);Object.assign(f.snapshot,copy(accepted));f.controller.changed('restore-accepted-selection');await f.flush();assert.equal(f.controller.snapshot().ready,true);
    f.held=true;if(intent==='Stop'){f.snapshot.ambiences=[];f.snapshot.frequency=null;f.controller.changed('global-stop');}else f.controller.sync();const plays=audio.playCalls;if(outcome==='resolve')f.resolveRender(1);else f.rejectRender(1);await f.flush();f.hide();f.advance(2000);await f.flush();assert.equal(audio.paused,true);assert.equal(audio.playCalls,plays);assert.equal(f.audible().length,0);assert.equal(f.controller.snapshot().playing,false);assert.equal(f.controller.snapshot().ready,false);assert.equal(f.controller.snapshot().state,intent==='Stop'?'IDLE':'PAUSED');assert.equal(f.renders.length,2);
    if(intent==='Stop'){assert.equal(f.controller.snapshot().prepared,false);assert.equal(f.revoked.includes(url),true);}else{assert.equal(audio.src,url);assert.equal(f.controller.snapshot().prepared,true);assert.equal(f.revoked.includes(url),false);}
  });
  await test('Missing or invalid native duration cannot produce a ready lock label',async()=>{
    for(const duration of [0,NaN,Infinity]){const f=fixture(),audio=await f.start();audio.duration=duration;assert.equal(f.controller.snapshot().ready,false);}
  });
  const failed=results.filter(result=>result.status==='FAIL');console.log(JSON.stringify({source:controllerPath,sourceSha256:crypto.createHash('sha256').update(source).digest('hex'),total:results.length,passed:results.length-failed.length,failed:failed.length,scope:'Actual production controller with controlled native media events, offline preparation and wall clock; no physical phone lock or speaker-audibility claim.',results},null,2));if(failed.length)process.exitCode=1;
})();
