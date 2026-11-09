'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'../..'),source=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert.equal(source,fs.readFileSync(path.join(root,'nero.html'),'utf8'),'both entry shells match');
const canonical={version:2,sets:[{id:'canonical',name:'Current IDB set'}]},stale=JSON.stringify({version:2,sets:[{id:'legacy',name:'Old copy'}]});
let fail=false,calls=0,checks=0;
const data=new Map([['sukun.frequencySets.v2',stale],['sukun.preference','keep'],['sukun.aikey','excluded']]);
const context={Blob,console,Date,JSON,Set,document:{querySelector:()=>({content:'r1241'})},
 localStorage:{get length(){return data.size},key:i=>[...data.keys()][i],getItem:k=>data.get(k)},
 window:{SukunFrequencySetsR1120:{exportPayload:async()=>{calls++;if(fail)throw Error('blocked');return canonical;}},SukunSecretPolicy:{unlocked:()=>true}},
 skSavedSessionBackupR1090:async()=>({rows:[],favs:[]}),skBackupAccessFenceR1090:()=>({assert(){},close(){}}),
 skYedekKey:k=>!k.includes('aikey'),skBackupError:(tr,en)=>new Error(en),skBackupFullValidate(){},skBackupLimits:()=>({fullFile:300*1048576}),idbDumpAll:async()=>({})};
vm.createContext(context);
const start=source.indexOf('async function skFrequencySetBackupR1241()'),end=source.indexOf('async function skImportData(',start);assert(start>=0&&end>start);
vm.runInContext(source.slice(start,end),context);
const full=source.match(/async function backupPayload\(\)\{[^\n]+/)[0];vm.runInContext(full,context);
(async()=>{
 for(const expression of ['skExportData({audio:false})','backupPayload()']){
  const result=await vm.runInContext(expression,context),out=typeof result==='string'?JSON.parse(result):result;
  assert.deepEqual(JSON.parse(out.ls['sukun.frequencySets.v2']),canonical,'exports use canonical payload');checks++;
  assert(!Object.hasOwn(out.ls,'sukun.aikey'),'secrets remain excluded');checks++;
  assert.equal(data.get('sukun.frequencySets.v2'),stale,'backup does not mutate legacy copy');checks++;
 }
 assert.equal(calls,2,'both exports call canonical API');checks++;
 fail=true;
 for(const expression of ['skExportData({audio:false})','backupPayload()']){await assert.rejects(()=>vm.runInContext(expression,context),/no incomplete backup/);checks++;}
 delete context.window.SukunFrequencySetsR1120;
 await assert.rejects(()=>vm.runInContext('skExportData({audio:false})',context),/no incomplete backup/);checks++;
 console.log(JSON.stringify({passed:checks,scope:'Actual shell export functions, canonical API stub; real IndexedDB covered separately.'},null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
