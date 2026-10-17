'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const source=fs.readFileSync(path.join(root,'assets/berhetiyye-gate/access-r1080.js'),'utf8');
const portal=fs.readFileSync(path.join(root,'assets/berhetiyye-gate/portal-r1080.js'),'utf8');
function fixture(){
 const events=[],wheel={id:'wheel',isConnected:true},counter={id:'counter'},name={id:'name'},state={activeMode:'berhet',activeIndex:7,count:9,journeyKind:'28'},gate={open:false};let unlocked=true;
 let activeTab=false;const window={KLT_ACIK:()=>unlocked,KLT_KURULU:()=>true,SukunSessionState:{snapshot:()=>state,command:()=>{throw Error('Reveal must not select or play');}},SukunBerhetGate:{snapshot:()=>gate},SukunPracticeUI:{restorePresentation:()=>{events.push('restore');return true;}},SukunNavigationR1066:{reveal:(target,options)=>{events.push({target,options});return true;}}};
 const document={documentElement:{lang:'tr'},querySelector:()=>({classList:{contains:()=>activeTab},click:()=>{activeTab=true;events.push('tab');}}),getElementById:id=>id==='r924WheelFrame'?wheel:id==='r920Counter'?counter:id==='r920NameInfo'?name:null};
 vm.runInNewContext(source,{window,document,Date,Promise,AbortController});return{window,state,gate,events,wheel,counter,name,adapter:window.SukunBerhetGateAccess,setUnlocked:v=>unlocked=v,setTabActive:v=>activeTab=v};
}
test('entry reveal only navigates the already selected wheel after modal closure',()=>{
 const f=fixture(),before={...f.state};assert.equal(f.adapter.revealEntry(),true);assert.deepEqual(f.events.slice(0,2),['tab','restore']);assert.equal(f.events[2].target,f.wheel);assert.equal(f.events[2].options.focus,f.counter);assert.equal(f.events[2].options.reason,'berhet-gate-entry');assert.equal(f.events[2].options.block,'center');assert.equal(f.events[2].options.isCurrent(),true);assert.deepEqual(f.state,before);
});
test('a disabled live-recording counter sends focus to the enabled name control',()=>{
 const f=fixture();f.counter.disabled=true;assert.equal(f.adapter.revealEntry(),true);assert.equal(f.events[2].options.focus,f.name);assert.equal(f.events[2].target,f.wheel);
});
test('a locked, reopened or superseded palace entry cannot reveal the old destination',()=>{
 for(const scenario of ['locked','reopened','superseded']){const f=fixture();if(scenario==='locked')f.setUnlocked(false);if(scenario==='reopened')f.gate.open=true;if(scenario==='superseded')f.state.activeMode='esma';assert.equal(f.adapter.revealEntry(),false,scenario);assert.deepEqual(f.events,[],scenario);}
 const f=fixture();f.adapter.revealEntry();const current=f.events[2].options.isCurrent;f.gate.open=true;assert.equal(current(),false);f.gate.open=false;f.setTabActive(false);assert.equal(current(),false);f.setTabActive(true);f.state.activeMode='esma';assert.equal(current(),false);
});
test('reopening a selected active Berhetiyye does not send another selection command',async()=>{
 const f=fixture(),before={...f.state};assert.equal((await f.adapter.enter()).ok,true);assert.deepEqual(f.events,[]);assert.deepEqual(f.state,before);
});
test('post-close reveal waits a frame and rejects stale history, replacement gate and later input',()=>{
 const start=portal.indexOf('  function revealAfterClose('),end=portal.indexOf('  function close(',start);assert(start>=0&&end>start);
 for(const scenario of ['current','epoch','gate','history','hidden','input']){
  const frames=[],seen=[],context=vm.createContext({epoch:4,state:{open:scenario==='gate'},pendingHistoryBack:scenario==='history',document:{hidden:scenario==='hidden'},window:{SukunViewportPolicy:{navigationCurrent:()=>scenario!=='input'}},requestAnimationFrame:fn=>frames.push(fn)});
  vm.runInContext(portal.slice(start,end),context);context.revealAfterClose({epoch:scenario==='epoch'?3:4,navigation:{},reveal:()=>seen.push('revealed')});assert.deepEqual(seen,[],scenario);assert.equal(frames.length,1);frames[0]();assert.deepEqual(seen,scenario==='current'?['revealed']:[],scenario);
 }
});
