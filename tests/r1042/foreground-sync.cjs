'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const code=html.match(/<script id="r609-lock-journey-runtime">([\s\S]*?)<\/script>/)[1];
function hub(){const listeners=new Map();return{addEventListener(type,fn){if(!listeners.has(type))listeners.set(type,new Set());listeners.get(type).add(fn);},fire(type){for(const fn of listeners.get(type)||[])fn({type});}};}
function fixture(options={}){
 let now=0,next=0;const jobs=new Map(),window=hub(),document=hub(),events=[],providers=new Map();
 const state={count:7,target:100,total:207,esma:{run:false,paused:false},berhet:{run:false,paused:false},...options};
 const calls={cats:0,zikir:0,count:0,registry:0,flow:0,playing:0};
 const card={style:{removeProperty(){}},dataset:{}};
 document.hidden=!!state.hidden;document.querySelector=()=>card;
 window.SukunEsma99Seyir={state:()=>state.esma};window.SukunBerhetiyyeSeyir={state:()=>state.berhet};
 window.AudioLife={userPaused:!!state.userPaused,register:(id,fn)=>providers.set(id,fn),set:(phase,reason)=>{calls.playing++;events.push({phase,reason});}};
 window.SukunAudioSessionRegistry={sync(){calls.registry++;}};
 window.currentFlowState={refresh(reason,force){calls.flow++;events.push({reason,force});}};
 const display={count:null,target:null,total:null};
 const context={window,document,JSON,localStorage:{getItem:()=>null,setItem(){throw Error('unexpected storage write');}},
  renderCats:()=>{calls.cats++;},renderZikir:swap=>{assert.equal(swap,false);calls.zikir++;},zUI:()=>{calls.count++;Object.assign(display,{count:state.count,target:state.target,total:state.total});},
  setTimeout:(fn,delay)=>{jobs.set(++next,{fn,at:now+delay});return next;},clearTimeout:id=>jobs.delete(id)};
 vm.createContext(context);vm.runInContext(code,context);
 function advance(ms){const until=now+ms;for(;;){const due=[...jobs].filter(([,job])=>job.at<=until).sort((a,b)=>a[1].at-b[1].at||a[0]-b[0])[0];if(!due)break;now=due[1].at;jobs.delete(due[0]);due[1].fn();}now=until;}
 function hidden(value){document.hidden=value;document.fire('visibilitychange');}
 return{window,document,state,calls,display,events,providers,jobs,advance,hidden};
}
const results=[];function test(name,fn){try{fn();results.push({name,status:'PASS'});}catch(error){results.push({name,status:'FAIL',error:error.stack});}}
test('Visible and pageshow wake events share one existing80-ms foreground sync',()=>{
 const f=fixture();f.hidden(false);f.window.fire('pageshow');f.window.fire('pageshow');f.advance(79);assert.equal(f.calls.count,0);f.advance(1);
 assert.deepEqual(f.calls,{cats:1,zikir:1,count:1,registry:1,flow:1,playing:0});
 f.advance(20);assert.equal(f.calls.count,1);
});
test('Pageshow first retains its bounded100-ms timer instead of queuing a second visible sync',()=>{
 const f=fixture();f.window.fire('pageshow');f.advance(10);f.hidden(false);f.advance(89);assert.equal(f.calls.count,0);f.advance(1);assert.equal(f.calls.count,1);f.advance(80);assert.equal(f.calls.cats,1);
});
test('Repeated foreground notifications before a frame do not postpone the pending sync',()=>{
 const f=fixture();f.hidden(false);for(let i=0;i<7;i++){f.advance(10);f.window.fire('pageshow');f.hidden(false);}f.advance(10);assert.equal(f.calls.count,1);assert.equal(f.calls.registry,1);
});
test('Hiding cancels foreground work without rebuilding the hidden view',()=>{
 const f=fixture();f.window.fire('pageshow');f.advance(20);f.hidden(true);f.advance(200);assert.equal(f.calls.cats,0);assert.equal(f.calls.zikir,0);assert.equal(f.calls.count,0);assert.equal(f.calls.registry,0);
});
test('Pagehide cancels foreground work even before visibility becomes hidden',()=>{
 const f=fixture();f.hidden(false);f.advance(20);f.window.fire('pagehide');f.advance(200);assert.equal(f.calls.count,0);assert.equal(f.calls.flow,0);
});
test('Pageshow while hidden does not queue a future rebuild',()=>{
 const f=fixture({hidden:true});for(let i=0;i<20;i++)f.window.fire('pageshow');f.advance(300);assert.equal(f.calls.count,0);f.hidden(false);f.advance(80);assert.equal(f.calls.count,1);
});
test('A later real return after cancellation owns one fresh foreground sync',()=>{
 const f=fixture();f.window.fire('pageshow');f.hidden(true);f.advance(120);f.hidden(false);f.window.fire('pageshow');f.advance(80);assert.equal(f.calls.count,1);f.advance(100);assert.equal(f.calls.count,1);
});
test('A completed sync permits a later foreground cycle to synchronize again',()=>{
 const f=fixture();f.hidden(false);f.advance(80);f.hidden(true);f.advance(1000);f.hidden(false);f.window.fire('pageshow');f.advance(80);assert.equal(f.calls.count,2);assert.equal(f.calls.registry,2);assert.equal(f.calls.flow,2);
});
test('The single sync paints the latest count and target without changing either',()=>{
 const f=fixture();f.hidden(false);f.state.count=13;f.state.target=660;f.state.total=213;f.window.fire('pageshow');f.advance(80);
 assert.deepEqual(f.display,{count:13,target:660,total:213});assert.equal(f.state.count,13);assert.equal(f.state.target,660);assert.equal(f.state.total,213);assert.equal(f.calls.count,1);
});
for(const family of ['esma','berhet'])test('Running '+family+' journey keeps native AudioLife playing reconciliation once',()=>{
 const f=fixture({[family]:{run:true,paused:false}});f.hidden(false);f.window.fire('pageshow');f.advance(80);assert.equal(f.calls.playing,1);assert.equal(f.events[0].phase,'playing');assert.equal(f.events[0].reason,family==='esma'?'esma99-visible-sync':'berhetiyye-visible-sync');
 assert.equal(f.calls.count,1);assert.equal(f.calls.registry,1);assert.equal(f.calls.flow,1);
});
test('A user pause remains untouched when physical journey state still says running',()=>{
 const f=fixture({userPaused:true,esma:{run:true,paused:false}});f.hidden(false);f.window.fire('pageshow');f.advance(80);assert.equal(f.calls.playing,0);assert(f.window.AudioLife.userPaused);assert.equal(f.calls.registry,1);
});
test('Paused journeys do not acquire a new playing intent',()=>{
 const f=fixture({esma:{run:true,paused:true},berhet:{run:true,paused:true}});f.hidden(false);f.advance(80);assert.equal(f.calls.playing,0);assert.equal(f.calls.count,1);
});
test('Provider registration and forced current-flow refresh preserve their existing owners',()=>{
 const f=fixture({berhet:{run:true,paused:false}});f.hidden(false);f.window.fire('pageshow');f.advance(80);assert.equal(f.providers.size,2);assert.equal(f.providers.get('journey28')(),true);assert.equal(f.providers.get('journey99')(),false);
 assert(f.events.some(e=>e.reason==='r609-visible-sync'&&e.force===true));assert.equal(f.window.SukunJourneyLockGuard.version,'r609');
});
test('Current-zikir and playback notifications keep the lightweight card repair without a full sync',()=>{
 const f=fixture();f.window.fire('sukun:currentzikirchange');f.window.fire('sukun:playbackchange');f.advance(150);assert.equal(f.calls.cats,0);assert.equal(f.calls.count,0);assert.equal(f.calls.registry,0);
});
const report={total:results.length,passed:results.filter(r=>r.status==='PASS').length,failed:results.filter(r=>r.status==='FAIL').length,scope:'Production r609 foreground lifecycle source with controlled events/timers. Duplicate wake work is bounded to one existing structural sync; counter and audio reconciliation remain unchanged. No Android paint timing is measured.',results};
console.log(JSON.stringify(report,null,2));if(report.failed)process.exitCode=1;
