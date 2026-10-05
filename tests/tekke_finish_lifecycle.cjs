'use strict';
// Source-executed terminal-action contract, using synthetic checkpoint/state.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||path.join(__dirname,'..'));
const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),set=fs.readFileSync(path.join(root,'assets/runtime/tekke-set-r990.js'),'utf8');
const extract=(s,a,b)=>{const i=s.indexOf(a),j=s.indexOf(b,i);assert(i>=0&&j>i);return s.slice(i,j)};
const code=extract(set,' function clearCheckpoint()',' function clock(')+extract(set,' function discardCheckpoint(',' function recover(')+extract(html,'function tkFinish()','function tkSceneAccessChanged()');
function fixture({owned=false,checkpoint=null,afterCloseCheckpoint=null,deny=false}={}){
 const events=[],persist=[],claims=[];let notices=0;
 const owner={owns:()=>owned,canPersist:()=>owned,cancelPending:r=>events.push('cancel:'+r),run:(kind,action)=>{claims.push(kind);if(deny){notices++;return Promise.resolve(false)}owned=true;return Promise.resolve(action())}};
 const c=vm.createContext({window:{SukunTabOwner:owner},checkpoint,options:{persist:(k,v)=>persist.push([k,v])},CHECKPOINT_KEY:'tekke.journey.checkpoint',safe:(f,d)=>{try{return f()}catch(_){return d}},publish:()=>events.push('publish'),close:()=>{events.push('close');if(afterCloseCheckpoint)c.checkpoint=afterCloseCheckpoint},tkSessionChanged:()=>events.push('render')});
 vm.runInContext(code,c);c.window.SukunTekkeSet={discardCheckpoint:c.discardCheckpoint};
 return {c,events,persist,claims,notices:()=>notices};
}
const results=[];async function test(name,fn){try{await fn();results.push({name,pass:true})}catch(e){results.push({name,pass:false,error:e.message})}}
(async()=>{
await test('Finish without a set checkpoint never opens failing ownership storage',()=>{const f=fixture({deny:true});f.c.tkFinish();assert.equal(f.claims.length,0);assert.equal(f.notices(),0);assert.equal(f.events.filter(x=>x==='close').length,1)});
await test('Repeated Finish remains storage-free while unowned',()=>{const f=fixture({deny:true});for(let i=0;i<5;i++)f.c.tkFinish();assert.equal(f.claims.length,0);assert.equal(f.persist.length,0)});
await test('Finish fences pending starts before closing the scene',()=>{const f=fixture();f.c.tkFinish();assert.deepEqual(f.events.slice(0,2),['cancel:tekke-finish','close'])});
await test('Owned Finish clears the checkpoint saved by terminal stop exactly once',()=>{const f=fixture({owned:true,checkpoint:{index:2},afterCloseCheckpoint:{index:3}});f.c.tkFinish();assert.equal(f.c.checkpoint,null);assert.deepEqual(f.persist,[['tekke.journey.checkpoint',null]]);assert.equal(f.claims.length,0)});
await test('Unowned Finish cannot overwrite another tab checkpoint or require its lock',()=>{const checkpoint={index:3};const f=fixture({checkpoint,deny:true});f.c.tkFinish();assert.equal(f.c.checkpoint,checkpoint);assert.equal(f.persist.length,0);assert.equal(f.claims.length,0)});
await test('Explicit discard still claims ownership for a real checkpoint',async()=>{const f=fixture({checkpoint:{index:2}});assert.equal(await f.c.discardCheckpoint(),true);assert.equal(f.claims.length,1);assert.equal(f.c.checkpoint,null);assert.equal(f.persist.length,1)});
await test('Explicit discard with unavailable ownership preserves checkpoint',async()=>{const checkpoint={index:2};const f=fixture({checkpoint,deny:true});assert.equal(await f.c.discardCheckpoint(),false);assert.equal(f.c.checkpoint,checkpoint);assert.equal(f.persist.length,0)});
await test('Discarding an absent checkpoint is an idempotent no-op',async()=>{const f=fixture({owned:true});await f.c.discardCheckpoint();assert.equal(f.persist.length,0);assert.equal(f.claims.length,0)});
const out={total:results.length,passed:results.filter(x=>x.pass).length,failed:results.filter(x=>!x.pass).length,scope:'Production finish and discardCheckpoint functions with controlled ownership/checkpoint callbacks; no phone, audio, count or actual recording data.',results};console.log(JSON.stringify(out,null,2));if(out.failed)process.exitCode=1;
})();
