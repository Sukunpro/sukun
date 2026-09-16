'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {fixture}=require('./test_ui.cjs');
const root=path.resolve(__dirname,'../..'),html=fs.readFileSync(path.join(root,'nero.html'),'utf8');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/berhetiyye-premium/backgrounds-r837.json'),'utf8'));
const active=manifest.scenes.filter(s=>s.status==='integrated'),results=[];
async function test(name,fn){try{await fn();results.push({name,status:'PASS'});}catch(e){results.push({name,status:'FAIL',error:e.stack});}}
const settle=async()=>{await Promise.resolve();await Promise.resolve();};
(async()=>{
 await test('Three approved names resolve to their exact packaged full-resolution backgrounds',async()=>{
  const f=fixture();f.unlock(true);f.Z.cat='berhet';f.load('sukun-r831-hard-fix-runtime');const api=f.c.SukunR832VisualAuthority;
  assert.equal(api.nameScenes.length,3);
  const data=html.slice(html.indexOf("berhet:{label:"),html.indexOf("berhet:{label:")+7500);
  const names=[...data.matchAll(/\{tr:'([^']+)'/g)].slice(0,28).map(m=>m[1]);
  for(const sc of active){
   assert(names[sc.index].includes(sc.name),sc.name+' correct source index');
   f.Z.idx=sc.index;api.sync();await f.image(path.basename(sc.file));assert.equal(api.snapshot().scene,sc.id);assert(f.document.documentElement.style.getPropertyValue('--r835-scene').includes(sc.file));assert.equal(f.Z.count,19);
  }
 });
 await test('All other 25 names retain their previous automatic scene assignments',async()=>{
  const f=fixture();f.unlock(true);f.Z.cat='berhet';f.load('sukun-r831-hard-fix-runtime');const api=f.c.SukunR832VisualAuthority;
  const legacy=['palace','secrets','staff','water','wind','crystal','seal','night','interface'];
  for(let i=0;i<28;i++){
   if(active.some(s=>s.index===i))continue;
   f.Z.idx=i;api.sync();const expected=api.scenes.find(s=>s.id===legacy[i%9]);await f.image(expected.file);await settle();assert.equal(api.snapshot().scene,expected.id,'name '+i);
  }
  assert(!api.scenes.some(s=>s.id==='galmesin'));assert.equal(manifest.scenes.find(s=>s.id==='galmesin').status,'pending-generation');
 });
 await test('Explicit background choice survives name changes; Auto returns to the matching name',async()=>{
  const f=fixture();f.unlock(true);f.Z.cat='berhet';f.load('sukun-r831-hard-fix-runtime');const api=f.c.SukunR832VisualAuthority;
  api.setScene('kalnehudin');await f.image('scene-11-');f.Z.idx=9;api.sync();await settle();assert.equal(api.snapshot().scene,'kalnehudin');
  api.setScene('auto');await f.image('scene-10-');assert.equal(api.snapshot().scene,'hutirin');assert.equal(f.Z.count,19);
 });
 await test('Locked Berhetiyye and unlocked ordinary Esma never request new premium backgrounds',()=>{
  const f=fixture();f.Z.cat='berhet';f.Z.idx=9;f.load('sukun-r831-hard-fix-runtime');const api=f.c.SukunR832VisualAuthority;
  assert.equal(f.pending.length,0);assert.equal(api.setScene('hutirin'),false);assert.equal(api.snapshot().bgmode,'generic');
  f.unlock(true);f.Z.cat='esma';api.sync();assert.equal(f.pending.length,0);assert.equal(api.setScene('berhetihin'),false);assert(f.document.documentElement.style.getPropertyValue('--r835-scene').includes('sukun-sanctuary-r717'));
 });
 await test('Favorite and active smart session use the same approved source-name mapping',async()=>{
  const f=fixture();f.unlock(true);f.Z.cat='fav';f.load('sukun-r831-hard-fix-runtime');const api=f.c.SukunR832VisualAuthority;
  await f.image('scene-10-');assert.equal(api.snapshot().scene,'hutirin');
  f.source({source:'smart',session:{active:true},cat:'berhet',idx:10});api.sync();await f.image('scene-11-');assert.equal(api.snapshot().scene,'kalnehudin');
  f.source({source:'smart',session:{active:true},cat:'esma',idx:0});api.sync();assert.equal(api.snapshot().bgmode,'generic');assert.equal(f.Z.count,19);
 });
 await test('Late background response cannot overwrite a newer name or a generic context',async()=>{
  const f=fixture();f.unlock(true);f.Z.cat='berhet';f.load('sukun-r831-hard-fix-runtime');const api=f.c.SukunR832VisualAuthority;
  f.Z.idx=9;api.sync();await f.image('scene-10-');assert.equal(api.snapshot().scene,'hutirin');await f.image('scene-09-');assert.equal(api.snapshot().scene,'hutirin');
  f.Z.idx=10;api.sync();f.Z.cat='esma';api.sync();await f.image('scene-11-');assert.equal(api.snapshot().bgmode,'generic');assert.equal(api.snapshot().scene,'');
 });
 await test('Tefekkür and repeated counter notifications retain one background request and wheel flags',async()=>{
  const f=fixture();f.unlock(true);f.Z.cat='berhet';f.Z.idx=9;f.document.documentElement.dataset.r819Counter='berhet';f.load('sukun-r831-hard-fix-runtime');await f.image('scene-10-');const n=f.pending.length;
  f.document.body.classList.add('sukun-tefekkur-mode');f.event('sukun:tefekkurchange');f.frame();
  for(let i=0;i<50;i++){f.notify();f.frame();}assert.equal(f.pending.length,n);assert.equal(f.document.documentElement.dataset.r819Counter,'berhet');assert.equal(f.c.SukunR832VisualAuthority.snapshot().scene,'hutirin');assert.equal(f.Z.count,19);
 });
 await test('New background decode failure uses the existing fallback and supports retry',async()=>{
  const f=fixture();f.unlock(true);f.Z.cat='berhet';f.Z.idx=9;f.load('sukun-r831-hard-fix-runtime');const api=f.c.SukunR832VisualAuthority;
  await f.image('scene-10-',false);assert.equal(api.snapshot().scene,'palace');assert.equal(api.snapshot().error,'hutirin');api.sync();assert.equal(f.pending.filter(s=>s.url.includes('scene-10-')).length,1);api.setScene('auto');const again=f.pending.filter(s=>s.url.includes('scene-10-'));assert.equal(again.length,2);again[1].onload();await settle();assert.equal(api.snapshot().scene,'hutirin');
 });
 const out={kind:'background-context-and-loading',browserRun:false,physicalDeviceRun:false,total:results.length,passed:results.filter(r=>r.status==='PASS').length,results};out.failed=out.total-out.passed;
 fs.writeFileSync(path.join(__dirname,'backgrounds-results.json'),JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify({total:out.total,passed:out.passed,failed:out.failed,failures:results.filter(r=>r.status!=='PASS')},null,2));if(out.failed)process.exitCode=1;
})();
