const {fixture}=require('../r1064/browser-fixture.cjs');
(async()=>{const app=await fixture(process.cwd(),{width:320,height:760,hasTouch:true,seed:{'sukun.obDone':'1','sukun.onboardSeen':'1','sukun.theme':'"feyz"'}});const p=app.page;
try{await p.evaluate(()=>{window.obClose?.();document.querySelector('#dcClose')?.click()});
await p.waitForFunction(()=>!window.SukunInteractionGateR732?.active?.());
for(const [hour,title,targets] of [[8,'Sabah',['tab-zkr','ferasetBox']],[13,'Öğle',['tab-amb','tab-frq']],[19,'Akşam',['dhBox','ferasetBox']],[23,'Gece',['tvBox','tab-zkr']]]){
 await p.clock.setFixedTime(new Date(2026,10,27,hour,0));
 for(const [i,target] of targets.entries()){
 await p.locator('.tab[data-t=ntf]').click();await p.waitForFunction(t=>document.getElementById('r1277Period').textContent.startsWith(t),title);
 await p.locator('#r1277Routes button').nth(i).click();await p.locator('#'+target).waitFor({state:'visible',timeout:6000});console.log(title,target);
 }}
await p.locator('#tekkeTab').click();await p.locator('#tk .r992PurposeBtn').first().waitFor({state:'visible'});
for(const width of [320,360,393,412]){
 await p.setViewportSize({width,height:760});
 const bad=await p.locator('#tk .r992PurposeBtn').evaluateAll(bs=>bs.filter(b=>{for(const t of b.querySelectorAll('strong,small')){t.style.setProperty('font-size','1.3rem','important');const r=document.createRange();r.selectNodeContents(t);const bb=b.getBoundingClientRect();if([...r.getClientRects()].some(q=>q.left<bb.left-1||q.right>bb.right+1||q.bottom>bb.bottom+1||q.top<bb.top-1))return true}return false}).map(b=>b.innerText));
 if(bad.length)throw Error(JSON.stringify(bad));console.log('Tekke',width);
}
}finally{await app.close()}})().catch(e=>{console.error(e);process.exitCode=1})
