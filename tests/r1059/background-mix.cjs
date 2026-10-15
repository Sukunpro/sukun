'use strict';
// Execute the shipped native mix controller against controlled DOM, media and
// preparation boundaries. The native clock advances while every JS timer is
// frozen and the live AudioContext is suspended; this is not a phone audibility
// result. The actual PCM renderer is covered by the separate renderer suite.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(process.argv[2] || path.join(__dirname, '../..'));
const source = fs.readFileSync(path.join(root, 'assets/runtime/background-mix-r1059.js'), 'utf8');
const baseline = path.resolve(process.argv[3] || path.join(root, '../sukun-r1058'));
const results = [];
const deferred = () => { let resolve, reject; const promise = new Promise((a,b) => { resolve=a; reject=b; }); return {promise,resolve,reject}; };
const clone = v => JSON.parse(JSON.stringify(v));
function pcm() {
  const samples=48000,bytes=new ArrayBuffer(44+samples*4),d=new DataView(bytes);
  const word=(at,value)=>{for(let i=0;i<value.length;i++)d.setUint8(at+i,value.charCodeAt(i));};
  word(0,'RIFF');d.setUint32(4,bytes.byteLength-8,true);word(8,'WAVE');word(12,'fmt ');
  d.setUint32(16,16,true);d.setUint16(20,1,true);d.setUint16(22,2,true);d.setUint32(24,1000,true);
  d.setUint32(28,4000,true);d.setUint16(32,4,true);d.setUint16(34,16,true);word(36,'data');d.setUint32(40,samples*4,true);
  for(let i=0;i<samples;i++){d.setInt16(44+i*4,Math.round(1600*Math.sin(i*.2)),true);d.setInt16(46+i*4,Math.round(1400*Math.sin(i*.21)),true);}
  return {blob:new Blob([bytes],{type:'audio/wav'}),duration:48,sampleRate:1000,channels:2,peak:.049,rms:.03};
}
class Events {
  constructor(){this.events=new Map();}
  addEventListener(type,fn){if(!this.events.has(type))this.events.set(type,new Set());this.events.get(type).add(fn);}
  removeEventListener(type,fn){this.events.get(type)?.delete(fn);}
  dispatchEvent(event){for(const fn of [...(this.events.get(event.type)||[])])fn.call(this,event);return true;}
}
function fixture(selection='combined') {
  let now=0,id=0,urlId=0,held=false,owned=true,masterVolume=.7,liveMuted=false,ctxState='running',renderMode='resolved';
  const timers=new Map(),urls=new Map(),revoked=[],media=[],renderJobs=[],muteCalls=[],resumeCalls=[],events=[];
  const window=new Events(),document=new Events();document.hidden=false;document.visibilityState='visible';
  const clockDate=class extends Date {static now(){return now;}};
  const setTimeout=(fn,delay=0)=>{const job=++id;timers.set(job,{fn,at:now+Math.max(0,+delay||0),period:0});return job;};
  const setInterval=(fn,delay=1)=>{const job=++id;timers.set(job,{fn,at:now+Math.max(1,+delay||1),period:Math.max(1,+delay||1)});return job;};
  const clearTimeout=job=>timers.delete(job),clearInterval=clearTimeout;
  class NativeAudio extends Events {
    constructor(){super();this.tagName='AUDIO';this.dataset={};this.style={};this.attributes={};this.paused=true;this.ended=false;this.readyState=4;this.networkState=1;this.srcObject=null;this.loop=false;this.volume=1;this.muted=false;this.currentTime=0;this.playbackRate=1;this.duration=48;this.totalPlayed=0;this.playCalls=0;this.pauseCalls=0;this.loadCalls=0;this.mode='resolved';this.pendingPlays=[];this.isConnected=false;media.push(this);}
    get src(){return this._src||'';} set src(value){this._src=String(value||'');this.currentSrc=this._src;this.currentTime=0;}
    setAttribute(key,value){this.attributes[key]=String(value);} removeAttribute(key){delete this.attributes[key];if(key==='src')this.src='';}
    load(){this.loadCalls++;this.currentSrc=this.src;}
    play(){this.playCalls++;const accept=()=>{this.paused=false;this.ended=false;this.currentSrc=this.src;this.dispatchEvent({type:'playing',target:this});};
      if(this.mode==='reject'){const error=new Error('NotAllowedError');error.name='NotAllowedError';return Promise.reject(error);}
      if(this.mode==='pending'){const p=deferred();this.pendingPlays.push({p,accept});return p.promise;}
      accept();return Promise.resolve();}
    resolvePlay(){const job=this.pendingPlays.shift();assert(job,'no pending native play');job.accept();job.p.resolve();}
    pause(){this.pauseCalls++;const changed=!this.paused;this.paused=true;if(changed)this.dispatchEvent({type:'pause',target:this});}
    remove(){this.isConnected=false;}
  }
  document.createElement=tag=>tag.toLowerCase()==='audio'?new NativeAudio():{tagName:tag.toUpperCase(),style:{},dataset:{},setAttribute(){},remove(){}};
  document.body={appendChild(node){node.isConnected=true;return node;},dataset:{}};
  document.documentElement={dataset:{}};document.querySelectorAll=()=>media;document.getElementById=()=>null;
  document.hasFocus=()=>!document.hidden;
  const URL={createObjectURL(blob){const url='blob:mix-test-'+(++urlId);urls.set(url,blob);return url;},revokeObjectURL(url){revoked.push(url);urls.delete(url);}};
  const snapshot={ambiences:[],frequency:null,eq:{bass:0,mid:0,treble:0},sampleRate:44100};
  if(selection==='ambient'||selection==='combined')snapshot.ambiences=[{id:'rain',volume:.35,def:{id:'rain',cal:.5,wet:.2}}];
  if(selection!=='ambient'&&selection!=='empty')snapshot.frequency={playing:true,mode:['bin','iso','mono','mix'].includes(selection)?selection:'bin',c:180,b:7.83,vol:.5};
  if(selection==='secondary')snapshot.frequency={playing:false,vol:.5,secondary:{playing:true,c:100,b:2.5}};
  const renderer={version:'r1059',duration:48,render(state,adapter){const job={state:clone(state),adapter,result:pcm()};renderJobs.push(job);if(renderMode==='pending'){job.wait=deferred();return job.wait.promise;}if(renderMode==='reject')return Promise.reject(Object.assign(new Error('Synthetic render failure'),{code:'fixture-render'}));return Promise.resolve(job.result);}};
  window.SukunBackgroundMixRenderer=renderer;window.AudioLife={get userPaused(){return held;},get _terminalIntent(){return held;}};
  window.SukunTabOwner={owns:()=>owned};window.HTMLMediaElement=NativeAudio;window.Audio=NativeAudio;
  window.addEventListener('sukun:backgroundmixchange',event=>events.push(event.detail));
  const adapter={snapshot:()=>clone(snapshot),volume:()=>masterVolume,held:()=>held,owns:()=>owned,
    muteLive(value){liveMuted=!!value;muteCalls.push(!!value);},resumeLive(){resumeCalls.push(now);if(!held)ctxState='running';return Promise.resolve(!held);},
    withContext(c,fn){return fn();}};
  const context=vm.createContext({window,document,navigator:{mediaSession:{}},Audio:NativeAudio,HTMLMediaElement:NativeAudio,
    URL,Blob,ArrayBuffer,DataView,Uint8Array,AbortController,Date:clockDate,Math,Number,JSON,Map,Set,WeakSet,Promise,Error,TypeError,
    performance:{now:()=>now},setTimeout,clearTimeout,setInterval,clearInterval,queueMicrotask,console,
    CustomEvent:class {constructor(type,o={}){this.type=type;this.detail=o.detail;}},addEventListener:window.addEventListener.bind(window)});
  vm.runInContext(source,context,{filename:'background-mix-r1059.js'});
  const controller=window.SukunBackgroundMixR1059||window.SukunBackgroundMix;
  assert(controller,'missing controller export');controller.bind(adapter);
  function advance(milliseconds,{freezeJS=false}={}) {
    const target=now+milliseconds;
    const native=ms=>{for(const a of media){if(!a.paused&&!a.ended){a.totalPlayed+=ms/1000;a.currentTime+=ms/1000*a.playbackRate;if(a.loop)a.currentTime%=Math.max(.01,a.duration);else if(a.currentTime>=a.duration){a.currentTime=a.duration;a.ended=true;a.paused=true;a.dispatchEvent({type:'ended',target:a});}}}};
    if(freezeJS){native(milliseconds);now=target;return;}
    let count=0;
    while(true){const eligible=[...timers].filter(([,j])=>j.at<=target).sort((a,b)=>a[1].at-b[1].at);if(!eligible.length)break;assert(++count<10000,'timer storm');const [key,job]=eligible[0];const next=Math.max(now,job.at);native(next-now);now=next;if(job.period)job.at=now+job.period;else timers.delete(key);job.fn();}
    native(target-now);now=target;
  }
  async function flush(){for(let n=0;n<12;n++)await Promise.resolve();}
  async function settle(){for(let n=0;n<12;n++){advance(100);await flush();}}
  function hide(value=true){document.hidden=value;document.visibilityState=value?'hidden':'visible';document.dispatchEvent({type:'visibilitychange'});}
  function audible(){return media.filter(a=>!a.paused&&!a.ended&&a.src.startsWith('blob:')&&urls.has(a.src)&&a.dataset.sukSilentCarrier!=='1');}
  return {window,document,controller,adapter,snapshot,media,timers,urls,revoked,renderJobs,muteCalls,resumeCalls,events,advance,flush,settle,hide,audible,
    get now(){return now;},get liveMuted(){return liveMuted;},get ctxState(){return ctxState;},set ctxState(v){ctxState=v;},set held(v){held=!!v;},set owned(v){owned=!!v;},set volume(v){masterVolume=v;},set renderMode(v){renderMode=v;},
    resolveRender(index=renderJobs.length-1){const job=renderJobs[index];assert(job?.wait,'no pending render');job.wait.resolve(job.result);},
    async start(){controller.changed('fixture-start',{gesture:true});await settle();await controller.prepare();await settle();assert.equal(audible().length,1,'one native audible mix route');return audible()[0];}};
}
async function test(name,fn,skipReason){if(skipReason){results.push({name,status:'SKIP',reason:skipReason});return;}try{await fn();results.push({name,status:'PASS'});}catch(error){results.push({name,status:'FAIL',error:error.stack});}}
async function nonzero(blob){const raw=Buffer.from(await blob.arrayBuffer());assert(raw.byteLength>44);assert.equal(raw.toString('ascii',0,4),'RIFF');assert(raw.subarray(44).some(v=>v!==0),'native output resource contains nonzero PCM');}
(async()=>{
  await test('Current release wires PCM renderer, native controller, and live-background adapter',()=>{
    const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
    const renderer=html.indexOf('<script src="./assets/runtime/background-mix-render-r1059.js?');
    const controller=html.indexOf('<script src="./assets/runtime/background-mix-r1059.js?');
    const binding=html.indexOf('<script id="r1059-background-mix-binding">');
    assert(renderer>=0&&controller>renderer&&binding>controller,'renderer, controller, and adapter load in order');
    const adapter=html.slice(binding,html.indexOf('</script>',binding));
    assert(adapter.includes('const api=window.SukunBackgroundMix'));
    assert(adapter.includes('api.bind({snapshot:capture,held:blocked,volume:'));
    assert(adapter.includes('muteLive(value)'));
    assert(adapter.includes('resumeLive:async()=>'));
  });
  await test('Baseline main graph uses a digital-zero native anchor and has no PCM background route',()=>{
    const html=fs.readFileSync(path.join(baseline,'index.html'),'utf8');
    const marker=html.indexOf('const SesCapa=window.SesCapa=');assert(marker>=0);
    const anchor=html.slice(marker,html.indexOf('function makeIR(dur,decay){',marker));
    const literal=anchor.match(/const silentAnchorSource='([^']+)'/)[1],raw=Buffer.from(literal.split(',')[1],'base64');
    assert(raw.subarray(44).every(v=>v===128));assert(html.includes('limiter.connect(ctx.destination)'));
    assert(!html.includes('background-mix-r1059.js'));
    // Execute baseline ac/SesCapa instead of fabricating an alternative mix
    // implementation. The browser boundary alone controls context suspension.
    const acStart=html.indexOf('function ac(){'),acEnd=html.indexOf('/* ── Günlük manevi söz',acStart);
    const irStart=html.indexOf('function makeIR(dur,decay){'),irEnd=html.indexOf('/* Kısa düğüm fabrikaları */',irStart);
    assert(acStart>=0&&acEnd>acStart&&irEnd>irStart);
    const native=[],connections=[];
    const param=()=>({value:0});
    class Context {
      constructor(){this.state='running';this.sampleRate=8;this.currentTime=0;this.destination={name:'destination'};}
      node(){return {gain:param(),threshold:param(),knee:param(),ratio:param(),attack:param(),release:param(),frequency:param(),Q:param(),connect(target){connections.push(target);},disconnect(){}};}
      createGain(){return this.node();}createDynamicsCompressor(){return this.node();}createBiquadFilter(){return this.node();}createConvolver(){return this.node();}
      createBuffer(channels,length){return {getChannelData(){return new Float32Array(length);}};}resume(){this.state='running';return Promise.resolve();}suspend(){this.state='suspended';return Promise.resolve();}
    }
    const win={AudioContext:Context},doc={body:{appendChild(){}},createElement(){const a={dataset:{},srcObject:null,currentSrc:'',volume:1,paused:true,ended:false,setAttribute(){},play(){this.currentSrc=this.src;this.paused=false;return Promise.resolve();},pause(){this.paused=true;}};native.push(a);return a;}};
    const context=vm.createContext({window:win,document:doc,navigator:{},Float32Array,Math,console});
    vm.runInContext("let ctx=null,master=null,wetIn=null,limiter=null,tizKes=null,guardIn=null,eqBas=null,eqOrta=null,eqTiz=null,komp=null,kompIn=null,kompOut=null,_acFailed=false;const $=()=>({value:'.7'}),EQ={uygulaEt(){}};function sesKilitAc(){}function kesintiIzlemeBaslat(){}function kesintiBagla(){}function hardStopAll(){}function alert(message){throw Error(message);}let _kesintiVardi=false;"+html.slice(acStart,acEnd)+anchor+html.slice(irStart,irEnd)+";window.testContext=ac();",context);
    assert.equal(win.testContext.state,'running');assert(connections.includes(win.testContext.destination));assert.equal(native.length,1);assert.equal(native[0].paused,false);assert.equal(native[0].src,literal);
    win.testContext.currentTime=8;win.testContext.state='suspended';
    const audibleNative=native.some(a=>!a.paused&&Buffer.from(a.src.split(',')[1],'base64').subarray(44).some(v=>v!==128));
    assert.equal(win.testContext.state==='running'||audibleNative,false,'baseline has no audible route after the live context is suspended');
  },fs.existsSync(path.join(baseline,'index.html'))?null:'Historical r1058 baseline was not supplied; current production controller cases still execute. Pass an archived baseline as argv[3] to run this historical comparison.');
  for(const kind of ['ambient','bin','iso','mono','mix','combined','secondary'])await test(kind+' native mix survives hidden +8s context suspension and 120s frozen JS',async()=>{
    const f=fixture(kind),a=await f.start();await nonzero(f.urls.get(a.src));assert(f.liveMuted,'only live background branches are muted');
    const plays=a.playCalls,renders=f.renderJobs.length,progress=a.totalPlayed;f.hide();f.advance(8000,{freezeJS:true});f.ctxState='suspended';f.advance(120000,{freezeJS:true});
    assert.equal(a.paused,false);assert.equal(a.playCalls,plays);assert.equal(f.renderJobs.length,renders);assert(a.totalPlayed-progress>=128);assert.equal(f.ctxState,'suspended');assert.equal(f.audible().length,1);assert(f.liveMuted);
  });
  await test('Native mix coexists with independent voice and stopping that voice retains mix',async()=>{
    const f=fixture(),voice=new f.window.Audio();voice.src='blob:independent-voice';await voice.play();const a=await f.start();
    const voiceCalls=voice.pauseCalls;assert.equal(voice.paused,false);assert.equal(voice.pauseCalls,voiceCalls);assert(!f.controller.owns(voice));voice.pause();
    f.controller.sync();await f.flush();assert.equal(a.paused,false);assert.equal(f.audible().length,1);
  });
  await test('Master volume zero is exact and does not restore a positive level on hide',async()=>{
    const f=fixture(),a=await f.start();f.volume=0;f.controller.sync();await f.flush();assert.equal(a.volume,0);f.hide();f.advance(120000,{freezeJS:true});assert.equal(a.volume,0);f.hide(false);await f.settle();assert.equal(a.volume,0);
  });
  await test('Native sleep fade decreases by elapsed time, preserves zero and clears its interval on Stop',async()=>{
    const f=fixture(),a=await f.start(),base=a.volume;
    assert.equal(f.controller.fadeOut(13),true);const intervalCount=()=>[...f.timers.values()].filter(job=>job.period>0).length;
    assert.equal(intervalCount(),1);f.advance(2000);const first=a.volume;assert(first>0&&first<base);
    f.advance(2000);const second=a.volume;assert(second>0&&second<first);assert(Math.abs(second-base*Math.exp(-1))<1e-12);
    f.volume=0;f.controller.sync();assert.equal(a.volume,0);f.advance(1000);assert.equal(a.volume,0);
    f.volume=base;f.controller.sync();assert(a.volume<second,'a later volume change retains the elapsed fade');
    f.advance(8000);assert.equal(a.volume,0);assert.equal(intervalCount(),0,'completed fade removes its timer');
    assert.equal(f.controller.fadeOut(13),true);assert.equal(intervalCount(),1);f.advance(1000);
    f.snapshot.ambiences=[];f.snapshot.frequency=null;f.held=true;f.controller.changed('sleep-global-stop');f.controller.sync();
    assert(a.paused);assert.equal(intervalCount(),0);const playCalls=a.playCalls;f.advance(30000);await f.flush();
    assert(a.paused);assert.equal(a.playCalls,playCalls);assert.equal(f.audible().length,0);
  });
  await test('Explicit aggregate Pause keeps native loop paused through hide/unlock',async()=>{
    const f=fixture(),a=await f.start();f.held=true;f.controller.sync();await f.flush();assert(a.paused);const p=a.playCalls;f.hide();f.advance(120000,{freezeJS:true});f.hide(false);await f.settle();assert(a.paused);assert.equal(a.playCalls,p);
  });
  await test('Global Stop clears native source, restores live bus and retires every audible URL',async()=>{
    const f=fixture(),a=await f.start(),url=a.src;f.snapshot.ambiences=[];f.snapshot.frequency=null;f.held=true;f.controller.changed('all-stop');f.controller.sync();await f.settle();
    assert(a.paused);assert.equal(f.audible().length,0);assert.equal(f.liveMuted,false);assert(f.revoked.includes(url));f.hide();f.advance(120000,{freezeJS:true});assert.equal(f.audible().length,0);
  });
  await test('Pause while rendering cannot admit a delayed audible native candidate',async()=>{
    const f=fixture();f.renderMode='pending';f.controller.changed('start',{gesture:true});await f.settle();assert(f.renderJobs.length);f.held=true;f.controller.sync();f.resolveRender();await f.settle();assert.equal(f.audible().length,0);
  });
  await test('Stop while rendering cannot revive after delayed preparation resolves',async()=>{
    const f=fixture();f.renderMode='pending';f.controller.changed('start',{gesture:true});await f.settle();assert(f.renderJobs.length);f.snapshot.ambiences=[];f.snapshot.frequency=null;f.held=true;f.controller.changed('all-stop');f.controller.sync();f.resolveRender();await f.settle();assert.equal(f.audible().length,0);assert.equal(f.liveMuted,false);
  });
  await test('Pause while native play promise is pending cancels delayed playback acceptance',async()=>{
    const f=fixture();f.renderMode='pending';f.controller.changed('start',{gesture:true});await f.settle();const a=f.media[0];a.mode='pending';f.resolveRender();await f.flush();assert.equal(a.pendingPlays.length,1);
    f.held=true;f.controller.sync();a.resolvePlay();await f.settle();assert(a.paused);assert.equal(f.audible().length,0);assert.equal(f.liveMuted,false);
  });
  await test('Stop while native play promise is pending cannot restart the removed mix',async()=>{
    const f=fixture();f.renderMode='pending';f.controller.changed('start',{gesture:true});await f.settle();const a=f.media[0];a.mode='pending';f.resolveRender();await f.flush();assert.equal(a.pendingPlays.length,1);
    f.snapshot.ambiences=[];f.snapshot.frequency=null;f.held=true;f.controller.changed('all-stop');f.controller.sync();a.resolvePlay();await f.settle();assert(a.paused);assert.equal(f.audible().length,0);assert.equal(f.liveMuted,false);
  });
  await test('Native play rejection leaves no audible lease and restores the live background route',async()=>{
    const f=fixture();f.renderMode='pending';f.controller.changed('start',{gesture:true});await f.settle();const a=f.media[0];a.mode='reject';f.resolveRender();await f.settle();assert(a.paused);assert.equal(f.audible().length,0);assert.equal(f.liveMuted,false);assert(f.controller.snapshot().error);
  });
  await test('Selection change keeps prior native output until the replacement is prepared',async()=>{
    const f=fixture(),old=await f.start();const oldUrl=old.src;f.renderMode='pending';f.snapshot.frequency.c=240;f.controller.changed('retune');await f.settle();
    assert.equal(old.paused,false);assert.equal(old.src,oldUrl);assert.equal(f.audible().length,1);f.resolveRender();await f.settle();assert.equal(f.audible().length,1);assert(f.audible()[0].src!==oldUrl);assert(f.revoked.includes(oldUrl));
  });
  await test('Rapid slider revisions allocate only one in-flight render and only the latest queued snapshot',async()=>{
    const f=fixture(),a=await f.start(),previousUrl=a.src;
    f.renderMode='pending';f.snapshot.frequency.c=300;f.controller.changed('first-retune');await f.settle();
    assert.equal(f.renderJobs.length,2,'one initial accepted render and one pending render');assert(f.renderJobs[1].wait);assert.equal(a.paused,false);
    for(let n=1;n<=40;n++){
      f.snapshot.frequency.c=400+n;f.snapshot.ambiences[0].volume=.2+n/200;
      f.controller.changed('rapid-slider-'+n);f.controller.prepare();await f.flush();
      assert.equal(f.renderJobs.length,2,'queued stale revisions must not allocate another renderer');
      assert.equal(a.paused,false);assert.equal(a.src,previousUrl);assert(f.liveMuted);
    }
    f.renderMode='resolved';f.resolveRender(1);await f.settle();await f.settle();
    assert.deepEqual(f.renderJobs.map(job=>job.state.frequency.c),[180,300,440]);
    assert.equal(f.renderJobs[2].state.ambiences[0].volume,.4);
    assert.equal(f.controller.snapshot().metrics.accepted,2,'initial output and latest settings accepted only');
    assert.equal(f.audible().length,1);assert(f.audible()[0].src!==previousUrl);assert(f.revoked.includes(previousUrl));assert(f.liveMuted);
  });
  await test('Finishing foreground voice ownership leaves the independent background mix running',async()=>{
    const f=fixture(),a=await f.start();f.owned=false;f.window.dispatchEvent({type:'sukun:tabownerchange'});f.controller.sync();await f.settle();assert.equal(a.paused,false);assert.equal(f.audible().length,1);assert(f.liveMuted);
  });
  await test('Global ownership cleanup cancels a delayed candidate and retires background output',async()=>{
    const f=fixture(),a=await f.start();f.renderMode='pending';f.snapshot.frequency.c=260;f.controller.changed('retune');await f.settle();f.owned=false;f.snapshot.ambiences=[];f.snapshot.frequency=null;f.held=true;f.controller.changed('ownership-global-cleanup');f.controller.sync();f.resolveRender();await f.settle();assert(a.paused);assert.equal(f.audible().length,0);
  });
  await test('Preparation failure drops obsolete native selection and restores current live configuration',async()=>{
    const f=fixture(),a=await f.start();f.renderMode='reject';f.snapshot.frequency.c=400;f.controller.changed('retune');await f.settle();assert(a.paused);assert.equal(f.audible().length,0);assert.equal(f.liveMuted,false);assert(f.controller.snapshot().error);
  });
  await test('Hidden and visible transitions require no replay and produce no duplicated native route',async()=>{
    const f=fixture(),a=await f.start(),p=a.playCalls;for(let n=0;n<4;n++){f.hide();f.advance(1000,{freezeJS:true});f.hide(false);await f.settle();assert.equal(f.audible().length,1);}assert.equal(a.playCalls,p);
  });
  await test('Same-value live setters are muted again without rendering or restarting the accepted native source',async()=>{
    const f=fixture(),a=await f.start(),url=a.src,plays=a.playCalls,renders=f.renderJobs.length;
    // The existing WebAudio setter may write a positive gain even when its
    // logical selection is unchanged. Muting must be physically reasserted.
    f.adapter.muteLive(false);assert.equal(f.liveMuted,false);
    f.controller.changed('same-value-setting');await f.flush();assert.equal(f.liveMuted,true);
    assert.equal(a.src,url);assert.equal(a.playCalls,plays);assert.equal(f.renderJobs.length,renders);
    f.adapter.muteLive(false);assert.equal(f.liveMuted,false);
    await f.controller.prepare();await f.flush();assert.equal(f.liveMuted,true);
    assert.equal(a.src,url);assert.equal(a.playCalls,plays);assert.equal(f.renderJobs.length,renders);assert.equal(f.audible().length,1);
  });
  await test('Only the private prime resource is classified as silence; audible mix never is',async()=>{
    const f=fixture();f.renderMode='pending';f.controller.changed('start',{gesture:true});await f.settle();const primes=f.media.filter(a=>f.controller.owns(a));assert(primes.length);
    assert(primes.some(a=>f.controller.isSilentCarrier(a)));const alien=new f.window.Audio();alien.src=primes[0].src;alien.dataset={...primes[0].dataset};assert.equal(f.controller.isSilentCarrier(alien),false);
    f.resolveRender();await f.settle();const a=f.audible()[0];assert(a);assert.equal(f.controller.isSilentCarrier(a),false);assert.equal(f.controller.owns(a),true);
  });
  const failed=results.filter(x=>x.status==='FAIL');console.log(JSON.stringify({source:path.join(root,'assets/runtime/background-mix-r1059.js'),total:results.length,passed:results.filter(x=>x.status==='PASS').length,skipped:results.filter(x=>x.status==='SKIP').length,failed:failed.length,scope:'Actual controller source with controlled native media, audible PCM fixture, context suspension and frozen JavaScript timers; not physical Android playback or speaker audibility.',results},null,2));if(failed.length)process.exitCode=1;
})();
