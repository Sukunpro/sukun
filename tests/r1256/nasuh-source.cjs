'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('nero.html','utf8');
function fn(name){const start=html.search(new RegExp('(?:async )?function '+name+'\\(')),end=html.indexOf('\n}',start);assert(start>=0&&end>start,name);return html.slice(start,end+2)}
const own=new Blob(['own'],{type:'audio/webm'}),prepared=new Blob(['prepared'],{type:'audio/webm'});
let result={ok:true,blob:own},calls=0,current=true,genericError=false;
const c={TVK:{},tvkKey:i=>'dua:tovbe:'+i,duaRecReadState:async()=>result,window:{SukunGenericRecordings:{hasKnown:()=>true,find:async()=>{calls++;if(genericError)throw Error('offline');return {blob:prepared,key:'archive:test',generic:true}}}}};vm.createContext(c);
vm.runInContext(fn('tvkGenericKnown')+'\n'+fn('duaReadSource')+'\n'+fn('tvkReadSource'),c);
(async()=>{
 assert(c.tvkGenericKnown(0));let got=await c.tvkReadSource(0,()=>current);assert.equal(got.blob,own);assert.equal(calls,0,'personal recording wins');
 result={ok:true,blob:null};got=await c.tvkReadSource(0,()=>current);assert.equal(got.blob,prepared);assert(got.generic);assert.equal(calls,1);
 result={ok:false};got=await c.tvkReadSource(0,()=>current);assert(got.error);assert.equal(calls,1,'unreadable personal storage is not missing');
 result={ok:true,blob:null};genericError=true;got=await c.tvkReadSource(0,()=>current);assert(got.error&&got.genericError);
 current=false;got=await c.tvkReadSource(0,()=>current);assert(got.cancelled);assert.equal(calls,2,'cancelled request does not fetch');
 console.log('Nasuh personal priority, fallback, storage error and cancellation: passed');
})().catch(e=>{console.error(e);process.exitCode=1});
