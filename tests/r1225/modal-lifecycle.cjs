'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'../..');const html=fs.readFileSync(path.join(root,'nero.html'),'utf8');
let cleanup=0,keyHandler,backdropHandler;
const sheet={id:'virdSheet',hidden:false,addEventListener(type,fn){backdropHandler=fn}};
const context={$:()=>sheet,$$:s=>s==='.mrSheet'?[sheet]:[],virdStopRun(){cleanup++},document:{addEventListener(type,fn){keyHandler=fn},querySelectorAll(){return sheet.hidden?[]:[sheet]}}};
vm.runInNewContext(html.slice(html.indexOf('function mrClose(id)'),html.indexOf('/* ── 1) MERTEBE REHBERİ')),context);
keyHandler({key:'Escape',preventDefault(){}});assert.equal(cleanup,1);assert.equal(sheet.hidden,true);
sheet.hidden=false;backdropHandler({target:sheet});assert.equal(cleanup,2);assert.equal(sheet.hidden,true);
sheet.hidden=false;context.mrClose('virdSheet');assert.equal(cleanup,3);
for(const id of ['ruyaSheet','haySheet','virdSheet','fatSheet','yksSheet']){
 const tag=html.match(new RegExp('<div[^>]+id="'+id+'"[^>]*>'))[0];
 assert.ok(tag.includes('aria-labelledby="'+id+'Title"'));assert.equal(html.split('id="'+id+'Title"').length-1,1);
}
assert.match(html,/const IDS=\[[^\n]*'hybridSheet'\]/);
assert.match(html,/SukunSheetAuthority\?\.open\('hybridSheet'\)/);
assert.match(html,/SukunSheetAuthority\?\.close\('hybridSheet'\)/);
console.log('PASS: Escape, backdrop and X share Vird cleanup; five unique dialog labels; hybrid common authority');
