'use strict';
// Native same-origin renderer pages test the shipped IndexedDB authority.
const assert=require('node:assert/strict'),http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const source=fs.readFileSync(path.resolve(__dirname,'../../assets/runtime/frequency-sets-r1120.js'),'utf8');
const KEY='sukun.frequencySets.v2',DB='sukun-frequency-sets-r1241';
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
 const mount=async p=>{await p.addScriptTag({content:source});await p.evaluate(()=>SukunFrequencySetsR1120.ready);};
 const a=await page(),b=await page(),gate=await page();
 const legacyRaw=JSON.stringify({version:2,sets:[original]});
 await a.evaluate(({KEY,legacyRaw})=>{localStorage.setItem(KEY,legacyRaw);localStorage.setItem('sukun.myfreq','legacy untouched');},{KEY,legacyRaw});
 await Promise.all([a,b].map(mount));
 const snap=p=>p.evaluate(()=>SukunFrequencySetsR1120.snapshot());
 const store=()=>a.evaluate(()=>SukunFrequencySetsR1120.exportPayload());
 const diagnostics=()=>Promise.all([a,b].map(p=>p.evaluate(KEY=>({raw:localStorage.getItem(KEY),snapshot:SukunFrequencySetsR1120.snapshot(),status:document.querySelector('#r1120SetStatus').textContent,draftName:document.querySelector('#r1120Setname')?.value}),KEY)));
 const create=async(p,name)=>{await p.locator('#r1120SetCreate').click();await p.locator('#r1120Setname').fill(name);};
 const submit=p=>p.locator('form').evaluate(f=>f.requestSubmit());
 const settled=p=>p.waitForFunction(()=>!SukunFrequencySetsR1120.snapshot().busy);
 // Hold a real transaction using a request chain. Both writers queue behind
 // it; release is explicit, not a timeout or localStorage visibility workaround.
 const hold=async()=>{await gate.evaluate(DB=>new Promise((resolve,reject)=>{
   const open=indexedDB.open(DB,1);open.onerror=()=>reject(open.error);
   open.onsuccess=()=>{const db=open.result,tx=db.transaction('state','readwrite'),st=tx.objectStore('state');window.releaseGate=false;window.heldRow=null;
    window.gateFinished=new Promise((done,fail)=>{tx.oncomplete=()=>{db.close();done();};tx.onabort=()=>{db.close();fail(tx.error);};});
    function keep(){const rq=st.get('sets');rq.onsuccess=()=>{window.heldRow=rq.result;resolve();if(!window.releaseGate)keep();};}keep();
   };
 }),DB);};
 const release=()=>gate.evaluate(async()=>{window.releaseGate=true;await window.gateFinished;});
 check((await snap(a)).sets[0].settings.fm===false,'legacy settings normalize without destructive migration');
 check(await a.evaluate(({KEY,legacyRaw})=>localStorage.getItem(KEY)===legacyRaw,{KEY,legacyRaw}),'migration preserves exact legacy rollback copy');
 check((await snap(a)).epoch===(await snap(b)).epoch,'simultaneous bootstrap has one canonical epoch');
 await Promise.all([create(a,'Added A'),create(b,'Added B')]);await hold();await Promise.all([submit(a),submit(b)]);
 check(await gate.evaluate(()=>heldRow.sets.length===1),'queued writers cannot write outside IDB transaction');
 check(await a.getByRole('button',{name:'Cancel',exact:true}).isDisabled(),'draft cannot be cancelled during queued save');
 await release();await Promise.all([settled(a),settled(b)]);
 const added=await store();
 if(added.sets.map(s=>s.name).sort().join('|')!=='Added A|Added B|Original')console.error('CONCURRENCY_DIAGNOSTICS',JSON.stringify(await diagnostics(),null,2));
 check(added.sets.map(s=>s.name).sort().join('|')==='Added A|Added B|Original','simultaneous independent additions both survive; actual='+JSON.stringify(added));
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
 const editor=winner==='Winner A'?a:b,deleter=loser;
 await editor.getByRole('button',{name:`Edit: ${winner}`,exact:true}).click();await editor.locator('#r1120Setname').fill('Fresh edit');
 await hold();await submit(editor);await deleter.getByRole('button',{name:`Delete: ${winner}`,exact:true}).click();
 await release();await Promise.all([settled(editor),settled(deleter)]);
 check((await store()).sets.some(s=>s.name==='Fresh edit'),'stale queued delete cannot remove newer edit');
 check((await deleter.locator('#r1120SetStatus').textContent()).includes('another tab'),'stale delete reports conflict');
 for(const [p,name]of [[a,'Added A'],[b,'Added B']]){await p.getByRole('button',{name:`Edit: ${name}`,exact:true}).click();await p.locator('#r1120Setname').fill(name+' revised');}
 await hold();await Promise.all([submit(a),submit(b)]);await release();await Promise.all([settled(a),settled(b)]);
 check((await store()).sets.filter(s=>s.name.endsWith('revised')).length===2,'different-record edits merge');
 check(await a.evaluate(()=>calls.length===0),'save/edit/delete do not invoke audio');
 await a.getByRole('button',{name:'Load: Fresh edit',exact:true}).click();await settled(a);
 check(await a.evaluate(()=>calls.length===1&&calls[0][1].play===false),'load applies without requesting playback');
 check(await a.evaluate(()=>localStorage.getItem('sukun.myfreq')==='legacy untouched'),'microphone legacy store untouched');
 // Aborting after request success rolls back canonical data; UI success waits
 // for transaction oncomplete, not request onsuccess.
 await a.getByRole('button',{name:'Edit: Fresh edit',exact:true}).click();await a.locator('#r1120Setname').fill('Must abort');
 await a.evaluate(()=>{window.originalPut=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(...args){const rq=originalPut.apply(this,args);rq.addEventListener('success',()=>this.transaction.abort(),{once:true});return rq;};});
 await submit(a);await settled(a);await a.evaluate(()=>{IDBObjectStore.prototype.put=originalPut;});
 check((await store()).sets.some(s=>s.name==='Fresh edit')&&!(await store()).sets.some(s=>s.name==='Must abort'),'request-success then abort does not persist');
 check((await snap(a)).draftOpen&&(await a.locator('#r1120SetStatus').textContent()).includes('Could not save'),'aborted save keeps draft without false success');
 await a.getByRole('button',{name:'Cancel',exact:true}).click();
 const reload=await page();await mount(reload);check((await snap(reload)).sets.length===3,'new renderer reads latest IDB records');
 check(await a.evaluate(({KEY,legacyRaw})=>localStorage.getItem(KEY)===legacyRaw,{KEY,legacyRaw}),'all mutations leave old-version rollback snapshot unchanged');
 const unsupported=await page();await unsupported.evaluate(()=>Object.defineProperty(window,'indexedDB',{value:undefined}));await mount(unsupported);
 check((await snap(unsupported)).readOnly&&(await snap(unsupported)).sets.length===1,'unavailable IDB shows preserved legacy data read-only');
 check((await unsupported.locator('.r1120-set-storage').textContent()).includes('database could not'),'unavailable IDB explanation is explicit');
 await unsupported.evaluate(()=>{I18N.lang='tr';dispatchEvent(new Event('sukun:languagechange'));});
 check((await unsupported.locator('.r1120-set-storage').textContent()).includes('veritabanı'),'unavailable IDB explanation localizes');
 await create(a,'Keep draft');await gate.evaluate(KEY=>localStorage.setItem(KEY,'{broken'),KEY);await a.waitForFunction(()=>SukunFrequencySetsR1120.snapshot().storageProblem==='legacy');await submit(a);
 check((await snap(a)).readOnly&&(await snap(a)).sets.length===3,'old-version corruption cannot replace canonical sets');
 check(await a.evaluate(KEY=>localStorage.getItem(KEY)==='{broken',KEY),'divergent legacy copy is preserved, not overwritten by mirror');
 check((await snap(a)).draftOpen&&await a.locator('#r1120Setname').inputValue()==='Keep draft','divergence preserves unfinished draft');
 const exportFailed=await a.evaluate(async()=>{try{await SukunFrequencySetsR1120.exportPayload();return false;}catch(_){return true;}});
 check(exportFailed,'conflicted full export fails rather than silently dropping either copy');
 const [download]=await Promise.all([a.waitForEvent('download'),a.getByRole('button',{name:'Download conflicting copies',exact:true}).click()]);
 const conflict=JSON.parse(fs.readFileSync(await download.path(),'utf8'));
 check(conflict.app==='SUKUN-Frequency-Conflict'&&conflict.canonical.sets.length===3&&conflict.legacyRaw==='{broken','explicit conflict download contains both copies without data loss');
 check((await snap(a)).readOnly&&await a.evaluate(KEY=>localStorage.getItem(KEY)==='{broken',KEY),'conflict download never changes or unblocks storage');
 console.log(JSON.stringify({passed:checks,scope:'Native Chromium IndexedDB transactions across separate same-origin renderer pages; isolated shipped module, no audio/device acceptance'},null,2));
 } finally {if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
