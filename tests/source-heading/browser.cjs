'use strict';
// Disposable native local app profile. No user records or deployed state.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {fixture}=require('../r1064/browser-fixture.cjs');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const target=path.resolve(process.argv[3]||'/tmp/sukun-source-heading');const reportFile=target.endsWith('.json')?target:path.join(target,'report.json');const out=target.endsWith('.json')?path.join(path.dirname(target),'source-heading-artifacts'):target;fs.mkdirSync(out,{recursive:true});
const results=[];let f;
(async()=>{try{
 f=await fixture(root,{width:393,height:1050,seed:{'sukun.ui.shellMode':'classic','sukun.obDone':'1','sukun.onboardSeen':'1','sukun.r920.focus':'0'}});const p=f.page;
 for(const mode of ['berhet','esma']){
  await p.evaluate(async mode=>{KLT_AC('LABELLED-source-heading-disposable-profile');await SukunTabOwner.run('manual',async()=>{const r=await SukunSessionState.command('select',{mode,index:9,journeyKind:mode==='berhet'?'28':'99'});if(!r.accepted)throw Error('Fixture selection rejected')},{prime:false,releaseAfter:true});document.querySelector('.tab[data-t=zkr]').click();SukunPracticeUI.refresh()},mode);
  for(const width of [320,393,720,1280])for(const lang of ['tr','en']){
   await p.setViewportSize({width,height:1050});await p.evaluate(lang=>I18N.set(lang),lang);await p.waitForTimeout(150);await p.evaluate(()=>SukunActiveNameInfo.open());await p.waitForTimeout(150);
   const summary=p.locator('#r1064ActiveSourcesLabel');await summary.scrollIntoViewIfNeeded();
   const result=await summary.evaluate(el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect(),range=document.createRange();range.selectNodeContents(el);const text=range.getBoundingClientRect();return{display:s.display,textAlign:s.textAlign,paddingLeft:s.paddingLeft,paddingRight:s.paddingRight,rect:r.toJSON(),text:text.toJSON(),scroll:el.scrollWidth,client:el.clientWidth,label:el.textContent,native:el.parentElement.tagName,theme:document.documentElement.dataset.r1074Theme}});
   assert.equal(result.display,'grid');assert.equal(result.textAlign,'center');assert.equal(result.paddingLeft,result.paddingRight,'Source label padding must remain symmetric');assert.equal(result.native,'DETAILS');assert(Math.abs(result.rect.x+result.rect.width/2-result.text.x-result.text.width/2)<1,'Text not centered '+JSON.stringify(result));assert(result.scroll<=result.client+1);assert(result.text.left>=result.rect.left+38&&result.text.right<=result.rect.right-38);assert(result.text.top>=result.rect.top+12&&result.text.bottom<=result.rect.bottom-12);
   for(let i=0;i<3;i++){await summary.press('Enter');assert.equal(await p.locator('#r1064ActiveSources').evaluate(el=>el.open),true);await summary.press('Space');assert.equal(await p.locator('#r1064ActiveSources').evaluate(el=>el.open),false)}
   results.push({mode,width,lang,...result});if(width===393&&lang==='tr')await p.locator('#r642ZikirInfoCard').screenshot({path:path.join(out,mode+'.png')});
   await p.locator('#r642InfoClose').click();await p.locator('#r642ZikirInfoLayer').waitFor({state:'hidden',timeout:2000});assert.equal(await p.locator('#r642ZikirInfoLayer').isVisible(),false);
  }
 }
 assert.deepEqual(f.errors,[]);assert(!f.consoleErrors.some(x=>/integrity|digest|Content Security Policy/i.test(x)));
 fs.writeFileSync(reportFile,JSON.stringify({allPassed:true,browserExecuted:true,passed:results.length,total:16,expectedChecks:16,results,evidence:f.evidence()},null,2));console.log('PASS source heading centered and keyboard disclosure matrix: '+results.length);
}finally{await f?.close()}})().catch(e=>{fs.writeFileSync(reportFile,JSON.stringify({allPassed:false,browserExecuted:!!f,passed:results.length,total:16,expectedChecks:16,error:e.stack,results},null,2));console.error(e);process.exitCode=1});
