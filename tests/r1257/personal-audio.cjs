'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('nero.html','utf8');
function fn(n){const s=html.search(new RegExp('(?:async )?function '+n+'\\(')),e=html.indexOf('\n}',s);assert(s>=0&&e>s,n);return html.slice(s,e+2)}
const noop=()=>{},deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return{promise,resolve}};
function setup(){
 const data=new Map(),revisions=new Map(),played=[],nodes={},messages=[],logs=[];let owns=false,lease=0;
 const c={Blob,Promise,Date,Math,Set,Object,DUAREC:{defs:{},has:{},blobCache:{},readError:{}},TV:{},TVK:{has:{}},DH:{},SVK:{has:{}},SEY:{gen:0},MINI:{paused:false},SES:{ler:new Set()},Z:{auto:false},ZIKIR_BIRLIKTE:false,
 REC_DB:{get:async key=>data.get(key),revision:key=>revisions.get(key)||0},
 $:id=>nodes[id]||(nodes[id]={textContent:'',classList:{add:noop,remove:noop,toggle:noop}}),$$:()=>[],document:{getElementById:()=>null},
 LOG:{push:x=>logs.push(x)},toast:x=>messages.push(x),ac:noop,duaRecSyncUI:noop,tvkBtnTazele:noop,okuyucuAcKapa:()=>false,okuyucularDurdur:noop,
 r1065LegacyReadingSelected:()=>false,r1065LegacyReadingRoute:()=>{throw Error('Unexpected selected-source route')},
 skRecordingCatalogWarning:()=> 'storage error',SPK:{list:[{}]},speechSynthesis:{cancel:noop},tvkSeyirNext:()=>{c.sections=(c.sections||0)+1},
 playRecording:async(blob,label,opt)=>{assert(owns,'Native admission must own the tab');assert(opt.isCurrent());played.push({blob,label,opt});return true},
 SukunTabOwner:{run:async(_id,run,opt)=>{owns=true;lease++;try{if(opt.isCurrent())return await run();return false}finally{owns=false}}},
 SukunVoiceAttempt:{capture:opt=>{const epoch=lease;return()=>owns&&epoch===lease&&opt.isCurrent()}},
 SukunGenericRecordings:{hasKnown:()=>true,find:async keys=>({blob:new Blob(['generic']),key:keys[0],generic:true})}
 };c.window=c;
 for(const id of ['tovbe','seyyid','salavat']){c.DUAREC.defs[id]={key:'dua:'+id};data.set('dua:'+id,new Blob([id]));c.DUAREC.has[id]=true;}
 vm.createContext(c);vm.runInContext(['duaRecReadState','duaRecKnown','duaGenericKnown','duaReadSource','duaRecAvailable','duaRecSourceLabel','duaRecStartRequest','duaRecBegin','duaRecCancel','duaRecFailure','duaRecPlay','duaRecPreview','tovbePlayRec','dhPlayRec','seyPlayRec','seyPlay','dhPlay','tvkSeyirPlay','miniSira'].map(fn).join('\n'),c);
 return{c,data,revisions,played,nodes,messages,logs};
}
const checks=[];async function test(name,run){await run();checks.push(name)}
(async()=>{
 for(const id of ['tovbe','seyyid','salavat'])await test(id+': cold preview owns lease before capture',async()=>{const h=setup();assert.equal(await h.c.duaRecPreview(id),true);assert.equal(h.played[0].blob,h.data.get('dua:'+id));assert.equal(h.played[0].opt.generic,false)});
 await test('Stop during pending lease cannot start late preview',async()=>{const h=setup(),gate=deferred();h.c.SukunTabOwner.run=async(_i,run,opt)=>{await gate.promise;if(opt.isCurrent())return run();return false};const p=h.c.duaRecPreview('seyyid');h.c.duaRecCancel('seyyid');gate.resolve();assert.equal(await p,false);assert.equal(h.played.length,0)});
 await test('Own preview never substitutes a packaged clip for missing own data',async()=>{const h=setup();h.data.clear();assert.equal(await h.c.duaRecPreview('tovbe'),false);assert.equal(h.played.length,0)});
 await test('Storage error preserves known personal recording and does not play generic',async()=>{const h=setup();h.c.REC_DB.get=async()=>{throw Error('read')};assert.equal(await h.c.duaRecPreview('seyyid'),false);assert.equal(h.c.DUAREC.has.seyyid,true);assert(h.c.DUAREC.readError.seyyid);assert.equal(h.played.length,0)});
 await test('Imported/re-recorded bytes supersede old cached bytes',async()=>{const h=setup(),old=new Blob(['old']),fresh=new Blob(['fresh']);h.c.DUAREC.blobCache.seyyid=old;h.c.DUAREC.blobRevision={seyyid:0};h.revisions.set('dua:seyyid',1);h.data.set('dua:seyyid',fresh);assert(await h.c.duaRecPreview('seyyid'));assert.equal(h.played[0].blob,fresh)});
 await test('Seyyid Turkish card uses own clip and keeps toggle mode',async()=>{const h=setup(),end=deferred();h.c.playRecording=async(blob,label,opt)=>{h.played.push({blob,label,opt});return end.promise};const p=h.c.seyPlay('tr');await new Promise(r=>setImmediate(r));assert.equal(h.c.SEY.mode,'tr');assert.equal(h.played.length,1);assert.equal(h.played[0].blob,h.data.get('dua:seyyid'));end.resolve(true);await p});
 await test('Nasuh main button honors full personal recording over ready sections',async()=>{const h=setup();h.c.tvkStartRequest=run=>h.c.duaRecStartRequest('tovbe',run);await h.c.tvkSeyirPlay();assert.equal(h.played[0].opt.recordingKey,'dua:tovbe');assert.equal(h.c.sections,undefined);assert.equal(h.logs.length,1)});
 await test('Whole Nasuh recording hides unrelated previous/next section controls',async()=>{const h=setup();h.c.__tvPlaying=true;h.c.TV.recorded=true;h.c.TOVBE_KISIM=[{},{}];assert.equal(h.c.miniSira(),null)});
 await test('Salavat own sections outrank whole general recording',async()=>{const h=setup();h.c.DUAREC.has.salavat=false;h.data.delete('dua:salavat');h.c.SVK.has[1]=true;let calls=0;h.c.dhKisimlariCal=async()=>{calls++;return true};assert(await h.c.dhPlay());assert.equal(calls,1);assert.equal(h.played.length,0)});
 for(const id of ['tovbe','salavat'])await test(id+': whole clip remains marked active and cannot log after Stop',async()=>{const h=setup(),end=deferred();h.c.playRecording=()=>end.promise;const p=h.c.duaRecStartRequest(id,()=>h.c[id==='tovbe'?'tovbePlayRec':'dhPlayRec']());await new Promise(r=>setImmediate(r));const state=id==='tovbe'?h.c.TV:h.c.DH;assert(state.playing&&state.recorded);h.c.duaRecCancel(id);assert.equal(state.playing,false);assert.equal(state.recorded,false);end.resolve(true);assert.equal(await p,false);assert.equal(h.logs.length,0)});
 // Exercise the runtime source selector itself, retaining explicit-mode permissions.
 const runtime=fs.readFileSync('assets/runtime/reading-audio-r1064.js','utf8'),a=runtime.indexOf(' async function findRecording('),b=runtime.indexOf('\n async function execute(',a);
 await test('Reading engine honors own prayer, explicit generic and bundled priority',async()=>{
  const own=new Blob(['own']),general=new Blob(['general']),bundle={blob:new Blob(['arabic']),bundled:true},entry={id:'reading:seyyid',recordingKeys:['dua:seyyid']};let bundled=null;
  const c={REC_DB:{get:async()=>own},w:{SukunReadingPolicy:{permissions:(_e,o)=>({generic:o.source!=='personal',personal:o.source!=='generic'})},SukunGenericRecordings:{find:async()=>({blob:general,generic:true})},SukunBundledArabicR1065:{find:async()=>bundled}}};vm.createContext(c);vm.runInContext(runtime.slice(a,b),c);
  assert.equal((await c.findRecording(entry,{source:'auto',content:'legacy'},()=>true)).blob,own);
  assert.equal((await c.findRecording(entry,{source:'generic',content:'legacy'},()=>true)).blob,general);
  assert.equal((await c.findRecording(entry,{source:'personal',content:'legacy'},()=>true)).blob,own);
  bundled=bundle;assert.equal((await c.findRecording(entry,{source:'auto',content:'legacy'},()=>true)).blob,bundle.blob);
  assert.equal(await c.findRecording(entry,{source:'auto',content:'legacy'},()=>false),null);
 });
 console.log(JSON.stringify({passed:checks.length,checks},null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
