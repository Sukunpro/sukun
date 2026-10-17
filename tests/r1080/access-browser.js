'use strict';
// Isolated browser profile with a labelled test-only configured device PIN.
// Uses the exact production access/portal/privacy modules, not a fake adapter.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {fixture,hash}=require('../r1064/browser-fixture.cjs');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const output=path.resolve(process.argv[3]||path.join(__dirname,'evidence/access-browser.json'));
const fixturePin='r1080-isolated-fixture-only';
function pinSummary(value){let result=5381;for(let i=0;i<value.length;i++)result=((result<<5)+result+value.charCodeAt(i))>>>0;return 'k'+result.toString(36);}
const report={suite:'r1080 real production adapter and device privacy integration',checks:[],limitations:[
  'Isolated Linux Chromium, 390×844, Classic/Feyz. The configured device PIN is seeded test data; no user credential, profile, recording or remote entitlement is read.',
  'Production access adapter, legacy configured-PIN verification, privacy bridge, portal interaction and canonical theme/selection APIs are used unchanged.',
  'Speech fixture is present for application startup only; this test does not claim audible judgment, Samsung Internet or physical Android verification.'
]};
let f,p;
function save(){report.total=report.checks.length;report.passed=report.checks.filter(x=>x.passed).length;report.allPassed=report.total>0&&report.total===report.passed;fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2));}
async function check(name,fn){try{report.checks.push({name,passed:true,evidence:await fn()});}catch(error){report.checks.push({name,passed:false,error:error.stack||String(error)});}save();console.log(JSON.stringify({name,passed:report.checks.at(-1).passed}));}
async function idle(){await p.waitForFunction(()=>!SukunInteractionGateR732.active());await p.waitForTimeout(75);}
async function tap(selector){await idle();await p.locator(selector).click();await idle();}
async function openDoor(){await p.evaluate(()=>SukunPracticeUI.openSection('zmgOkumalar'));await tap('#r1080BerhetEntry');}
async function state(){return p.evaluate(()=>({access:SukunBerhetGateAccess.snapshot(),open:KLT_ACIK(),secret:SukunSecretPolicy.unlocked(),selected:{cat:zKat(),index:zIdx(),count:currentZikirState.snapshot().count,target:currentZikirState.snapshot().target},theme:SukunSceneEngine.snapshot().selectionTheme.family,playing:SukunSessionState.snapshot().playing,total:Z.total,gate:SukunBerhetGate.snapshot(),configured:KLT_KURULU()}));}
(async()=>{try{
  f=await fixture(root,{width:390,height:844,seed:{'sukun.kilitPin':JSON.stringify(pinSummary(fixturePin)),'sukun.kilitAcik':'false'}});p=f.page;
  await p.waitForFunction(()=>!!window.SukunBerhetGateAccess&&!!window.SukunBerhetGatePrivacy&&!!window.SukunBerhetGate);
  await p.emulateMedia({reducedMotion:'reduce'});await tap('.tab[data-t="zkr"]');
  await p.evaluate(()=>{NIYET.on=false;NIYET.spk=false;NIYET.devir=false;ZA.kapali=true;Z.tick=false;Z.vib=false;});
  const initial=await state();
  await check('Final production shell loads configured device adapter without auto-enrollment or access',async()=>{
    assert.equal(initial.access.mode,'device');assert.equal(initial.configured,true);assert.equal(initial.open,false);assert.equal(initial.secret,false);assert.equal(initial.access.unlocked,false);
    assert.equal(await p.evaluate(()=>SukunBerhetGateAccess.needsSetup()),false);assert.equal(await p.locator('#zCats [data-c="berhet"]').count(),0);
    assert.match(await p.evaluate(()=>SukunBerhetGateAccess.getHelpText()),/gizlilik/);return initial;
  });
  await check('Correct configured PIN prepares and opens access without changing existing dhikr or theme',async()=>{
    await openDoor();await tap('#sukunBerhetGate [data-act="knock"]');await p.waitForSelector('#sbgPassword');
    await p.locator('#sbgPassword').fill(fixturePin);await p.locator('#sbgPassword').press('Enter');await p.waitForFunction(()=>SukunBerhetGate.snapshot().phase==='ready');
    const s=await state();assert.equal(s.open,true);assert.equal(s.secret,true);assert.equal(s.access.unlocked,true);assert.deepEqual(s.selected,initial.selected);assert.equal(s.total,initial.total);assert.equal(s.theme,initial.theme);assert.equal(s.playing,false);return s;
  });
  await check('Ordinary close preserves the authenticated session and explicit Saraya gir uses canonical Berhetiyye theme',async()=>{
    await p.keyboard.press('Escape');await p.waitForFunction(()=>!SukunBerhetGate.snapshot().open);assert.equal((await state()).open,true);
    await openDoor();await p.waitForFunction(()=>SukunBerhetGate.snapshot().phase==='ready');await tap('#sukunBerhetGate [data-act="enter"]');
    await p.waitForFunction(()=>!SukunBerhetGate.snapshot().open&&zKat()==='berhet'&&SukunSceneEngine.snapshot().selectionTheme.family==='berhet');
    const s=await state();assert.equal(s.playing,false);assert.equal(s.total,initial.total);assert.equal(s.theme,'berhet');return s;
  });
  await check('Returning to the current Berhetiyye name preserves index/count and does not autoplay',async()=>{
    const before=await state();await openDoor();await p.waitForFunction(()=>SukunBerhetGate.snapshot().phase==='ready');await tap('#sukunBerhetGate [data-act="enter"]');await p.waitForFunction(()=>!SukunBerhetGate.snapshot().open);
    const after=await state();assert.deepEqual(after.selected,before.selected);assert.equal(after.total,before.total);assert.equal(after.playing,false);return after;
  });
  await check('Explicit lock-and-exit clears private session, retains configured PIN and returns to safe theme',async()=>{
    await openDoor();await p.waitForFunction(()=>SukunBerhetGate.snapshot().phase==='ready');await tap('#sukunBerhetGate [data-act="lock-exit"]');await p.waitForFunction(()=>!SukunBerhetGate.snapshot().open&&!KLT_ACIK());
    await p.waitForFunction(()=>SukunSceneEngine.snapshot().selectionTheme.family!=='berhet');
    const s=await state();assert.equal(s.secret,false);assert.equal(s.access.unlocked,false);assert.equal(s.configured,true);assert.equal(s.total,initial.total);assert.equal(s.playing,false);assert.equal(s.gate.dormant,true);assert.equal(await p.locator('#zCats [data-c="berhet"]').count(),0);return s;
  });
  await check('Wrong password uses real production verification, seals the gate and shows its counsel',async()=>{
    await openDoor();await tap('#sukunBerhetGate [data-act="knock"]');await p.waitForSelector('#sbgPassword');await p.locator('#sbgPassword').fill('r1080-labelled-wrong-fixture');await p.locator('#sbgPassword').press('Enter');await p.waitForFunction(()=>SukunBerhetGate.snapshot().phase==='sealed');
    const s=await state();assert.equal(s.gate.reason,'wrong');assert.equal(s.access.unlocked,false);assert.equal(s.configured,true);assert.match(await p.locator('#sukunBerhetGate').innerText(),/Her kapının bir vakti vardır/);return s;
  });
  await check('No JavaScript faults and exact served production module bytes',async()=>{
    const evidence=f.evidence();assert.deepEqual(evidence.pageErrors,[]);assert(!evidence.consoleErrors.some(x=>/integrity|digest|syntaxerror|referenceerror|typeerror/i.test(x)),evidence.consoleErrors.join('\n'));assert.deepEqual(evidence.failedRequests,[]);
    for(const name of ['nero.html','assets/berhetiyye-gate/access-r1080.js','assets/berhetiyye-gate/portal-r1080.js'])assert.equal(evidence.served[name].sha256,hash(fs.readFileSync(path.join(root,name))));
    return {browser:f.browser.version(),files:Object.keys(evidence.served).length,accessSHA256:evidence.served['assets/berhetiyye-gate/access-r1080.js'].sha256};
  });
}catch(error){report.fatal=error.stack||String(error);}finally{if(f)await f.close();save();console.log(JSON.stringify({passed:report.passed,total:report.total,output,fatal:report.fatal},null,2));if(!report.allPassed||report.fatal)process.exitCode=1;}})();
