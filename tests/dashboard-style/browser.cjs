'use strict';
// Exact shipped application; disposable synthetic profile, no production origin.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {fixture,hash}=require('../r1064/browser-fixture.cjs');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const out=path.resolve(process.argv[3]||'/tmp/dashboard-tab-style.json');
const report={build:fs.readFileSync(path.join(root,'version.txt'),'utf8').trim(),runs:[],allPassed:false,limitations:['Linux Chromium only; not physical Android, screen reader, enlarged text or acoustic acceptance.']};
let f;
(async()=>{try{
 f=await fixture(root,{width:1280,height:950,seed:{'sukun.ui.shellMode':'classic','sukun.obDone':'1','sukun.onboardSeen':'1'}});
 const p=f.page,session=await f.context.newCDPSession(p);
 for(const media of ['normal','forced-colors','reduced-transparency']){
  await session.send('Emulation.setEmulatedMedia',{features:media==='normal'?[]:[{name:media==='forced-colors'?'forced-colors':'prefers-reduced-transparency',value:media==='forced-colors'?'active':'reduce'}]});
  // Match the fixture's bounded 60-second load budget for the exact large application.
  await p.goto(f.origin+'/tests/dashboard-style/managed-preview.html',{waitUntil:'load',timeout:60000});
  await p.locator('#run:not([disabled])').waitFor({timeout:30000});
  await p.locator('#run').click();
  await p.locator('#result[data-done="true"]').waitFor({timeout:180000});
  const result=JSON.parse(await p.locator('#result').textContent());
  report.runs.push({media,...result});
  // Preserve all media evidence before the final assertion; a failure still fails the suite.
  assert.equal(result.fatal,undefined);assert.equal(result.total,240);
 }
 report.evidence=f.evidence();assert.deepEqual(report.evidence.pageErrors,[]);
 for(const [name,row]of Object.entries(report.evidence.served))assert.equal(hash(fs.readFileSync(path.join(root,name))),row.sha256);
 report.total=report.runs.reduce((n,r)=>n+r.total,0);report.passed=report.runs.reduce((n,r)=>n+r.passed,0);report.allPassed=report.total===720&&report.passed===720;
 assert.equal(report.allPassed,true,JSON.stringify(report.runs.flatMap(r=>r.checks.filter(c=>!c.passed).map(c=>({media:r.media,...c})))));
}catch(e){report.fatal=e.stack||String(e)}finally{
 if(f)await f.close();fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({total:report.total,passed:report.passed,allPassed:report.allPassed,fatal:report.fatal}));if(!report.allPassed)process.exitCode=1;
}})();
