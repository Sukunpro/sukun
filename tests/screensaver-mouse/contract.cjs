'use strict';
// Real shipped Kandil owner, deterministic time and minimal DOM. No app/user data.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
let passed=0;
function check(name,fn){fn();passed++;console.log('PASS '+name)}
function fixture(shell,mode='1m'){
 const html=fs.readFileSync(path.join(root,shell),'utf8'),start=html.indexOf('const KANDIL_PREF_KEY='),end=html.indexOf('/* Diğer tüm sesli okuyucular',start);
 assert(start>=0&&end>start,'shipped owner boundaries');
 const listeners={document:new Map(),window:new Map()},nodes={},storageWrites=[],timers=new Map(),oldTimers=new Map();let now=1000000,id=0;
 const listen=scope=>(type,fn,options)=>{const entries=listeners[scope].get(type)||[];entries.push({fn,options});listeners[scope].set(type,entries)};
 const document={hidden:false,readyState:'complete',addEventListener:listen('document'),getElementById:id=>nodes[id]||null,querySelector:s=>nodes[s.slice(1)]||null,querySelectorAll:()=>[]};
 function node(name,hidden=false){const classes=new Set();return nodes[name]={id:name,hidden,disabled:false,isConnected:true,dataset:{},attrs:{},style:{setProperty(){}},options:[],classList:{contains:v=>classes.has(v),add:(...v)=>v.forEach(x=>classes.add(x)),remove:(...v)=>v.forEach(x=>classes.delete(x))},setAttribute(k,v){this.attrs[k]=v},getClientRects(){return this.hidden?[]:[{}]},closest(s){return s.split(',').map(x=>x.trim()).includes('#'+this.id)?this:null},focus(){document.activeElement=this},querySelectorAll:()=>[]}}
 document.body=node('body');document.activeElement=node('prior');
 for(const name of ['kandil','kandilWake','kandilSettingsButton','kandilPowerWrap','onboardCard','kSaat','kTarih','kEsmaAr','kEsmaTr'])node(name,['onboardCard','kandilPowerWrap'].includes(name));
 nodes.kandil.querySelectorAll=()=>[nodes.kandilWake,nodes.kandilSettingsButton];
 const window={addEventListener:listen('window')};
 function set(fn,ms,interval=false){const key=++id,job={fn,ms,due:now+ms,interval};timers.set(key,job);oldTimers.set(key,job);return key}
 const context=vm.createContext({window,document,$:document.querySelector,Number,Object,Math,console,Date:class extends Date{constructor(...args){super(...(args.length?args:[now]))}static now(){return now}},S:{get:(key,fallback)=>key==='sukun.kandil.idle'?mode:fallback,set:(...args)=>storageWrites.push(args)},localStorage:{getItem:()=>JSON.stringify(mode)},getComputedStyle:()=>({display:'block',visibility:'visible'}),setTimeout:(fn,ms)=>set(fn,ms),clearTimeout:key=>timers.delete(key),setInterval:(fn,ms)=>set(fn,ms,true),clearInterval:key=>timers.delete(key)});
 vm.runInContext(html.slice(start,end),context,{filename:shell+'-kandil-owner'});
 function emit(type,extra={},scope='document'){
  const event={type,target:nodes.prior,isTrusted:true,preventDefault(){this.prevented=true},stopImmediatePropagation(){this.stopped=true},...extra};
  for(const {fn}of listeners[scope].get(type)||[]){fn(event);if(event.stopped)break}return event;
 }
 function advance(ms){const until=now+ms;let runs=0;for(;;){const next=[...timers].filter(([,t])=>t.due<=until).sort((a,b)=>a[1].due-b[1].due)[0];if(!next)break;assert(++runs<10000);const [key,t]=next;now=t.due;t.interval?t.due+=t.ms:timers.delete(key);t.fn()}now=until}
 return{api:window.SukunKandil,context,document,window,nodes,listeners,timers,oldTimers,storageWrites,advance,emit,move:(x,y,extra={})=>emit('mousemove',{clientX:x,clientY:y,...extra}),snapshot:()=>window.SukunKandil.snapshot(),idle:()=>[...timers].filter(([,job])=>job.ms===window.SukunKandil.snapshot().idleMs),settings:()=>vm.runInContext('({active:KANDIL.settingsActive,until:KANDIL.settingsUntil})',context)};
}
for(const shell of ['index.html','nero.html']){
 check(shell+': trusted desktop motion postpones both idle modes until the full quiet interval',()=>{
  for(const [mode,delay]of [['1m',60000],['5m',300000]]){const f=fixture(shell,mode);f.move(10,20);f.advance(delay-1);f.move(11,20);f.advance(1);assert.equal(f.snapshot().on,false);f.advance(delay-2);assert.equal(f.snapshot().on,false);f.advance(1);assert.equal(f.snapshot().on,true);assert.equal(f.snapshot().timerPending,false)}
 });
 check(shell+': continuous real movement retains one idle deadline and invalidates stale callbacks',()=>{
  const f=fixture(shell);const old=f.idle()[0][0];for(let i=0;i<180;i++){f.advance(1000);f.move(20+i,30);assert.equal(f.snapshot().on,false);assert.equal(f.idle().length,1)}
  f.oldTimers.get(old).fn();assert.equal(f.snapshot().on,false);assert.equal(f.idle().length,1);assert.deepEqual(f.storageWrites,[]);f.advance(59999);assert.equal(f.snapshot().on,false);f.advance(1);assert.equal(f.snapshot().on,true);
 });
 check(shell+': synthetic, stationary, malformed and touch-compatibility mouse events cannot keep the page awake',()=>{
  const f=fixture(shell);f.move(10,20);f.advance(59999);const before=f.idle()[0][0];
  for(const move of [()=>f.move(50,50,{isTrusted:false}),()=>f.move(10,20),()=>f.move(NaN,20),()=>f.move(20,Infinity),()=>f.move(30,40,{sourceCapabilities:{firesTouchEvents:true}})]){move();assert.equal(f.idle()[0][0],before)}
  f.advance(1);assert.equal(f.snapshot().on,true);
 });
 check(shell+': passive capture sees movement without consuming app or mobile gestures',()=>{
  const f=fixture(shell),listeners=f.listeners.document.get('mousemove');assert.equal(listeners.length,1);assert.equal(listeners[0].options.capture,true);assert.equal(listeners[0].options.passive,true);
  const event=f.move(1,1);assert(!event.prevented&&!event.stopped);
  for(const type of ['touchstart','click','keydown']){const g=fixture(shell);g.advance(59999);g.emit(type,{key:'ArrowRight'});assert.equal(g.snapshot().on,false);g.advance(1);assert.equal(g.snapshot().on,false);g.advance(59999);assert.equal(g.snapshot().on,true)}
 });
 check(shell+': movement on the saver reveals settings without dismissing or altering playback/session',()=>{
  const f=fixture(shell);const session={activeMode:'esma',playing:true,count:23,journey:{active:true}};f.window.SukunSessionState={peek:()=>session};const before=JSON.stringify(session);
  assert.equal(f.api.show(),true);f.move(10,20);assert.equal(f.snapshot().on,true);assert.equal(f.settings().active,true);assert.equal(f.snapshot().timerPending,false);
  f.advance(59000);f.move(11,20);f.advance(1000);assert.equal(f.settings().active,true);assert.equal(f.snapshot().on,true);assert.equal(JSON.stringify(session),before);assert.deepEqual(f.storageWrites,[]);
 });
 check(shell+': explicit return, Escape focus restore, Tab trap and touch return remain intact',()=>{
  for(const action of ['click','Escape','Enter',' ']){const f=fixture(shell);assert.equal(f.api.show(),true);f.move(10,20);const tab=f.emit('keydown',{key:'Tab'});assert(tab.prevented&&tab.stopped);assert.equal(f.document.activeElement,f.nodes.kandilSettingsButton);
   const event=action==='click'?f.emit('click',{target:f.nodes.kandilWake}):f.emit('keydown',{key:action,target:f.nodes.kandilWake});assert(event.prevented&&event.stopped);assert.equal(f.snapshot().on,false);assert.equal(f.document.activeElement,f.nodes.prior);assert.equal(f.snapshot().timerPending,true);
   if(action!=='click'){const up=f.emit('keyup',{key:action});assert(up.prevented&&up.stopped)}
  }
  const f=fixture(shell);f.api.show();f.emit('touchstart');assert.equal(f.snapshot().on,true);f.emit('click',{target:f.nodes.kandilWake});assert.equal(f.snapshot().on,false);
 });
 check(shell+': off, hidden page, onboarding and busy audio gates still win over mouse activity',()=>{
  const off=fixture(shell,'off');off.move(1,1);off.advance(300000);assert.equal(off.snapshot().on,false);assert.equal(off.snapshot().timerPending,false);
  const hidden=fixture(shell);hidden.document.hidden=true;hidden.emit('visibilitychange');hidden.move(1,1);assert.equal(hidden.snapshot().timerPending,false);hidden.document.hidden=false;hidden.emit('visibilitychange');hidden.advance(59999);assert.equal(hidden.snapshot().on,false);hidden.advance(1);assert.equal(hidden.snapshot().on,true);
  const tour=fixture(shell);tour.nodes.onboardCard.hidden=false;tour.move(1,1);assert.equal(tour.snapshot().timerPending,false);assert.equal(tour.api.show(),false);
  const busy=fixture(shell);busy.window.SukunAudioTruth={snapshot:()=>({tangible:true})};busy.move(1,1);busy.advance(60000);assert.equal(busy.snapshot().on,false);assert.equal(busy.snapshot().deferrals,1);assert.equal(busy.idle().length,1);
 });
}
console.log(JSON.stringify({passed,total:passed,shells:['index.html','nero.html'],method:'shipped-owner deterministic DOM/clock; trusted-event shape is controlled here, native events verified by browser suite'}));
