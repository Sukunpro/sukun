'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {fixture}=require('../r1056/ui-controls-fixture.cjs');
const root=path.resolve(__dirname,'../..'),read=name=>fs.readFileSync(path.join(root,name),'utf8');let passed=0;
function test(name,fn){fn();passed++;console.log('PASS '+name)}
for(const mode of ['esma','berhet'])for(const language of ['tr','en'])test(mode+' '+language+' original actions, one toggle and direct restart',()=>{
 const f=fixture(root,{preference:'1',language}),restart=f.add('r920JourneyRestartAll',f.$('nav'),'button');let calls=0;restart.onclick=()=>calls++;const handler=restart.onclick;
 f.reading();f.sync(mode,false);
 assert.equal(f.$('r1213JourneyActionsTitle'),null);assert.equal(f.$('r1196JourneyRestartControls'),null);assert.equal(restart.parentElement,f.$('r1056FinishRow'));assert.equal(restart.nextElementSibling,f.$('r932EasyStop'));assert.equal(restart.onclick,handler);
 const nodes=['r932EasyPlay','r932EasyStop','r932EasyMinus','r932EasyPlus'].map(id=>f.$(id));
 for(const tef of [true,false,true,false]){f.sync(mode,tef);f.window.SukunBerhetLayout.setFocusControls(false);assert.equal(f.$('r1056FinishRow').hidden,true);f.window.SukunBerhetLayout.setFocusControls(true);assert.equal(f.$('r1056FinishRow').hidden,false);assert.deepEqual(nodes,nodes.map(n=>f.$(n.id)));assert.equal(restart.onclick,handler)}
 restart.click();assert.equal(calls,1);assert.equal(f.commands.length,0);assert.match(restart.getAttribute('aria-label'),mode==='berhet'?/Berhetiyye/:/Esmâ|Esma/);assert.match(restart.getAttribute('data-tip'),mode==='berhet'?/28/:/99/);
 for(const id of ['r932EasyPlay','r932EasyStop','r920JourneyRestartAll','r1056FocusControlsToggle'])assert(f.$(id).getAttribute('data-tip'));
 restart.focus();f.window.SukunBerhetLayout.setFocusControls(false);assert.equal(f.document.activeElement,f.$('r1056FocusControlsToggle'));
 f.root.hidden=true;f.window.SukunBerhetLayout.sync(f.root,false);assert.equal(restart.parentElement,f.$('nav'));assert.equal(restart.onclick,handler);
});
test('state-specific help follows the current transport without another owner',()=>{const f=fixture(root,{preference:'1'});for(const phase of ['IDLE','PLAYING','PREPARING','PAUSED','ERROR']){f.state.phase=phase;f.sync('berhet');const tip=f.$('r932EasyPlay').getAttribute('data-tip');assert.match(tip,phase==='PLAYING'||phase==='PREPARING'?/duraklatır/:phase==='PAUSED'?/kaldığın yerden/:phase==='ERROR'?/yeniden dener/:/başa almaz/)}assert.equal(f.commands.length,0)});
test('native reset confirmation and original transport source remain untouched',()=>{const s=read('assets/runtime/interface-r920.js');assert.match(s,/if\(!window.confirm\(question\)\)return/);assert.match(s,/command\('restart-journey'/);assert.match(read('assets/runtime/berhet-layout-r938.js'),/window\.dockTipBagla\?\.\(node\)/);assert(!read('assets/runtime/berhet-layout-r938.js').includes('Seyir işlemleri'))});
test('terminal and non-reading smart steps have accurate localized help without commanding owners',()=>{
 for(const language of ['tr','en']){const f=fixture(root,{preference:'1',language});f.add('r920Restart',f.$('nav'),'button');f.state.phase='COMPLETED';f.state.smartSession={terminal:true,reading:true,stepType:'zikir'};f.sync('esma');
  assert.equal(f.$('r932EasyPlay').textContent,language==='en'?'Restart session':'Seansı yeniden başlat');assert.equal(f.$('r932EasyPlay').getAttribute('aria-label'),language==='en'?'Restart session':'Seansı yeniden başlat');
  assert.match(f.$('r932EasyPlay').getAttribute('data-tip'),language==='en'?/first step/:/ilk adımından/);assert.match(f.$('r920Restart').getAttribute('data-tip'),language==='en'?/first step/:/ilk adımından/);assert.match(f.$('r932EasyStop').getAttribute('data-tip'),language==='en'?/Close the session result/:/Seans sonucunu kapatır/);assert.equal(f.$('r932EasyStop').getAttribute('aria-label'),language==='en'?'Close session result':'Seans sonucunu kapat');
  for(const stepType of ['silence','frequency'])for(const phase of ['IDLE','PLAYING','PAUSED','ERROR']){f.state.smartSession={terminal:false,reading:false,stepType};f.state.phase=phase;f.sync('esma');const help=f.$('r932EasyPlay').getAttribute('data-tip');assert.match(help,language==='en'?/session step/:/Seansın geçerli adımını/);assert(!/count|sayım|sayım|zikri/.test(help));assert.match(f.$('r932EasyPlay').getAttribute('aria-label'),language==='en'?/session/:/Seans/);assert.match(f.$('r920Restart').getAttribute('data-tip'),language==='en'?/current session step/:/geçerli adımını/);}
  f.state.smartSession=null;f.state.phase='IDLE';f.sync('esma');assert.equal(f.$('r932EasyPlay').textContent,language==='en'?'Start':'Başlat');assert.equal(f.$('r932EasyPlay').getAttribute('aria-label'),language==='en'?'Start dhikr':'Zikri başlat');assert.equal(f.commands.length,0);
 }
 const session=read('assets/runtime/session-r919.js');assert.match(session,/if\(pendingSmart\|\|before.smartSession\?\.terminal\)return pc\?\.play\?\.\('smart-session'\)/);assert.match(session,/if\(action==='restart'&&before.smartSession\?\.terminal\)return route\('play',before,reject\)/);
});
test('native evidence rejects missing cases, hashes, browser errors and changed files',()=>{
 const {expectedChecks,expectedNames,sourcePaths,testPaths,complete}=require('./evidence.cjs');assert.equal(expectedChecks,31);assert.equal(expectedNames.length,31);
 const digest='a'.repeat(64),sources=Object.fromEntries(sourcePaths.map(n=>[n,digest])),testSources=Object.fromEntries(testPaths.map(n=>[n,digest]));
 const served=Object.fromEntries([...sourcePaths,'tests/tefekkur-help/managed-preview.html'].map(n=>[n,{sha256:digest}]));
 const valid={expectedChecks,passed:31,total:31,browserExecuted:true,sourceUnchanged:true,testUnchanged:true,servedHashesValid:true,sources,testSources,results:expectedNames.map(name=>({name,passed:true})),browserEvidence:[{pageErrors:[],consoleErrors:[],served}]};
 assert.equal(complete(valid),true);
 const mutate=[r=>r.results.pop(),r=>r.results[1].name=r.results[0].name,r=>r.results[0].name='unexpected case',r=>r.results[0].passed=false,r=>r.results[0]=null,r=>r.total=28,r=>r.passed=28,r=>r.expectedChecks=20,r=>r.browserExecuted=false,r=>r.sourceUnchanged=false,r=>r.testUnchanged=false,r=>r.servedHashesValid=false,r=>r.fatal='fixture failed',r=>delete r.testSources,r=>delete r.testSources[testPaths[0]],r=>r.testSources[testPaths[0]]='invalid',r=>delete r.sources[sourcePaths[0]],r=>r.browserEvidence=[],r=>r.browserEvidence[0]=null,r=>r.browserEvidence[0].pageErrors.push('Uncaught error'),r=>r.browserEvidence[0].consoleErrors.push('Failed to find a valid digest in integrity attribute'),r=>r.browserEvidence[0].consoleErrors.push('TypeError: broken handler'),r=>delete r.browserEvidence[0].served['nero.html'],r=>r.browserEvidence[0].served['nero.html'].sha256='b'.repeat(64)];
 for(const change of mutate){const r=JSON.parse(JSON.stringify(valid));change(r);assert.equal(complete(r),false,String(change));}assert.equal(complete(null),false);
});
console.log(JSON.stringify({passed,total:8,scope:'Current production layout, original quick delegates, controlled endpoints and fail-closed native evidence contract. No native browser execution implied.'}));
