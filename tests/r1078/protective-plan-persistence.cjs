'use strict';
// Full production journal API with an isolated storage leaf; no audio clock.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const source=fs.readFileSync(path.join(root,'assets/runtime/progress-journal-r982.js'),'utf8'),results=[];
const step=(extra={})=>({type:'zikir',cat:'koruma',idx:4,reps:7,gap:900,repeatMode:'fixed',protectionPlan:'r1078',...extra});
function profile(storage=new Map()){
 let owned=true,applied=null;
 const window={addEventListener(){},dispatchEvent(){},SukunTabOwner:{owns:()=>owned,snapshot:()=>({owned,epoch:1,intent:1,maintenance:false})}};
 const context={window,document:{readyState:'loading',body:null,addEventListener(){}},localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k)},CustomEvent:class{},queueMicrotask,console,Date,setTimeout,clearTimeout};
 vm.runInNewContext(source,context,{filename:'production-progress-journal-r982.js'});
 const api=window.SukunProgressJournal;
 const progress={total:0,days:{},names:{},direct:{cat:'koruma',idx:4,form:'',count:0,devir:0,target:33,targetMode:'fixed',total:0,auto:false},journey28:null,journey99:null,smart:{queue:[step()],i:0,name:'Protective sequence fixture',active:true,unfinished:true,completedReps:1},resume:{},canonical:{context:'smart',phase:'PAUSED',journeyKind:'single'}};
 api.bind({capture:()=>progress,validate:()=>true,apply:p=>{applied=p;return true}});
 return{api,progress,storage,setOwned:v=>owned=v,applied:()=>applied};
}
function test(name,fn){try{fn();results.push({name,passed:true})}catch(error){results.push({name,passed:false,error:error.stack||String(error)})}}
test('Confirmed protective progress and its scoped marker survive storage and a fresh runtime',()=>{
 const a=profile();assert.equal(a.api.commit('fixture'),true);const raw=a.storage.get(a.api.key);assert.equal(a.api.validate(raw),true);
 const b=profile(a.storage),saved=b.api.read();assert.equal(saved.smart.queue[0].protectionPlan,'r1078');assert.equal(saved.smart.completedReps,1);assert.equal(saved.direct.target,33);assert.equal(saved.direct.count,0);
 b.setOwned(false);const legacy=b.api.legacy('sukun.session.player.v2',null);assert.equal(legacy.queue[0].protectionPlan,'r1078');assert.equal(legacy.completedReps,1);assert.equal(legacy.playing,false);assert.equal(legacy.paused,true);
 b.setOwned(true);assert.equal(b.api.rebase('smart'),true);assert.equal(b.applied().smart.queue[0].protectionPlan,'r1078');assert.equal(b.applied().smart.completedReps,1);
});
for(const patch of [{cat:'esma'},{repeatMode:'manual'},{protectionPlan:'unknown'}])test('Unrelated or unsupported marker does not obtain protective-plan ownership: '+JSON.stringify(patch),()=>{
 const a=profile();a.progress.smart.queue=[step(patch)];
 if(patch.repeatMode)a.progress.smart.completedReps=0; // Manual steps have no fixed-count ledger.
 assert.equal(a.api.commit('fixture'),true);assert.equal(a.api.read().smart.queue[0].protectionPlan,undefined);
});
test('Marker participates in step identity while unmarked legacy identities retain their schema',()=>{
 const a=profile(),plain=step();delete plain.protectionPlan;
 const legacy=JSON.stringify({type:'zikir',cat:'koruma',idx:4,reps:7,repeatMode:'fixed',source:'auto',ms:null,c:null,b:null,mode:''});
 assert.equal(a.api.stepIdentity(plain),legacy);assert.notEqual(a.api.stepIdentity(step()),legacy);assert.equal(JSON.parse(a.api.stepIdentity(step())).protectionPlan,'r1078');
});
test('Out-of-range confirmed progress cannot overwrite the prior verified record',()=>{
 const a=profile();assert.equal(a.api.commit('fixture'),true);const before=a.storage.get(a.api.key);a.progress.smart.completedReps=8;
 assert.equal(a.api.commit('invalid-fixture'),false);assert.equal(a.storage.get(a.api.key),before);
});
console.log(JSON.stringify({suite:'r1078 protective plan journal round trip',passed:results.filter(r=>r.passed).length,total:results.length,results},null,2));
if(results.some(r=>!r.passed))process.exitCode=1;
