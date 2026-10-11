'use strict';
// Actual registry invoke and AudioLife user-intent methods against the real
// recording caller. Registry membership/media are controlled synthetic fixtures.
const assert=require('node:assert/strict');
const {harness,between}=require('../r1048/audio-volume-preview.cjs');
const noop=()=>{};
function fixture(){
 const h=harness(),c=h.c;let paused=false;
 Object.assign(c,{providers:new Map([['seyyid',{pause:()=>{paused=true;c.sesDuraklat();return true},resume:()=>{paused=false;c.sesSurdur();return true},getState:()=>paused?'paused':'playing'}]]),sessions:new Map([['seyyid',{id:'seyyid',state:'playing',commandEpoch:0}]]),resolveId:x=>x,reconcileOne(rid){const s=c.sessions.get(rid);if(s)s.state=c.providers.get(rid).getState();return s},activate:noop,schedule:noop,STATES:{IDLE:'idle',PLAYING:'playing',PAUSED:'paused',STOPPING:'stopping',ENDED:'ended'},ACTIVE_STATES:new Set(['playing','paused']),transition(s,state){s.state=state}});
 Object.assign(c.AudioLife,{userPaused:false,_terminalIntent:false,_recoverSeq:0,_recoverReasons:new Set(),_log:noop,set:noop});
 h.run('Object.assign(AudioLife,{'+between('  setUserPaused(','  busy(){')+'});');
 h.run(between('function invoke(action,id){','function toggle(id){'));
 return h;
}
const results=[];async function test(name,fn){try{await fn();results.push({name,passed:true})}catch(e){results.push({name,passed:false,error:e.message})}}
(async()=>{
 for(const native of [false,true])await test(`${native?'native journey':'raw'} reader registry Resume preserves the same accepted recording`,async()=>{
  const h=fixture(),{a,p}=await h.start({native});await h.advance(40);a.currentTime=.8;const src=a.src;
  h.c.invoke('pause','seyyid');assert.equal(a.paused,true);h.c.invoke('resume','seyyid');a.dispatch('playing');await h.flush();
  assert(h.c.SES.ler.has(a),'Resume retired its own audio through AudioLife intent fence');assert.equal(a.src,src);assert.equal(a.currentTime,.8);assert.equal(a.plays,2);
  a.dispatch('ended');assert.equal((await p).ok,true);
 });
 const report={method:'Actual production registry invoke, AudioLife intent methods and recording handlers; controlled membership/media. No physical device validation.',passed:results.filter(r=>r.passed).length,total:results.length,results};console.log(JSON.stringify(report,null,2));if(report.passed!==report.total)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
