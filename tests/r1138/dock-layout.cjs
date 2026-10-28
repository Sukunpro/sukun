'use strict';
// Production DOM/CSS and native mode controls in isolated Classic/Feyz profiles.
// The shared fixture supplies speech completion only; no UI dimensions are mocked.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {fixture,hash}=require('../r1064/browser-fixture.cjs');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const output=path.resolve(process.argv[3]||'/tmp/r1138-dock-layout.json');
const {chromium}=require('playwright');
process.env.CHROMIUM_PATH ||= chromium.executablePath();
const report={build:fs.readFileSync(path.join(root,'version.txt'),'utf8').trim(),expectedChecks:9,checks:[],sourceSha256:hash(fs.readFileSync(path.join(root,'nero.html'))),limitations:['Isolated headless Chromium with real shipped HTML/CSS; synthetic speech fixture; no physical Samsung or OS lock claim.']};
let f,p;
const save=()=>{report.total=report.checks.length;report.passed=report.checks.filter(x=>x.passed).length;report.allPassed=report.total===report.expectedChecks&&report.passed===report.total&&!report.fatal;fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');};
async function tap(selector){await p.waitForFunction(()=>!window.SukunInteractionGateR732?.active?.());const kandil=p.locator('#kandil.on');if(await kandil.isVisible())await kandil.click({position:{x:20,y:20}});await p.locator(selector).first().click();await p.waitForTimeout(150);}
async function geometry(){return p.evaluate(()=>{
 const rect=n=>n?.getBoundingClientRect().toJSON(),visible=n=>n&&n.getBoundingClientRect().width&&n.getBoundingClientRect().height&&getComputedStyle(n).visibility!=='hidden';
 const shell=document.getElementById('r588DockShell'),body=document.getElementById('r659DockBody'),footer=shell.querySelector(':scope>.r588Mode');
 const buttons=[...footer.querySelectorAll('button')].filter(visible).map(n=>({id:n.id||n.dataset.r588Mode,rect:rect(n)}));
 const texts=[...shell.querySelectorAll('#r588Title,#r588Current,#r588Source,#r921DockName,.r588Meta b')].filter(visible).map(n=>({id:n.id,border:getComputedStyle(n).borderImageSource}));
 const stats=[...shell.querySelectorAll('.r588Stat')].filter(visible).map(n=>({rect:rect(n),align:getComputedStyle(n).textAlign,items:[...n.querySelectorAll('i,b')].filter(visible).map(x=>({rect:rect(x),text:x.textContent}))}));
 return{viewport:{width:innerWidth,height:innerHeight},panel:rect(document.getElementById('r170Now')),shell:rect(shell),body:rect(body),footer:rect(footer),buttons,texts,stats,volume:rect(document.getElementById('r920DockVolumeValue')),mode:SukunDockSize.get(),total:Z.total,scroll:{height:body.scrollHeight,client:body.clientHeight},background:getComputedStyle(document.getElementById('r170Now')).backgroundImage};
});}
(async()=>{try{
 for(const width of [360,393,720]){
  const seed={'sukun.theme':'"feyz"','sukun.obDone':'1','sukun.onboardSeen':'1','sukun.r920.focus':'0','sukun.obSeenBuild':JSON.stringify(report.build)};
  f=await fixture(root,{width,height:900,voices:'tr',seed});p=f.page;
  await p.waitForFunction(()=>window.SukunSecretPolicy&&window.SukunDockSize&&window.SukunSessionState);
  if(await p.locator('#dailyCard').isVisible())await p.locator('#dcClose').click();
  await tap('.tab[data-t="zkr"]');
  assert.equal(await p.evaluate(()=>KLT_AC('LABELLED-r1138-disposable-layout-profile')),true);
  const selected=await p.evaluate(()=>SukunSessionState.command('select',{mode:'berhet',index:8,journeyKind:'single'}));assert.equal(selected.accepted,true);
  await p.waitForFunction(()=>document.documentElement.dataset.r1074Theme==='berhet');
  await tap('#r932EasyPlay');await p.locator('#r170Now').waitFor({state:'visible'});
  for(const mode of ['mini','midi','max']){
   try{
    // Public layout owner, with the same mode setter used by the real buttons.
    await p.evaluate(mode=>SukunDockSize.set(mode,true),mode);await p.waitForTimeout(350);
    const g=await geometry();assert.equal(g.mode,mode);
    assert(g.panel.left>=-1&&g.panel.right<=width+1,'Panel outside viewport');
    for(const b of g.buttons){assert(b.rect.width>=43&&b.rect.height>=43,'Small hit target '+b.id);assert(b.rect.left>=g.panel.left-1&&b.rect.right<=g.panel.right+1,'Footer button outside panel '+b.id);}
    for(let i=0;i<g.buttons.length;i++)for(let j=i+1;j<g.buttons.length;j++){const a=g.buttons[i].rect,b=g.buttons[j].rect;assert(Math.min(a.right,b.right)-Math.max(a.left,b.left)<=1||Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)<=1,'Footer controls overlap');}
    for(const t of g.texts)assert.equal(t.border,'none','Nested text must not have a gemstone strip '+t.id);
    if(mode!=='mini'){
     assert(g.body.bottom<=g.footer.top+1,'Scroll body overlaps persistent controls');
     assert(g.volume.right<=g.panel.right-5,'Volume percentage clips');
     for(const s of g.stats)assert.equal(s.align,'center','Counter not centered');
     assert(g.footer.bottom<=g.panel.bottom+1,'Footer escapes panel');
    }
    const shot=path.join(path.dirname(output),`dock-${width}-${mode}.png`);await p.locator('#r170Now').screenshot({path:shot,animations:'disabled'});
    report.checks.push({width,mode,passed:true,geometry:g,screenshot:shot});
   }catch(error){report.checks.push({width,mode,passed:false,error:error.stack});}
   save();console.log(JSON.stringify({width,mode,passed:report.checks.at(-1).passed}));
  }
  assert.deepEqual(f.errors,[]);await f.close();f=p=null;
 }
}catch(error){report.fatal=error.stack}finally{if(f)await f.close().catch(()=>{});save();console.log(JSON.stringify({passed:report.passed,total:report.total,allPassed:report.allPassed,fatal:report.fatal,output}));if(!report.allPassed)process.exitCode=1;}})();
