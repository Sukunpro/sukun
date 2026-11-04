'use strict';
// Controlled owner/media/worker seams execute the shipped production modules.
// These checks do not claim physical Android, Bluetooth or audible output QA.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,'assets/runtime',name),'utf8');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const flush=async()=>{for(let i=0;i<5;i++)await tick()};
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b});return{promise,resolve,reject}};
function reader(){
 const events=new Map(),calls=[],stops=[],warnings=[],entries=new Map(['one','two'].map(id=>['reading:'+id,{id:'reading:'+id,title:id,kind:id,recordingKeys:[id]}]));
 const c={console,Promise,Map,Set,Array,Object,Number,String,Math,Date,Blob,setTimeout,clearTimeout,CustomEvent:class{constructor(type,opt){this.type=type;this.detail=opt?.detail}},SES:{ad:''}};c.window=c;
 c.addEventListener=(key,fn)=>{if(!events.has(key))events.set(key,[]);events.get(key).push(fn)};c.dispatchEvent=e=>{for(const fn of events.get(e.type)||[])fn(e)};
 c.SukunReadingSourcesR1064={get:id=>entries.get(id)};
 c.SukunReadingPolicy={permissions:()=>({personal:true,generic:true}),unavailable:reason=>{warnings.push(reason);return{ok:false,reason}}};
 c.SukunBundledArabicR1065={find:async e=>({blob:new Blob([e.id]),key:e.id,bundled:true})};
 c.playRecording=async(blob,id,opt)=>{calls.push({id,opt});c.SES.ad=id;return{ok:true}};
 c.sesDurdur=(reason,opt)=>stops.push({reason,opt});
 vm.createContext(c);vm.runInContext(read('reading-audio-r1064.js'),c);
 return{c,api:c.SukunReadingAudioR1064,calls,stops,warnings};
}
function packs(){
 const nodes=new Map(),requests=[],handlers=new Map(),channels=[];
 const element=id=>({id,textContent:'',disabled:false,hidden:false,options:id==='r1213AudioSelect'?['yasin','short','ambience'].map(value=>({value})):[],setAttribute(){}});
 nodes.set('r1095ImagePack',{after(field){nodes.set(field.id,field)}});
 const service={controller:{postMessage(message,ports){requests.push({message,port:ports?.[0]?.peer})}},addEventListener(name,fn){handlers.set(name,fn)}};
 class MessageChannel{constructor(){this.port1={closed:false,onmessage:null,onmessageerror:null,close(){this.closed=true}};this.port2={peer:this.port1};channels.push(this)}}
 const document={readyState:'complete',getElementById:id=>nodes.get(id)||null,querySelector:()=>({content:'r1215'}),createElement(){const field=element('');field.setAttribute=()=>{};Object.defineProperty(field,'innerHTML',{set(value){for(const match of value.matchAll(/id="([^"]+)"/g))nodes.set(match[1],element(match[1]))}});return field}};
 const c={console,Promise,Map,Set,Object,Number,String,Math,MessageChannel,setTimeout,clearTimeout,document,navigator:{serviceWorker:service},requestAnimationFrame:fn=>fn(),addEventListener(){},I18N:{lang:'tr'}};c.window=c;
 vm.createContext(c);vm.runInContext(read('offline-audio-r1213.js'),c);
 const reply=(request,value)=>request.port.onmessage?.({data:{protocol:1,build:'r1215',ok:true,...value}});
 return{c,nodes,requests,channels,service,reply,check:()=>nodes.get('r1213AudioCheck').onclick(),download:()=>nodes.get('r1213AudioDownload').onclick(),activate(){service.controller={postMessage(message,ports){requests.push({message,port:ports?.[0]?.peer})}};handlers.get('controllerchange')()},snapshot:()=>c.SukunOfflineAudioR1213.snapshot()};
}
const results=[];async function test(name,fn){try{await fn();results.push({name,passed:true});console.log('PASS',name)}catch(error){results.push({name,passed:false,error:error.stack});console.error('FAIL',name,error)}}
(async()=>{
 await test('Synchronous foreground rejection becomes recoverable error instead of a thrown start',async()=>{const f=reader();f.c.SukunForegroundArbiter={runOrQueue(){throw Error('arbiter unavailable')}};const result=await f.api.play({id:'reading:one'});assert.equal(result.ok,false);assert.equal(f.api.snapshot().phase,'error');assert.equal(f.calls.length,0);delete f.c.SukunForegroundArbiter;assert.equal((await f.api.play({id:'reading:one'})).ok,true)});
 await test('Rejected owner acquisition leaves preparing and can be retried',async()=>{const f=reader();f.c.SukunTabOwner={snapshot:()=>({epoch:1}),owns:()=>true,run:()=>Promise.reject(Error('owner unavailable'))};const result=await f.api.play({id:'reading:one'});assert.equal(result.ok,false);assert.equal(f.api.snapshot().phase,'error');assert.equal(f.calls.length,0);f.c.SukunTabOwner.run=(kind,action)=>action();assert.equal((await f.api.play({id:'reading:one'})).ok,true)});
 await test('Late rejection from superseded owner cannot stop or overwrite the newer reader',async()=>{const f=reader(),old=deferred(),media=deferred();let starts=0,guard;f.c.SukunTabOwner={snapshot:()=>({epoch:1}),owns:()=>true,run:(kind,action)=>++starts===1?old.promise:action()};f.c.playRecording=(blob,id,opt)=>{f.c.SES.ad=id;guard=opt.isCurrent;return media.promise};const first=f.api.play({id:'reading:one'});await flush();const second=f.api.play({id:'reading:two'});await flush();old.reject(Error('old owner failed'));assert.equal((await first).cancelled,true);assert.equal(f.api.snapshot().id,'reading:two');assert.equal(f.api.snapshot().phase,'playing');assert.equal(guard(),true);assert.equal(f.stops.length,0);media.resolve({ok:true});assert.equal((await second).ok,true)});
 await test('Terminal native failure invalidates delayed playback and retires only this reader',async()=>{const f=reader();let guard;f.c.playRecording=(blob,id,opt)=>{f.c.SES.ad=id;guard=opt.isCurrent;return Promise.reject(Error('native rejected'))};const result=await f.api.play({id:'reading:one'});assert.equal(result.ok,false);assert.equal(guard(),false);assert.equal(f.api.snapshot().phase,'error');assert.equal(f.stops.length,1);assert.equal(f.stops[0].opt.retireNativeOwner,'reading-r1064:reading:one')});
 await test('Reader failure leaves a different native media owner untouched',async()=>{const f=reader();f.c.SES.ad='other-reader';f.c.playRecording=()=>Promise.reject(Error('native rejected'));assert.equal((await f.api.play({id:'reading:one'})).ok,false);assert.equal(f.stops.length,0)});
 await test('Controller activation invalidates pending pack status and discards queued old replies',async()=>{const f=packs(),check=f.check(),old=f.requests[0],late=old.port.onmessage;f.activate();await check;assert.equal(f.snapshot().busy,false);assert.equal(f.snapshot().error,'audio-update-required');assert.equal(old.port.closed,true);late({data:{build:'r1215',protocol:1,ok:true,ready:true,saved:1,total:1}});await flush();assert.equal(f.snapshot().report,null);assert.equal(f.snapshot().error,'audio-update-required')});
 await test('A fresh pack check survives progress queued by the retired worker',async()=>{const f=packs(),first=f.check(),old=f.requests[0],late=old.port.onmessage;f.activate();await first;const second=f.check();late({data:{build:'r1215',protocol:1,type:'progress',ready:true,saved:99,total:99}});assert.equal(f.snapshot().report,null);assert.equal(f.snapshot().busy,true);f.reply(f.requests.at(-1),{ready:false,saved:2,total:3,savedBytes:2,totalBytes:3});await second;assert.equal(f.snapshot().report.saved,2);assert.equal(f.snapshot().busy,false);assert.equal(f.snapshot().error,'')});
 await test('Controller replacement cancels obsolete download without removing saved audio',async()=>{const f=packs(),first=f.check();f.reply(f.requests[0],{ready:false,saved:0,total:1});await first;const download=f.download(),request=f.requests.at(-1),late=request.port.onmessage;f.activate();await download;assert.equal(f.requests.at(-1).message.type,'AUDIO_PACK_CANCEL');assert.equal(request.port.closed,true);late({data:{build:'r1215',protocol:1,type:'progress',ready:true,saved:1,total:1}});assert.equal(f.snapshot().report,null);assert.equal(f.snapshot().error,'audio-update-required');assert(!f.requests.some(r=>/DELETE|REMOVE/.test(r.message.type)))});
 const report={suite:'r1215 audio lifecycle races',passed:results.filter(r=>r.passed).length,total:results.length,limitations:['Deterministic Node VM owner/media/worker seams; no physical Android or audible output acceptance.'],tests:results};console.log(JSON.stringify(report,null,2));if(results.some(r=>!r.passed))process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
