'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('nero.html','utf8'),start=html.indexOf('async function hzvAdim('),end=html.indexOf('\n}',start);
assert(start>=0&&end>start);const source=html.slice(start,end+2);
const personal=new Blob(['personal']), included=new Blob(['included']);
async function run({own=null,mode='auto',storageError=false,findError=false,cancelDuringFind=false,disableDuringPlayback=false,missingGeneric=false}={}){
 let calls=0,played=null,error='',findOptions=null;
 const generic={enabled:true,seq:7,snapshot(){return {enabled:this.enabled}},epoch(){return this.seq},async find(keys,opt){calls++;findOptions=opt;if(findError)throw Error('offline');if(cancelDuringFind)c.HZV.seq++;if(missingGeneric)return null;return {blob:included,key:'archive:123',generic:true,genericEpoch:this.seq}}};
 const c={HZV:{zincir:true,seq:1,paused:false,i:-1,tek:true},HZV_KISIM:[{ad:'Bölüm',p:[]}],hzvSira:()=>[0],hzvKisimYaz(){},hzvKey:i=>'dua:hizb:'+i,RECKEYS:new Set(),REC_DB:{async get(){if(storageError)throw Error('database');return own}},window:{SukunVoiceSettings:{getMode:()=>mode},SukunGenericRecordings:generic},document:{getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[]},hzvKayitHatasi:m=>{error=m;c.HZV.zincir=false},hzvDurdur:()=>{c.HZV.zincir=false},async playRecording(blob,key,opt){played={blob,key,opt};if(disableDuringPlayback){generic.enabled=false;generic.seq++;assert.equal(opt.isCurrent(),false);return {ok:false}}assert.equal(opt.isCurrent(),true);return {ok:true}},setTimeout};
 vm.createContext(c);vm.runInContext(source,c);await c.hzvAdim(1);return {calls,played,error,findOptions};
}
(async()=>{
 let r=await run({own:personal});assert.equal(r.calls,0);assert.equal(r.played.blob,personal);assert.equal(r.played.opt.generic,false);
 r=await run();assert.equal(r.calls,1);assert.equal(r.played.blob,included);assert.equal(r.played.opt.recordingKey,'archive:123');assert.equal(r.played.opt.generic,true);
 r=await run({mode:'generic',own:personal});assert.equal(r.calls,1);assert.equal(r.played.blob,included,'generic-only must not select personal');
 r=await run({mode:'generic',own:personal,missingGeneric:true});assert.equal(r.played,null);assert.match(r.error,/hazır ses/);
 r=await run({mode:'personal'});assert.equal(r.calls,0);assert.match(r.error,/kendi ses/);
 r=await run({storageError:true});assert.equal(r.calls,0);assert.match(r.error,/deposu/);
 r=await run({findError:true});assert.equal(r.calls,1);assert.equal(r.played,null);assert.match(r.error,/Hazır ses/);
 r=await run({cancelDuringFind:true});assert.equal(r.calls,1);assert.equal(r.played,null);
 r=await run({disableDuringPlayback:true});assert.match(r.error,/kaynak değişti/);
 console.log('Hizb personal priority, generic fallback, storage and network errors, cancellation and preference change: passed');
})().catch(e=>{console.error(e);process.exitCode=1});
