'use strict';
// Shipped Studio edit, bound busy/paused callbacks and owner runtime. Browser
// locks, storage, sample processing and timing are controlled test seams.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));process.env.SUKUN_AUDIO_SOURCE=root;
const {origin}=require('../helpers/tab-owner-origin.cjs'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
function cut(a,b){const i=html.indexOf(a),j=html.indexOf(b,i);assert(i>=0&&j>i,a);return html.slice(i,j)}
const binding=cut('window.SukunTabOwner?.bind?.({','\n\n\n/* ═');
const editSource=cut('async function studioEdit(kind){','// Cancel native/worker/storage stages');
const preparationSource=fs.readFileSync(path.join(root,'assets/runtime/studio-preparation-r982.js'),'utf8');
const fences=cut('function studioTabFence(){','async function analyzeKey(');
const results=[];async function test(name,fn){try{await fn();results.push({name,passed:true})}catch(error){results.push({name,passed:false,error:error.stack||String(error)})}}
async function settle(w,p){let out;Promise.resolve(p).then(value=>out={value},error=>out={error});await w.flush();assert(out,'controlled operation must settle');return out}
function fixture(){
 const w=origin(),t=w.tab(),c=t.window,Studio={key:'temel:0',analysisSeq:7,recordClaim:null,session:null,edit:null,analysisTask:null};
 const status=[],writes=[],savedAnalyses=[],clears=[];let processing=0;
 Object.assign(c,{Z:{cat:'temel',idx:0,form:'oku',auto:false},R170:{Studio},Studio,AbortController,
  studioAbort:task=>task?.controller?.abort(),studioControls(){},studioStatus:text=>status.push(text),studioText:(_tr,en)=>en,
  studioAnalyze:async opt=>{savedAnalyses.push(opt);return true},studioClearMeasurements:()=>clears.push(Studio.key),mediaRender:async()=>true,
  REC_DB:{set:async(key,blob,opt)=>{assert.equal(key,Studio.key);assert.equal(opt.expectedRevision,1);assert.equal(opt.signal.aborted,false);assert.equal(opt.isCurrent(),true);writes.push({key,blob});return true;}},
  analyzeKey:async(key,draw,opt)=>{processing++;assert.equal(draw,false);assert.equal(key,Studio.key);assert(['normalize','trim'].includes(opt.kind));const check=()=>{if(!opt.isCurrent()||opt.signal.aborted)throw Object.assign(Error('PREP_CANCELLED'),{code:'PREP_CANCELLED'});};check();const output={changed:true,blob:{kind:opt.kind},peak:.62,scale:.92/.62};await opt.commit(output,check,opt.signal,1);check();return output;}
 });
 vm.runInContext(preparationSource,c);
 vm.runInContext('let _r980ItemRecStarting=false,ITEMREC=null;',c);vm.runInContext(binding,c);
 vm.runInContext('globalThis.__boundBusy='+binding.slice(binding.indexOf(' busy:')+6,binding.indexOf(',\n stop:')),c);
 t.owner.bind({rebase:()=>true});vm.runInContext(fences,c);vm.runInContext(editSource,c);
 return{w,t,c,Studio,status,writes,savedAnalyses,clears,get processing(){return processing},claim(kind='normalize'){return Studio.edit={key:Studio.key,kind,seq:Studio.analysisSeq,controller:new AbortController(),saving:false,lease:null,tabFence:null}}};
}
async function admit(f,{kind='studio-edit',claim=f.Studio.edit,strict=false}={}){let calls=0;const out=await settle(f.w,f.t.owner.maintenance(kind,()=>{calls++;return true},{editClaim:claim,throwOnBlocked:strict}));return{...out,calls}}
async function hold(f,owned){if(owned)assert.equal((await settle(f.w,f.t.owner.acquire())).value,true)}
(async()=>{
 for(const owned of [false,true])for(const kind of ['normalize','trim'])await test((owned?'Owned':'Unowned')+' actual '+kind+' edit is admitted, commits and releases the silent lease',async()=>{
  const f=fixture();await hold(f,owned);const out=await settle(f.w,f.c.studioEdit(kind));assert.equal(out.value,true);assert.equal(f.processing,1);assert.equal(f.writes.length,1);assert.equal(f.writes[0].blob.kind,kind);assert.equal(f.savedAnalyses.length,1);assert(f.savedAnalyses[0].savedNote);assert.equal(f.Studio.edit,null);assert.equal(f.t.owner.snapshot().maintenance,false);assert.equal(f.w.dbRecord,null);assert.equal(f.t.calls.flush,0);
 });
 for(const owned of [false,true])for(const kind of ['normalize','trim'])for(const invalidation of ['abort','selection','selection-return','sequence','owner'])await test((owned?'Owned':'Unowned')+' '+kind+' keeps its committed outcome after '+invalidation,async()=>{
  const f=fixture();await hold(f,owned);const set=f.c.REC_DB.set;let statusAfterCommit;
  f.c.REC_DB.set=async(...args)=>{await set(...args);statusAfterCommit=f.status.length;
   if(invalidation==='abort')f.Studio.edit.controller.abort();
   if(invalidation==='selection')f.Studio.key='temel:1';
   if(invalidation==='selection-return'){f.Studio.key='temel:1';f.Studio.analysisSeq++;f.Studio.key='temel:0';f.Studio.analysisSeq++;}
   if(invalidation==='sequence')f.Studio.analysisSeq++;
   if(invalidation==='owner')f.c.SukunTabOwner.cancelPending('post-commit-intent');
   return true;
  };
  const out=await settle(f.w,f.c.studioEdit(kind));assert.equal(out.value,true);assert.equal(f.writes.length,1);assert.equal(f.savedAnalyses.length,0);assert.equal(f.Studio.edit,null);assert.equal(f.t.owner.snapshot().maintenance,false);assert.equal(f.w.dbRecord,null);
  if(['abort','owner'].includes(invalidation)){assert.equal(f.clears.length,1);assert.match(f.status.at(-1),/recording was saved/i);assert.doesNotMatch(f.status.at(-1),/original recording was kept|no changes were saved|edit was cancelled/i);}
  else{assert.equal(f.clears.length,0);assert.equal(f.status.length,statusAfterCommit,'stale selection receives no completion status');}
 });
 for(const owned of [false,true])await test((owned?'Owned':'Unowned')+' cancellation before commit preserves the false outcome and original-recording message',async()=>{
  const f=fixture();await hold(f,owned);f.c.REC_DB.set=async()=>{f.Studio.edit.controller.abort();throw Object.assign(Error('PREP_CANCELLED'),{code:'PREP_CANCELLED'});};
  const out=await settle(f.w,f.c.studioEdit('normalize'));assert.equal(out.value,false);assert.equal(f.writes.length,0);assert.equal(f.savedAnalyses.length,0);assert.equal(f.clears.length,0);assert.match(f.status.at(-1),/original recording was kept/i);assert.doesNotMatch(f.status.at(-1),/recording was saved/i);
 });
 await test('Committed edit followed by owner cleanup failure stays saved and skips analysis',async()=>{
  const f=fixture(),owner=f.c.SukunTabOwner;f.c.SukunTabOwner={...owner,maintenance:async(...args)=>{await owner.maintenance(...args);throw Object.assign(Error('PREP_CANCELLED'),{code:'PREP_CANCELLED'});}};
  const out=await settle(f.w,f.c.studioEdit('trim'));assert.equal(out.value,true);assert.equal(f.writes.length,1);assert.equal(f.savedAnalyses.length,0);assert.equal(f.clears.length,1);assert.match(f.status.at(-1),/recording was saved/i);assert.doesNotMatch(f.status.at(-1),/original recording was kept/i);
 });
 await test('A newer ownership intent after committed cleanup prevents follow-on analysis',async()=>{
  const f=fixture(),owner=f.c.SukunTabOwner;f.c.SukunTabOwner={...owner,maintenance:async(...args)=>{const value=await owner.maintenance(...args);owner.cancelPending('newer-post-commit-intent');return value;}};
  const out=await settle(f.w,f.c.studioEdit('normalize'));assert.equal(out.value,true);assert.equal(f.writes.length,1);assert.equal(f.savedAnalyses.length,0);assert.equal(f.clears.length,1);assert.match(f.status.at(-1),/recording was saved/i);assert.doesNotMatch(f.status.at(-1),/original recording was kept/i);
 });
 await test('A second settled maintenance attempt cannot masquerade as this edit release',async()=>{
  const f=fixture(),owner=f.c.SukunTabOwner;let second;
  f.c.SukunTabOwner={...owner,maintenance:async(...args)=>{const value=await owner.maintenance(...args);second=await owner.maintenance('backup-export',()=>true);return value;}};
  const out=await settle(f.w,f.c.studioEdit('normalize'));assert.equal(out.value,true);assert.equal(second,false);assert.equal(f.writes.length,1);assert.equal(f.savedAnalyses.length,0);assert.equal(f.clears.length,1);assert.equal(owner.snapshot().reason,'maintenance-finished');assert.match(f.status.at(-1),/recording was saved/i);assert.doesNotMatch(f.status.at(-1),/original recording was kept/i);
 });
 await test('Only the exact pending edit is discounted, while ordinary busy remains true',async()=>{const f=fixture(),claim=f.claim();assert.equal(f.c.__boundBusy(),true);assert.equal(f.c.__boundBusy(false,{maintenanceKind:'studio-edit',editClaim:claim}),false);assert.equal(f.c.__boundBusy(false,{maintenanceKind:'studio-record',editClaim:claim}),true);assert.equal(f.c.__boundBusy(false,{maintenanceKind:'backup-import',editClaim:claim}),true)});
 const invalid={
  'missing context':(_f,o)=>{o.claim=null},
  'another maintenance kind':(_f,o)=>{o.kind='backup-import'},
  'record maintenance kind':(_f,o)=>{o.kind='studio-record'},
  'different claim reference':(f,o)=>{o.claim={...f.Studio.edit}},
  'foreign current task':f=>{f.Studio.edit={...f.Studio.edit}},
  'changed selected key':f=>{f.Studio.key='temel:1'},
  'changed analysis sequence':f=>{f.Studio.analysisSeq++},
  'aborted edit':f=>{f.Studio.edit.controller.abort()},
  'missing cancellation controller':f=>{f.Studio.edit.controller=null},
  'unknown cancellation state':f=>{f.Studio.edit.controller={signal:{}}},
  'active recording session':f=>{f.Studio.session={}},
  'pending recording claim':f=>{f.Studio.recordClaim={}},
  'pending analysis':f=>{f.Studio.analysisTask={}},
  'unsupported edit operation':f=>{f.Studio.edit.kind='unknown'},
  'already saving edit':f=>{f.Studio.edit.saving=true},
  'already admitted edit':f=>{f.Studio.edit.lease={}}
 };
 for(const owned of [false,true])for(const[name,mutate]of Object.entries(invalid))await test((owned?'Owned':'Unowned')+' admission stays blocked for '+name,async()=>{const f=fixture();await hold(f,owned);const o={claim:f.claim(),kind:'studio-edit'};mutate(f,o);const out=await admit(f,o);assert.equal(out.value,false);assert.equal(out.calls,0);if(!owned)assert.equal(f.w.dbRecord,null)});
 const busy={
  'automatic dhikr':c=>{c.Z.auto=true},
  'set session':c=>{c.SukunTekkeSet={snapshot:()=>({active:true})}},
  'active Tekke':c=>{c.Tekke={sessionState:()=>({active:true})}},
  'direct Start':c=>{c.SukunDirectZikirTransportR698={state:()=>({starting:true})}},
  'pending Start':c=>{c.SukunR698Transport={snapshot:()=>({pendingStart:true})}},
  'pending Stop':c=>{c.SukunR698Transport={snapshot:()=>({pendingStop:true})}},
  'Berhet journey':c=>{c.SukunBerhetiyyeSeyir={state:()=>({run:true})}},
  'Esma journey':c=>{c.SukunEsma99Seyir={state:()=>({run:true})}},
  'manual voice':c=>{c.SukunManualVoice={busy:()=>true}},
  'physical audio':c=>{c.SukunPhysicalRecordingBusyR696=()=>true},
  'voice busy':c=>{c.__SUKUN_ZIKIR_VOICE_BUSY__=true},
  'pending voice':c=>{c.__SUKUN_ZIKIR_VOICE_PROMISE__={}},
  'item recording preparation':c=>vm.runInContext('_r980ItemRecStarting=true',c),
  'terkip voice':c=>{c.SukunTerkipVoice={snapshot:()=>({active:true})}},
  'foreground audio':c=>{c.SukunForegroundArbiter={snapshot:()=>({owner:'controlled-owner'})}},
  'smart player':c=>{c.R170.Player={playing:true}},
  'speech':c=>{c.speechSynthesis={speaking:true}},
  'pending speech':c=>{c.speechSynthesis={pending:true}},
  'item microphone':c=>vm.runInContext('ITEMREC={}',c),
  'tick microphone':c=>{c.SukunTickSound={isRecording:()=>true}}
 };
 for(const owned of [false,true])for(const[name,mutate]of Object.entries(busy))await test((owned?'Owned':'Unowned')+' own edit cannot discount '+name,async()=>{const f=fixture();await hold(f,owned);f.claim();mutate(f.c);const out=await admit(f);assert.equal(out.value,false);assert.equal(out.calls,0)});
 const paused={
  'Tekke':c=>{c.Tekke={sessionState:()=>({phase:'paused'})}},
  'canonical session':c=>{c.SukunSessionState={peek:()=>({phase:'PAUSED'})}},
  'Berhet journey':c=>{c.SukunBerhetiyyeSeyir={state:()=>({paused:true})}},
  'Esma journey':c=>{c.SukunEsma99Seyir={state:()=>({paused:true})}},
  'smart player':c=>{c.R170.Player={paused:true}}
 };
 for(const[name,mutate]of Object.entries(paused))await test('Owned paused '+name+' still blocks the edit',async()=>{const f=fixture();await hold(f,true);f.claim();mutate(f.c);const out=await admit(f);assert.equal(out.value,false);assert.equal(out.calls,0);assert(f.t.owner.owns())});
 await test('Unowned restored paused suggestion keeps the existing maintenance policy',async()=>{const f=fixture();f.claim();f.c.SukunSessionState={peek:()=>({phase:'PAUSED'})};const out=await admit(f);assert.equal(out.value,true);assert.equal(out.calls,1)});
 for(const owned of [false,true])for(const strict of [false,true])await test((owned?'Owned':'Unowned')+' busy getter errors fail closed '+(strict?'with typed diagnostics':'for boolean callers'),async()=>{const f=fixture();await hold(f,owned);f.claim();f.c.SukunR698Transport={snapshot:()=>{throw new TypeError('controlled')}};const out=await admit(f,{strict});assert.equal(out.calls,0);if(strict)assert.equal(out.error.code,'maintenance-check-failed');else assert.equal(out.value,false)});
 await test('Paused getter errors also fail closed before an owned edit',async()=>{const f=fixture();await hold(f,true);f.claim();f.c.SukunSessionState={peek:()=>{throw new TypeError('controlled')}};const out=await admit(f,{strict:true});assert.equal(out.calls,0);assert.equal(out.error.code,'maintenance-check-failed')});
 await test('Frozen maintenance context carries the edit reference only for studio-edit',async()=>{const f=fixture(),claim=f.claim();let context;f.t.owner.bind({busy:(_report,a)=>{context=a;return false}});let out=await admit(f);assert.equal(out.value,true);assert(Object.isFrozen(context));assert.equal(context.editClaim,claim);assert.equal(context.recordClaim,null);assert.equal(context.maintenanceKind,'studio-edit');out=await admit(f,{kind:'backup-import'});assert.equal(out.value,true);assert.equal(context.editClaim,null);assert.equal(context.recordClaim,null)});
 await test('Strict non-boolean busy state remains unavailable',async()=>{const f=fixture();f.claim();f.t.owner.bind({busy:()=>undefined});const out=await admit(f,{strict:true});assert.equal(out.calls,0);assert.equal(out.error.code,'maintenance-check-unavailable')});
 await test('Another tab ownership still prevents editing',async()=>{const f=fixture(),peer=f.w.tab();assert.equal((await settle(f.w,peer.owner.acquire())).value,true);f.claim();const out=await admit(f);assert.equal(out.value,false);assert.equal(out.calls,0);assert(peer.owner.owns())});
 for(const invalidation of ['abort','selection','sequence'])await test('Actual edit invalidated during ownership wait cannot process or write: '+invalidation,async()=>{const f=fixture();f.w.allowLocks=false;const promise=f.c.studioEdit('normalize');await f.w.flush();assert(f.Studio.edit);if(invalidation==='abort')f.Studio.edit.controller.abort();if(invalidation==='selection')f.Studio.key='temel:1';if(invalidation==='sequence')f.Studio.analysisSeq++;f.w.unpauseLocks();const out=await settle(f.w,promise);assert.equal(out.value,false);assert.equal(f.processing,0);assert.equal(f.writes.length,0);assert.equal(f.Studio.edit,null);assert.equal(f.w.dbRecord,null)});
 assert.equal(html,fs.readFileSync(path.join(root,'nero.html'),'utf8'));
 const report={suite:'r1096 exact pending Studio edit admission',method:'Shipped Studio edit, owner runtime and bound busy/paused callbacks in the existing controlled VM origin. Sample processing, writes, locks and timing are seams; no native browser or microphone claim.',passed:results.filter(r=>r.passed).length,total:results.length,results};
 console.log(JSON.stringify(report,null,2));if(report.passed!==report.total)process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1});
