'use strict';
// Runs the production interaction-gate body with controlled native event
// endpoints and timers. It does not simulate browser scrolling or rendering.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const file=path.resolve(process.argv[2]||path.join(__dirname,'../index.html')); const html=fs.readFileSync(file,'utf8');
const start=html.indexOf('const activeTouches=new Set(),activePointers=new Set();');
const end=html.indexOf('// r706: local style guard',start);
assert(start>=0&&end>start);
const code=html.slice(start,end);
function fixture(){let at=0,next=0,callbacks=0;const jobs=new Map();
 const hub=()=>({handlers:{},addEventListener(t,fn){(this.handlers[t]??=[]).push(fn)}}),window=hub(),document=hub();document.hidden=false;
 const context=vm.createContext({window,document,root:{},B:{},Set,Object,Math,performance:{now:()=>at},schedule:()=>callbacks++,setTimeout:(f,ms)=>{jobs.set(++next,{f,t:at+ms});return next},clearTimeout:n=>jobs.delete(n)});
 vm.runInContext(code,context);
 const fire=(target,type,data={})=>{for(const f of target.handlers[type]||[])f({type,pointerType:'touch',pointerId:1,changedTouches:[{identifier:1}],...data})};
 const tick=ms=>{const until=at+ms;let guard=0;for(;;){const job=[...jobs].filter(([,v])=>v.t<=until).sort((a,b)=>a[1].t-b[1].t)[0];if(!job)break;if(++guard>1000)throw Error('timer spin');at=job[1].t;jobs.delete(job[0]);job[1].f()}at=until;};
 return {window,document,fire,tick,gate:window.SukunInteractionGateR732,jobs,waitForWork:()=>vm.runInContext("deferPan('regression');armPanEnd()",context),callbacks:()=>callbacks};
}
const results=[];function test(name,fn){try{fn();results.push({name,status:'PASS'})}catch(e){results.push({name,status:'FAIL',error:e.message})}}
test('Ordinary contact keeps layout gate closed until release and quiet window',()=>{const f=fixture();f.fire(f.document,'pointerdown');assert(f.gate.active());f.fire(f.document,'pointerup');f.tick(170);assert(!f.gate.active())});
test('Combined touchend clears both contacts',()=>{const f=fixture();const data={changedTouches:[{identifier:1},{identifier:2}]};f.fire(f.document,'touchstart',data);f.fire(f.document,'touchend',data);f.tick(170);assert(!f.gate.active())});
test('Pagehide clears an abandoned pointer',()=>{const f=fixture();f.fire(f.document,'pointerdown');f.fire(f.window,'pagehide');f.tick(170);assert(!f.gate.active())});
test('Hidden visibility clears abandoned touch and pointer',()=>{const f=fixture();f.fire(f.document,'pointerdown');f.fire(f.document,'touchstart');f.document.hidden=true;f.fire(f.document,'visibilitychange');f.tick(170);assert(!f.gate.active())});
test('Blur clears abandoned touch and pointer gate',()=>{const f=fixture();f.fire(f.document,'pointerdown');f.fire(f.document,'touchstart');f.fire(f.window,'blur');f.tick(2000);assert.equal(f.gate.active(),false,JSON.stringify(f.gate.snapshot()))});
test('Blur releases queued layout without needing another gesture',()=>{const f=fixture();f.fire(f.document,'pointerdown');f.waitForWork();f.fire(f.window,'blur');f.tick(2000);assert.equal(f.callbacks(),1,'queued layout remains deferred')});
test('Blur releases whenIdle callback instead of polling forever',()=>{const f=fixture();let calls=0;f.fire(f.document,'pointerdown');f.gate.whenIdle(()=>calls++);f.fire(f.window,'blur');f.tick(2000);assert.equal(calls,1,'whenIdle still blocked')});
test('Uninterrupted active input continues to defer layout and whenIdle',()=>{const f=fixture();let calls=0;f.fire(f.document,'pointerdown');f.fire(f.document,'touchstart');f.waitForWork();f.gate.whenIdle(()=>calls++);f.tick(2000);assert(f.gate.active());assert.equal(calls,0);assert.equal(f.callbacks(),0);f.fire(f.document,'pointerup');f.tick(170);assert(f.gate.active());assert.equal(calls,0);f.fire(f.document,'touchend');f.tick(180);assert.equal(calls,1);assert.equal(f.callbacks(),1)});
test('A fresh touch after blur owns input until its release',()=>{const f=fixture();let calls=0;f.fire(f.document,'pointerdown');f.gate.whenIdle(()=>calls++);f.fire(f.window,'blur');f.fire(f.document,'pointerdown',{pointerId:2});f.tick(2000);assert(f.gate.active());assert.equal(calls,0);f.fire(f.document,'pointerup',{pointerId:2});f.tick(180);assert.equal(calls,1);assert(!f.gate.active())});
test('Repeated blur cleanup releases each queued job once',()=>{const f=fixture();let calls=0;f.fire(f.document,'pointerdown');f.waitForWork();f.gate.whenIdle(()=>calls++);for(let i=0;i<4;i++)f.fire(f.window,'blur');f.tick(2000);assert.equal(calls,1);assert.equal(f.callbacks(),1);assert.equal(f.jobs.size,0)});
console.log(JSON.stringify({source:file,total:results.length,passed:results.filter(x=>x.status==='PASS').length,failed:results.filter(x=>x.status==='FAIL').length,scope:'Actual production input-gate source with controlled timers and event endpoints only; no audio, count, tempo, browser rendering or real user data accessed.',results},null,2));
if(results.some(x=>x.status==='FAIL'))process.exitCode=1;
