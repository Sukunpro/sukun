'use strict';
// Exact shipped FRM, CIZ, GORSEL and lifecycle hooks in controlled DOM/canvas fixtures.
// No browser pixels, audible playback, personal data, or physical resize claim.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const args=process.argv.slice(2),root=path.resolve(args.find(x=>!x.startsWith('--'))||path.join(__dirname,'../..'));
const locations={fixed:root};
for(const [build,flag]of [['r1041','--baseline-root='],['original','--original-root=']]){const value=args.find(x=>x.startsWith(flag))?.slice(flag.length);if(value)locations[build]=path.resolve(value)}
const lifecycle=fs.readFileSync(path.join(root,'assets/runtime/lifecycle-r949.js'),'utf8');
const documents=Object.fromEntries(Object.entries(locations).map(([name,root])=>[name,fs.readFileSync(path.join(root,'index.html'),'utf8')]));
function find(source,pattern){const m=source.match(pattern);assert(m,'Missing production fragment '+pattern);return m[0]}
function fixture(build,mode='dengeli',reduced=true){
 const html=documents[build],docEvents=new Map(),winEvents=new Map(),frames=new Map();let serial=0,time=1000,paints=0,painted=false,resets=0,draws=0,commands=0,lastReadMode=null;
 const history=[];const add=(map,type,fn)=>{if(!map.has(type))map.set(type,[]);map.get(type).push(fn)},emit=(map,type)=>{for(const fn of map.get(type)||[])fn({type,detail:{phase:'PLAYING'}})};
 const gradient={addColorStop(){}};
 const x=new Proxy({createLinearGradient(){return gradient},clearRect(){draws++;painted=false},stroke(){paints++;painted=true},fill(){paints++;painted=true}}, {get(o,k){if(k in o)return o[k];return()=>{}},set(o,k,v){o[k]=v;return true}});
 const canvas={isConnected:true,getContext(){return x},_width:0,_height:0,set width(v){this._width=v;resets++;painted=false},get width(){return this._width},set height(v){this._height=v;resets++;painted=false},get height(){return this._height}};
 const box={clientWidth:360,clientHeight:104,classList:{toggle(){}}},tag={textContent:''};
 const nodes={'frMirrorC':canvas,'frMirror':box,'fmTag':tag,'tab-frq':{hidden:false}};
 const document={hidden:false,visibilityState:'visible',wasDiscarded:false,documentElement:{dataset:{r949Hidden:'0'}},body:{dataset:{perf:mode},classList:{contains(){return false}}},getElementById:id=>nodes[id]||null,querySelectorAll(){return[]},addEventListener:(type,fn)=>add(docEvents,type,fn)};
 const window={devicePixelRatio:1,addEventListener:(type,fn)=>add(winEvents,type,fn),AudioContext:null,SukunSessionState:{peek(){return{phase:'PLAYING'}},command(){commands++;throw Error('No transport command allowed')}},SukunR698Transport:{stop(){commands++},pause(){commands++}}};
 const rawFrequency={playing:false,mode:'bin',b:7.83};const FR=new Proxy(rawFrequency,{get(o,k){if(k==='mode')lastReadMode=o[k];return o[k]}});
 const context=vm.createContext({window,document,FR,console,performance:{now:()=>time,getEntriesByType:()=>[{type:'navigate'}]},sessionStorage:{getItem(){return null},setItem(){}},
  localStorage:{getItem(){commands++;throw Error('Unexpected preference read')},setItem(){commands++;throw Error('Unexpected preference write')}},
  navigator:{mediaDevices:{getUserMedia(){commands++;throw Error('No microphone access')}}},MediaRecorder:class{constructor(){commands++;throw Error('No recorder')}},
  AudioLife:{set(){commands++}},SukunCountCorrection:{apply(){commands++}},
  addEventListener:(type,fn)=>add(winEvents,type,fn),requestAnimationFrame(fn){const id=++serial;frames.set(id,fn);return id},cancelAnimationFrame:id=>frames.delete(id),
  matchMedia:()=>({matches:reduced}),devicePixelRatio:1,getComputedStyle:()=>({getPropertyValue(){return''}}),_TAU:Math.PI*2,_rgba:v=>v,
  $:id=>nodes[id.replace(/^#/,'')]||null,MUHR:{wake(){},draw(){}},SIRA:['tam','dengeli','pil'],ilk:mode});
 vm.runInContext(lifecycle,context);
 const helper=html.match(/function sukunGraphicsSleepingR1042\([^)]*\)\{[\s\S]*?\n\}/)?.[0]||'';
 const scheduler=find(html,/const CIZ=\{[\s\S]*?\n\};\nwindow\.CIZ=CIZ;\n[\s\S]*?\n\n/);
 const mirror=find(html,/const FRM=\{[\s\S]*?\n\};/);
 const mirrorVisibility=find(html,/document\.addEventListener\('visibilitychange',\(\)=>\{\n  if\(!document\.hidden\)\{ MUHR\.wake\(\); FRM\.wake\(\); \}\n\}\);/);
 const resume=html.match(/document\.addEventListener\('resume',\(\)=>FRM\.wake\(\),\{passive:true\}\);/)?.[0]||'';
 const perf=find(html,/const GORSEL=window\.SukunPerformance=\{[\s\S]*?\n\};/);
 const perfEvents=find(html,/document\.addEventListener\('visibilitychange',\(\)=>document\.hidden\?GORSEL\.uyut\(\):GORSEL\.uyandir\(\)\);\nwindow\.addEventListener\('pagehide',\(\)=>GORSEL\.uyut\(\)\);\nwindow\.addEventListener\('pageshow',\(\)=>GORSEL\.uyandir\(\)\);/);
 vm.runInContext([helper,scheduler,mirror,mirrorVisibility,resume,perf,perfEvents,'FRM.init();globalThis.mirror=FRM;'].join('\n'),context);
 const api={document,window,context,box,canvas,frames,rawFrequency,
  resize(){emit(winEvents,'resize')},doc(type){emit(docEvents,type)},win(type){emit(winEvents,type)},
  hide(){document.hidden=true;document.visibilityState='hidden';emit(docEvents,'visibilitychange')},show(){document.hidden=false;document.visibilityState='visible';emit(docEvents,'visibilitychange')},
  frame(){time+=150;const batch=[...frames];frames.clear();for(const[,fn]of batch)fn(time)},
  snapshot(){return{paints,painted,resets,draws,commands,lastReadMode,width:canvas.width,height:canvas.height,pendingRAF:frames.size,quality:document.body.dataset.perf,mode:window.SukunPerformance.mode}},
  mark(label){history.push({label,...this.snapshot()})},history};
 if(!reduced&&mode!=='pil')api.frame();return api;
}
const results=[];function test(name,fn){try{fn();results.push({name,passed:true})}catch(e){results.push({name,passed:false,error:e.stack})}}
// Optional source-only r1041/original-r1042 comparison does not require Git.
const baseline=[];
for(const mode of ['tam','dengeli','pil']){
 for(const build of ['r1041','original','fixed'].filter(build=>documents[build])){
  const f=fixture(build,mode);assert(f.snapshot().painted);f.hide();f.box.clientWidth=420;f.resize();const hidden=f.snapshot();f.show();const visible=f.snapshot();
  baseline.push({build,mode,hiddenPainted:hidden.painted,visiblePainted:visible.painted,width:visible.width});
  if(build==='r1041')assert(visible.painted);
  if(build==='original'&&mode!=='pil')assert.equal(visible.painted,false,'reproduce original r1042 regression');
  if(build==='fixed')assert(visible.painted);
 }
}
for(const mode of ['tam','dengeli','pil'])for(const transition of ['visibility','freeze-resume','pagehide-pageshow'])for(const hiddenWidth of [0,420]){
 test(`Reduced-motion ${mode}, ${transition}, hidden width ${hiddenWidth}`,()=>{
  const f=fixture('fixed',mode);assert(f.snapshot().painted);const before=f.snapshot();
  if(transition==='visibility')f.hide();else if(transition==='freeze-resume')f.doc('freeze');else f.win('pagehide');
  f.box.clientWidth=hiddenWidth;f.box.clientHeight=144;f.rawFrequency.mode='mono';f.rawFrequency.b=13;f.resize();
  const resting=f.snapshot();assert.equal(resting.paints,before.paints,'no hidden/frozen/pagehide paint');assert.equal(resting.pendingRAF,0);
  // Duplicate attempted wakes during rest cannot reset, paint or start a loop.
  for(let i=0;i<20;i++)f.context.mirror.wake();assert.deepEqual(f.snapshot(),resting);
  f.box.clientWidth=420;
  if(transition==='visibility')f.show();else if(transition==='freeze-resume')f.doc('resume');else f.win('pageshow');
  const after=f.snapshot();assert(after.painted);assert.equal(after.width,420);assert.equal(after.height,144);assert.equal(after.lastReadMode,'mono');assert.equal(after.pendingRAF,0);assert.equal(after.commands,0);assert.equal(after.quality,mode);assert.equal(after.mode,mode);
 });
}
for(const mode of ['tam','dengeli','pil'])test(`Reduced-motion ${mode} repeated hide/freeze/pagehide and latest state`,()=>{
 const f=fixture('fixed',mode);for(let i=0;i<12;i++){
  f.hide();f.box.clientWidth=i%2?0:400+i;f.resize();f.show();assert(f.snapshot().painted);
  f.doc('freeze');f.box.clientWidth=430+i;f.resize();f.doc('resume');assert(f.snapshot().painted);
  f.win('pagehide');f.box.clientWidth=450+i;f.resize();f.win('pageshow');
  assert(f.snapshot().painted);assert.equal(f.snapshot().width,450+i);assert.equal(f.snapshot().pendingRAF,0);
 }
 assert.equal(f.snapshot().commands,0);assert.equal(f.snapshot().quality,mode);
});
for(const mode of ['tam','dengeli'])test(`Animated ${mode} retains scheduler and sleeps/resumes without transport`,()=>{
 const f=fixture('fixed',mode,false);assert.equal(f.snapshot().pendingRAF,1);f.hide();assert.equal(f.snapshot().pendingRAF,0);f.box.clientWidth=420;f.resize();assert.equal(f.snapshot().painted,false);f.show();assert.equal(f.snapshot().pendingRAF,1);f.frame();assert(f.snapshot().painted);
 f.doc('freeze');assert.equal(f.snapshot().pendingRAF,0);f.doc('resume');assert.equal(f.snapshot().pendingRAF,1);f.frame();assert(f.snapshot().painted);f.win('pagehide');assert.equal(f.snapshot().pendingRAF,0);f.win('pageshow');assert.equal(f.snapshot().pendingRAF,1);f.frame();assert(f.snapshot().painted);assert.equal(f.snapshot().commands,0);assert.equal(f.snapshot().quality,mode);
});
test('Battery non-reduced static wake remains a single non-animated drawing operation',()=>{const f=fixture('fixed','pil',false);f.hide();f.resize();assert.equal(f.snapshot().pendingRAF,0);f.show();assert(f.snapshot().painted);assert.equal(f.snapshot().pendingRAF,0);assert.equal(f.snapshot().commands,0)});
test('Still-zero visible width does not clear or force paint; later visible resize recovers',()=>{const f=fixture('fixed');f.hide();f.box.clientWidth=0;f.resize();const b=f.snapshot();f.show();assert.equal(f.snapshot().resets,b.resets);assert.equal(f.snapshot().paints,b.paints);f.box.clientWidth=470;f.resize();assert.equal(f.snapshot().width,470);assert(f.snapshot().painted);assert.equal(f.snapshot().pendingRAF,0)});
const report={scope:'Exact FRM/CIZ/GORSEL/lifecycle source in controlled DOM/canvas/events; standard bitmap clearing modeled; no physical browser or audio claim.',baseline,passed:results.filter(x=>x.passed).length,total:results.length,results};console.log(JSON.stringify(report,null,2));if(report.passed!==report.total)process.exitCode=1;
