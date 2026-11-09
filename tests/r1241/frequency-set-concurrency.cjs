'use strict';
// Real same-origin Chromium pages exercise the shipped module and native Web Locks.
const assert=require('node:assert/strict'),http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const source=fs.readFileSync(path.resolve(__dirname,'../../assets/runtime/frequency-sets-r1120.js'),'utf8');
const KEY='sukun.frequencySets.v2';
const settings={c:180,b:7.83,mode:'bin',vol:.5,pink:false,harmonik:0,harmSeri:'dogal',uzam:false,uzamHiz:22,wave:'sine',balL:1,balR:1,noise:'off',noiseVol:0,filterOn:false,lpf:2000,hpf:80,levelProfile:'legacy',secondary:{on:false,c:100,b:2.5}};
const original={id:'set_old',name:'Original',description:'Preserve me',settings,createdAt:1,updatedAt:2};
let checks=0;
const check=(value,message)=>{assert(value,message);checks++;};
(async()=>{
 const server=http.createServer((q,r)=>{r.setHeader('Content-Type','text/html');r.end('<section id="manualFrequencySetsR1120"></section>');});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser;
 try {
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium'});
 const context=await browser.newContext(),url=`http://127.0.0.1:${server.address().port}`;
 const page=async()=>{const p=await context.newPage();p.on('dialog',d=>d.accept());await p.goto(url);await p.evaluate(s=>{window.I18N={lang:'en'};window.calls=[];window.SukunFrequencyR1120={capture:()=>s,apply:async(...args)=>{calls.push(args);return {ok:true,playing:false};}};},settings);return p;};
 const a=await page(),b=await page(),gate=await page();
 await a.evaluate(({KEY,original})=>{localStorage.setItem(KEY,JSON.stringify({version:2,sets:[original]}));localStorage.setItem('sukun.myfreq','legacy untouched');},{KEY,original});
 await Promise.all([a,b].map(async(p)=>{
   await p.evaluate(KEY=>{
    window.storageTrace=[];
    const note=(kind,extra={})=>storageTrace.push({kind,time:Date.now(),...extra});
    const get=Storage.prototype.getItem,set=Storage.prototype.setItem;
    Storage.prototype.getItem=function(key){const value=get.call(this,key);if(key===KEY)note('read',{value});return value;};
    Storage.prototype.setItem=function(key,value){if(key===KEY)note('write',{value});return set.call(this,key,value);};
    const request=navigator.locks.request.bind(navigator.locks);
    navigator.locks.request=(name,options,callback)=>{note('lock-request',{name});return request(name,options,lock=>{note('lock-acquired',{name});const result=callback(lock);note('lock-release',{name});return result;});};
    addEventListener('storage',event=>{if(event.key===KEY)note('storage-event',{old:event.oldValue,value:event.newValue});});
   },KEY);
   await p.addScriptTag({content:source});
 }));
 const snap=p=>p.evaluate(()=>SukunFrequencySetsR1120.snapshot());
 const store=()=>a.evaluate(KEY=>JSON.parse(localStorage.getItem(KEY)),KEY);
 const diagnostics=()=>Promise.all([a,b].map(p=>p.evaluate(KEY=>({raw:localStorage.getItem(KEY),snapshot:SukunFrequencySetsR1120.snapshot(),status:document.querySelector('#r1120SetStatus').textContent,draftName:document.querySelector('#r1120Setname')?.value,trace:storageTrace}),KEY)));
 const create=async(p,name)=>{await p.locator('#r1120SetCreate').click();await p.locator('#r1120Setname').fill(name);};
 const submit=p=>p.locator('form').evaluate(f=>f.requestSubmit());
 const settled=p=>p.waitForFunction(()=>!document.querySelector('#r1120SetCreate').disabled);
 const hold=async()=>{await gate.evaluate(KEY=>{window.release=null;window.lockHeld=false;navigator.locks.request(KEY+'.write',()=>new Promise(resolve=>{window.release=resolve;window.lockHeld=true;}));},KEY);await gate.waitForFunction(()=>lockHeld);};
 const release=()=>gate.evaluate(()=>release());
 check((await snap(a)).sets[0].settings.fm===false,'legacy settings normalize without destructive migration');
 check((await store()).sets[0].settings.fm===undefined,'read does not rewrite old data');
 await Promise.all([create(a,'Added A'),create(b,'Added B')]);await hold();await Promise.all([submit(a),submit(b)]);
 check((await store()).sets.length===1,'queued writers do not write outside exclusive lock');
 check(await a.getByRole('button',{name:'Cancel',exact:true}).isDisabled(),'draft cannot be cancelled during queued save');
 await release();await Promise.all([settled(a),settled(b)]);
 const added=await store();
 if(added.sets.map(s=>s.name).sort().join('|')!=='Added A|Added B|Original')console.error('CONCURRENCY_DIAGNOSTICS',JSON.stringify(await diagnostics(),null,2));
 check(added.sets.map(s=>s.name).sort().join('|')==='Added A|Added B|Original','simultaneous independent additions both survive; actual='+JSON.stringify(added));
 // Both drafts capture the same base. Only one may replace that record.
 for(const p of [a,b]){await p.getByRole('button',{name:'Edit: Original',exact:true}).click();await p.locator('#r1120Setname').fill(p===a?'Winner A':'Winner B');}
 await hold();await Promise.all([submit(a),submit(b)]);await release();await Promise.all([settled(a),settled(b)]);
 const winner=(await store()).sets.find(s=>s.id==='set_old').name;
 check(['Winner A','Winner B'].includes(winner),'one concurrent edit wins');
 const loser=winner==='Winner A'?b:a;
 check((await snap(loser)).draftOpen,'stale editor draft remains open');
 check((await loser.locator('#r1120SetStatus').textContent()).includes('another tab'),'stale edit explains conflict');
 check((await loser.locator('#r1120Setname').inputValue())===(winner==='Winner A'?'Winner B':'Winner A'),'stale typed draft preserved');
 await submit(loser);await settled(loser);check((await store()).sets.find(s=>s.id==='set_old').name===winner,'retry cannot overwrite newer record');
 await loser.getByRole('button',{name:'Cancel',exact:true}).click();
 // Capture a delete operation before the winning edit, while both wait on lock.
 const editor=winner==='Winner A'?a:b,deleter=loser;
 await editor.getByRole('button',{name:`Edit: ${winner}`,exact:true}).click();await editor.locator('#r1120Setname').fill('Fresh edit');
 await hold();await submit(editor);
 await deleter.getByRole('button',{name:`Delete: ${winner}`,exact:true}).click();
 await release();await Promise.all([settled(editor),settled(deleter)]);
 check((await store()).sets.some(s=>s.name==='Fresh edit'),'stale queued delete cannot remove newer edit');
 check((await deleter.locator('#r1120SetStatus').textContent()).includes('another tab'),'stale delete reports conflict');
 // Distinct existing records may be edited concurrently.
 for(const [p,name] of [[a,'Added A'],[b,'Added B']]){await p.getByRole('button',{name:`Edit: ${name}`,exact:true}).click();await p.locator('#r1120Setname').fill(name+' revised');}
 await hold();await Promise.all([submit(a),submit(b)]);await release();await Promise.all([settled(a),settled(b)]);
 check((await store()).sets.filter(s=>s.name.endsWith('revised')).length===2,'different-record edits are merged');
 check(await a.evaluate(()=>calls.length===0),'save/edit/delete do not invoke audio bridge');
 await a.getByRole('button',{name:'Load: Fresh edit',exact:true}).click();await settled(a);
 check(await a.evaluate(()=>calls.length===1&&calls[0][1].play===false),'load remains explicit without playback');
 check(await a.evaluate(()=>localStorage.getItem('sukun.myfreq')==='legacy untouched'),'microphone legacy store untouched');
 // Unsupported locks must retain readable saved records with an honest warning.
 const unsupported=await page();await unsupported.evaluate(()=>Object.defineProperty(navigator,'locks',{value:undefined}));await unsupported.addScriptTag({content:source});
 check((await snap(unsupported)).readOnly&&(await snap(unsupported)).sets.length===3,'unsupported locks preserve readable data and prohibit writing');
 check((await unsupported.locator('.r1120-set-storage').textContent()).includes('safe cross-tab'),'unsupported explanation is explicit');
 await unsupported.evaluate(()=>{I18N.lang='tr';dispatchEvent(new Event('sukun:languagechange'));});
 check((await unsupported.locator('.r1120-set-storage').textContent()).includes('sekmeler arası'),'unsupported explanation localizes');
 // Corruption introduced while a valid draft is open must not be overwritten.
 await create(a,'Keep draft');await a.evaluate(KEY=>localStorage.setItem(KEY,'{broken'),KEY);await submit(a);
 await a.waitForFunction(()=>SukunFrequencySetsR1120.snapshot().readOnly);
 check(await a.evaluate(KEY=>localStorage.getItem(KEY)==='{broken',KEY),'malformed store is never overwritten');
 check((await snap(a)).draftOpen&&await a.locator('#r1120Setname').inputValue()==='Keep draft','corruption preserves unfinished draft');
 console.log(JSON.stringify({passed:checks,scope:'Native Chromium Web Locks with separate same-origin pages; isolated shipped module, no audio/device acceptance'},null,2));
 } finally {if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
