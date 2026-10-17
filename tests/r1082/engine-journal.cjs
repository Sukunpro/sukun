'use strict';
// Exercise the production journal through its public API. Synthetic elapsed
// values are persisted checkpoints, never simulated audio completion events.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const source=fs.readFileSync(path.join(root,'assets/runtime/progress-journal-r982.js'),'utf8'),results=[];
const step=(extra={})=>({type:'zikir',cat:'koruma',idx:0,reps:7,gap:0,repeatMode:'duration',repeatForMs:60000,_r1082Id:'step_A-1082',...extra});
const json=x=>JSON.parse(JSON.stringify(x));
function profile(storage=new Map()){
  let owned=true,applied=null;
  const window={addEventListener(){},dispatchEvent(){},SukunTabOwner:{owns:()=>owned,snapshot:()=>({owned,epoch:1,intent:1,maintenance:false})}};
  const context={window,document:{readyState:'loading',body:null,addEventListener(){}},localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k)},CustomEvent:class{},queueMicrotask,console,Date,setTimeout,clearTimeout};
  vm.runInNewContext(source,context,{filename:'production-progress-journal-r982.js'});
  const api=window.SukunProgressJournal;
  const progress={total:0,days:{},names:{},direct:{cat:'koruma',idx:0,form:'',count:0,devir:0,target:622,targetMode:'fixed',total:0,auto:false},journey28:null,journey99:null,smart:{queue:[step()],i:0,name:'Conditional session fixture',active:true,unfinished:true,completedReps:0},resume:{},canonical:{context:'smart',phase:'PAUSED',journeyKind:'single'}};
  api.bind({capture:()=>progress,validate:()=>true,apply:p=>{applied=p;return true}});
  return{api,progress,storage,setOwned:v=>owned=v,applied:()=>applied};
}
function runtime(p,extra={}){const at=p.progress.smart.queue[p.progress.smart.i];return{stepId:at._r1082Id,signature:p.api.stepIdentity(at),elapsedMs:23500.5,completed:3,...extra};}
function test(name,fn){try{fn();results.push({name,passed:true})}catch(error){results.push({name,passed:false,error:error.stack||String(error)})}}
function rejectsWithoutOverwrite(a,change){
  a.progress.smart.runtimeProgress=runtime(a);assert.equal(a.api.commit('valid-checkpoint'),true);const prior=a.storage.get(a.api.key);
  change(a);assert.equal(a.api.commit('invalid-checkpoint'),false);assert.equal(a.storage.get(a.api.key),prior,'Invalid state must not overwrite the last verified checkpoint');
}

test('Legacy fixed identity remains byte-for-byte compatible, including steps with new IDs',()=>{
  const a=profile(),s=step({repeatMode:'fixed'});
  const expected=JSON.stringify({type:'zikir',cat:'koruma',idx:0,reps:7,repeatMode:'fixed',source:'auto',ms:null,c:null,b:null,mode:''});
  assert.equal(a.api.stepIdentity(s),expected);delete s._r1082Id;assert.equal(a.api.stepIdentity(s),expected);
  s.protectionPlan='r1078';assert.equal(a.api.stepIdentity(s),expected.slice(0,-1)+',"protectionPlan":"r1078"}');
});
test('Old untagged fixed-count journals remain valid and resume paused',()=>{
  const a=profile(),s=step({repeatMode:'fixed'});delete s._r1082Id;a.progress.smart.queue=[s];a.progress.smart.completedReps=4;
  assert.equal(a.api.commit('legacy'),true);const b=profile(a.storage);assert.equal(b.api.read().smart.completedReps,4);b.setOwned(false);
  const saved=b.api.legacy('sukun.session.player.v2',null);assert.equal(saved.playing,false);assert.equal(saved.paused,true);assert.equal(saved.completedReps,4);assert.equal(saved.runtimeProgress,undefined);
});
test('Duration limit participates in identity while stable ID does not',()=>{
  const a=profile(),s=step();assert.notEqual(a.api.stepIdentity(s),a.api.stepIdentity({...s,repeatForMs:30000}));
  assert.equal(a.api.stepIdentity(s),a.api.stepIdentity({...s,_r1082Id:'other'}));assert.equal(JSON.parse(a.api.stepIdentity(s)).repeatForMs,60000);
  const manual=JSON.parse(a.api.stepIdentity({...s,repeatMode:'manual'}));assert.equal(manual.repeatForMs,undefined);
});
test('Duration checkpoint survives a fresh runtime and deliberate paused recovery',()=>{
  const a=profile();a.progress.smart.runtimeProgress=runtime(a);assert.equal(a.api.commit('duration-checkpoint'),true);assert.equal(a.api.validate(a.storage.get(a.api.key)),true);
  const b=profile(a.storage),saved=b.api.read();assert.deepEqual(json(saved.smart.runtimeProgress),a.progress.smart.runtimeProgress);assert.equal(saved.smart.queue[0]._r1082Id,'step_A-1082');assert.equal(saved.direct.target,622);
  b.setOwned(false);const legacy=b.api.legacy('sukun.session.player.v2',null);assert.equal(legacy.playing,false);assert.equal(legacy.paused,true);assert.deepEqual(json(legacy.runtimeProgress),a.progress.smart.runtimeProgress);
  b.setOwned(true);assert.equal(b.api.rebase('smart'),true);assert.deepEqual(json(b.applied().smart.runtimeProgress),a.progress.smart.runtimeProgress);
});
test('Manual checkpoint keeps confirmed units separate from fixed completedReps',()=>{
  const a=profile();a.progress.smart.queue=[step({repeatMode:'manual'})];a.progress.smart.runtimeProgress=runtime(a,{elapsedMs:0,completed:19});
  assert.equal(a.api.commit('manual-checkpoint'),true);const s=a.api.read().smart;assert.equal(s.completedReps,0);assert.equal(s.runtimeProgress.completed,19);
});
test('Stable IDs round-trip for fixed, silence and frequency queue entries',()=>{
  const a=profile();a.progress.smart.queue=[step({repeatMode:'fixed'}),{type:'silence',ms:4000,_r1082Id:'silence-1'},{type:'frequency',ms:1000,c:200,b:8,mode:'bin',_r1082Id:'freq_2'}];
  assert.equal(a.api.commit('step-ids'),true);assert.deepEqual(Array.from(a.api.read().smart.queue,x=>x._r1082Id),['step_A-1082','silence-1','freq_2']);
});
test('Removing a finished conditional checkpoint permits an exhausted queue',()=>{
  const a=profile();a.progress.smart.i=1;a.progress.smart.active=false;a.progress.smart.unfinished=false;
  assert.equal(a.api.commit('complete'),true);assert.equal(a.api.read().smart.runtimeProgress,undefined);
});
for(const [label,value] of [['empty',''],['spaces','two words'],['unicode','şifre'],['control','step\n'],['overlong','a'.repeat(81)]])test('Invalid stable ID is rejected: '+label,()=>{
  const a=profile();assert.equal(a.api.commit('baseline'),true);const prior=a.storage.get(a.api.key);a.progress.smart.queue[0]._r1082Id=value;
  assert.equal(a.api.commit('bad-id'),false);assert.equal(a.storage.get(a.api.key),prior);
});
for(const [label,patch] of [
  ['wrong stable ID',{stepId:'other'}],['wrong signature',{signature:'old-step'}],['negative elapsed time',{elapsedMs:-1}],['NaN elapsed time',{elapsedMs:NaN}],['infinite elapsed time',{elapsedMs:Infinity}],['elapsed time over six hours',{elapsedMs:21600001}],['negative completed count',{completed:-1}],['fractional completed count',{completed:1.5}],['out-of-range completed count',{completed:100000}],['non-number completed count',{completed:'3'}]
])test('Invalid checkpoint is rejected without destroying progress: '+label,()=>{
  const a=profile();rejectsWithoutOverwrite(a,b=>Object.assign(b.progress.smart.runtimeProgress,patch));
});
test('A checkpoint from an earlier duration limit cannot attach to a newly edited plan',()=>{
  const a=profile();rejectsWithoutOverwrite(a,b=>b.progress.smart.queue[0].repeatForMs=30000);
});
test('An otherwise identical next queue entry cannot inherit the previous stable-ID checkpoint',()=>{
  const a=profile();rejectsWithoutOverwrite(a,b=>{b.progress.smart.queue.push(step({_r1082Id:'step_B'}));b.progress.smart.i=1;});
});
test('Conditional checkpoint is not accepted for fixed repeat mode',()=>{
  const a=profile();rejectsWithoutOverwrite(a,b=>{b.progress.smart.queue[0].repeatMode='fixed';b.progress.smart.runtimeProgress.signature=b.api.stepIdentity(b.progress.smart.queue[0]);});
});
test('Conditional checkpoint requires an actual stable-ID current step',()=>{
  const a=profile();rejectsWithoutOverwrite(a,b=>delete b.progress.smart.queue[0]._r1082Id);
});
test('Conditional checkpoint cannot survive after the queue has completed',()=>{
  const a=profile();rejectsWithoutOverwrite(a,b=>{b.progress.smart.i=1;b.progress.smart.unfinished=false;b.progress.smart.active=false;});
});
test('Fixed-count ledger cannot be smuggled into a duration checkpoint',()=>{
  const a=profile();rejectsWithoutOverwrite(a,b=>b.progress.smart.completedReps=1);
});
function outcomes(a){
  a.progress.smart.queue=[step({repeatMode:'fixed',_r1082Id:'completed_1'}),step({repeatMode:'fixed',idx:1,_r1082Id:'skipped_2'})];
  a.progress.smart.outcomeProgress={completedIds:['completed_1'],skippedIds:['skipped_2']};
}
test('Completed and skipped outcomes survive a fresh runtime and paused legacy recovery',()=>{
  const a=profile();outcomes(a);assert.equal(a.api.commit('outcomes'),true);const b=profile(a.storage),s=b.api.read().smart;
  assert.deepEqual(json(s.outcomeProgress),a.progress.smart.outcomeProgress);b.setOwned(false);const legacy=b.api.legacy('sukun.session.player.v2',null);
  assert.equal(legacy.playing,false);assert.equal(legacy.paused,true);assert.deepEqual(json(legacy.outcomeProgress),a.progress.smart.outcomeProgress);
  b.setOwned(true);assert.equal(b.api.rebase('smart'),true);assert.deepEqual(json(b.applied().smart.outcomeProgress),a.progress.smart.outcomeProgress);
});
test('An exhausted queue still records skipped outcomes rather than losing their history',()=>{
  const a=profile();outcomes(a);a.progress.smart.i=2;a.progress.smart.active=false;a.progress.smart.unfinished=false;
  assert.equal(a.api.commit('queue-ended-with-skip'),true);assert.deepEqual(json(a.api.read().smart.outcomeProgress),a.progress.smart.outcomeProgress);
});
test('Legacy journals keep outcomeProgress absent; empty new ledgers are valid',()=>{
  const a=profile();assert.equal(a.api.commit('old-ledger'),true);assert.equal(a.api.read().smart.outcomeProgress,undefined);
  a.progress.smart.outcomeProgress={completedIds:[],skippedIds:[]};assert.equal(a.api.commit('empty-outcomes'),true);
  assert.deepEqual(json(a.api.read().smart.outcomeProgress),{completedIds:[],skippedIds:[]});
});
test('The full bounded queue can retain one outcome per unique entry',()=>{
  const a=profile();a.progress.smart.queue=Array.from({length:128},(_,n)=>step({repeatMode:'fixed',_r1082Id:'entry_'+n}));
  a.progress.smart.outcomeProgress={completedIds:a.progress.smart.queue.map(s=>s._r1082Id),skippedIds:[]};
  assert.equal(a.api.commit('maximum-outcomes'),true);assert.equal(a.api.read().smart.outcomeProgress.completedIds.length,128);
});
for(const [label,change] of [
  ['unknown queue entry',s=>s.outcomeProgress.skippedIds=['unknown']],
  ['duplicate completed ID',s=>s.outcomeProgress.completedIds=['completed_1','completed_1']],
  ['duplicate skipped ID',s=>s.outcomeProgress.skippedIds=['skipped_2','skipped_2']],
  ['overlapping outcome sets',s=>s.outcomeProgress.skippedIds=['completed_1']],
  ['non-ASCII ID',s=>s.outcomeProgress.skippedIds=['şifre']],
  ['non-string ID',s=>s.outcomeProgress.skippedIds=[1]],
  ['missing completed list',s=>delete s.outcomeProgress.completedIds],
  ['missing skipped list',s=>delete s.outcomeProgress.skippedIds],
  ['non-array list',s=>s.outcomeProgress.completedIds='completed_1'],
  ['overlong completed list',s=>s.outcomeProgress.completedIds=Array(129).fill('completed_1')],
  ['overlong skipped list',s=>s.outcomeProgress.skippedIds=Array(129).fill('skipped_2')],
  ['removed queue entry',s=>s.queue.pop()],
])test('Invalid outcomes cannot replace verified progress: '+label,()=>{
  const a=profile();outcomes(a);assert.equal(a.api.commit('valid-outcome'),true);const prior=a.storage.get(a.api.key);
  change(a.progress.smart);assert.equal(a.api.commit('invalid-outcome'),false);assert.equal(a.storage.get(a.api.key),prior);
});
console.log(JSON.stringify({suite:'r1082 conditional progress journal compatibility',passed:results.filter(r=>r.passed).length,total:results.length,results},null,2));
if(results.some(r=>!r.passed))process.exitCode=1;
