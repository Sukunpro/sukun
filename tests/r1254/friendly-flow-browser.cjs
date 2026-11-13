'use strict';
const path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||'.');
const {fixture}=require(path.join(root,'tests/r1064/browser-fixture.cjs'));
(async()=>{const report=[];
for(const width of [320,390]){const f=await fixture(root,{width,height:900,seed:{'sukun.ui.shellMode':'simple'}}),p=f.page;
try{
await p.waitForFunction(()=>document.body.classList.contains('r616-ui')&&!!window.SukunSmartSessionUIR1082);
for(const view of ['home','journeys'])for(const idx of [0,1]){
await p.evaluate(({idx,view})=>{R170.Player.stop(true);R170.Player.set([],'Akış görünürlük testi');Z.cat='sure';Z.idx=idx;renderZikir(false);zUI();SukunFriendlyUI.go(view)},{idx,view});
await p.waitForFunction(view=>SukunFriendlyUI.current()===view&&document.getElementById('tab-zkr').hidden,view);
if(view==='journeys')assert(await p.locator('.tab[data-t="zkr"]').evaluate(e=>e.classList.contains('act')),'Journeys active-but-hidden legacy tab');
assert.equal(await p.evaluate(()=>SukunSmartSessionUIR1082.open({reveal:false})),true);
await p.waitForFunction(()=>SukunFriendlyUI.current()==='zikir'&&!document.getElementById('tab-zkr').hidden&&!window.SukunInteractionGateR732?.active?.());
await p.locator('#r170CurrentAdd').waitFor({state:'visible'});assert(await p.locator('#r170CurrentAdd').isEnabled());
await p.locator('#r170CurrentAdd').click();
await p.waitForFunction(idx=>R170.Player.queue.length===1&&R170.Player.queue[0].cat==='sure'&&R170.Player.queue[0].idx===idx,idx);
const result=await p.evaluate(()=>({step:{...R170.Player.queue[0]},playing:R170.Player.playing,parent:document.getElementById('r170SessionHub').closest('.zMegaGroup')?.id,hubOpen:document.getElementById('r170SessionHub').open,groupOpen:document.getElementById('zmgAkis').open}));
assert.equal(result.playing,false);assert.equal(result.parent,'zmgAkis');assert.equal(result.hubOpen,true);assert.equal(result.groupOpen,true);report.push({width,view,surah:idx===0?'abese':'tarik',passed:true,result});
}
assert.deepEqual(f.errors,[]);assert(!f.consoleErrors.some(e=>/integrity|syntaxerror|referenceerror|typeerror/i.test(e)),f.consoleErrors.join('\n'));
}finally{await f.close()}}
console.log(JSON.stringify({checks:report,total:report.length,passed:report.length,limitations:['Presentation and queue admission only. No playback or physical-device claim.']}));
})().catch(e=>{console.error(e.stack);process.exitCode=1});
