'use strict';
// Reuse the production site-export regression harness without rerunning its
// existing cases. Personal capture is deliberately synthetic here; actual
// canonical JSON/Recovery and ZIP integration run in the native browser suite.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const harness=fs.readFileSync(path.join(__dirname,'../r1027/site-backup-regression.cjs'),'utf8').split('(async()=>{')[0];
const run=`
(async()=>{
 const checks=[];
 for(const transition of ['revoke','revoke-and-reopen','unlock']){
  const f=fixture(),listeners=new Set();let unlocked=transition!=='unlock',release,entered;const waiting=new Promise(r=>entered=r),held=new Promise(r=>release=r);
  const h=harness(f,{fetch:async({path})=>{if(path==='assets/art.bin'){entered();await held;}return undefined;}});
  h.w.SukunSecretPolicy={unlocked:()=>unlocked};h.w.addEventListener=(name,fn)=>{if(name==='sukun:secretaccesschange')listeners.add(fn)};h.w.removeEventListener=(name,fn)=>listeners.delete(fn);
  const pending=h.api.exportSite({download:false});await waiting;unlocked=!unlocked;for(const fn of listeners)fn();if(transition==='revoke-and-reopen'){unlocked=true;for(const fn of listeners)fn();}release();const result=await pending;
  assert.equal(result.ok,false);assert.equal(result.error,'SITE_PRIVATE_ACCESS_CHANGED');assert.equal(h.writes.length,0);assert.equal(h.urls.length,0);assert.equal(listeners.size,0);assert.equal(h.api.snapshot().busy,false);checks.push({name:'Access '+transition+' after personal capture rejects ZIP before return or download',passed:true});
 }
 const h=harness(fixture());let unlocked=true;h.w.SukunSecretPolicy={unlocked:()=>unlocked};const good=await h.api.exportSite({download:false});assert.equal(good.ok,true);const entries=await unzip(good.blob);assert(entries.get('recovery/SUKUN_KISISEL_YEDEK_'+h.w.SUKUN_BUILD+'.json').toString().includes('syntheticRecording'));checks.push({name:'Unchanged access retains verified ZIP production export behavior',passed:true});
 console.log(JSON.stringify({suite:'r1090 complete site ZIP privacy interval',passed:checks.length,total:checks.length,checks,limitations:['Actual exporter and byte/hash ZIP path in controlled same-origin DOM/fetch/lease harness; personal JSON deliberately synthetic. Native canonical export/ZIP integration is separate.']},null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
`;
new Function('require','process','__dirname',harness+run)(require,process,path.join(__dirname,'../r1027'));
