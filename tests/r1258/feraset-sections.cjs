/* Isolated contract tests: no microphone, user data or network required. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'../..');
const code=fs.readFileSync(path.join(root,'assets/runtime/feraset-sections-r1258.js'),'utf8');
class Element {
 constructor(tag){this.tagName=tag;this.children=[];this.dataset={};this.events={};this.textContent='';this.classList={add(){},toggle(){}};}
 append(...items){this.children.push(...items);}
 setAttribute(k,v){this[k]=v;}
 addEventListener(k,v){this.events[k]=v;}
 before(e){this.previous=e;}
 insertAdjacentElement(_,e){this.after=e;}
}
async function setup(){
 const source=new Element('pre'),box=new Element('details');
 const html=fs.readFileSync(path.join(root,'nero.html'),'utf8');
 const match=html.match(/<pre\b[^>]*id=["']ferasetText["'][^>]*>([\s\S]*?)<\/pre>/);
 assert.ok(match,'canonical prayer text exists');
 source.textContent=match[1].replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>');
 const store=new Map([['dua:tovbe:legacy',new Blob(['keep'])]]),rev=new Map(),calls=[];
 let failRead=false,failSet=false,failDelete=false,confirm=true,playHook=null,lastRecorder,chunkSize=1024,activeAttempt=null;const adapters=new Map();
 const doc={readyState:'complete',getElementById:id=>id==='ferasetText'?source:id==='ferasetBox'?box:null,createElement:tag=>new Element(tag)};
 const win={SukunAudioSessionRegistry:{register:(id,adapter)=>adapters.set(id,adapter),releasePauseGate(){}},I18N:{lang:'tr'},addEventListener(){},confirm:()=>confirm,SukunTabOwner:{run:async(_,fn,opt)=>opt.isCurrent()?fn():false}};
 const ctx={window:win,document:doc,Blob,console,navigator:{mediaDevices:{getUserMedia:async()=>({getTracks:()=>[{stop(){}}]})}},SES:{ad:''},ac(){},micKisit:()=>({}),micHazirla:async()=>{},miniPause(){calls.push('pause');},miniResume(){calls.push('resume');},sesDurdur(){ctx.SES.ad='';calls.push('stop');},okuyucularDurdur:id=>calls.push({handoff:id}),duaRecBegin:(id,onCancel)=>{if(activeAttempt&&!activeAttempt.cancelled){activeAttempt.cancelled=true;activeAttempt.onCancel();}activeAttempt={id,onCancel,cancelled:false,current(){return !this.cancelled;}};return activeAttempt;},playRecording:async(blob,label,opt)=>{calls.push({label,key:opt.recordingKey});ctx.SES.ad=label;return playHook?playHook(blob,label,opt):true;},REC_DB:{revision:k=>rev.get(k)||0,get:async k=>{if(failRead)throw Error('read');return store.get(k)||null;},set:async(k,b,opt)=>{if(failSet)throw Error('write');assert.equal(opt.expectedRevision,rev.get(k)||0);store.set(k,b);rev.set(k,(rev.get(k)||0)+1);},del:async k=>{if(failDelete)throw Error('delete');store.delete(k);}},recSessionBegin:()=>({bitir(){}})};
 class Recorder{constructor(){lastRecorder=this;this.mimeType='audio/webm';}start(){this.started=true;}stop(){this.ondataavailable({data:new Blob([new Uint8Array(chunkSize)])});return this.onstop();}}
 win.MediaRecorder=ctx.MediaRecorder=Recorder;
 ctx.recCaptureBegin=(state,i,field,render)=>{state[field]=i;let done=false;const cap={accept:()=>!done,current:()=>!done,attach:mr=>state.rec=mr,finish(){done=true;state[field]=null;render();},stop(){done=true;state[field]=null;render();}};return cap;};
 vm.runInNewContext(code,ctx,{filename:'feraset-sections-r1258.js'});
 const api=win.SukunFerasetSections;
 await api.refresh();
 return {api,source,store,calls,ctx,adapters,setChunk:v=>chunkSize=v,setRead:v=>failRead=v,setWrite:v=>failSet=v,setDelete:v=>failDelete=v,setConfirm:v=>confirm=v,setPlay:v=>playHook=v,recorder:()=>lastRecorder};
}
(async()=>{
 const h=await setup(),a=h.api,sections=a.split(h.source.textContent);
 assert.equal(sections.length,35);
 assert.equal(sections.map(x=>x.text).join(''),h.source.textContent,'split preserves full canonical prayer');
 assert.equal(a.key(0),'dua:feraset:v1:h01');assert.equal(a.key(34),'dua:feraset:v1:h35');
 const changed=a.split(h.source.textContent.replace('Bismillâhirrahmânirrahîm.','Bismillâhirrahmânirrahîm.\n'));
 assert.deepEqual(Array.from(changed,x=>x.id),Array.from(sections,x=>x.id),'body edits cannot move storage identities');
 assert.throws(()=>a.split(h.source.textContent.replace(a.headings[1],'')),/headings changed/);
 assert.throws(()=>a.split(h.source.textContent.replace(a.headings[1],'__SWAP__').replace(a.headings[2],a.headings[1]).replace('__SWAP__',a.headings[2])),/headings changed/);
 assert.equal(await a.start(0),false,'missing recording stops');assert.equal(h.calls.filter(x=>x.key).length,0);
 h.store.set(a.key(0),new Blob(['first']));h.store.set(a.key(1),new Blob(['second']));
 assert.equal(await a.start(0),false,'sequence stops at first missing section');assert.equal(a.index(),2);
 assert.deepEqual(h.calls.filter(x=>x.key).map(x=>x.key),[a.key(0),a.key(1)]);
 let release;h.setPlay(()=>new Promise(r=>release=r));const pending=a.start(0);await new Promise(r=>setImmediate(r));
 const adapter=h.adapters.get('feraset');assert.ok(adapter,'global transport adapter registered');assert.equal(adapter.getState(),'playing');adapter.pause();assert.equal(a.snapshot().paused,true);assert.equal(adapter.getState(),'paused');adapter.resume();assert.equal(a.snapshot().paused,false);
 a.stop();release(true);assert.equal(await pending,false);assert.equal(a.index(),0,'cancelled completion cannot advance');
 h.setPlay(()=>new Promise(r=>release=r));const competing=a.start(0);await new Promise(r=>setImmediate(r));h.ctx.duaRecBegin('tovbe',()=>{});assert.equal(a.snapshot().playing,false,'competing reader cancels Feraset');release(true);assert.equal(await competing,false);assert.equal(a.index(),0,'handoff cannot advance cancelled sequence');assert.ok(h.calls.some(x=>x.handoff==='feraset'),'Feraset stops prior readers');
 h.setPlay(()=>false);assert.equal(await a.start(0),false);assert.equal(a.index(),0,'failed playback cannot advance');
 h.setRead(true);assert.equal(await a.start(0),false);h.setRead(false);
 const original=h.store.get(a.key(0));h.setChunk(10);await a.record(0);await h.recorder().stop();assert.equal(h.store.get(a.key(0)),original,'too-short recording preserves old clip');h.setChunk(1024);h.setWrite(true);await a.record(0);await h.recorder().stop();assert.equal(h.store.get(a.key(0)),original,'failed save preserves old recording');h.setWrite(false);
 await a.record(0);await h.recorder().stop();assert.equal(h.store.get(a.key(0)).size,1024);assert.equal(a.snapshot().saving,false);assert.equal(a.snapshot().recording,null);
 h.setConfirm(false);await a.remove(0);assert.ok(h.store.has(a.key(0)));h.setConfirm(true);
 h.setDelete(true);await a.remove(0);assert.ok(h.store.has(a.key(0)));h.setDelete(false);await a.remove(0);assert.equal(h.store.has(a.key(0)),false);
 assert.ok(h.store.has(a.key(1)),'delete is section scoped');assert.equal(await h.store.get('dua:tovbe:legacy').text(),'keep','legacy recordings unchanged');
 console.log('PASS r1258 section identities, exact text, sequential playback, cancellation, pause, storage faults, save/delete and legacy preservation');
})().catch(e=>{console.error(e);process.exitCode=1;});
