// Reusable actual-browser assertion. Call after native readings route opens,
// for TR/EN and viewport widths 320,390,768,1440,1920.
const assert=require('node:assert/strict');
module.exports=async function checkReadingInnerSummaries(page){
 await page.locator('#surah-abese,#surah-tarik').evaluateAll(ns=>ns.forEach(n=>n.open=true));
 await page.waitForTimeout(150);
 const selector='#surah-abese .r1064-content details>summary,#surah-tarik .r1064-content details>summary';
 const results=await page.locator(selector).evaluateAll(ns=>ns.map(n=>{
  const b=n.getBoundingClientRect(),s=getComputedStyle(n),r=document.createRange();r.selectNodeContents(n);
  return{text:n.textContent,box:b.toJSON(),rects:[...r.getClientRects()].map(x=>x.toJSON()),align:s.textAlign,font:parseFloat(s.fontSize),left:parseFloat(s.paddingLeft),right:parseFloat(s.paddingRight),scroll:n.scrollWidth,client:n.clientWidth,viewport:innerWidth};
 }));
 assert(results.length>=2,'Both source subpanel captions must exist');
 for(const r of results){
  assert.equal(r.align,'center');assert(r.font>=14);assert(r.box.height>=64);
  assert(r.box.left>=0&&r.box.right<=r.viewport+1);assert(r.scroll<=r.client+1);
  for(const t of r.rects){assert(t.left>=r.box.left+r.left-1&&t.right<=r.box.right-r.right+1,'Text intrudes on jewel/caret safe inset '+JSON.stringify(r));assert(t.top>=r.box.top+20&&t.bottom<=r.box.bottom-20,'Text intrudes on top/bottom bevel '+JSON.stringify(r));}
 }
 return results;
};
