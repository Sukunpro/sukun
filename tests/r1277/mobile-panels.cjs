const {fixture}=require('../r1064/browser-fixture.cjs');
(async()=>{const app=await fixture(process.cwd(),{width:320,height:800,hasTouch:true,seed:{'sukun.theme':'"feyz"','sukun.r920.focus':'0','sukun.obDone':'1','sukun.onboardSeen':'1'}});const p=app.page;
try{
await p.evaluate(()=>{window.obClose?.();document.querySelector('#dcClose')?.click()});
await p.waitForFunction(()=>!window.SukunInteractionGateR732?.active?.());
console.log(await p.evaluate(()=>[SukunLayoutModes.current(),SukunShellSkin.getAppearance()]));
for(const width of [320,360,393,412]){
await p.setViewportSize({width,height:800});await p.evaluate(()=>document.documentElement.style.setProperty('font-size','125%','important'));
for(const [tab,ids] of [['amb',['karisimBox']],['zkr',['ydkBox','maneviGunluk','dlBox','dhBox','ferasetBox','r1064ReadingExplorer']]]){
await p.locator('.tab[data-t='+tab+']').click();
for(const id of ids){const result=await p.evaluate(id=>{
 if(id!=='karisimBox'){
 if(!document.body.classList.contains('r920-details-open'))document.getElementById('r920More')?.click();
 window.zNavGo?.(id);
 }
 const n=document.getElementById(id);if(!n)return 'missing';
 for(let a=n;a;a=a.parentElement)if(a.tagName==='DETAILS')a.open=true;
 n.scrollIntoView();const nodes=[...n.querySelectorAll('button,select,textarea')].filter(b=>b.offsetWidth&&!b.closest('[hidden]'));
 return {controls:nodes.length,issues:nodes.filter(b=>{const r=b.getBoundingClientRect();return r.left<0||r.right>innerWidth+1||b.scrollHeight>b.clientHeight+3}).map(b=>b.id||b.innerText).slice(0,15)};
},id);
 if(!result.controls || result.issues.length)throw Error(JSON.stringify({width,id,result}));
 console.log(width,id,result.controls);}
}}
}finally{await app.close()}})().catch(e=>{console.error(e);process.exitCode=1});
