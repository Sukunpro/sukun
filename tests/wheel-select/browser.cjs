'use strict';
// Native CI wrapper for the same full-application layout matrix used by managed QA.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {fixture}=require('../r1064/browser-fixture.cjs');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..')),reportFile=path.resolve(process.argv[3]||'/tmp/sukun-wheel-heading.json');
const bound=require('../r1213/visual-evidence.cjs').binding(root,'wheel-select');
const reports=[];let f;
(async()=>{try{
 f=await fixture(root,{width:1365,height:1050,seed:{'sukun.ui.shellMode':'classic','sukun.obDone':'1','sukun.onboardSeen':'1','sukun.r920.focus':'0'}});const p=f.page;
 for(const mode of ['berhet','esma']){
  const url=new URL('/tests/wheel-select/managed-preview.html',f.origin);url.searchParams.set('mode',mode);await p.goto(url.href);await p.waitForFunction(()=>!document.querySelector('#run').disabled,null,{timeout:180000});await p.locator('#run').click();
  await p.waitForFunction(()=>document.querySelector('#result').textContent.includes('"allPassed"'),null,{timeout:180000});const result=JSON.parse(await p.locator('#result').textContent());assert.equal(result.allPassed,true,JSON.stringify(result));assert.equal(result.total,71);assert.equal(result.mode,mode);assert.equal(result.results.length,71);assert(result.results.every(check=>check.passed===true));
  const app=p.frameLocator('#app'),summary=app.locator('#r924WheelGalleryDetails>summary');
  for(let i=0;i<3;i++){await summary.press('Enter');assert.equal(await app.locator('#r924WheelGalleryDetails').evaluate(el=>el.open),false);await summary.press('Space');assert.equal(await app.locator('#r924WheelGalleryDetails').evaluate(el=>el.open),true)}
  await p.emulateMedia({forcedColors:'active'});assert.equal(await summary.evaluate(el=>getComputedStyle(el).borderImageSource),'none');assert.notEqual(await summary.evaluate(el=>getComputedStyle(el).color),await summary.evaluate(el=>getComputedStyle(el).backgroundColor));await p.emulateMedia({forcedColors:'none'});
  reports.push({...result,keyboardCycles:3,forcedColors:true});
 }
 bound.verify(f);assert(bound.unchanged(),'Visual sources changed during run');
 fs.mkdirSync(path.dirname(reportFile),{recursive:true});fs.writeFileSync(reportFile,JSON.stringify({allPassed:true,browserExecuted:true,passed:2,total:2,expectedChecks:2,sourceUnchanged:true,sources:bound.sources,requiredSources:bound.required,servedHashesValid:true,reports,evidence:f.evidence()},null,2));console.log('PASS wheel heading 128 layout cases, 12 native click toggles, 12 keyboard toggles and both forced-color themes');
}finally{await f?.close()}})().catch(e=>{fs.mkdirSync(path.dirname(reportFile),{recursive:true});fs.writeFileSync(reportFile,JSON.stringify({allPassed:false,browserExecuted:!!f,passed:reports.length,total:2,expectedChecks:2,error:e.stack,reports},null,2));console.error(e);process.exitCode=1});
