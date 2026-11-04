'use strict';
// Shipped journal and full worker, controlled local storage/network/clock.
// No claim about physical-phone audio, browser frame rates or real network timing.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {fixture}=require('./sw-fixture.cjs');
const root=path.resolve(__dirname,'../..'),source=fs.readFileSync(path.join(root,'assets/runtime/progress-journal-r982.js'),'utf8');
function journal(){
 let owned=true,mode='normal';const storage=new Map(),events=[],microtasks=[];
 const w={addEventListener(){},dispatchEvent:e=>events.push(e),SukunTabOwner:{owns:()=>owned,snapshot:()=>({owned,epoch:1,intent:1,maintenance:false})}};
 const context={window:w,document:{body:null,readyState:'loading',addEventListener(){}},localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>{if(mode==='quota')throw Error('quota');if(mode!=='silent')storage.set(k,String(v))},removeItem:k=>storage.delete(k)},CustomEvent:class{constructor(type,args){this.type=type;this.detail=args.detail}},Date,queueMicrotask:f=>microtasks.push(f)};
 vm.runInNewContext(source,context);const api=w.SukunProgressJournal;
 const progress={total:0,days:{},names:{},direct:{cat:'esma',idx:0,form:'',count:0,devir:0,target:298,targetMode:'ebced',total:0,auto:false},journey28:null,journey99:null,smart:{queue:[],i:0,name:'',active:false,unfinished:false,completedReps:0},resume:{},canonical:{context:'single',phase:'PAUSED',journeyKind:'single'}};
 api.bind({capture:()=>progress,validate:()=>true,apply:()=>true});
 return{api,events,storage,progress,setMode:v=>mode=v,setOwned:v=>owned=v,flush:()=>{while(microtasks.length)microtasks.shift()()}};
}
const tests=[];async function test(name,fn){await fn();tests.push(name);console.log('PASS '+name)}
(async()=>{
 await test('Journal starts idle and announces saved only after durable write and readback',()=>{
  const f=journal();assert.equal(f.api.snapshot().saveState,'idle');assert.equal(f.api.schedule('count'),true);assert.equal(f.api.snapshot().saveState,'pending');assert.equal(f.events.filter(e=>e.type==='sukun:progressjournal').length,0);f.flush();assert.equal(f.api.snapshot().saveState,'saved');assert(f.api.snapshot().savedAt>0);assert(f.storage.has(f.api.key));assert.equal(f.events.filter(e=>e.type==='sukun:progressjournal').length,1);
 });
 for(const mode of ['quota','silent'])await test('Failed '+mode+' storage does not retain a saved badge or advance durable revision',()=>{
  const f=journal();assert(f.api.commit('first'));const old=f.storage.get(f.api.key),saved=f.api.snapshot().savedAt;f.setMode(mode);f.progress.total=f.progress.direct.total=1;assert.equal(f.api.commit('next'),false);assert.equal(f.api.snapshot().saveState,'error');assert.equal(f.api.snapshot().revision,1);assert.equal(f.api.snapshot().savedAt,saved);assert.equal(f.storage.get(f.api.key),old);assert.equal(f.events.filter(e=>e.type==='sukun:progressjournal').length,1);f.setMode('normal');assert(f.api.commit('retry'));assert.equal(f.api.snapshot().saveState,'saved');assert.equal(f.api.snapshot().revision,2);
 });
 await test('Losing tab ownership before queued save reports unsaved and writes nothing',()=>{
  const f=journal();f.api.schedule('count');f.setOwned(false);f.flush();assert.equal(f.api.snapshot().saveState,'unsaved');assert.equal(f.api.snapshot().saveReason,'ownership-changed');assert.equal(f.storage.has(f.api.key),false);
 });
 await test('Reading the previous durable checkpoint cannot mask newer unsaved progress',()=>{
  const f=journal();assert(f.api.commit('first'));f.progress.total=f.progress.direct.total=2;f.api.schedule('next');f.setOwned(false);f.flush();assert.equal(f.api.read().total,0);assert.equal(f.api.snapshot().saveState,'unsaved');
 });
 await test('Corrupt saved data emits an error rather than a saved state',()=>{
  const f=journal();assert(f.api.commit());f.storage.set(f.api.key,'corrupted');assert.equal(f.api.read(),null);assert.equal(f.api.snapshot().saveState,'error');assert.equal(f.api.snapshot().invalid,true);
 });
 await test('Slow preparation advancing beyond 60 seconds still verifies the complete graph',async()=>{
  const f=fixture(),fetch=f.c.fetch;let time=Date.now();f.c.Date={now:()=>time};f.c.fetch=async request=>{if(request.url.includes('fixture.js'))time+=70000;return fetch(request)};
  const result=await f.run('prepareShell()');assert.equal(result.complete,true);assert.equal(await f.run('currentComplete()'),true);
 });
 await test('Failed install preserves verified candidates and retry downloads only missing bytes',async()=>{
  const f=fixture();f.fail(f.core.url);assert.equal((await f.run('prepareShell()')).complete,false);const calls=f.calls.filter(u=>u.endsWith('/nero.html')).length;f.online();assert.equal((await f.run('prepareShell()')).complete,true);assert.equal(f.calls.filter(u=>u.endsWith('/nero.html')).length,calls);
 });
 await test('Tampered runtime bytes cannot complete or activate the release',async()=>{
  const f=fixture();f.files.set(new URL(f.core.url,'https://sukun.test/app/sw.js').href,'tampered');assert.equal((await f.run('prepareShell()')).complete,false);assert.equal(await f.run('currentComplete()'),false);
 });
 await test('Hard deadline aborts the in-flight fetch and permits a clean verified retry',async()=>{
  const f=fixture(),fetch=f.c.fetch;let clock=Date.now(),next=0,began,aborted=false;const timers=new Map(),started=new Promise(r=>began=r);
  f.c.Date={now:()=>clock};f.c.setTimeout=(fn,ms)=>{const id=++next;timers.set(id,{fn,ms});return id};f.c.clearTimeout=id=>timers.delete(id);
  f.c.fetch=request=>request.url.includes('fixture.js')?new Promise((resolve,reject)=>{request.signal.addEventListener('abort',()=>{aborted=true;reject(Error('aborted'))},{once:true});began()}):fetch(request);
  const task=f.run('prepareShell()'),rejection=assert.rejects(task,/zaman aşımı/);await started;const deadline=[...timers.values()].find(t=>t.ms===180000);assert(deadline);clock+=180001;deadline.fn();await rejection;assert.equal(aborted,true);assert.equal(await f.run('currentComplete()'),false);
  f.c.fetch=fetch;assert.equal((await f.run('prepareShell()')).complete,true);
 });
 console.log(JSON.stringify({passed:tests.length,total:tests.length,scope:'Node controlled storage, network and clock; physical-device checks not run'}));
})().catch(error=>{console.error(error);process.exitCode=1});
