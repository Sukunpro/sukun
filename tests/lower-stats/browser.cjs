'use strict';
// Native UI preference/edit acceptance. The managed harness changes presentation
// through shipped handlers; it never substitutes counter, wheel, or lease owners.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {fixture,hash}=require('../r1064/browser-fixture.cjs');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const out=path.resolve(process.argv[3]||'/tmp/sukun-lower-stats');fs.mkdirSync(out,{recursive:true});
const files=['index.html','nero.html','css/lower-stats-r1236.css','assets/runtime/lower-stats-r1236.js','assets/runtime/wheels-r924.js','assets/runtime/berhet-layout-r938.js','tests/lower-stats/managed-preview.html'];
const sources=Object.fromEntries(files.map(file=>[file,hash(fs.readFileSync(path.join(root,file)))]));
const report={sources,expectedCases:2,results:[],limitations:['Device touch and screen readers are not physically exercised.','This focused suite does not replace full release, audio, upgrade or offline acceptance.']};
(async()=>{let f;try{
 for(const mode of ['berhet','esma']){
  f=await fixture(root,{width:1280,height:1000,voices:'tr',seed:{'sukun.onboardSeen':'1','sukun.obSeenBuild':JSON.stringify(fs.readFileSync(path.join(root,'version.txt'),'utf8').trim())}});
  const p=f.page;await p.goto(f.origin+'/tests/lower-stats/managed-preview.html?w=393&theme='+mode+'&mode='+mode,{waitUntil:'load'});
  await p.locator('#run').waitFor({state:'visible'});await p.waitForFunction(()=>!document.getElementById('run').disabled,null,{timeout:20000});
  await p.locator('#run').click();await p.waitForFunction(()=>{try{return typeof JSON.parse(document.getElementById('result').textContent).allPassed==='boolean'}catch{return false}},null,{timeout:45000});
  const result=JSON.parse(await p.locator('#result').textContent());report.results.push(result);
  await p.screenshot({path:path.join(out,mode+'-compact.png'),fullPage:true});
  assert.equal(result.allPassed,true,JSON.stringify(result.results.filter(r=>!r.passed)));
  assert.equal(result.results.length,81,'complete expected assertion set');
  assert.deepEqual(f.consoleErrors.filter(e=>/integrity|digest|\bSRI\b/i.test(String(e))),[],'no SRI failure');
  await f.close();f=null;
 }
}catch(error){report.error=error.stack;process.exitCode=1}finally{
 if(f)await f.close();report.allPassed=report.results.length===report.expectedCases&&report.results.every(r=>r.allPassed)&&!report.error;
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({allPassed:report.allPassed,cases:report.results.length,error:report.error}));if(!report.allPassed)process.exitCode=1;
}})();
