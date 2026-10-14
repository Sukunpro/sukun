'use strict';
// Production session selection/read-model/commands and motion controller;
// legacy owner and DOM/native media endpoints are controlled boundaries.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
function fixture(root,{enabled=true}={}){
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),code=fs.readFileSync(path.join(root,'assets/runtime/wheels-r924.js'),'utf8');
 const motion=code.slice(code.indexOf('/* r929: compositor-only motion;'),code.indexOf('/* r932: stationary shortcuts'));
 const between=(start,end)=>{const a=html.indexOf(start),b=html.indexOf(end,a);assert(a>=0&&b>a,'production boundary '+start);return html.slice(a,b)};
 let selected='single',at=100000,seq=0;const actions=[],jobs=new Map(),listeners=[];
 function hub(){const map=new Map();return{addEventListener(type,fn,opt={}){if(!map.has(type))map.set(type,new Set());map.get(type).add(fn);listeners.push({type,opt});opt.signal?.addEventListener('abort',()=>map.get(type)?.delete(fn),{once:true})},dispatchEvent(e){for(const fn of [...map.get(e.type)||[]])fn(e);return true},fire(type,props={}){this.dispatchEvent({type,...props})}}}
 function node(id){const values=new Map(),children=[];return Object.assign(hub(),{id,dataset:{},hidden:false,isConnected:true,children,style:{setProperty:(k,v)=>values.set(k,String(v)),getPropertyValue:k=>values.get(k)||''},append(n){children.push(n);n.parentElement=this},contains(n){return n===this||children.some(child=>child.contains(n))}})}
 const body=node('body');body.classList={contains:()=>false};const frame=node('r924WheelFrame'),stone=node('r920Plus'),counter=node('r920Counter'),outside=node('outside'),toggle=node('r925WheelMotion'),tekke=node('tk');
 frame.dataset.wheelState='ready';frame.append(stone);frame.append(counter);tekke.hidden=true;
 const elements={r924WheelFrame:frame,r920Plus:stone,r920Counter:counter,r925WheelMotion:toggle,tk:tekke};
 const document=Object.assign(hub(),{hidden:false,visibilityState:'visible',readyState:'loading',body,documentElement:{dataset:{}},getElementById:id=>elements[id]||null});
 const reduced=Object.assign(hub(),{matches:false}),win=hub(),Z={cat:'esma',idx:0,count:42,total:142,target:100,auto:false};
 const states={'28':{i:1,rep:42,run:false,paused:false,systemHold:false},'99':{i:1,rep:42,run:false,paused:false,systemHold:false}};
 const media={currentTime:3.25,paused:true,play(){actions.push('media.play');this.paused=false},pause(){actions.push('media.pause');this.paused=true}};
 let directPaused=false,aggregatePaused=false;
 function currentOwner(){return ['28','99'].find(kind=>states[kind].run||states[kind].paused||states[kind].systemHold)||'single'}
 function pause(){const kind=currentOwner();if(kind==='single'){Z.auto=false;directPaused=true}else{states[kind].run=false;states[kind].paused=true}media.pause();return true}
 function resume(){const kind=currentOwner();if(kind==='single'){Z.auto=true;directPaused=false}else{states[kind].run=true;states[kind].paused=false}media.play();return true}
 function journey(kind){const s=states[kind];return{state:()=>s,display:()=>({index:s.i,name:'Synthetic '+kind,count:s.rep,target:100,complete:false}),jumpTo(i){actions.push('journey'+kind+'.jump');s.i=i;return true},play(){actions.push('journey'+kind+'.play');s.run=true;s.paused=false;media.play();return true},resume(){actions.push('journey'+kind+'.resume');return resume()},pause(){actions.push('journey'+kind+'.pause');return pause()},stop(){actions.push('journey'+kind+'.stop');s.run=s.paused=false;media.pause();return true}}}
 const c={window:null,document,navigator:{},location:{search:''},URLSearchParams,Set,Map,Math,Number,Object,String,Promise,AbortController,
  Date:{now:()=>at},CustomEvent:class{constructor(type,opt){this.type=type;this.detail=opt?.detail}},queueMicrotask,
  addEventListener:win.addEventListener.bind(win),dispatchEvent:win.dispatchEvent.bind(win),matchMedia:()=>reduced,
  localStorage:{getItem:()=>enabled?null:'0',setItem(){}},Z,ZIKIR:{esma:{items:[{},{}]},berhet:{items:[{},{}]}},
  SukunSecretPolicy:{unlocked:()=>true},SukunTabOwner:{owns:()=>true},
  currentZikirState:{snapshot:()=>({...Z,name:'Synthetic name',session:{active:Z.auto||directPaused,paused:directPaused}}),refresh(){}},
  currentFlowState:{snapshot:()=>({}),refresh(){}},
  SukunForegroundArbiter:{snapshot:()=>({owner:{type:currentOwner()==='single'?(Z.auto||directPaused?'auto-zikir':''):'journey'+currentOwner()}})},
  SukunJourneyController:{target:()=>selected,select(kind){selected=kind;return true}},
  SukunBerhetiyyeSeyir:journey('28'),SukunEsma99Seyir:journey('99'),
  SukunJourneyAudioMachine:{intent:(...args)=>actions.push('intent:'+args[0])},
  SukunAudioSessionRegistry:{aggregateSnapshot:()=>({paused:aggregatePaused}),pauseAll(){actions.push('registry.pauseAll');aggregatePaused=true;return pause()},resumeAll(){actions.push('registry.resumeAll');aggregatePaused=false;return resume()},reconcilePauseGate(){}},
  SukunR698Transport:{snapshot:()=>({direct:{auto:Z.auto,paused:directPaused,active:Z.auto||directPaused,starting:false}}),presentation:()=>({}),cancelPending(){},
   pauseDhikr(){const kind=currentOwner();if(kind==='single'){actions.push('direct.pause');return pause()}return c[kind==='28'?'SukunBerhetiyyeSeyir':'SukunEsma99Seyir'].pause()},
   resumeDhikr(){if(aggregatePaused)return false;const kind=currentOwner();if(kind!=='single')return c[kind==='28'?'SukunBerhetiyyeSeyir':'SukunEsma99Seyir'].resume();actions.push(directPaused?'direct.resume':'direct.play');return resume()},
   playPause(){actions.push('direct.play');Z.auto=true;directPaused=false;media.play();return true}},
  setTimeout(fn,delay){const id=++seq;jobs.set(id,{fn,at:at+delay});return id},clearTimeout:id=>jobs.delete(id),
  rep(){throw Error('automatic pointer interaction attempted manual credit')}
 };
 c.window=c;
 document.querySelector=s=>{const cat=s.match(/^#zCats \[data-c="([^"]+)"\]$/),item=s.match(/^#zList \[data-i="(\d+)"\]$/);if(cat)return{click:()=>{Z.cat=cat[1];Z.auto=false;directPaused=false}};if(item)return{click:()=>{Z.idx=Number(item[1])}};return null};
 vm.createContext(c);vm.runInContext(fs.readFileSync(path.join(root,'assets/runtime/session-r919.js'),'utf8'),c);
 vm.runInContext(between('const SukunManualCounter=(()=>{','// A disabled native count button'),c);
 vm.runInContext(between('window.SukunCountCorrection=(()=>{','function rep(){'),c);
 vm.runInContext(motion,c);
 c.SukunSessionState.subscribe(s=>c.SukunWheelMotion.render(s));
 const host={querySelector:s=>s==='#r924WheelFrame'?frame:s==='#r925WheelMotion'?toggle:null};c.SukunWheelMotion.connect(host);
 const hostile=()=>{throw Error('motion took ownership of a native gesture')};
 return{c,frame,stone,counter,outside,toggle,document,reduced,actions,jobs,listeners,media,states,motion,api:c.SukunWheelMotion,
  async start(kind='single'){const mode=kind==='28'?'berhet':'esma';const selectedResult=await c.SukunSessionState.command('select',{mode,index:1,journeyKind:kind});assert.equal(selectedResult.accepted,true);const started=await c.SukunSessionState.command('start');assert.equal(started.accepted,true);await this.flush();const s=this.snapshot();assert.equal(s.journeyKind,kind);assert.equal(s.activeMode,mode);assert.equal(s.activeIndex,1);assert.equal(s.phase,'PLAYING');actions.length=0;return s},
  snapshot:()=>c.SukunSessionState.snapshot(),
  async flush(){for(let i=0;i<12;i++)await Promise.resolve()},
  down(id=1,pointerType='touch',target=stone,button=0){const e={type:'pointerdown',pointerId:id,pointerType,target,button,preventDefault:hostile,stopPropagation:hostile,setPointerCapture:hostile};document.dispatchEvent(e);frame.dispatchEvent(e)},
  up(id=1,type='pointerup'){document.fire(type,{pointerId:id,pointerType:'touch',target:stone,preventDefault:hostile})},
  focus(target=stone){document.activeElement=target;frame.fire('focusin',{target})},
  keyboard(key='Tab',onFrame=false){document.fire('keydown',{key,target:onFrame?stone:outside});if(onFrame)frame.fire('keydown',{key,target:stone})},
  leave(target=outside){document.activeElement=target;frame.fire('focusout',{relatedTarget:target})},
  emit(type,props={}){win.fire(type,props)},
  async visible(hidden){document.hidden=hidden;document.visibilityState=hidden?'hidden':'visible';document.fire('visibilitychange');await this.flush()},
  advance(ms){at+=ms;for(const[id,job]of [...jobs])if(job.at<=at){jobs.delete(id);job.fn()}},
  transportState:()=>({auto:Z.auto,count:Z.count,total:Z.total,currentTime:media.currentTime,paused:media.paused,journeys:Object.fromEntries(Object.entries(states).map(([k,s])=>[k,{...s}]))})
 };
}
module.exports={fixture};
