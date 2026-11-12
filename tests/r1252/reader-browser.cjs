'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {fixture}=require('../r1064/browser-fixture.cjs');
const root=path.resolve(process.argv[2]||'.'),out=path.resolve(process.argv[3]||'/tmp/r1252-readers/report.json');
fs.mkdirSync(path.dirname(out),{recursive:true});
const report={checks:[],limitations:['Synthetic disposable Chromium profile. No physical Android or audible recitation certification.']};let f;
(async()=>{try{
 for(const width of [320,390,1440]){
  f=await fixture(root,{width,height:1000,seed:{'sukun.onboardSeen':'1','sukun.obDone':'1','sukun.obSeenBuild':'"r1252"','sukun.r920.focus':'0'}});const p=f.page;
  await p.emulateMedia({reducedMotion:'reduce'});
  await p.evaluate(()=>{window.obClose?.();document.getElementById('dcClose')?.click();KLT_AC('LABELLED-r1252-reader-disposable')});
  await p.evaluate(()=>SukunTabOwner.run('manual',()=>SukunSessionState.command('select',{mode:'berhet',index:0,journeyKind:'single'}),{prime:false,releaseAfter:true}));
  await p.waitForFunction(()=>document.documentElement.dataset.r1074Theme==='berhet');
  assert.equal(await p.evaluate(()=>SukunDiscoveryR1158.open('okumalar',document.querySelector('[data-discovery=okumalar]'))),true);
  await p.waitForFunction(()=>document.body.classList.contains('r920-details-open')&&document.getElementById('zmgOkumalar')?.open);
  for(const [key,count] of [['abese',42],['tarik',17]]){
   const box=p.locator('#surah-'+key);await box.evaluate(e=>e.open=true);await p.evaluate(()=>document.fonts.ready);
   assert.equal(await box.locator('.r1064-verse').count(),count);
   assert.equal(await box.locator('.r1064-verse-meaning:visible').count(),count);
   assert.equal(await box.locator('.r1064-latin:visible').count(),0);
   const data=await box.locator('.r1064-verse').evaluateAll(rows=>rows.map(row=>{const r=row.getBoundingClientRect();return {left:r.left,right:r.right,width:innerWidth,scroll:row.scrollWidth,client:row.clientWidth,ar:row.querySelector('.r1064-arabic')?.getAttribute('dir'),meal:row.querySelector('.r1064-verse-meaning')?.tagName}}));
   for(const r of data){assert(r.left>=-2&&r.right<=r.width+2,JSON.stringify(r));assert(r.scroll<=r.client+2);assert.equal(r.ar,'rtl');assert.equal(r.meal,'P')}
   await p.locator('#surah-'+key+'-show-meaning').uncheck();assert.equal(await box.locator('.r1064-verse-meaning:visible').count(),0);
   await p.locator('#surah-'+key+'-show-latin').check();assert.equal(await box.locator('.r1064-latin:visible').count(),count);
   await p.evaluate(()=>{SukunReadingUIR1064.mount();SukunReadingUIR1064.render();I18N.set('en')});
   assert.equal(await p.locator('#surah-'+key).count(),1);assert(await p.locator('#surah-'+key+'-show-latin').isChecked());
   assert.equal(await p.locator('#surah-'+key+'-show-latin + span').textContent(),'Show Latin transliteration');
   await p.evaluate(()=>I18N.set('tr'));await p.locator('#surah-'+key+'-show-meaning').check();await p.locator('#surah-'+key+'-show-latin').uncheck();
   await box.locator('.r1064-verse').first().scrollIntoViewIfNeeded();await p.screenshot({path:path.join(path.dirname(out),`${width}-${key}.png`)});
   report.checks.push({name:`${width} ${key} complete Arabic/meal default, toggles, language, remount, containment`,passed:true});await box.evaluate(e=>e.open=false);
  }
  assert.deepEqual(f.errors,[]);assert(!f.consoleErrors.some(x=>/integrity|syntaxerror|referenceerror|typeerror/i.test(x)),f.consoleErrors.join('\n'));await f.close();f=null;
 }
}catch(e){report.fatal=e.stack;process.exitCode=1}finally{if(f)await f.close();report.total=report.checks.length;report.allPassed=!report.fatal&&report.total===6;fs.writeFileSync(out,JSON.stringify(report,null,2));console.log(JSON.stringify(report))}})();
