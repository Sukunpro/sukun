'use strict';
// Native app, real UI and selection/persistence. Speech fixture supplies completion only.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {fixture,hash}=require('../r1064/browser-fixture.cjs');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..')),out=path.resolve(process.argv[3]||'/tmp/sukun-direct-count');fs.mkdirSync(out,{recursive:true});
const sources=Object.fromEntries(['index.html','nero.html','assets/runtime/session-r919.js','assets/runtime/wheels-r924.js','assets/runtime/berhet-layout-r938.js','assets/runtime/tab-owner-r981.js','assets/runtime/count-entry-r1227.css'].map(file=>[file,hash(fs.readFileSync(path.join(root,file)))]));
const report={build:fs.readFileSync(path.join(root,'version.txt'),'utf8').trim(),sources,expectedChecks:8,checks:[]};
(async()=>{let f;const results=report.checks;try{
 for(const width of [320,1200])for(const mode of ['esma','berhet'])for(const kind of ['single',mode==='esma'?'99':'28']){
 f=await fixture(root,{width,height:900,voices:'tr',seed:{'sukun.onboardSeen':'1','sukun.obSeenBuild':JSON.stringify(fs.readFileSync(path.join(root,'version.txt'),'utf8').trim())}});const p=f.page;
 if(await p.locator('#dailyCard').isVisible())await p.locator('#dcClose').click();
 await p.locator('.tab[data-t="zkr"]').first().click();
 await p.evaluate(()=>KLT_AC('direct-count-disposable-test'));
 // Native selection and target-control handlers; never assign counter/engine state.
 const index=0;
 assert((await p.evaluate(({mode,index,kind})=>SukunSessionState.command('select',{mode,index,journeyKind:kind}),{mode,index,kind})).accepted);
 await p.evaluate(()=>{document.getElementById('freeTargetInput').value='100';document.getElementById('freeApplyBtn').click()});
 await p.waitForFunction(()=>window.SukunCountCorrection.statusRemaining(undefined,true).allowed&&SukunSessionState.snapshot().target===100);
 await p.evaluate(()=>SukunBerhetLayout.setFocusControls(true));
 await p.waitForFunction(()=>document.getElementById('r920Remaining')?.getAttribute('aria-disabled')==='false');
 // Observe, never replace, native audio entry points. No editor action may call them.
 await p.evaluate(()=>{window.__countSounds=[];for(const [object,key,label]of [[HTMLMediaElement.prototype,'play','media'],[speechSynthesis,'speak','speech']]){const old=object[key];object[key]=function(...args){window.__countSounds.push(label);return old.apply(this,args)}}});
 // Let the native idle lease drain, then prove Save reacquires it silently.
 await p.evaluate(()=>SukunTabOwner.retire('remaining-test-idle'));await p.waitForFunction(()=>!SukunTabOwner.snapshot().owned&&!SukunTabOwner.snapshot().releasing);
 const before=await p.evaluate(()=>SukunSessionState.snapshot());
 assert.equal(await p.locator('#r1227CountEdit').count(),0,'no separate edit icon');
 const remainingGeometry=await p.locator('#r920Remaining').evaluate(n=>({rect:n.getBoundingClientRect().toJSON(),pencil:getComputedStyle(n,'::after').content}));assert(remainingGeometry.rect.width>=44&&remainingGeometry.rect.height>=44,'remaining touch target');assert.match(remainingGeometry.pencil,/✎/,'subtle themed pencil marks existing value');
 await p.locator('#r920Remaining').click();await p.locator('#r1227CountValue').fill('41');await p.keyboard.press('Enter');
 await p.waitForFunction(()=>SukunSessionState.snapshot().count===59&&document.getElementById('r1227CountForm').hidden);
 assert.equal(await p.locator('#r920Remaining').evaluate(n=>n===document.activeElement),true);
 assert.equal(await p.locator('#r920Remaining').textContent(),'41');assert.equal(await p.locator('#r920Target').textContent(),'100');
 await p.locator('#r1227CountUndo').click();await p.waitForFunction(count=>SukunSessionState.snapshot().count===count,before.count);
 assert.equal(await p.evaluate(()=>SukunSessionState.snapshot().target),100,'undo preserves target');
 await p.locator('#r920Remaining').focus();await p.keyboard.press('Enter');await p.locator('#r1227CountValue').fill('41');await p.keyboard.press('Enter');await p.waitForFunction(()=>SukunSessionState.snapshot().count===59&&document.getElementById('r1227CountForm').hidden);
 // Undo expires gently, but never disappears under keyboard focus.
 if(width===320&&mode==='esma'&&kind==='single'){
  await p.locator('#r1227CountUndo').focus();await p.waitForTimeout(12500);assert(await p.locator('#r1227CountUndo').isVisible(),'focused undo survives expiry');
  await p.locator('#r920Remaining').focus();await p.waitForTimeout(1200);assert.equal(await p.locator('#r1227CountUndo').isVisible(),false,'undo retires after focus leaves');
 }
 const changed=await p.evaluate(()=>SukunSessionState.command('set-remaining',{value:'40'}));assert(changed.accepted);await p.waitForFunction(()=>document.getElementById('r1227CountUndo').hidden);assert.equal(await p.evaluate(()=>SukunSessionState.snapshot().count),60,'progress invalidates undo');
 assert((await p.evaluate(()=>SukunSessionState.command('set-remaining',{value:'41'}))).accepted);
 for(const invalid of ['', '-1','1.5','1e2','0',String(before.target+1)]){
  await p.locator('#r920Remaining').click();await p.locator('#r1227CountValue').fill(invalid);await p.keyboard.press('Enter');
  assert.equal(await p.locator('#r1227CountValue').getAttribute('aria-invalid'),'true');assert.equal(await p.evaluate(()=>SukunSessionState.snapshot().count),59);await p.keyboard.press('Escape');
 }
 await p.locator('#r920Remaining').click();await p.locator('#r1227CountValue').fill('1');await p.locator('#r1227CountCancel').click();assert.equal(await p.evaluate(()=>SukunSessionState.snapshot().count),59);
 await p.locator('#r920Remaining').click();await p.locator('#r1227CountValue').fill('1');await p.evaluate(()=>SukunBerhetLayout.setFocusControls(false));assert.equal(await p.locator('#r1227CountEntry').isVisible(),false);assert.equal(await p.locator('#r920Remaining').isVisible(),true,'remaining stays readable');assert.equal(await p.locator('#r920Remaining').getAttribute('aria-disabled'),'true');await p.evaluate(()=>SukunBerhetLayout.setFocusControls(true));assert.equal(await p.locator('#r1227CountForm').isVisible(),false);
 assert.deepEqual(await p.evaluate(()=>window.__countSounds),[],'direct entry never requests speech/media');
 const stale=await p.evaluate(expected=>SukunSessionState.command('set-count',{value:'7',expected}),before);assert.equal(stale.accepted,false,'old editor cannot overwrite a newer count');
 const after=await p.evaluate(()=>SukunSessionState.snapshot());assert.equal(after.activeIndex,before.activeIndex);assert.equal(after.journeyKind,before.journeyKind);assert.equal(after.phase,'IDLE');
 const saved=await p.evaluate(kind=>JSON.parse(localStorage.getItem(kind==='single'?'sukun.session.r470':kind==='99'?'sukun.esma99.seyir.state':'sukun.berhet.seyir.state')),kind);assert.equal(kind==='single'?saved.z.count:saved.rep,59);
 await p.locator('#r920Remaining').click();const geometry=await p.locator('#r1227CountEntry').evaluate(n=>({viewport:innerWidth,scroll:document.documentElement.scrollWidth,rect:n.getBoundingClientRect().toJSON(),controls:[...n.querySelectorAll('input,button')].filter(e=>!e.hidden).map(e=>({id:e.id,...e.getBoundingClientRect().toJSON()}))}));assert(geometry.scroll<=width+1,'no horizontal overflow');assert(geometry.rect.left>=0&&geometry.rect.right<=width+1,'editor within viewport');for(const r of geometry.controls){assert(r.width>=44&&r.height>=44,r.id+' touch target')}const save=geometry.controls.find(r=>r.id==='r1227CountSave'),cancel=geometry.controls.find(r=>r.id==='r1227CountCancel');assert(save.right<=cancel.left,'Save and Cancel do not overlap');await p.locator('#r1227CountEntry').screenshot({path:path.join(out,`${width}-${mode}-${kind}.png`)});await p.keyboard.press('Escape');
 await p.reload();await p.waitForFunction(()=>window.SukunSessionState&&window.SukunCountCorrection);await p.waitForTimeout(2500);
 if(await p.locator('#dailyCard').isVisible())await p.locator('#dcClose').click();await p.locator('.tab[data-t="zkr"]').first().click();await p.evaluate(()=>KLT_AC('direct-count-disposable-test'));
 if(kind!=='single')await p.evaluate(({mode,kind})=>SukunSessionState.command('select',{mode,journeyKind:kind}),{mode,kind});
 await p.waitForFunction(()=>SukunSessionState.snapshot().count===59);
 let continuation=null;
 if(kind!=='single'){
  // Only the existing fixture supplies device speech completion. Native Start,
  // Pause, Resume, ownership and repeat accounting remain untouched.
  await p.evaluate(async()=>{await SukunVoiceSettings.setMode('turkish');await SukunVoiceSettings.setContent('legacy');__r1064SpeechFixture.setAuto(false);__r1064SpeechFixture.reset();SukunBerhetLayout.setFocusControls(true)});
  await p.waitForFunction(()=>!window.SukunInteractionGateR732?.active?.());
  await p.locator('#r920Remaining').click();await p.locator('#r1227CountValue').fill('41');await p.keyboard.press('Enter');await p.waitForFunction(()=>document.getElementById('r1227CountForm').hidden);assert(await p.locator('#r1227CountUndo').isVisible());
  await p.locator('#r932EasyPlay').click();
  await p.waitForFunction(kind=>{const s=(kind==='28'?SukunBerhetiyyeSeyir:SukunEsma99Seyir).state();return s.run&&!s.paused&&!!__r1064SpeechFixture.snapshot().active},kind,{timeout:20000});
  const started=await p.evaluate(kind=>({native:(kind==='28'?SukunBerhetiyyeSeyir:SukunEsma99Seyir).state(),count:SukunSessionState.snapshot().count,speech:__r1064SpeechFixture.snapshot()}),kind);
  assert.equal(started.native.i,index);assert.equal(started.native.rep,59,'Start retains entered progress before completion');assert.equal(started.count,59);assert.equal(await p.locator('#r1227CountUndo').isVisible(),false,'Start invalidates undo');
  assert.equal(await p.locator('#r920Remaining').isDisabled(),true,'active reading blocks remaining entry');
  assert(await p.evaluate(()=>__r1064SpeechFixture.finish()),'finish one native requested utterance');
  await p.waitForFunction(kind=>(kind==='28'?SukunBerhetiyyeSeyir:SukunEsma99Seyir).state().rep===60,kind,{timeout:15000});
  await p.locator('#r932EasyPlay').click();
  await p.waitForFunction(()=>SukunSessionState.snapshot().phase==='PAUSED');
  const paused=await p.evaluate(kind=>(kind==='28'?SukunBerhetiyyeSeyir:SukunEsma99Seyir).state(),kind);assert.equal(paused.rep,60);assert.equal(paused.i,index);
  await p.locator('#r932EasyPlay').click();
  await p.waitForFunction(kind=>{const s=(kind==='28'?SukunBerhetiyyeSeyir:SukunEsma99Seyir).state();return s.run&&!s.paused&&!!__r1064SpeechFixture.snapshot().active},kind,{timeout:20000});
  assert.equal(await p.evaluate(kind=>(kind==='28'?SukunBerhetiyyeSeyir:SukunEsma99Seyir).state().rep,kind),60,'Resume retains completed progress');
  assert(await p.evaluate(()=>__r1064SpeechFixture.finish()));
  await p.waitForFunction(kind=>(kind==='28'?SukunBerhetiyyeSeyir:SukunEsma99Seyir).state().rep===61,kind,{timeout:15000});
  await p.locator('#r932EasyPlay').click();await p.waitForFunction(()=>SukunSessionState.snapshot().phase==='PAUSED');
  const resumed=await p.evaluate(kind=>(kind==='28'?SukunBerhetiyyeSeyir:SukunEsma99Seyir).state(),kind);assert.equal(resumed.rep,61);assert.equal(resumed.i,index);
  continuation={started,paused,resumed,completedCounts:[60,61]};
 }
 const sriErrors=f.consoleErrors.filter(e=>/integrity|digest|\bSRI\b/i.test(String(e)));assert.deepEqual(sriErrors,[],'no integrity failure in finalized native app');
 results.push({width,mode,kind,passed:true,before:{index:before.activeIndex,target:before.target,phase:before.phase},after:{index:after.activeIndex,count:after.count,phase:after.phase},savedCount:kind==='single'?saved.z.count:saved.rep,geometry,remainingGeometry,continuation,sriErrors});await f.close();f=null;
 }
 }catch(e){console.error(e);results.push({passed:false,error:e.stack,evidence:f?.evidence?.()});process.exitCode=1}finally{if(f)await f.close();report.passed=results.filter(r=>r.passed).length;report.allPassed=report.passed===report.expectedChecks&&!results.some(r=>!r.passed);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));if(!report.allPassed)process.exitCode=1}})();
