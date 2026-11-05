'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=process.argv[2]||path.resolve(__dirname,'../..'),source=fs.readFileSync(path.join(root,'assets/runtime/progress-journal-r982.js'),'utf8');
const hash=s=>{let n=2166136261;for(let i=0;i<s.length;i++){n^=s.charCodeAt(i);n=Math.imul(n,16777619)}return(n>>>0).toString(16).padStart(8,'0')};
const progress=()=>({total:1234,days:{'2026-11-05':37},names:{esma:24},direct:{cat:'esma',idx:3,form:'',count:19,devir:2,target:298,targetMode:'ebced',total:1234,auto:false},journey28:{i:4,rep:15,totalDone:317,mode:'ebced',custom:47,gap:900,active:false},journey99:{i:6,rep:23,totalDone:417,mode:'custom',custom:47,gap:1000,active:false},smart:{queue:[],i:0,name:'',active:false,unfinished:false,completedReps:0},resume:{},canonical:{context:'journey99',phase:'PAUSED',journeyKind:'99'}});
function boot(){
 const storage=new Map();let captured=progress();const w={addEventListener(){},dispatchEvent(){},SukunTabOwner:{owns:()=>true,snapshot:()=>({owned:true,epoch:1,intent:1,maintenance:false})}};
 const ctx={window:w,document:{body:null,readyState:'loading',addEventListener(){}},localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v))},CustomEvent:class{},Date,queueMicrotask(){}};
 vm.runInNewContext(source,ctx);const api=w.SukunProgressJournal;api.bind({capture:()=>captured,validate:()=>true,apply:()=>true});assert(api.commit('fixture'));const initial=storage.get(api.key);
 return {api,storage,initial,setCapture:v=>captured=v};
}
let checks=0;const check=fn=>{fn();checks++};
for(const custom of [0,10000,99999])for(const mode of ['custom','ebced']){
 const f=boot(),record=JSON.parse(f.initial);for(const key of ['journey28','journey99'])Object.assign(record.body.progress[key],{custom,mode});record.sum=hash(JSON.stringify(record.body));const raw=JSON.stringify(record);f.storage.set(f.api.key,raw);
 const migrated=f.api.read();check(()=>assert(migrated,'legacy valid record remains readable'));
 const expected=JSON.parse(JSON.stringify(record.body.progress));expected.journey28.custom=33;expected.journey99.custom=33;
 check(()=>assert.deepEqual(JSON.parse(JSON.stringify(migrated)),expected));
 check(()=>assert.equal(f.storage.get(f.api.key),raw,'read does not rewrite source record'));
 f.setCapture(migrated);check(()=>assert(f.api.commit('upgrade'),'first new save must not block on legacy record'));
 const saved=JSON.parse(f.storage.get(f.api.key));check(()=>{assert.equal(saved.body.rev,2);assert.equal(saved.sum,hash(JSON.stringify(saved.body)));assert.equal(saved.body.progress.journey99.rep,23);assert.equal(saved.body.progress.journey28.totalDone,317);assert.equal(saved.body.progress.total,1234)});
}
for(const custom of [-1,2.5,100000]){
 const f=boot(),record=JSON.parse(f.initial);record.body.progress.journey99.custom=custom;record.sum=hash(JSON.stringify(record.body));f.storage.set(f.api.key,JSON.stringify(record));check(()=>assert.equal(f.api.read(),null));
}
for(const custom of [0,10000,99999,-1,2.5]){
 const f=boot(),p=progress();p.journey99.custom=custom;f.setCapture(p);check(()=>{assert.equal(f.api.commit('invalid-new-write'),false);assert.equal(f.storage.get(f.api.key),f.initial)});
}
const f=boot(),bad=JSON.parse(f.initial);bad.body.progress.journey99.custom=10000;f.storage.set(f.api.key,JSON.stringify(bad));check(()=>assert.equal(f.api.read(),null,'checksum must be verified before migration'));
console.log(`F02 journal upgrade: ${checks} checks passed; old valid records preserved, new writes strict.`);
