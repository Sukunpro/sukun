'use strict';
// Execute the shipped dock and authority publisher. RAF, state and document
// endpoints are controlled; this is not a browser timing or Android benchmark.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const script=id=>{const match=html.match(new RegExp('<script id="'+id+'">([\\s\\S]*?)</script>'));assert(match,'production script '+id);return match[1]};
const dock=script('r633-flow-dock-placement-runtime'),authority=script('r632-state-authority-regression-shield');
const publisher=authority.slice(authority.indexOf('function signature(s)'),authority.indexOf('function schedule(',authority.indexOf('function signature(s)')));
assert(publisher.includes('s.zikir?.countRaw'),'production authority publishes counter changes');
let checks=0;const check=(value,message)=>{assert(value,message);checks++};
function fixture(){
 const windowEvents=new Map(),documentEvents=new Map(),frames=new Map(),timers=new Map();let next=0,scheduled=0,published=0,layoutReads=0;
 const list=new Set();const classes={contains:key=>list.has(key),add:(...keys)=>keys.forEach(key=>list.add(key)),remove:(...keys)=>keys.forEach(key=>list.delete(key)),toggle(key,value){const on=value===undefined?!list.has(key):value;on?list.add(key):list.delete(key);return on}};
 const on=events=>(name,fn)=>{if(!events.has(name))events.set(name,[]);events.get(name).push(fn)};
 let model={truth:{state:'playing',source:'auto-zikir'},playback:{provider:'recording',registryState:'playing',lockPlaying:false,counterGate:{}},foreground:{owner:'auto-zikir'},journey:{active:'',paused:false},zikir:{cat:'esma',idx:0,name:'Yâ Rahmân',countRaw:0,target:298},ui:{view:'zikir',layout:'classic',skin:'feyz',tefekkur:false,tekke:false,hidden:false},consistency:{issues:[]}};
 const document={hidden:false,readyState:'loading',documentElement:{style:{},get clientHeight(){layoutReads++;throw Error('layout read outside measured frame')}},body:{classList:classes},getElementById:()=>null,addEventListener:on(documentEvents)};
 const context={document,localStorage:{getItem:()=>null},performance:{now:()=>1000},MutationObserver:class{observe(){}},ResizeObserver:class{observe(){}disconnect(){}},CustomEvent:class{constructor(type,options){this.type=type;this.detail=options?.detail}},getComputedStyle:()=>{layoutReads++;throw Error('layout read outside measured frame')},requestAnimationFrame(fn){const id=++next;frames.set(id,fn);scheduled++;return id},setTimeout(fn){const id=++next;timers.set(id,fn);return id},clearTimeout:id=>timers.delete(id),addEventListener:on(windowEvents),dispatchEvent(event){if(event.type==='sukun:authoritychange')published++;for(const fn of windowEvents.get(event.type)||[])fn(event)},derive:()=>model,freeze:value=>value,listeners:new Set(),Date,console};
 context.window=context;vm.createContext(context);
 vm.runInContext('let state=derive(),lastSig="",revision=1;'+publisher+'\nlastSig=signature(state);this.SukunStateAuthority={snapshot:()=>state};',context);
 vm.runInContext(dock,context);
 const emit=(name,detail)=>context.dispatchEvent({type:name,detail});
 function change(part){model={...model,...part};context.publish('fixture-state');}
 function flush(){const ready=[...frames.values()];frames.clear();ready.forEach(fn=>fn());}
 return{context,document,frames,timers,emit,change,flush,model:()=>model,get scheduled(){return scheduled},get published(){return published},get layoutReads(){return layoutReads}};
}
const f=fixture();
for(let count=1;count<=3600;count++){f.change({zikir:{...f.model().zikir,countRaw:count}});f.flush();}
check(f.published===3600,'actual authority publisher still emits every counter change');
check(f.scheduled===0,'3,600 count-only progress publishes schedule no dock geometry frames; observed '+f.scheduled);
check(f.layoutReads===0,'pure progress listener does not read layout');
for(const [label,part] of [
 ['pause',{truth:{state:'paused',source:'auto-zikir'}}],
 ['name selection',{zikir:{...f.model().zikir,idx:1,name:'Yâ Rahîm'}}],
 ['target change',{zikir:{...f.model().zikir,target:500}}],
 ['Feyz skin change',{ui:{...f.model().ui,skin:'seal'}}],
 ['Classic view change',{ui:{...f.model().ui,view:'home'}}],
 ['reflection entry',{ui:{...f.model().ui,tefekkur:true}}]
]){const before=f.scheduled;f.change(part);check(f.scheduled===before+1,label+' retains dock geometry invalidation');f.flush();}
f.emit('sukun:authoritychange');check(f.frames.size===1,'legacy authority events without a model retain the safe reconciliation');f.flush();
const before=f.scheduled;f.emit('sukun:r698modechange');f.emit('sukun:tabchange');f.emit('sukun:r619skinchange');check(f.scheduled===before+1,'explicit mode/tab/skin events remain coalesced');f.flush();
f.document.hidden=true;f.change({ui:{...f.model().ui,hidden:true}});check(f.frames.size===0,'hidden authority transition does not schedule graphics');
f.document.hidden=false;f.change({ui:{...f.model().ui,hidden:false}});check(f.frames.size===1,'foreground authority transition still reconciles geometry');f.flush();
const repeat=f.scheduled;for(let i=0;i<100;i++)f.emit('sukun:authoritychange',f.model());check(f.scheduled===repeat,'unchanged authority republishing does not measure geometry');
console.log(JSON.stringify({total:checks,passed:checks,failed:0,progressPublishes:3600,progressGeometryFrames:0,scope:'Production dock script and authority publisher with controlled RAF/state/document endpoints. No browser timing or hardware performance claim.'},null,2));
