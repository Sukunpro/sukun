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
 remove(){}
 append(...items){this.children.push(...items);}
 setAttribute(k,v){this[k]=v;}
 addEventListener(k,v){this.events[k]=v;}
 before(e){this.previous=e;}
 insertAdjacentElement(_,e){this.after=e;}
}
async function setup(savedTexts){
 const source=new Element('pre'),box=new Element('details');
 const html=fs.readFileSync(path.join(root,'nero.html'),'utf8');
 const match=html.match(/<pre\b[^>]*id=["']ferasetText["'][^>]*>([\s\S]*?)<\/pre>/);
 assert.ok(match,'canonical prayer text exists');
 source.textContent=match[1].replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>');
 const store=new Map([['dua:tovbe:legacy',new Blob(['keep'])]]),rev=new Map(),calls=[];
 let failRead=false,failSet=false,failDelete=false,confirm=true,playHook=null,lastRecorder,chunkSize=1024,activeAttempt=null,competingAudio=false;const mini={paused:false};const adapters=new Map();
 const doc={readyState:'complete',getElementById:id=>id==='ferasetText'?source:id==='ferasetBox'?box:null,createElement:tag=>new Element(tag)};
 const texts=new Map(savedTexts);let textFail=false;
 const win={localStorage:{getItem:k=>texts.get(k)||null,setItem:(k,v)=>{if(textFail)throw Error('quota');texts.set(k,v);}},SukunAudioSessionRegistry:{register:(id,adapter)=>adapters.set(id,adapter),releasePauseGate(){},stopAll(){competingAudio=false;calls.push('stop-all');}},I18N:{lang:'tr'},addEventListener(){},confirm:()=>confirm,SukunTabOwner:{run:async(_,fn,opt)=>{calls.push('lease');return opt.isCurrent()?fn():false;}}};
 const ctx={window:win,document:doc,Blob,console,navigator:{mediaDevices:{getUserMedia:async()=>{calls.push({micCompeting:competingAudio});return {getTracks:()=>[{stop(){}}]};}}},SES:{ad:''},ac(){},micKisit:()=>({}),micHazirla:async()=>{},MINI:mini,miniClearPause(){calls.push('clear-pause');mini.paused=false;},miniPause(){if(mini.paused)return;mini.paused=true;calls.push('pause');},miniResume(){if(!mini.paused)return;mini.paused=false;calls.push('resume');},sesDurdur(){ctx.SES.ad='';calls.push('stop');},okuyucularDurdur:id=>{competingAudio=false;calls.push({handoff:id});},duaRecBegin:(id,onCancel)=>{calls.push({attempt:id,miniPaused:mini.paused});if(activeAttempt&&!activeAttempt.cancelled){activeAttempt.cancelled=true;activeAttempt.onCancel();}activeAttempt={id,onCancel,cancelled:false,current(){return !this.cancelled;}};return activeAttempt;},playRecording:async(blob,label,opt)=>{calls.push({label,key:opt.recordingKey});ctx.SES.ad=label;return playHook?playHook(blob,label,opt):true;},REC_DB:{revision:k=>rev.get(k)||0,get:async k=>{if(failRead)throw Error('read');return store.get(k)||null;},set:async(k,b,opt)=>{if(failSet)throw Error('write');assert.equal(opt.expectedRevision,rev.get(k)||0);store.set(k,b);rev.set(k,(rev.get(k)||0)+1);},del:async k=>{if(failDelete)throw Error('delete');store.delete(k);}},recSessionBegin:()=>({bitir(){}})};
 class Recorder{constructor(){lastRecorder=this;this.mimeType='audio/webm';}start(){this.started=true;}stop(){this.ondataavailable({data:new Blob([new Uint8Array(chunkSize)])});return this.onstop();}}
 win.MediaRecorder=ctx.MediaRecorder=Recorder;
 ctx.recCaptureBegin=(state,i,field,render)=>{state[field]=i;let done=false;const cap={accept:()=>!done,current:()=>!done,attach:mr=>{state.rec=mr;mr.onerror=()=>{cap.failed=true;};},finish(){done=true;state[field]=null;render();},stop(){done=true;state[field]=null;render();}};return cap;};
 vm.runInNewContext(code,ctx,{filename:'feraset-sections-r1258.js'});
 const api=win.SukunFerasetSections;
 await api.refresh();
 return {api,source,store,calls,ctx,texts,setTextFail:v=>textFail=v,adapters,mini,setCompeting:v=>competingAudio=v,setChunk:v=>chunkSize=v,setRead:v=>failRead=v,setWrite:v=>failSet=v,setDelete:v=>failDelete=v,setConfirm:v=>confirm=v,setPlay:v=>playHook=v,recorder:()=>lastRecorder};
}
(async()=>{
 const h=await setup(),a=h.api,sections=a.sections();
 assert.equal(sections.length,26);
 assert.equal(sections.map(x=>x.text).join(''),fs.readFileSync(path.join(root,'tests/r1258/reviewed-prayer.txt'),'utf8'),'exact approved text without omissions');
 assert.equal(a.key(0),'dua:feraset:v2:p01');assert.equal(a.key(25),'dua:feraset:v2:p26');
 const orig=sections[0].text;assert.equal(a.saveText(0,'Custom <script> text'),true);assert.equal(h.texts.get('sukun.feraset.v2.text.p01'),'Custom <script> text');assert.equal(a.sections()[0].text,'Custom <script> text');assert.ok(h.source.textContent.startsWith('Custom <script> text'));assert.equal(a.saveText(0,''),false);
 h.setTextFail(true);assert.equal(a.saveText(0,'cannot save'),false);assert.equal(a.sections()[0].text,'Custom <script> text');h.setTextFail(false);assert.equal(a.saveText(0,orig),true);
 const reloaded=await setup([['sukun.feraset.v2.text.p01','Persisted text']]);assert.equal(reloaded.api.sections()[0].text,'Persisted text');
 h.store.set('dua:feraset:v1:h01',new Blob(['legacy']));
 const mode=h.source.previous.after.children[0].children.at(-1);mode.events.click();await a.refresh();assert.equal(a.snapshot().sections,35);assert.equal(a.key(0),'dua:feraset:v1:h01');assert.equal(a.saveText(0,'NO'),false);assert.equal(a.sections()[0].text.includes('Bismillâhirrahmânirrahîm.'),true);await a.start(0);assert.equal(h.calls.filter(x=>x.key).at(-1).key,'dua:feraset:v1:h01');mode.events.click();await a.refresh();assert.equal(a.snapshot().sections,26);assert.equal(a.key(0),'dua:feraset:v2:p01');h.calls.length=0;

 assert.equal(await a.start(0),false,'missing recording stops');assert.equal(h.calls.filter(x=>x.key).length,0);
 h.store.set(a.key(0),new Blob(['first']));h.store.set(a.key(1),new Blob(['second']));
 assert.equal(await a.start(0),false,'sequence stops at first missing section');assert.equal(a.index(),2);
 assert.deepEqual(h.calls.filter(x=>x.key).map(x=>x.key),[a.key(0),a.key(1)]);
 let release;h.setPlay(()=>new Promise(r=>release=r));const pending=a.start(0);await new Promise(r=>setImmediate(r));
 const adapter=h.adapters.get('feraset');assert.ok(adapter,'global transport adapter registered');assert.equal(adapter.getState(),'playing');adapter.pause();assert.equal(a.snapshot().paused,true);assert.equal(adapter.getState(),'paused');adapter.resume();assert.equal(a.snapshot().paused,false);
 a.stop();release(true);assert.equal(await pending,false);assert.equal(a.index(),0,'cancelled completion cannot advance');
 h.setPlay(()=>new Promise(r=>release=r));const competing=a.start(0);await new Promise(r=>setImmediate(r));h.ctx.duaRecBegin('tovbe',()=>{});assert.equal(a.snapshot().playing,false,'competing reader cancels Feraset');release(true);assert.equal(await competing,false);assert.equal(a.index(),0,'handoff cannot advance cancelled sequence');assert.ok(h.calls.some(x=>x.handoff==='feraset'),'Feraset stops prior readers');
 const checkpoint=h.calls.length;h.mini.paused=true;h.setPlay(()=>new Promise(r=>release=r));const fresh=a.start(1);await new Promise(r=>setImmediate(r));assert.equal(h.mini.paused,false,'fresh admitted start clears stale MINI pause');const events=h.calls.slice(checkpoint);assert.ok(events.indexOf('lease')<events.indexOf('clear-pause'),'clear pause follows ownership admission');assert.ok(events.indexOf('clear-pause')<events.findIndex(x=>x.attempt==='feraset'),'clear pause precedes intent capture');const pauses=h.calls.filter(x=>x==='pause').length;a.pause();assert.equal(h.calls.filter(x=>x==='pause').length,pauses+1,'fresh section remains natively pausable');a.stop();release(true);assert.equal(await fresh,false);
 h.setPlay(()=>false);assert.equal(await a.start(0),false);assert.equal(a.index(),0,'failed playback cannot advance');
 h.setRead(true);assert.equal(await a.start(0),false);h.setRead(false);
 h.setCompeting(true);const micCheckpoint=h.calls.length;await a.record(2);assert.equal(h.calls.slice(micCheckpoint).find(x=>Object.hasOwn(x,'micCompeting'))?.micCompeting,false,'competing audio stopped before mic capture');await h.recorder().stop();
 const original=h.store.get(a.key(0));h.setConfirm(false);const micBefore=h.calls.length;await a.record(0);assert.equal(h.calls.slice(micBefore).some(x=>Object.hasOwn(x,'micCompeting')),false);assert.equal(h.store.get(a.key(0)),original);h.setConfirm(true);await a.record(0);h.recorder().onerror();await h.recorder().stop();assert.equal(h.store.get(a.key(0)),original,'recorder error preserves old');h.setChunk(10);await a.record(0);await h.recorder().stop();assert.equal(h.store.get(a.key(0)),original,'too-short recording preserves old clip');h.setChunk(1024);h.setWrite(true);await a.record(0);await h.recorder().stop();assert.equal(h.store.get(a.key(0)),original,'failed save preserves old recording');h.setWrite(false);
 await a.record(0);await h.recorder().stop();assert.equal(h.store.get(a.key(0)).size,1024);assert.equal(a.snapshot().saving,false);assert.equal(a.snapshot().recording,null);
 h.setConfirm(false);await a.remove(0);assert.ok(h.store.has(a.key(0)));h.setConfirm(true);
 h.setDelete(true);await a.remove(0);assert.ok(h.store.has(a.key(0)));h.setDelete(false);await a.remove(0);assert.equal(h.store.has(a.key(0)),false);
 assert.ok(h.store.has(a.key(1)),'delete is section scoped');assert.equal(await h.store.get('dua:tovbe:legacy').text(),'keep','legacy recordings unchanged');
 assert.equal(await h.store.get('dua:feraset:v1:h01').text(),'legacy');
 console.log('PASS revised section identities, exact text, sequential playback, cancellation, pause, storage faults, save/delete and legacy preservation');
})().catch(e=>{console.error(e);process.exitCode=1;});
