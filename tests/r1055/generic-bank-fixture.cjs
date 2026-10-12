'use strict';
// Controlled IDB transactions with commit-only writes and fault injection.
// No bank validator, hash or import policy is implemented in this fixture.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const digest=value=>crypto.createHash('sha256').update(value).digest('hex');
const plain=value=>JSON.parse(JSON.stringify(value));
const flush=async()=>{for(let i=0;i<20;i++)await Promise.resolve();await new Promise(setImmediate)};
function wav(seed=1){const b=Buffer.alloc(76);b.write('RIFF',0);b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(8000,24);b.writeUInt32LE(16000,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(32,40);for(let i=44;i<b.length;i+=2)b.writeInt16LE(seed*100,i);return b}
function record(key='esma:0:nida',bytes=wav(),type='audio/wav'){return{key,type,bytes:bytes.length,sha256:digest(bytes),data:'data:'+type+';base64,'+bytes.toString('base64')}}
function bank(records=[record()]){return{app:'SUKUN_GENERIC_RECORDINGS',schema:1,records,bankSha256:digest(JSON.stringify(records.map(({key,type,bytes,sha256})=>({key,type,bytes,sha256}))))}}
const file=data=>Object.assign(new Blob([JSON.stringify(data)],{type:'application/json'}),{name:'generic-test.json'});
function fixture(root,{disk=new Map(),storage=new Map()}={}){
 const history={opens:[],transactions:[],commits:0,aborts:0,lsReads:[],lsWrites:[],personalAccess:[],downloads:[],events:[],maintenance:[]},faults={abortWrite:false,holdReads:false,readError:false,openError:false,preferenceWrite:false},held=[],listeners=new Map();
 const personal=new Map([['esma:0:nida',new Blob(['PRIVATE_PERSONAL_VOICE'],{type:'audio/webm'})]]),keys=new Set(personal.keys());let current=true;
 function txFor(name,names,mode){
  const list=Array.isArray(names)?names:[names],existing=disk.get(name),draft=new Map(list.map(s=>[s,new Map(existing.get(s)||[])]));let pending=0,completed=false,aborted=false,schedulePending=false;
  history.transactions.push({name,names:list,mode});
  const tx={error:null,objectStore:s=>store(s),abort(){if(completed||aborted)return;aborted=true;tx.error=Object.assign(Error('fixture abort'),{name:'AbortError'});history.aborts++;queueMicrotask(()=>tx.onabort?.())}};
  const settle=()=>{if(schedulePending||pending||completed||aborted)return;schedulePending=true;setImmediate(()=>{schedulePending=false;if(pending||completed||aborted)return;if(mode==='readwrite'&&faults.abortWrite){faults.abortWrite=false;tx.abort();return}completed=true;if(mode==='readwrite'){for(const[s,values]of draft)existing.set(s,new Map(values));history.commits++}tx.oncomplete?.()})};
  function request(result,mutation){pending++;const req={};const run=()=>{if(aborted)return;if(faults.readError&&mode==='readonly'){req.error=Object.assign(Error('fixture read'),{name:'UnknownError'});req.onerror?.();tx.error=req.error;tx.onerror?.();tx.abort();return}try{mutation?.();req.result=result();req.onsuccess?.({target:req})}catch(error){req.error=error;req.onerror?.();tx.error=error;tx.onerror?.();tx.abort()}pending--;settle()};if(mode==='readonly'&&faults.holdReads)held.push(run);else queueMicrotask(run);return req}
  function store(s){if(!draft.has(s))throw Error('unlisted store '+s);const values=draft.get(s);return{get:k=>request(()=>values.get(k)),getKey:k=>request(()=>values.has(k)?k:undefined),getAll:()=>request(()=>[...values.values()]),getAllKeys:()=>request(()=>[...values.keys()]),put:(v,k)=>request(()=>k??v.key,()=>values.set(k??v.key,v)),add:(v,k)=>request(()=>k??v.key,()=>{const key=k??v.key;if(values.has(key))throw Object.assign(Error('duplicate'),{name:'ConstraintError'});values.set(key,v)}),delete:k=>request(()=>undefined,()=>values.delete(k)),clear:()=>request(()=>undefined,()=>values.clear()),openCursor(){const entries=[...values.entries()];let index=0;pending++;const req={};const step=()=>{if(aborted)return;const entry=entries[index++];req.result=entry?{key:entry[0],value:entry[1],continue:()=>queueMicrotask(step)}:null;req.onsuccess?.({target:req});if(!entry){pending--;settle()}};queueMicrotask(step);return req}}}
  settle();return tx;
 }
 const indexedDB={open(name,version){history.opens.push({name,version});if(name==='sukunRec')history.personalAccess.push('indexedDB.open');const req={};queueMicrotask(()=>{if(faults.openError){req.error=Object.assign(Error('open failed'),{name:'SecurityError'});req.onerror?.();return}const fresh=!disk.has(name);if(fresh)disk.set(name,new Map());const stores=disk.get(name);const db={name,objectStoreNames:{contains:s=>stores.has(s)},createObjectStore(s){stores.set(s,new Map());return{}},transaction:(s,m)=>txFor(name,s,m),close(){}};req.result=db;if(fresh){req.transaction={abort(){disk.delete(name);req.error=Object.assign(Error('upgrade aborted'),{name:'AbortError'})}};req.onupgradeneeded?.({target:req});if(req.error){req.onerror?.();return}}req.onsuccess?.({target:req})});return req}};
 const document={readyState:'loading',baseURI:'https://example.invalid/sukun/',currentScript:{src:'https://example.invalid/sukun/assets/runtime/generic-recordings-r1055.js?v=r1055'},addEventListener(){},querySelector:()=>null,getElementById:()=>null,createElement:()=>({click(){history.downloads.push('click')},remove(){}}),body:{append(){}}};
 const c={window:null,document,Blob,Uint8Array,ArrayBuffer,DataView,TextEncoder,TextDecoder,Buffer,Map,Set,Object,Array,Number,String,JSON,RegExp,Promise,Date,Error,AbortController,URL,atob,btoa,queueMicrotask,setTimeout,clearTimeout,crypto:crypto.webcrypto,indexedDB,navigator:{},location:{href:'https://example.invalid/sukun/',origin:'https://example.invalid'},
  FileReader:class{readAsDataURL(blob){blob.arrayBuffer().then(bytes=>{this.result='data:'+blob.type+';base64,'+Buffer.from(bytes).toString('base64');this.onload?.()},error=>{this.error=error;this.onerror?.()})}},
  localStorage:{getItem(key){history.lsReads.push(key);return storage.get(key)??null},setItem(key,value){history.lsWrites.push([key,String(value)]);if(faults.preferenceWrite&&key==='sukun.generic.recordings.enabled.v1')throw Error('denied');storage.set(key,String(value))},removeItem(key){history.lsWrites.push([key,null]);storage.delete(key)},clear(){history.personalAccess.push('localStorage.clear')}},
  RECKEYS:keys,REC_DB:{get(){history.personalAccess.push('REC_DB.get');throw Error('bank touched personal recordings')},set(){history.personalAccess.push('REC_DB.set');throw Error('bank touched personal recordings')}},
  SukunTabOwner:{maintenance:async(kind,run)=>{history.maintenance.push(kind);return run({current:()=>current,assertCurrent(){if(!current)throw Object.assign(Error('stale lease'),{code:'cancelled'})}})}},
  CustomEvent:class{constructor(type,init){this.type=type;this.detail=init?.detail}},addEventListener(type,fn){if(!listeners.has(type))listeners.set(type,new Set());listeners.get(type).add(fn)},removeEventListener(type,fn){listeners.get(type)?.delete(fn)},dispatchEvent(e){history.events.push({type:e.type,detail:e.detail});for(const fn of listeners.get(e.type)||[])fn(e);return true},
  fetch:async()=>{throw Error('unexpected bank fetch')}
 };
 c.window=c;vm.createContext(c);vm.runInContext(fs.readFileSync(path.join(root,'assets/runtime/generic-recordings-r1055.js'),'utf8'),c);
 return{c,api:c.SukunGenericRecordings,disk,storage,personal,keys,history,faults,held,document,
  setCurrent:v=>{current=v},async release(){faults.holdReads=false;for(const fn of held.splice(0))fn();await flush()},flush,
  state:()=>plain(c.SukunGenericRecordings.snapshot()),async import(data,opt={}){return c.SukunGenericRecordings.importFiles([file(data)],opt)}
 };
}
module.exports={fixture,record,bank,file,wav,digest,plain,flush};
