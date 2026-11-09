'use strict';
// Disposable exact-byte app profile. This suite is mandatory, not a substitute
// for physical Android, screen-reader or acoustic acceptance.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {fixture,hash}=require('../r1064/browser-fixture.cjs');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const out=path.resolve(process.argv[3]||'/tmp/sukun-frequency-screenshot-fit.json');fs.mkdirSync(path.dirname(out),{recursive:true});
const images=out.replace(/\.json$/,'')+'-images';fs.mkdirSync(images,{recursive:true});
const files=['index.html','nero.html','css/visual-polish-r1232.css','js/frequency-hub-r1101.js'];
const report={build:fs.readFileSync(path.join(root,'version.txt'),'utf8').trim(),sources:Object.fromEntries(files.map(n=>[n,hash(fs.readFileSync(path.join(root,n)))])),checks:[],limitations:['Native Chromium synthetic profiles only; no physical Android, screen reader or acoustic acceptance.']};
let f,p,tag;
function save(){report.total=report.checks.length;report.passed=report.checks.filter(r=>r.passed).length;report.allPassed=report.total===148&&report.total===report.passed&&!report.fatal;fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n')}
async function check(name,fn){try{report.checks.push({tag,name,passed:true,evidence:await fn()})}catch(e){report.checks.push({tag,name,passed:false,error:e.stack});try{await p.screenshot({path:path.join(images,tag+'-'+report.checks.length+'-failure.png')})}catch(_){}}save()}
async function open(tool){await p.evaluate(t=>SukunFrequencyHubR1101.open(t,{navigate:false}),tool);await p.waitForTimeout(100);await p.evaluate(()=>document.fonts.ready)}
async function geometry(selector){return p.locator(selector).evaluateAll(nodes=>nodes.filter(n=>n.getClientRects().length).map(n=>{const b=n.getBoundingClientRect(),s=getComputedStyle(n),w=document.createTreeWalker(n,NodeFilter.SHOW_TEXT),rects=[];while(w.nextNode()){if(!w.currentNode.textContent.trim())continue;const r=document.createRange();r.selectNodeContents(w.currentNode);for(const x of r.getClientRects())if(x.width&&x.height)rects.push(x.toJSON())}return{text:n.textContent.trim(),box:b.toJSON(),rects,scrollWidth:n.scrollWidth,clientWidth:n.clientWidth,align:s.textAlign,gem:s.borderImageSource}}))}
function fits(rows,width,gutter=0){assert(rows.length);for(const r of rows){assert(r.box.left>=-1&&r.box.right<=width+1,JSON.stringify(r));assert(r.scrollWidth<=r.clientWidth+2,JSON.stringify(r));for(const t of r.rects){assert(t.left>=r.box.left+gutter-2&&t.right<=r.box.right-gutter+2,JSON.stringify(r));assert(t.top>=r.box.top+10&&t.bottom<=r.box.bottom-10,JSON.stringify(r))}assert.equal(r.align,'center')}}
async function selectFits(selector){const rows=await p.locator(selector).evaluateAll(nodes=>nodes.filter(n=>n.getClientRects().length).map(n=>{const s=getComputedStyle(n),ctx=document.createElement('canvas').getContext('2d');ctx.font=s.font;return{id:n.id,text:n.selectedOptions[0].textContent,textWidth:ctx.measureText(n.selectedOptions[0].textContent).width,available:n.clientWidth-parseFloat(s.paddingLeft)-parseFloat(s.paddingRight)-18,align:s.textAlignLast,gem:s.borderImageSource}}));assert(rows.length);for(const r of rows){assert(r.textWidth<=r.available+2,JSON.stringify(r));assert.equal(r.align,'center')}return rows}
(async()=>{try{
 for(const forcedColors of ['none','active']){
  f=await fixture(root,{width:393,height:1000,seed:{'sukun.onboardSeen':'1','sukun.obDone':'1','sukun.obSeenBuild':JSON.stringify(report.build),'sukun.r920.focus':'0','sukun.rut':JSON.stringify([{name:'Çok uzun kayıtlı düzen adı ve açıklaması ile dar ekran denemesi'},{name:'UzunKesintisizBirDüzenAdınınÇerçevedeSatırlaraSığmasıDenemesi'}])}});p=f.page;
  await p.emulateMedia({forcedColors,reducedMotion:'reduce'});
  await p.evaluate(()=>{window.obClose?.();document.getElementById('dcClose')?.click();KLT_AC('LABELLED-frequency-fit-disposable-profile')});
  await p.evaluate(()=>SukunTabOwner.run('manual',()=>SukunSessionState.command('select',{mode:'berhet',index:0,journeyKind:'single'}),{prime:false,releaseAfter:true}));
  await p.waitForFunction(()=>document.documentElement.dataset.r1074Theme==='berhet'&&SukunBerhetTheme.snapshot().family==='berhet');
  await p.locator('.tab[data-t="frq"]').click();
  for(const lang of ['tr','en']){
   await p.evaluate(l=>I18N.set(l),lang);
   for(const width of [320,393,720,1280]){
    tag=forcedColors+'-'+lang+'-'+width;await p.setViewportSize({width,height:1000});await open('breath');
    await check('breathing text fits inside carved setting',async()=>{const rows=await geometry('#breathModeGrid .breath-mode-card');assert.equal(rows.length,7);fits(rows,width,34);assert(rows.every(r=>forcedColors==='active'?r.gem==='none':/gem-(sapphire|emerald)/.test(r.gem)));return rows});
    await check('breathing keyboard preserves selection and pressed state',async()=>{const b=p.locator('#breathModeGrid .breath-mode-card').nth(1);await b.focus();await b.press('Enter');assert.equal(await b.getAttribute('aria-pressed'),'true');await p.locator('#breathModeGrid .breath-mode-card').first().press('Space');assert.equal(await b.getAttribute('aria-pressed'),'false')});
    await open('guided');
    await check('guided cards fit and match the active material',async()=>{const rows=await geometry('#medScriptGrid .med-script-card');fits(rows,width,34);assert(rows.every(r=>forcedColors==='active'?r.gem==='none':r.gem.includes('gem-sapphire')));return rows});
    await check('guided keyboard opens, closes and repeats with focus restored',async()=>{for(const key of ['Enter','Space']){const card=p.locator('#medScriptGrid .med-script-card').first();await card.focus();await card.press(key);assert(await p.locator('#medPlayerCard').isVisible());assert.equal(await p.evaluate(()=>document.activeElement.id),'medPlayBtn');await p.locator('#medExitBtn').click();assert(await card.isVisible());assert.equal(await card.evaluate(n=>document.activeElement===n),true)}});
    await open('library');await check('library names, descriptions and badges stay inside frame',async()=>{const rows=await geometry('#ns .libRow');fits(rows,width,34);return rows});
    await open('cymatics');
    await check('native model and quality labels remain inside equal gutters',async()=>{await p.locator('#cymView').selectOption('3d');await p.waitForTimeout(300);const rows=await selectFits('#cymView,#cymQuality');await p.locator('#cymView').selectOption('2d');return rows});
    await open('overview');
    await check('signal view switches preserve hidden time-window controls',async()=>{await p.locator('#signalView').selectOption('waveform');assert(await p.locator('#signalWindow').isVisible());const rows=await selectFits('#signalView,#signalWindow');await p.locator('#signalView').selectOption('spectrum');assert(await p.locator('#signalWindow').isHidden());assert(await p.locator('.frequency-select-field:has(#signalWindow)').isHidden());return rows});
    await check('frequency shortcuts show sapphire and emerald, or system colors',async()=>{const b=p.locator('#bandChips button').nth(1);await b.click();assert.equal(await b.getAttribute('aria-pressed'),'true');const states=await p.locator('#bandChips button').evaluateAll(ns=>ns.map(n=>({selected:n.getAttribute('aria-pressed'),gem:getComputedStyle(n).borderImageSource,box:n.getBoundingClientRect().toJSON()})));for(const s of states){assert(s.box.width>=44&&s.box.height>=44);assert(forcedColors==='active'?s.gem==='none':s.gem.includes(s.selected==='true'?'gem-emerald':'gem-sapphire'))}return states});
    await check('saved-routine gems and page have no horizontal overflow',async()=>{const rows=await geometry('#rutRow>.rut');assert(rows.length===3);fits(rows,width,24);const deletes=await p.locator('#rutRow .rx').evaluateAll(ns=>ns.map(n=>({w:n.getBoundingClientRect().width,h:n.getBoundingClientRect().height})));assert(deletes.every(r=>r.w>=44&&r.h>=44));assert(rows.every(r=>forcedColors==='active'?r.gem==='none':r.gem.includes('gem-sapphire')));assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));return rows});
    if(lang==='tr'&&width===393){await open('breath');await p.locator('#breathModeGrid').screenshot({path:path.join(images,tag+'-breathing.png')});await open('guided');await p.locator('#medScriptGrid').screenshot({path:path.join(images,tag+'-guided.png')});}
   }
  }
  tag=forcedColors+'-esma-regression';await p.evaluate(()=>SukunTabOwner.run('manual',()=>SukunSessionState.command('select',{mode:'esma',index:0,journeyKind:'single'}),{prime:false,releaseAfter:true}));await p.waitForFunction(()=>document.documentElement.dataset.r1074Theme==='esma');await p.setViewportSize({width:320,height:1000});await open('guided');
  await check('other theme does not inherit Berhetiyye gemstone paint',async()=>{assert((await geometry('#medScriptGrid .med-script-card')).every(r=>r.gem==='none'));await open('overview');const wrappers=await p.locator('.frequency-select-field').evaluateAll(ns=>ns.map(n=>getComputedStyle(n).display));assert(wrappers.every(s=>s==='contents'));assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1))});
  await check('shipped bytes and SRI remained unchanged during the run',async()=>{for(const[n,h]of Object.entries(report.sources))assert.equal(hash(fs.readFileSync(path.join(root,n))),h);assert(!f.consoleErrors.some(e=>/integrity|digest|SRI/i.test(e)));assert.deepEqual(f.errors,[]);return{pageErrors:f.errors,served:Object.keys(f.evidence().served).length}});
  await f.close();f=null;
 }
}catch(e){report.fatal=e.stack}finally{if(f)await f.close().catch(()=>{});save();console.log(JSON.stringify({allPassed:report.allPassed,total:report.total,passed:report.passed,fatal:report.fatal}));if(!report.allPassed)process.exit(1)}})();
