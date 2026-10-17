'use strict';
// Finished presentation data must survive reload without creating a resumable job.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..')),source=fs.readFileSync(path.join(root,'assets/runtime/progress-journal-r982.js'),'utf8');
const clone=v=>JSON.parse(JSON.stringify(v));let passed=0;
function profile(storage=new Map()){
 let owned=true;const window={addEventListener(){},dispatchEvent(){},SukunTabOwner:{owns:()=>owned,snapshot:()=>({owned,epoch:1,intent:1,maintenance:false})}};
 const ctx={window,document:{readyState:'loading',body:null,addEventListener(){}},localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k)},CustomEvent:class{},queueMicrotask,console,Date,setTimeout,clearTimeout};
 vm.runInNewContext(source,ctx);const api=window.SukunProgressJournal;
 const queue=[{type:'zikir',cat:'temel',idx:0,reps:3,gap:0,repeatMode:'fixed',_r1082Id:'read_A'},{type:'silence',ms:5000,_r1082Id:'quiet_B'}];
 const progress={total:0,days:{},names:{},direct:{cat:'temel',idx:0,form:'',count:11,devir:0,target:622,targetMode:'fixed',total:0,auto:false},journey28:null,journey99:null,smart:{queue,i:0,name:'Terminal fixture',active:false,unfinished:false,completedReps:0,outcomeProgress:{completedIds:['read_A','quiet_B'],skippedIds:[]},terminalResult:{stepId:'read_A',signature:api.stepIdentity(queue[0]),completed:3,status:'completed'}},resume:{},canonical:{context:'zikir',phase:'COMPLETED',journeyKind:'single'}};
 api.bind({capture:()=>progress,validate:()=>true,apply:()=>true});return{api,progress,storage,setOwned:v=>owned=v};
}
function check(fn){fn();passed++}
const a=profile();check(()=>assert.equal(a.api.commit('finished-reading'),true));
const b=profile(a.storage);check(()=>assert.deepEqual(clone(b.api.read().smart.terminalResult),a.progress.smart.terminalResult));
b.setOwned(false);const legacy=b.api.legacy('sukun.session.player.v2',null);
check(()=>assert.equal(legacy.playing,false));check(()=>assert.equal(legacy.paused,false));check(()=>assert.equal(legacy.unfinished,false));check(()=>assert.equal(legacy.terminalResult.completed,3));check(()=>assert.equal(b.api.read().direct.target,622));
for(const patch of [{stepId:'quiet_B'},{stepId:'other'},{signature:'old-plan'},{completed:2},{completed:4},{completed:0},{completed:-1},{completed:1.5},{completed:'3'},{status:'playing'},{status:'ended'}]){
 const p=profile();assert(p.api.commit('valid'));const prior=p.storage.get(p.api.key);Object.assign(p.progress.smart.terminalResult,patch);
 check(()=>assert.equal(p.api.commit('invalid-terminal'),false));check(()=>assert.equal(p.storage.get(p.api.key),prior));
}
for(const key of ['active','unfinished']){const p=profile();p.progress.smart[key]=true;check(()=>assert.equal(p.api.commit('not-terminal'),false));}
const skipped=profile();skipped.progress.smart.outcomeProgress={completedIds:['read_A'],skippedIds:['quiet_B']};skipped.progress.smart.terminalResult.status='ended';check(()=>assert.equal(skipped.api.commit('ended-with-skip'),true));check(()=>assert.equal(skipped.api.read().smart.terminalResult.completed,3));
const older=profile();delete older.progress.smart.terminalResult;check(()=>assert.equal(older.api.commit('old-schema'),true));check(()=>assert.equal(older.api.read().smart.terminalResult,undefined));
const edited=profile();edited.progress.smart.queue[0].reps=7;check(()=>assert.equal(edited.api.commit('edited-plan'),false));
const forged=profile();forged.progress.smart.outcomeProgress.completedIds=['quiet_B'];check(()=>assert.equal(forged.api.commit('unconfirmed-reading'),false));
console.log(JSON.stringify({suite:'r1084 terminal result persistence',passed,scope:'Production journal validation, reload and old-schema compatibility; no audio simulation'}));
