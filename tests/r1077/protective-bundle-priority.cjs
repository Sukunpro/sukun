'use strict';
// Actual canonical recording-priority closure with bounded storage leaves.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const environment=require('../r1055/generic-priority-fixture.cjs');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const source=fs.readFileSync(path.join(root,'assets/runtime/bundled-arabic-r1065.js'),'utf8');
const rows=JSON.parse(source.slice(source.indexOf('const rows=')+11,source.indexOf(',cache=new Map()')));
const results=[],deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return{promise,resolve};};
function setup(){const f=environment(root),c=f.c,blob=f.blob('controlled Arabic-bank boundary'),row=rows.find(r=>r.key==='ayatul-kursi');let hook=null;
 c.SukunReadingSourcesR1064={forZikir:(cat,index)=>({id:'zikir:'+cat+':'+index,recordingContent:'unknown'})};
 c.SukunBundledArabicR1065={descriptor:entry=>rows.find(r=>r.ids.includes(entry.id))||null,async find(entry,opt,current){if(hook)return hook(entry,opt,current);return current()?{key:'bundled:r1065:'+row.key,blob,bundled:true,metadata:row}:null;}};
 const find=(opt={})=>f.test.priority.find('koruma',4,{tr:'Ayatul Kursi'},{key:'koruma:4',...opt});
 return{...f,c,bankBlob:blob,row,find,hook:fn=>hook=fn,known:()=>f.test.priority.hasKnown('koruma',4,{tr:'Ayatul Kursi'},{key:'koruma:4'}),signature:()=>f.test.priority.signature('koruma',4,{tr:'Ayatul Kursi'},{key:'koruma:4'})};}
async function test(name,fn){try{await fn();results.push({name,passed:true});}catch(error){results.push({name,passed:false,error:error.stack||String(error)});}}
(async()=>{
 await test('Clean automatic protective source is known and keyed by exact immutable bank digest',async()=>{const f=setup();assert.equal(f.known(),true);assert.match(f.signature(),new RegExp(f.row.sha256));const r=await f.find();assert.equal(r.bundled,true);assert.equal(r.key,'bundled:r1065:ayatul-kursi');assert.equal(r.blob,f.bankBlob);assert.equal(f.reads.length,0);assert.equal(f.played.length,0);});
 for(const mode of ['personal','generic','arabic','turkish'])await test('Explicit '+mode+' selection is never replaced by an automatic bundle',async()=>{const f=setup();await f.c.SukunVoiceSettings.setMode(mode);assert.equal(f.known(),false);assert(!f.signature().includes('bundled:'));assert.equal(await f.find(),null);});
 await test('Personal source-only mode returns preserved personal bytes',async()=>{const f=setup(),personal=f.blob('personal independent bytes');await f.test.db.set('koruma:4',personal);await f.c.SukunVoiceSettings.setMode('personal');const r=await f.find();assert.equal(r.key,'koruma:4');assert.equal(r.blob,personal);assert.equal(!!r.bundled,false);});
 await test('Unavailable optional bundle falls back to the preserved personal source',async()=>{const f=setup(),personal=f.blob('personal independent bytes');await f.test.db.set('koruma:4',personal);f.hook(async()=>null);const r=await f.find();assert.equal(r.key,'koruma:4');assert.equal(r.blob,personal);});
 await test('An unverified custom terkip part cannot inherit an ordinal bundled recording',async()=>{const f=setup();assert.equal(await f.find({terkipPart:true,canonicalPart:false,key:''}),null);});
 await test('Kalem has no manufactured bundled Arabic mapping',async()=>{const f=setup();assert.equal(f.test.priority.hasKnown('koruma',3,{tr:'Kalem 51-52'},{key:'koruma:3'}),false);assert.equal(await f.test.priority.find('koruma',3,{tr:'Kalem 51-52'},{key:'koruma:3'}),null);});
 for(const cause of ['signal','selection'])await test('Retired '+cause+' during pending bank lookup cannot fall through into another source',async()=>{const f=setup(),pending=deferred(),controller=new AbortController();let current=true;f.hook(()=>pending.promise);const result=f.find({signal:controller.signal,isCurrent:()=>current});if(cause==='signal')controller.abort();else current=false;pending.resolve({key:'bundled:r1065:ayatul-kursi',blob:f.bankBlob,bundled:true});await assert.rejects(result,{name:'AbortError'});assert.equal(f.reads.length,0);assert.equal(f.played.length,0);});
 const report={suite:'r1077 canonical protective bank priority, immutable identity and cancellation',passed:results.filter(r=>r.passed).length,total:results.length,results};console.log(JSON.stringify(report,null,2));if(report.passed!==report.total)process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1;});
