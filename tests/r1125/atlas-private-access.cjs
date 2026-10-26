'use strict';
// Exact application bytes in a disposable profile. Only a persisted lock bit
// is changed to model a stale previously unlocked Berhetiyye selection.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {fixture,hash}=require('../r1064/browser-fixture.cjs');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const output=path.resolve(process.argv[3]||path.join(__dirname,'evidence/atlas-private-access.json'));
const build=fs.readFileSync(path.join(root,'version.txt'),'utf8').trim();
const report={suite:'r1125 private atlas stale-state access',build,sourceSha256:hash(fs.readFileSync(path.join(root,'nero.html'))),testSha256:hash(fs.readFileSync(__filename)),startedAt:new Date().toISOString(),expectedChecks:7,checks:[],limitations:[
 'Isolated headless Linux Chromium at 393 CSS pixels, Classic/Feyz. This tests the application private-content lock, not a physical Android or operating-system screen lock.',
 'A real unlocked Berhetiyye selection is saved through the tab-owner persistence API. Only its localStorage lock bit is then set false before reload to simulate stale saved state; renderer, policy, session memory and production CSS are not replaced.',
 'Mutation and animation-frame boundaries are sampled; this does not prove the absence of every possible compositor paint. The shared fixture controls device speech and blocks service workers.'
]};
let f;
function save(){report.total=report.checks.length;report.passed=report.checks.filter(x=>x.passed).length;report.allPassed=report.total===report.expectedChecks&&report.passed===report.total&&!report.fatal;fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');}
async function check(name,fn){try{report.checks.push({name,passed:true,evidence:await fn()});}catch(error){report.checks.push({name,passed:false,error:error.stack||String(error)});}save();console.log(JSON.stringify({name,passed:report.checks.at(-1).passed}));}
(async()=>{try{
 f=await fixture(root,{width:393,height:850,seed:{'sukun.obSeenBuild':JSON.stringify(build),'sukun.obDone':'1','sukun.theme':'"feyz"','sukun.esma.background.r923':'classic'}});
 const p=f.page;
 const openZikir=async()=>{if(await p.locator('#dailyCard').isVisible())await p.keyboard.press('Escape');await p.waitForFunction(()=>!window.SukunInteractionGateR732?.active?.(),null,{timeout:10000});await p.locator('.tab[data-t="zkr"]').click();};
 const state=()=>p.evaluate(()=>{const a=document.getElementById('berhetAtlas'),r=a?.getBoundingClientRect(),s=SukunSessionState.snapshot();return{locked:!SukunSecretPolicy.unlocked(),selected:zKat(),mode:s.activeMode,index:s.activeIndex,count:s.count,phase:s.phase,theme:document.documentElement.dataset.r1074Theme,atlas:{hidden:a?.hidden,display:a?getComputedStyle(a).display:null,width:r?.width||0,height:r?.height||0,cells:a?.querySelectorAll('.r168Cell').length||0},visibleSource:[...document.querySelectorAll('#berhetAtlas .r168Cell')].some(n=>n.getClientRects().length>0)};});
 await openZikir();
 assert.equal(await p.evaluate(()=>KLT_AC('r1125-private-access-fixture')),true);
 const selected=await p.evaluate(()=>SukunSessionState.command('select',{mode:'berhet',index:8,journeyKind:'single'}));assert.equal(selected.accepted,true);
 await p.waitForFunction(()=>document.documentElement.dataset.r1074Theme==='berhet'&&document.querySelector('#berhetAtlasBody .r168Cell'));
 const saved=await p.evaluate(()=>SukunTabOwner.run('adjust',()=>SukunSessionMemory.save(),{keepSelection:true,releaseAfter:true}));
 await check('Real unlocked Berhetiyye selection is saved through its persistence owner',async()=>{assert(saved);assert.equal(saved.z.cat,'berhet');assert.equal(saved.z.idx,8);assert.equal(saved.z.auto,false);return{category:saved.z.cat,index:saved.z.idx,count:saved.z.count,auto:saved.z.auto};});
 assert(saved&&saved.z.cat==='berhet','Cannot probe stale state without a real saved Berhetiyye session');
 await p.context().addInitScript(()=>{
  const probe=window.__r1125PrivateAccessProbe={samples:[],sampleCount:0,exposureCount:0,frames:0,stop:false};let last='',atlasObserver=null;
  function sample(source){if(probe.stop)return;const a=document.getElementById('berhetAtlas');if(!a)return;const r=a.getBoundingClientRect(),row={source,at:performance.now(),locked:localStorage.getItem('sukun.kilitAcik')==='false',hidden:a.hidden,display:getComputedStyle(a).display,width:r.width,height:r.height};probe.sampleCount++;if(row.locked&&!row.hidden&&row.display!=='none'&&row.width>0&&row.height>0)probe.exposureCount++;const signature=JSON.stringify({...row,source:'',at:0});if(signature!==last&&probe.samples.length<1024){probe.samples.push(row);last=signature;}}
  function attach(){const a=document.getElementById('berhetAtlas');if(!a)return;finder.disconnect();atlasObserver=new MutationObserver(()=>sample('atlas-mutation'));atlasObserver.observe(a,{attributes:true,attributeFilter:['hidden','class','style'],childList:true,subtree:true});sample('atlas-mounted');}
  const finder=new MutationObserver(attach);finder.observe(document,{childList:true,subtree:true});attach();
  function frame(){if(probe.stop){atlasObserver?.disconnect();finder.disconnect();return;}probe.frames++;sample('frame');if(probe.frames<600)requestAnimationFrame(frame);}requestAnimationFrame(frame);
 });
 await p.evaluate(()=>localStorage.setItem('sukun.kilitAcik','false'));
 await p.reload({waitUntil:'load',timeout:60000});await p.waitForTimeout(3500);await openZikir();await p.waitForTimeout(800);
 const stale=await state();
 const observation=await p.evaluate(()=>{__r1125PrivateAccessProbe.stop=true;return __r1125PrivateAccessProbe;});report.staleState=stale;report.observation=observation;
 await check('Reload actually restores a stale Berhetiyye selection while access remains locked',async()=>{assert.equal(stale.locked,true);assert.equal(stale.selected,'berhet');assert.equal(stale.index,8);assert.notEqual(stale.theme,'berhet');return stale;});
 await check('Locked stale selection keeps the private atlas and every source card invisible',async()=>{assert.equal(stale.atlas.hidden,true);assert.equal(stale.atlas.display,'none');assert.equal(stale.visibleSource,false);return stale.atlas;});
 await check('No sampled mutation or animation frame exposes the atlas while locked',async()=>{assert(observation.sampleCount>=2);assert(observation.frames>=2);assert.equal(observation.exposureCount,0);return{samples:observation.sampleCount,frames:observation.frames,exposures:observation.exposureCount,transitions:observation.samples};});
 await check('Unlock event rerenders the stale selected atlas without changing session progress',async()=>{const before=await state();assert.equal(await p.evaluate(()=>KLT_AC('r1125-private-access-fixture')),true);await p.waitForFunction(()=>!document.getElementById('berhetAtlas').hidden&&document.querySelector('#berhetAtlasBody .r168Cell'));const after=await state();assert.equal(after.locked,false);assert.equal(after.selected,'berhet');assert.equal(after.count,before.count);assert.equal(after.index,before.index);assert.equal(after.atlas.hidden,false);assert(after.atlas.cells>=2,'Unlocked selected atlas must be populated; ancestor disclosures may remain closed');return{before,after};});
 await check('Normal relock hides the populated atlas and returns to the permitted family',async()=>{await p.evaluate(()=>KLT_KILITLE());await p.waitForFunction(()=>!SukunSecretPolicy.unlocked()&&document.getElementById('berhetAtlas').hidden);const after=await state();assert.equal(after.locked,true);assert.equal(after.selected,'esma');assert.equal(after.visibleSource,false);return after;});
 await check('Served production bytes remain exact with no local resource or JavaScript failures',async()=>{const e=f.evidence();for(const[name,row]of Object.entries(e.served))assert.equal(row.sha256,hash(fs.readFileSync(path.join(root,name))),'File changed during suite: '+name);assert.deepEqual(e.pageErrors,[]);assert.deepEqual(e.failedRequests,[]);assert(!e.consoleErrors.some(x=>/integrity|digest|syntaxerror|referenceerror|typeerror/i.test(x)),e.consoleErrors.join('\n'));report.evidence=e;return{served:Object.keys(e.served).length,pageErrors:e.pageErrors.length,failedRequests:e.failedRequests.length};});
 }catch(error){report.fatal=error.stack||String(error);}finally{report.finishedAt=new Date().toISOString();if(f){report.evidence=f.evidence();await f.close();}save();console.log(JSON.stringify({build,passed:report.passed,total:report.total,expectedChecks:report.expectedChecks,allPassed:report.allPassed,fatal:report.fatal,output},null,2));if(!report.allPassed)process.exitCode=1;}
})();
