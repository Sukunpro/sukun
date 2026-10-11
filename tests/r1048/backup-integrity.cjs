/* Exact shipped planner, visible handler, shared native validator and atomic
 * REC_DB.mergeMissing with synthetic files and transactional storage only.
 * Run: node tests/r1048/backup-integrity.cjs [source root]
 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),salvage=fs.readFileSync(path.join(root,'assets/runtime/recording-salvage-r1020.js'),'utf8');
const results=[];
async function test(name,fn){try{await fn();results.push({name,passed:true});}catch(error){results.push({name,passed:false,error:String(error.stack||error)});}}
function cut(source,start,end){const a=source.indexOf(start),b=source.indexOf(end,a);assert(a>=0&&b>a,start);return source.slice(a,b);}
const sum=value=>crypto.createHash('sha256').update(value).digest('hex');
const clone=value=>JSON.parse(JSON.stringify(value));
const uri=(bytes,type='audio/webm')=>'data:'+(type||'application/octet-stream')+';base64,'+Buffer.from(bytes).toString('base64');
const file=data=>new Blob([JSON.stringify(data)],{type:'application/json'});
function native(options={}){
 const {type='audio/webm',privateOnly=false}=options,t=Date.now(),build='r1047';
 const recordings=privateOnly?{'private.clip':'HIDE'}:{existing:'AAAA',missing:'AAAA','private.clip':'HIDE'};
 const ls={'sukun.lang':'en','sukun.total':'7'};
 const entries=Object.entries(recordings).map(([key,bytes])=>[key,{size:Buffer.byteLength(bytes),type,sum:sum(bytes),metadata:null}]).sort(([a],[b])=>a.localeCompare(b));
 const ambience={name:'Synthetic ambience'};
 const serial={schema:1,app:'SUKUN-Recovery',at:t,build,ls:Object.entries(ls).sort(([a],[b])=>a.localeCompare(b)),stores:{sukunRec:{present:true,version:1,entries},sukunCustomAmb:{present:true,version:1,entries:[['ambient',{size:4,type:'audio/webm',sum:sum('AMBI'),metadata:ambience}]]}}};
 const data={app:'SUKUN',fmt:2,t,build,ls,idb:{sukunRec:Object.fromEntries(Object.entries(recordings).map(([key,bytes])=>[key,{__blob:uri(bytes,type),type}])),sukunCustomAmb:{ambient:{__audioRecord:{...ambience,blob:uri('AMBI'),type:'audio/webm'}}}},recovery:{schema:1,mode:'exact-personal-data',presence:{sukunRec:true,sukunCustomAmb:true},digest:sum(JSON.stringify(serial))}};
 return data;
}
function fixture({unlocked=false,validator=true,cancelAt=0,onTransaction=null}={}){
 const clips=new Map([['existing',new Blob(['NEWER'],{type:'audio/webm'})]]),status={textContent:''},history={mergeCalls:0,transactions:0,commits:0,aborts:0,storageOpens:0,settingWrites:0,checks:0};
 let current=true,revision=0;
 const window={crypto:crypto.webcrypto,I18N:{lang:'en'},addEventListener(){},removeEventListener(){},SukunSecretPolicy:{unlocked:()=>unlocked,secretRecKey:key=>key.startsWith('private.')},SukunTabOwner:{maintenance:async(kind,run)=>run({current:()=>current,assertCurrent:()=>{history.checks++;if(cancelAt&&history.checks>=cancelAt)current=false;if(!current)throw Object.assign(Error('cancelled'),{code:'cancelled'});}})}};
 const document={readyState:'loading',documentElement:{lang:'en'},getElementById:id=>id==='ydkDurum'?status:null,addEventListener(){},querySelector:()=>null};
 function transaction(){
  history.transactions++;onTransaction?.(clips);
  const pending=new Map(clips);let requests=0,aborted=false,completed=false,queued=false;
  const tx={objectStore:()=>store,abort(){if(completed||aborted)return;aborted=true;history.aborts++;queueMicrotask(()=>tx.onabort?.());}};
  const settle=()=>{if(queued||aborted||completed||requests)return;queued=true;queueMicrotask(()=>{queued=false;if(aborted||completed||requests)return;completed=true;clips.clear();for(const pair of pending)clips.set(...pair);history.commits++;tx.oncomplete?.();});};
  const store={getKey(key){const request={};requests++;queueMicrotask(()=>{if(aborted)return;request.result=pending.has(key)?key:undefined;request.onsuccess?.();requests--;settle();});return request;},add(blob,key){if(pending.has(key))throw Error('ConstraintError');pending.set(key,blob);settle();}};
  return tx;
 }
 const c={window,document,Blob,Uint8Array,TextEncoder,Map,Set,Promise,Date,Object,Array,Error,Number,String,JSON,RegExp,AbortController,setTimeout,clearTimeout,atob,btoa,queueMicrotask,localStorage:{getItem:()=>null,setItem(){history.settingWrites++;}},toast(){},RECKEYS:new Set(),open:async()=>{history.storageOpens++;return{transaction};},revision:()=>revision,revisions:{set:(key,value)=>revision=value},skRecordingCatalogPublish(){},skRecordingCatalogRead:async()=>({ok:true,keys:[...clips.keys()]}),skRecordingCatalogWarning:()=>'',SK_RECORDING_CATALOG:{error:''}};
 vm.createContext(c);
 vm.runInContext(cut(html,'function skBackupLimits(){','function skVoiceRestoreBind(){'),c);
 // This uses the real missing-only getKey+add transaction body, not a merge stub.
 const merge=vm.runInContext('('+cut(html,'  async function mergeMissing(entries,opt={}){','  /* Tüm kayıtları anahtar+boyutuyla listele')+')',c);
 c.REC_DB={mergeMissing:async(...args)=>{history.mergeCalls++;return merge(...args);}};
 c.skVoiceRestoreRefresh=async()=>{};
 if(validator){
  // Expose only existing closures to tests of the lower import route.
  vm.runInContext(salvage.replace(' w.SukunRecordingSalvage=',' w.__nativeTest={verifyNativeJSON};\n w.SukunRecordingSalvage='),c);
 }
 async function restore(data){return c.skRestoreMissingVoices([file(data)]);}
 return {c,window,clips,status,history,restore,setCurrent:value=>current=value};
}
async function unchanged(f){assert.equal(await f.clips.get('existing').text(),'NEWER');assert.equal(f.clips.has('missing'),false);assert.equal(f.history.mergeCalls,0);assert.equal(f.history.commits,0);assert.equal(f.history.settingWrites,0);}
(async()=>{
 await test('native audio tamper is rejected before the real missing-only merge',async()=>{const f=fixture(),data=native();data.idb.sukunRec.missing.__blob=uri('BBBB');assert.equal((await f.restore(data)).ok,false);assert.match(f.status.textContent,/integrity verification failed/);await unchanged(f);});
 await test('native non-audio setting tamper participates in the original full digest',async()=>{const f=fixture(),data=native();data.ls['sukun.total']='8';assert.equal((await f.restore(data)).ok,false);await unchanged(f);});
 await test('native custom ambience tamper participates in the original full digest',async()=>{const f=fixture(),data=native();data.idb.sukunCustomAmb.ambient.__audioRecord.blob=uri('CHNG');assert.equal((await f.restore(data)).ok,false);await unchanged(f);});
 await test('native malformed checksum fails before any recording transaction',async()=>{const f=fixture(),data=native();data.recovery.digest='invalid';assert.equal((await f.restore(data)).ok,false);await unchanged(f);});
 await test('native valid-shaped incorrect checksum fails before any recording transaction',async()=>{const f=fixture(),data=native();data.recovery.digest='0'.repeat(64);assert.equal((await f.restore(data)).ok,false);await unchanged(f);});
 for(const [name,mutate]of [['unsupported recovery schema',d=>d.recovery.schema=99],['unsupported recovery mode',d=>d.recovery.mode='other'],['unsupported full version',d=>d.fmt=999],['null recovery claim',d=>d.recovery=null],['false recovery claim',d=>d.recovery=false],['empty recovery claim',d=>d.recovery={}],['recovery claim on voice backup',d=>{d.uygulama='SUKUN';d.kayitlar={missing:{veri:Buffer.from('BBBB').toString('base64'),tur:'audio/webm'}};d.app='other';}]])await test(name+' cannot fall back to legacy acceptance',async()=>{const f=fixture(),data=native();mutate(data);assert.equal((await f.restore(data)).ok,false);await unchanged(f);});
 await test('unsupported checksumless full version is rejected',async()=>{const f=fixture(),data=native();delete data.recovery;data.fmt=999;assert.equal((await f.restore(data)).ok,false);await unchanged(f);});
 await test('valid native full backup adds only missing keys and filters private recordings',async()=>{const f=fixture(),out=await f.restore(native());assert.equal(out.ok,true);assert.equal(out.added,1);assert.equal(out.kept,1);assert.equal(out.privateSkipped,1);assert.equal(await f.clips.get('existing').text(),'NEWER');assert.equal(await f.clips.get('missing').text(),'AAAA');assert.equal(f.clips.has('private.clip'),false);assert.equal(f.history.mergeCalls,1);assert.equal(f.history.settingWrites,0);});
 await test('legitimate untyped native audio uses the already verified canonical Blob',async()=>{const f=fixture(),out=await f.restore(native({type:''}));assert.equal(out.ok,true);assert.equal(f.clips.get('missing').type,'');assert.equal(await f.clips.get('missing').text(),'AAAA');});
 await test('unlocked private native recording can be added after complete verification',async()=>{const f=fixture({unlocked:true}),out=await f.restore(native({privateOnly:true}));assert.equal(out.ok,true);assert.equal(out.added,1);assert.equal(await f.clips.get('private.clip').text(),'HIDE');});
 await test('tampered locked private audio is verified before it can be skipped',async()=>{const f=fixture(),data=native();data.idb.sukunRec['private.clip'].__blob=uri('EVIL');assert.equal((await f.restore(data)).ok,false);await unchanged(f);});
 for(const version of [undefined,1,2])await test('checksumless legacy full backup remains compatible: '+version,async()=>{const f=fixture(),data={app:'SUKUN',idb:{sukunRec:{existing:{__blob:uri('AAAA')},missing:{__blob:uri('AAAA')},'private.clip':{__blob:uri('HIDE')}}}};if(version!==undefined)data.fmt=version;const out=await f.restore(data);assert.equal(out.ok,true);assert.equal(out.added,1);assert.equal(out.kept,1);assert.equal(out.privateSkipped,1);assert.equal(await f.clips.get('existing').text(),'NEWER');assert.equal(await f.clips.get('missing').text(),'AAAA');assert.equal(f.history.settingWrites,0);});
 await test('legacy full import reports absence of checksum explicitly',async()=>{const f=fixture(),data={app:'SUKUN',fmt:1,idb:{sukunRec:{missing:{__blob:uri('AAAA')}}}};assert.equal((await f.restore(data)).ok,true);assert.match(f.status.textContent,/legacy full backup has no integrity checksum/);});
 await test('legacy voice-only backup remains compatible and additive',async()=>{const f=fixture(),data={uygulama:'SUKUN',sur:1,kayitlar:{existing:{veri:Buffer.from('AAAA').toString('base64'),tur:'audio/webm'},missing:{veri:Buffer.from('AAAA').toString('base64'),tur:'audio/webm'}}};const out=await f.restore(data);assert.equal(out.ok,true);assert.equal(out.added,1);assert.equal(out.kept,1);assert.equal(await f.clips.get('existing').text(),'NEWER');});
 await test('canonical validator unavailable fails closed only for native imports',async()=>{const f=fixture({validator:false});assert.equal((await f.restore(native())).ok,false);await unchanged(f);const legacy={app:'SUKUN',fmt:1,idb:{sukunRec:{missing:{__blob:uri('AAAA')}}}};assert.equal((await f.restore(legacy)).ok,true);});
 await test('native read-only validation does not acquire or mutate a recording store',async()=>{const f=fixture();assert.equal(typeof f.window.SukunRecordingSalvage.validateNativeJSON,'function');const rows=await f.window.SukunRecordingSalvage.validateNativeJSON(native());assert.equal(rows.length,3);assert.equal(f.history.storageOpens,0);assert.equal(f.history.mergeCalls,0);assert.equal(f.window.SukunRecordingSalvage.status().busy,false);});
 await test('cancelled native validation cannot reach mergeMissing',async()=>{const f=fixture({cancelAt:4});assert.equal((await f.restore(native())).ok,false);await unchanged(f);});
 for(const [name,mutate,code]of [['audio tamper',d=>d.idb.sukunRec.missing.__blob=uri('BBBB'),'checksum-failed'],['settings tamper',d=>d.ls['sukun.total']='8','checksum-failed'],['null recovery claim',d=>d.recovery=null,'invalid-source'],['false recovery claim',d=>d.recovery=false,'invalid-source'],['unsupported recovery schema',d=>d.recovery.schema=99,'invalid-source']])await test('lower importJSON also rejects '+name+' before staging',async()=>{const f=fixture(),data=native();mutate(data);await assert.rejects(f.window.SukunRecordingSalvage.importJSON([file(data)]),error=>error.code===code);await unchanged(f);assert.equal(f.history.storageOpens,0);assert.equal(f.window.SukunRecordingSalvage.status().busy,false);});
 await test('invalid later file prevents the entire multi-file merge',async()=>{const f=fixture(),first=native(),bad=clone(first);bad.idb.sukunRec.missing.__blob=uri('BBBB');assert.equal((await f.c.skRestoreMissingVoices([file(first),file(bad)])).ok,false);await unchanged(f);});
 await test('a clip added after planning is still retained by the atomic transaction',async()=>{const f=fixture({onTransaction:clips=>clips.set('missing',new Blob(['LATER'],{type:'audio/webm'}))}),out=await f.restore(native());assert.equal(out.ok,true);assert.equal(out.added,0);assert.equal(out.kept,2);assert.equal(await f.clips.get('missing').text(),'LATER');assert.equal(await f.clips.get('existing').text(),'NEWER');});
 await test('actual mergeMissing rolls back prior additions when a missing conflicting key aborts',async()=>{const f=fixture();await assert.rejects(f.c.REC_DB.mergeMissing([['first',new Blob(['AAAA'],{type:'audio/webm'})],['conflict',new Blob(['BBBB'],{type:'audio/webm'})]],{conflictKeys:['conflict']}),/conflicting recording changed/);assert.equal(f.clips.has('first'),false);assert.equal(f.clips.has('conflict'),false);assert.equal(f.history.commits,0);assert.equal(f.history.aborts,1);});
 const report={sourceRoot:root,method:'Exact shipped planner, visible handler, canonical digest validator and mergeMissing; synthetic files and transactional storage. No personal profile or physical device.',passed:results.filter(x=>x.passed).length,total:results.length,results};console.log(JSON.stringify(report,null,2));if(report.passed!==report.total)process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1;});
