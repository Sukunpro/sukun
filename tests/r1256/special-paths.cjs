'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('nero.html','utf8');
function functionSource(name){const start=html.indexOf('function '+name+'('),end=html.indexOf('\n}',start);assert(start>=0&&end>start);return html.slice(start,end+2)}
const own=new Blob(['personal']),included=new Blob(['included']);
async function testTekke(){
 const start=html.indexOf('loadForPlayback:async(k,i,isCurrent)=>{');
 const end=html.indexOf('\n  },\n  selectionChanged:',start);
 assert(start>=0&&end>start,'Tekke adapter exists');
 const code='('+html.slice(start+'loadForPlayback:'.length,end)+'\n})';
 let saved=null,failure=null,calls=0,active=true;
 const c={imgKey:(key,i)=>`tekke:imge:${key}:${i}`,REC_DB:{get:async()=>saved},window:{SukunGenericRecordings:{find:async(keys,opt)=>{calls++;assert.equal(keys[0],'tekke:imge:kabe:0');assert.equal(opt.isCurrent(),active);if(failure)throw failure;return {blob:included}}}}};
 const load=vm.runInNewContext(code,c);
 saved=own;assert.equal(await load('kabe',0,()=>active),own);assert.equal(calls,0,'personal recording wins');
 saved=null;assert.equal(await load('kabe',0,()=>active),included);
 failure=Object.assign(Error('offline'),{code:'archive-network'});assert.equal(await load('kabe',0,()=>active),null,'network failure permits Tekke TTS');
 failure=Object.assign(Error('digest mismatch'),{code:'archive-integrity'});await assert.rejects(load('kabe',0,()=>active),/digest mismatch/,'integrity failure is not concealed');
 failure=null;active=false;assert.equal(await load('kabe',0,()=>active),null,'cancelled session never fetches');assert.equal(calls,3);
}
function testHizbNavigation(){
 let mode='generic',routed=[],scheduled=0;
 const c={window:{SukunVoiceSettings:{getMode:()=>mode}},HZV_KISIM:[{},{}],HZV:{seq:1,playing:true},r1065LegacyReadingRoute:(kind,opt)=>{routed.push({kind,opt});return true},hzvBekleyenleriCoz(){},speechSynthesis:{cancel(){}},hzvDugmeler(){},setTimeout(){scheduled++}};
 vm.createContext(c);vm.runInContext(functionSource('hzvGit'),c);
 for(const selected of ['generic','arabic','turkish']){mode=selected;c.hzvGit(1,true);assert.equal(routed.at(-1).kind,'vikaye');assert.equal(routed.at(-1).opt.section,1)}
 assert.equal(scheduled,0,'explicit source must never enter the auto player');
 mode='generic';c.hzvGit(0,true);assert.equal(scheduled,1,'excluded introduction uses its direct generic key');
 for(const selected of ['auto','personal']){mode=selected;c.hzvGit(0,true)}
 assert.equal(routed.length,3);assert.equal(scheduled,3,'legacy modes retain their existing player');
}
(async()=>{await testTekke();testHizbNavigation();console.log('Tekke network fallback, recording integrity and HzV section source policy: passed')})().catch(e=>{console.error(e);process.exitCode=1});
