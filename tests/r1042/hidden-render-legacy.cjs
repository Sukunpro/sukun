/* Executes the five shipped legacy render owners with synthetic DOM and
 * suspended RAF. No browser compositor, sound, storage, or device claim. */
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert'),cp=require('child_process');
const root=path.resolve(process.argv.slice(2).find(s=>!s.startsWith('--'))||path.join(__dirname,'../..'));
const candidate=fs.readFileSync(path.join(root,'index.html'),'utf8');
const comparison=process.argv.find(s=>s.startsWith('--compare-base='))?.slice('--compare-base='.length);
const baseline=comparison?cp.execFileSync('git',['show',comparison+':index.html'],{cwd:root,encoding:'utf8',maxBuffer:8*1024*1024}):null;
const specs=[
  {id:'r499-current-esma-badge-runtime',kind:'badge'},
  {id:'r591-inactive-dock-owner-runtime',kind:'owner'},
  {id:'r592-dock-collapse-runtime',kind:'collapse'},
  {id:'r598-group-card-repair',kind:'repair'},
  {id:'r675-interaction-authority-runtime',kind:'interaction'}
];
function script(html,spec){
  for(const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){
    if(m[1].includes('application/x-sukun-disabled'))continue;
    if(spec.kind==='repair'?m[2].includes('r598 — GRUP KARTLARI'):m[1].includes('id="'+spec.id+'"'))return m[2];
  }
  throw Error('Missing active script '+spec.id);
}
function fixture(source,spec,options={}){
  let serial=0,rafScheduled=0,rafCancelled=0,timerScheduled=0;
  const frames=new Map(),timers=new Map(),windowEvents=new Map(),documentEvents=new Map(),flowSubscribers=[],zikirSubscribers=[],writes=[],reads=[];
  const state={count:0,active:true,hostWidth:250};
  function eventMap(map){return{addEventListener(type,fn){if(!map.has(type))map.set(type,[]);map.get(type).push(fn)},emit(type,detail){for(const fn of map.get(type)||[])fn({type,detail})}}}
  function node(id=''){
    let text='',hidden=false;const attributes=new Map(),classes=new Set(),children=[];
    const n={id,dataset:{},children,style:{removeProperty(k){writes.push([id,'remove',k])},setProperty(k,v){writes.push([id,k,v])}},
      classList:{contains:k=>classes.has(k),add(...args){args.forEach(k=>classes.add(k))},remove(...args){args.forEach(k=>classes.delete(k))},toggle(k,v){if(v===undefined)v=!classes.has(k);v?classes.add(k):classes.delete(k);writes.push([id,'class',k,v]);return v}},
      get firstElementChild(){return children[0]||null},get textContent(){return text},set textContent(v){text=String(v);writes.push([id,'text',text])},get hidden(){return hidden},set hidden(v){hidden=!!v;writes.push([id,'hidden',hidden])},
      setAttribute(k,v){attributes.set(k,String(v));writes.push([id,'attr',k,v])},getAttribute:k=>attributes.get(k)||null,removeAttribute(k){attributes.delete(k);writes.push([id,'removeAttr',k])},
      appendChild(child){children.push(child);child.parentNode=n;child.parentElement=n},
      insertAdjacentElement(where,child){if(where==='afterbegin')children.unshift(child);else children.push(child);child.parentNode=n;child.parentElement=n;writes.push([id,'insert',child.id])},
      remove(){writes.push([id,'removed'])},querySelector(selector){return n.parts?.[selector]||null},closest(){return null},getBoundingClientRect(){return{width:300,height:100}}};
    Object.defineProperty(n,'innerHTML',{set(v){if(String(v).includes('r499Kicker')){const kick=node('badge-kicker'),value=node('badge-value'),meta=node('badge-meta'),eb=node('badge-eb');meta.parts={'b':eb};n.parts={'.r499Kicker':kick,'.r499Value':value,'.r499Meta':meta};}writes.push([id,'html'])}});
    return n;
  }
  const nodes=new Map(['esmaStepNav','zStage','esmaStepNow','r170Now','tab-ntf','r554AlertDrawer','r551AlertDrawer','r433DockPeek','r659DockBody','r674DetailsScroll','calanSayfa'].map(id=>[id,node(id)]));
  const body=node('body'),ntfTab=node('ntf-tab'),zkrTab=node('zkr-tab');zkrTab.classList.add('act');
  let controlPanel=node('controls-old');
  const card=node('card'),nav=node('repairNav'),host=node('zMegaHost');host.parentElement=nav;nav.parentElement=card;nodes.set('zMegaHost',host);
  host.closest=()=>card;host.getBoundingClientRect=()=>{reads.push(state.hostWidth);return{width:state.hostWidth,height:50}};
  const document={...eventMap(documentEvents),readyState:'complete',hidden:false,body,
    getElementById:id=>nodes.get(id)||null,
    createElement:()=>node('created'),
    querySelector:s=>s==='.tab[data-t="ntf"]'?ntfTab:s==='.tab[data-t="zkr"]'?zkrTab:s==='#tfRefinedLayout>.tfControlPanel'?controlPanel:null};
  const zikir=()=>({cat:'esma',idx:0,position:1,length:99,name:'Latest '+state.count,ebced:42,count:state.count,auto:state.active});
  const flow=()=>({active:state.active,playing:state.active,paused:false,zikir:zikir()});
  const context={...eventMap(windowEvents),document,console,CustomEvent:class{constructor(type,options){this.type=type;this.detail=options?.detail}},navigator:{vibrate(){}},
    currentFlowState:{snapshot:flow,subscribe(fn){flowSubscribers.push(fn);fn(flow())}},
    currentZikirState:{snapshot:zikir,subscribe(fn){zikirSubscribers.push(fn);fn(zikir())}},
    SukunDockVisibility:{setHidden(){}},SukunDockSize:{refresh(){}},
    requestAnimationFrame(fn){const id=++serial;frames.set(id,fn);rafScheduled++;return id},
    cancelAnimationFrame(id){if(frames.delete(id))rafCancelled++},
    setTimeout(fn){const id=++serial;timers.set(id,fn);timerScheduled++;return id},clearTimeout:id=>timers.delete(id)};
  if(options.rawOnly)delete context.currentFlowState;
  context.window=context;context.addEventListener=context.addEventListener.bind(context);
  context.dispatchEvent=e=>context.emit(e.type,e.detail);vm.createContext(context);vm.runInContext(source,context,{filename:spec.id+'.js'});
  function flush(){for(let round=0;(timers.size||frames.size)&&round<30;round++){const ts=[...timers];timers.clear();ts.forEach(([,fn])=>fn());const fs=[...frames];frames.clear();fs.forEach(([,fn])=>fn());}assert.equal(timers.size+frames.size,0,'queue must settle');}
  function burst(n){for(let i=1;i<=n;i++){state.count=i;flowSubscribers.forEach(fn=>fn(flow()));zikirSubscribers.forEach(fn=>fn(zikir()));context.emit('sukun:currentzikirchange',zikir());context.emit('sukun:currentflowchange',flow());}}
  function visibility(hidden){document.hidden=hidden;document.emit('visibilitychange');}
  flush();writes.length=0;reads.length=0;
  return{context,document,state,frames,timers,writes,reads,burst,visibility,flush,
    latestControl(){controlPanel=node('controls-latest')},
    stats:()=>({rafScheduled,rafCancelled,timerScheduled,pendingRAF:frames.size,pendingTimers:timers.size}),
    badge:()=>nodes.get('zStage').firstElementChild?.querySelector('.r499Value')?.textContent,
    ownerActive:()=>body.classList.contains('r591-flow-active')};
}
const results=[];
for(const spec of specs){
  let before={pendingRAF:null,pendingTimers:null};
  if(baseline){const old=fixture(script(baseline,spec),spec);old.visibility(true);old.burst(10000);
    before=old.stats();assert(before.pendingRAF>=10000||before.pendingTimers>=10000,'baseline must reproduce unbounded hidden queue: '+spec.id);}
  const current=fixture(script(candidate,spec),spec);
  current.burst(10000);assert(current.frames.size<=1&&current.timers.size<=1,'visible burst coalesces '+spec.id);
  current.visibility(true);assert.equal(current.frames.size+current.timers.size,0,'hiding cancels pending work '+spec.id);
  if(spec.kind==='collapse'){current.visibility(false);current.flush();current.context.SukunDockCollapse.set(true);current.flush();current.visibility(true);}
  current.writes.length=0;current.reads.length=0;const scheduled=current.stats();current.burst(10000);
  assert.equal(current.frames.size,0,'hidden burst must never queue RAF '+spec.id);
  assert.equal(current.timers.size,0,'hidden burst must never queue timeout '+spec.id);
  assert.equal(current.stats().rafScheduled,scheduled.rafScheduled,'hidden burst submits no frame '+spec.id);
  assert.equal(current.writes.length,0,'hidden event burst makes no DOM writes '+spec.id);
  current.state.count=10001;current.state.active=spec.kind==='owner';current.state.hostWidth=260;current.latestControl();
  current.visibility(false);assert.equal(current.frames.size,1,'one latest visible frame '+spec.id);current.flush();
  if(spec.kind==='badge')assert.equal(current.badge(),'1. Latest 10001');
  if(spec.kind==='owner')assert.equal(current.ownerActive(),true);
  if(spec.kind==='collapse')assert.equal(current.context.SukunDockCollapse.get(),false,'latest inactive flow releases collapse');
  if(spec.kind==='repair')assert.deepEqual(current.reads,[260],'repair samples only latest width');
  if(spec.kind==='interaction'){assert(current.writes.some(w=>w[0]==='controls-latest'&&w[1]==='pointer-events'));assert(!current.writes.some(w=>w[0]==='controls-old'));}
  if(spec.kind==='badge'){
    const raw=fixture(script(candidate,spec),spec,{rawOnly:true});raw.visibility(true);raw.burst(10000);
    assert.equal(raw.frames.size+raw.timers.size,0,'raw-state badge subscription cannot build a hidden queue');
    assert.equal(raw.writes.length,0,'raw-state badge subscription makes no hidden DOM writes');
    raw.state.count=10001;raw.visibility(false);assert.equal(raw.frames.size,1);raw.flush();assert.equal(raw.badge(),'1. Latest 10001');
  }
  results.push({id:spec.id,pass:true,hiddenEvents:20000,baselinePendingRAF:before.pendingRAF,baselinePendingTimers:before.pendingTimers,candidateHiddenRAF:0,candidateHiddenTimers:0,latestVisibleState:true});
}
console.log(JSON.stringify({scope:'Exact shipped script bodies in controlled DOM/timer/RAF VM. No browser, compositor or physical lockscreen verification.',baselineRevision:comparison||null,passed:results.length,total:specs.length,results},null,2));
