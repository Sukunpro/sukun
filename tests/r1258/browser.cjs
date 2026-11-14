'use strict';
const assert=require('node:assert/strict');const {fixture,wav}=require('../r1064/browser-fixture.cjs');
(async()=>{let f;try{for(const width of [390,1440]){
 f=await fixture(process.cwd(),{width,height:900,seed:{'sukun.onboardSeen':'1','sukun.obDone':'1'}});const p=f.page;
 await p.evaluate(()=>{window.obClose?.();document.getElementById('dcClose')?.click();KLT_AC('synthetic-test');SukunFriendlyUI.go('zikir');document.querySelector('.tab[data-t="zkr"]')?.click();zNavGo('ferasetBox');let el=document.getElementById('ferasetBox');while(el){if(el.tagName==='DETAILS')el.open=true;el=el.parentElement}});
 assert.equal(await p.locator('.feraset-section').count(),35);
 const layout=await p.locator('#ferasetSections').evaluate(el=>({width:el.clientWidth,scroll:el.scrollWidth,text:el.innerText}));assert(layout.width>0);assert(layout.scroll<=layout.width+1);assert(layout.text.includes('Ahzâb 33/43'));
 await p.evaluate(async base64=>{const b=new Blob([Uint8Array.from(atob(base64),x=>x.charCodeAt(0))],{type:'audio/wav'});for(const key of ['dua:tovbe','dua:feraset:v1:h34','dua:feraset:v1:h35'])await REC_DB.set(key,b);await SukunFerasetSections.refresh();},wav(3,440).toString('base64'));
 const before=await p.evaluate(async()=>{const b=await REC_DB.get('dua:tovbe');return skBackupHash(b)});
 await p.locator('.feraset-section').nth(33).getByRole('button',{name:/Bu bölümden dinle/}).click();
 await p.waitForFunction(()=>[...SES.ler].somea=>a._sukunRecordingKey==='dua:feraset:v1:h34'&&!a.paused&&a.currentTime>.2));
 await p.locator('#ferasetSections > .feraset-controls').getByRole('button',{name:/Duraklat/}).click();
 assert.equal(await p.evaluate(()=>SukunFerasetSections.snapshot().paused),true);
 await p.locator('#ferasetSections > .feraset-controls').getByRole('button',{name:/Sürdür/}).click();
 await p.waitForFunction(()=>[...SES.ler].somea=>a._sukunRecordingKey==='dua:feraset:v1:h35'&&!a.paused),null,{timeout:12000});
 await p.waitForFunction(()=>document.getElementById('ferasetProgress').textContent==='Dua tamamlandı.',null,{timeout:12000});
 assert.equal(await p.evaluate(async()=>skBackupHash(await REC_DB.get('dua:tovbe'))),before);
 // A missing recording stops at its exact heading, without synthesized substitution.
 await p.locator('#ferasetSections > .feraset-controls').getByRole('button',{name:/Baştan dinle/}).click();await p.waitForFunction(()=>document.getElementById('ferasetProgress').textContent.includes('1. bölümün kaydı yok'));
 assert.deepEqual(f.errors,[]);console.log('PASS native Feraset sequence/pause/resume/missing/preservation/layout',width);await f.close();f=null;
 }}finally{if(f)await f.close();}})().catch(e=>{console.error(e);process.exit(1)});
