'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {execFileSync}=require('node:child_process');

const html=fs.readFileSync(path.join(__dirname,'../../index.html'),'utf8');
// Optional controlled regression comparison uses the committed source entirely
// in memory; the test remains portable in update packages without a .git folder.
const comparison=process.argv.find(s=>s.startsWith('--compare-base='))?.slice('--compare-base='.length)||(process.argv.includes('--compare-head')?'HEAD':null);
const baseline=comparison?execFileSync('git',['show',comparison+':index.html'],{cwd:path.join(__dirname,'../..'),encoding:'utf8',maxBuffer:32*1024*1024}):null;
function script(id,source=html){
  const found=source.match(new RegExp('<script\\b[^>]*\\bid="'+id+'"[^>]*>([\\s\\S]*?)</script>'));
  assert(found,'missing real production script '+id);
  return found[1];
}
function surface(){
  const windowEvents=new Map(),documentEvents=new Map(),frames=new Map(),subscriptions=[],observers=[],timers=[],intervals=[];
  let sequence=0,state={name:'Yâ Başlangıç',meaning:'initial',cat:'esma',idx:0,target:33,ebced:33,auto:false},transportCalls=0,reads=0;
  function events(map){return {addEventListener(type,callback){if(!map.has(type))map.set(type,[]);map.get(type).push(callback)}}}
  function dispatch(map,type){for(const callback of map.get(type)||[])callback({type,detail:{}})}
  function element(id=''){
    let value='';
    const classes=new Set(),attrs=new Map();
    return {id,hidden:false,isConnected:true,dataset:{},style:{width:'',getPropertyValue(){return ''},setProperty(){}},
      classList:{add(...xs){xs.forEach(x=>classes.add(x))},remove(...xs){xs.forEach(x=>classes.delete(x))},contains(x){return classes.has(x)},toggle(x,on){if(on===undefined)on=!classes.has(x);on?classes.add(x):classes.delete(x);return on}},
      get textContent(){return value},set textContent(v){value=String(v)},get innerHTML(){return value},set innerHTML(v){value=String(v)},
      getAttribute(k){return attrs.get(k)||null},setAttribute(k,v){attrs.set(k,String(v))},
      querySelector(){return null},querySelectorAll(){return []},addEventListener(){},closest(){return null},
      getBoundingClientRect(){return {top:0,bottom:100,left:0,right:100,width:100,height:100}},
      click(){transportCalls++},appendChild(){},append(){},insertBefore(){},prepend(){},remove(){}};
  }
  const ids=new Map();
  for(const id of ['tab-amb','r616Topbar','r616HomeZikir','r616HomeMeaning','r616HomeTarget','r616HomeStart','r616ContinueTitle','r616ContinueMeta','r616ContinueBtn','r616Continue','tekkeContextCard','tekkeContextName','tekkeContextArabic','tekkeContextMeta','tekkeContextMeaning','tekkeBtn','r630TekkeQuick','tekkeTab','r616TekkeBtn','tcHi'])ids.set(id,element(id));
  const wrap=element('wrap'),body=element('body'),root=element('html');root.lang='tr';
  const document={...events(documentEvents),hidden:false,readyState:'complete',body,documentElement:root,
    getElementById(id){return ids.get(id)||null},querySelector(selector){return selector==='.wrap'?wrap:null},querySelectorAll(){return []},createElement(){return element()}};
  const window={...events(windowEvents),currentZikirState:{snapshot(){reads++;return {...state}},subscribe(callback){subscriptions.push(callback);callback({...state})}},
    SukunSecretPolicy:{unlocked(){return true}},SukunEsma99Seyir:{state(){return {run:false,i:0}},play(){transportCalls++},pause(){transportCalls++},resume(){transportCalls++}},SukunBerhetiyyeSeyir:{state(){return {run:false,i:0}},play(){transportCalls++},pause(){transportCalls++},resume(){transportCalls++}},
    dispatchEvent(event){dispatch(windowEvents,event.type)},scrollTo(){},scrollBy(){}};
  const context=vm.createContext({window,document,console,innerHeight:691,localStorage:{getItem(){return null},setItem(){}},
    MutationObserver:class {constructor(callback){this.callback=callback;observers.push(this)}observe(){}},
    CustomEvent:class {constructor(type,options={}){this.type=type;Object.assign(this,options)}},
    requestAnimationFrame(callback){const id=++sequence;frames.set(id,callback);return id},cancelAnimationFrame(id){frames.delete(id)},
    setTimeout(callback){timers.push(callback);return timers.length},clearTimeout(){},setInterval(callback){intervals.push(callback);return intervals.length},clearInterval(){},
    getComputedStyle(){return {display:'block',visibility:'visible',position:'static'}}});
  return {context,frames,ids,observers,timers,intervals,
    run(id,source){vm.runInContext(script(id,source),context,{filename:id+'.js'})},
    publish(n,event){state={...state,name:'Yâ Son '+n,meaning:'meaning '+n,target:n+1,idx:n,count:n};for(const callback of subscriptions)callback({...state});if(event)dispatch(windowEvents,event)},
    hide(){document.hidden=true;dispatch(documentEvents,'visibilitychange')},show(){document.hidden=false;dispatch(documentEvents,'visibilitychange')},
    emit(type){dispatch(windowEvents,type)},
    flush(){let rounds=0;while(frames.size){assert(++rounds<8,'render caused an unbounded follow-up frame loop');const queued=[...frames];frames.clear();for(const [,callback]of queued)callback(rounds*16)}},
    get reads(){return reads},get transportCalls(){return transportCalls}};
}

const cases=[
  {id:'r616-friendly-ui-runtime',event:'sukun:currentflowchange',output:'r616HomeZikir'},
  {id:'r630-tekke-context-runtime',event:'sukun:languagechange',output:'tekkeContextName'},
  {id:'sukun-r821-tekke-context-authority',event:'sukun:currentzikirchange',output:'tekkeContextName'}
];
for(const item of cases){
  let legacyPending=null;
  if(baseline){
    const old=surface();old.run(item.id,baseline);old.flush();old.hide();
    for(let n=1;n<=10000;n++)old.publish(n,item.event);
    legacyPending=old.frames.size;
    assert(legacyPending>=10000,item.id+' baseline must reproduce the hidden frame backlog');
    assert.equal(old.transportCalls,0);
  }
  const s=surface();s.run(item.id);s.flush();
  // A visible burst has at most one pending render, including overlapping
  // state, lifecycle and observer invalidations from the real production code.
  for(let n=1;n<=10000;n++){s.publish(n,item.event);for(const observer of s.observers)observer.callback();}
  assert.equal(s.frames.size,1,item.id+' must coalesce a visible publication burst');
  s.hide();assert.equal(s.frames.size,0,item.id+' must cancel an already queued frame when hidden');
  const readsBefore=s.reads;
  for(let n=10001;n<=20000;n++){s.publish(n,item.event);for(const observer of s.observers)observer.callback();for(const interval of s.intervals)interval();}
  for(const timer of s.timers)timer();
  assert.equal(s.frames.size,0,item.id+' must queue no RAF while hidden');
  assert.equal(s.reads,readsBefore,item.id+' must defer hidden snapshot/render work');
  s.show();assert.equal(s.frames.size,1,item.id+' must enqueue one final visible render');
  s.flush();
  assert.equal(s.ids.get(item.output).textContent,'Yâ Son 20000',item.id+' must render the latest state');
  assert.equal(s.transportCalls,0,item.id+' presentation updates must not issue transport commands');
  // Repeated lock/unlock cycles cannot retain retired frames or stale state.
  for(let n=20001;n<=20010;n++){s.publish(n,item.event);s.hide();s.publish(n+1,item.event);s.show();assert.equal(s.frames.size,1);s.flush();assert.equal(s.ids.get(item.output).textContent,'Yâ Son '+(n+1));}
  assert.equal(s.transportCalls,0);
  console.log('PASS',item.id,'10000 hidden publications, bounded RAF, latest visible state, no transport commands',legacyPending===null?'':'(HEAD pending='+legacyPending+', patched hidden=0, visible=1)');
}
