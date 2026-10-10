'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {execFileSync}=require('node:child_process');
const root=path.join(__dirname,'../..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const lifecycle=fs.readFileSync(path.join(root,'assets/runtime/lifecycle-r949.js'),'utf8');
const baseline=process.argv.includes('--compare-head')?execFileSync('git',['show','HEAD:index.html'],{cwd:root,encoding:'utf8',maxBuffer:32*1024*1024}):null;
function match(pattern,source=html){const found=source.match(pattern);assert(found,'production source fixture missing '+pattern);return found[0]}
function fn(name,source=html){return match(new RegExp('function '+name+'\\([^)]*\\)\\{[\\s\\S]*?\\n\\}'),source)}
function object(name,source=html){return match(new RegExp('const '+name+'\\s*=\\s*\\{[\\s\\S]*?\\n\\};'),source)}
const sleeping=fn('sukunGraphicsSleepingR1042');
function fixture(){
  const documentEvents=new Map(),windowEvents=new Map(),frames=new Map(),timers=new Map(),ids=new Map();
  let next=0,writes=0,clears=0,geometry=0,count=0,transport=0,visualUpdates=0;
  const ramps=[],classes=new Set(),quality={perf:'tam',perfEffective:'pil'};
  const gradient={addColorStop(){writes++}};
  const canvasContext=new Proxy({}, {get(target,key){return target[key]||((...args)=>{writes++;if(key==='clearRect')clears++;if(key==='createRadialGradient'||key==='createLinearGradient')return gradient})},set(target,key,value){writes++;target[key]=value;return true}});
  function add(map,type,callback){if(!map.has(type))map.set(type,[]);map.get(type).push(callback)}
  function emit(map,type){for(const callback of map.get(type)||[])callback({type,detail:{phase:'PLAYING'}})}
  function node(id){return {id,hidden:false,isConnected:true,style:{},value:0,min:0,max:1000,textContent:'',classList:{toggle(){},contains(k){return classes.has(k)}},getContext(){return canvasContext}}}
  for(const id of ['zCountVisual','tab-zkr','carrierFreq','carrierVal','carrierNum','sessionCarrier','beatFreq'])ids.set(id,node(id));
  const document={hidden:false,wasDiscarded:false,documentElement:{dataset:{r949Hidden:'0'}},body:{dataset:quality,classList:{contains(k){return classes.has(k)}}},getElementById(id){return ids.get(id)||null},querySelectorAll(){return []},addEventListener(type,callback){add(documentEvents,type,callback)}};
  const window={addEventListener(type,callback){add(windowEvents,type,callback)},SukunSessionState:{peek(){return {phase:'PLAYING'}},command(){transport++}},SukunR698Transport:{stop(){transport++},pause(){transport++}},AudioContext:null};
  const Z={target:33,count:0,devir:0,auto:true},NS={ctx:{currentTime:0},beatMode:'mono',isPlaying:true};
  NS.binauralL={frequency:{cancelScheduledValues(t){ramps.push(['cancel',t])},setValueAtTime(v,t){ramps.push(['set',v,t])},linearRampToValueAtTime(v,t){ramps.push(['linear',v,t])},exponentialRampToValueAtTime(v,t){ramps.push(['exponential',v,t])}}};
  const maths=Object.create(Math);maths.random=()=>0;
  const context=vm.createContext({window,document,Z,NS,Math:maths,console,performance:{now(){return 1000},getEntriesByType(){return [{type:'navigate'}]}},
    sessionStorage:{getItem(){return null},setItem(){}},localStorage:{getItem(){throw Error('graphics must not read saved preferences')},setItem(){throw Error('graphics must not persist saved preferences')}},
    addEventListener(type,callback){add(windowEvents,type,callback)},
    requestAnimationFrame(callback){const id=++next;frames.set(id,callback);return id},cancelAnimationFrame(id){frames.delete(id)},
    setTimeout(callback,delay){const id=++next;timers.set(id,{callback,delay});return id},clearTimeout(id){timers.delete(id)},
    $:id=>document.getElementById(id),_TAU:Math.PI*2,_rgba:(colour,alpha)=>colour,FR:{playing:true,b:7.83,mode:'bin'},AMB:{},VH:{playing:false},
    BG:{x:canvasContext,W:100,H:100,drops:[]},eb:{x:canvasContext,W:100,H:100,drops:[]},TK_PAL:['','','','','#000'],SEY:{stage:{mode:'katre'}},bast:1,
    zkCount(){count++},ebComb(){geometry++},ebDrop(){geometry++},rnd(){return 1},ebColor(){return '#000'},
    updateTrack(){visualUpdates++},sweepStop(){NS.sweep.active=false},getComputedStyle(){return {getPropertyValue(){return ''}}}});
  vm.runInContext(sleeping,context);
  return {context,document,window,Z,NS,frames,timers,ramps,quality,canvasContext,ids,
    run(source){return vm.runInContext(source,context)},
    lifecycle(){vm.runInContext(lifecycle,context,{filename:'lifecycle-r949.js'})},
    doc(type){emit(documentEvents,type)},win(type){emit(windowEvents,type)},
    frame(time=1000){const queue=[...frames];frames.clear();for(const [,callback]of queue)callback(time)},
    get writes(){return writes},get clears(){return clears},get geometry(){return geometry},get count(){return count},get transport(){return transport},get visualUpdates(){return visualUpdates}};
}

// Execute the actual seal object: hidden native publications must update its
// model, while the existing canvas surface receives no paint calls.
{
  const s=fixture();s.run(object('MUHR')+'\nglobalThis.seal=MUHR;');const seal=s.context.seal;seal.x=s.canvasContext;seal.reduced=true;
  s.document.hidden=true;
  for(let n=1;n<=10000;n++){s.Z.count=n;seal.sync(false)}
  assert.equal(s.writes,0);assert.equal(seal._prevCount,10000);assert.equal(seal.done,10000%33);assert.equal(s.frames.size,0);
  s.document.hidden=false;s.document.documentElement.dataset.r949Hidden='1';seal.sync(false);assert.equal(s.writes,0,'freeze/pagehide marker suppresses direct seal painting');
  s.document.documentElement.dataset.r949Hidden='0';seal.sync(true);assert.equal(s.clears,1);assert.equal(seal.done,10000%33);assert.equal(s.transport,0);
  if(baseline){const old=fixture();old.run(object('MUHR',baseline)+'\nglobalThis.seal=MUHR;');old.context.seal.x=old.canvasContext;old.context.seal.reduced=true;old.document.hidden=true;for(let n=1;n<=1000;n++){old.Z.count=n;old.context.seal.sync(false)}assert.equal(old.clears,1000);console.log('HEAD hidden seal:1000 paints; patched:0 paints after10000 publications');}
  console.log('PASS seal keeps latest count with10000 hidden publications and no canvas paint/transport');
}

// Guard the other real direct draw entries before any canvas/analyser work.
{
  const s=fixture();s.run(fn('bgDraw')+'\n'+fn('ebDraw')+'\n'+object('FRM')+'\n'+object('SPEC')+'\n'+object('HV')+'\nglobalThis.mirror=FRM;globalThis.spectrum=SPEC;globalThis.visuals=HV;');
  s.context.mirror.x=s.canvasContext;s.context.mirror.W=100;s.context.spectrum.c=s.canvasContext;
  for(const hidden of [true,false]){s.document.hidden=hidden;s.document.documentElement.dataset.r949Hidden=hidden?'0':'1';for(let n=0;n<100;n++)s.run("bgDraw();ebDraw();FRM.draw(0);SPEC.draw();HV.render('unused');");}
  assert.equal(s.writes,0);assert.equal(s.frames.size,0);assert.equal(s.transport,0);
  console.log('PASS BG,FRM,Tekke ebru,SPEC,HV direct painters sleep on hidden/freeze gate');
}

// The native Tekke tick retains its count operation, suppressing only expensive
// decorative ebru geometry. Audio/timer/haptic ownership is outside this branch.
{
  const s=fixture();s.run(fn('onKatre'));s.document.hidden=true;
  for(let n=0;n<10000;n++)s.run('onKatre(true)');assert.equal(s.count,10000);assert.equal(s.geometry,0);
  s.document.hidden=false;s.document.documentElement.dataset.r949Hidden='1';s.run('onKatre(true)');assert.equal(s.count,10001);assert.equal(s.geometry,0);
  s.document.documentElement.dataset.r949Hidden='0';s.run('onKatre(true)');assert.equal(s.count,10002);assert.equal(s.geometry,1);assert.equal(s.transport,0);
  console.log('PASS native Tekke count continues while decorative polygon work rests');
}

// Use the real lifecycle module and shared scheduler, including an audio-coupled
// job. Sleep cancels graphical RAF; configured cadence and job ownership survive.
{
  const s=fixture();s.lifecycle();const code=match(/const CIZ=\{[\s\S]*?\n\};\nwindow\.CIZ=CIZ;\n[\s\S]*?\n\n/);
  s.run(code);const scheduler=s.window.CIZ;let visual=0,coupled=0;
  scheduler.ekle('visual',()=>visual++);scheduler.ekle('audio-coupled',()=>coupled++,{audioCoupled:true});assert.equal(s.frames.size,1);
  assert.equal(scheduler._frameBudgetMs(),125);assert.equal(scheduler._frameBudgetMs(true),16.5);
  const originalQuality={...s.quality};s.document.hidden=true;s.doc('visibilitychange');assert.equal(s.frames.size,0);assert.equal(scheduler.snapshot().graphicsMode,'sleep');
  for(let n=0;n<10000;n++)scheduler.basla();assert.equal(s.frames.size,0);assert.equal(visual,0);assert.equal(coupled,0);
  s.document.hidden=false;s.doc('visibilitychange');assert.equal(s.frames.size,1);s.frame(1000);assert.equal(visual,1);assert.equal(coupled,1);
  s.doc('freeze');assert.equal(s.frames.size,0);assert.equal(s.document.documentElement.dataset.r949Hidden,'1');s.doc('resume');assert.equal(s.frames.size,1);
  // Pagehide can precede document.hidden: preserve the canvas and cancel the
  // queued shared frame using the existing lifecycle rest marker.
  s.win('pagehide');assert.equal(s.document.hidden,false);assert.equal(s.frames.size,0);assert.equal(s.document.documentElement.dataset.r949Hidden,'1');assert.equal(scheduler.snapshot().graphicsMode,'sleep');
  s.win('pageshow');assert.equal(s.frames.size,1);assert.equal(s.document.documentElement.dataset.r949Hidden,'0');assert.equal(scheduler.snapshot().configuredQuality,'tam');
  assert.deepEqual(s.quality,originalQuality);assert.equal(scheduler.isler.get('audio-coupled').opt.audioCoupled,true);assert.equal(scheduler._frameBudgetMs(true),16.5);assert.equal(s.transport,0);
  console.log('PASS shared graphics RAF rests/resumes through hide,freeze,pagehide; cadence and saved quality preserved');
}

// Execute the production sweep display and its original audio sweepRun. Audio
// ramps/loop timer still run hidden, while UI paint and UI RAF remain asleep.
{
  const s=fixture();s.lifecycle();const start=html.indexOf('NS.sweep = {active:false'),end=html.indexOf('\nfunction sweepRun(){',start);assert(start>=0&&end>start);s.run(html.slice(start,end));s.run(fn('sweepRun'));
  if(baseline)assert.equal(fn('sweepRun'),fn('sweepRun',baseline),'audio sweepRun source must stay unchanged');
  Object.assign(s.NS.sweep,{active:true,dur:100,startHz:20,endHz:500,scale:'linear'});
  s.document.hidden=true;s.doc('visibilitychange');s.run('sweepRun()');assert.deepEqual(s.ramps,[['cancel',0],['set',20,0],['linear',500,100]]);assert.equal(s.timers.size,1);assert.equal(s.frames.size,0);assert.equal(s.visualUpdates,0);
  const audioTimer=s.NS.sweep.loopTimer;
  for(let n=0;n<10000;n++)s.run('sweepVisualTick()');assert.equal(s.frames.size,0);assert.equal(s.visualUpdates,0);assert.equal(s.NS.sweep.loopTimer,audioTimer);
  s.NS.ctx.currentTime=1000;s.document.hidden=false;s.doc('visibilitychange');assert.equal(s.frames.size,1);for(let n=0;n<100;n++)s.run('sweepVisualWake()');assert.equal(s.frames.size,1);
  s.frame();assert.equal(s.ids.get('carrierVal').textContent,'500.0 Hz');assert.equal(s.visualUpdates,1);assert.equal(s.frames.size,0);assert.equal(s.NS.sweep.loopTimer,audioTimer);assert.equal(s.ramps.length,3);
  s.NS.ctx.currentTime=5;s.run('sweepVisualTick()');assert.equal(s.frames.size,1);s.doc('freeze');assert.equal(s.frames.size,0);s.doc('resume');assert.equal(s.frames.size,1);s.win('pagehide');assert.equal(s.frames.size,0);s.win('pageshow');assert.equal(s.frames.size,1);
  assert.equal(s.NS.sweep.loopTimer,audioTimer);assert.equal(s.transport,0);
  console.log('PASS sweep UI sleeps and displays current audio clock once; ramps and loopTimer preserved');
}
