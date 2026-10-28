'use strict';
// r1138 acceptance: real worker upgrade from frozen r1137, offline reload and supported rollback.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const root=path.resolve(process.argv[2]),baseline=path.resolve(process.argv[3]),output=path.resolve(process.argv[4]);
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
let serving=baseline,online=true,browser,context,page,server;
const report={startedAt:new Date().toISOString(),evidenceOrigin:'Fresh r1138 execution; adapted r1120 recovery harness; baseline advanced to immutable r1137, candidate r1138; same eight assertions; immutable r1120 feature filenames are unchanged',method:'Disposable real Chromium with native ServiceWorker, CacheStorage, IndexedDB, and server-enforced offline; production bytes served unchanged. Synthetic personal WAV clip and counter only.',limitations:['Linux headless Chromium only; not physical Android, audible output or OS lock acceptance.','Worker recovery protocol invoked directly with explicit confirm in disposable profile; recovery UI click acceptance is separate.'],checks:[],requests:[],blocked:[],statusSamples:[]};
const mime={'.html':'text/html','.js':'application/javascript','.json':'application/json','.css':'text/css','.webmanifest':'application/manifest+json','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.wav':'audio/wav','.mp3':'audio/mpeg'};
async function check(name,fn){const evidence=await fn();report.checks.push({name,passed:true,evidence});console.log(name+' PASS');}
async function ask(data){return page.evaluate(async data=>{const worker=navigator.serviceWorker.controller;if(!worker)throw Error('No controller');return new Promise((resolve,reject)=>{const ch=new MessageChannel(),t=setTimeout(()=>reject(Error('Worker message timeout '+data.type)),60000);ch.port1.onmessage=e=>{clearTimeout(t);resolve(e.data)};worker.postMessage(data,[ch.port2]);});},data);}
async function status(build){for(let i=0;i<60;i++){const s=await ask({type:'STATUS'});report.statusSamples.push(s);if(s.v===build&&s.complete)return s;await page.waitForTimeout(500);}throw Error('No complete '+build);}
async function sentinel(){return page.evaluate(async()=>{const clip=await new Promise((resolve,reject)=>{const q=indexedDB.open('sukunRec',1);q.onerror=()=>reject(q.error);q.onsuccess=()=>{const db=q.result,r=db.transaction('clips').objectStore('clips').get('g8-synthetic-clip');r.onerror=()=>reject(r.error);r.onsuccess=async()=>{const bytes=Array.from(new Uint8Array(await r.result.arrayBuffer()));db.close();resolve({type:r.result.type,bytes})}}});return{counter:localStorage.getItem('sukun.esmaCount'),clip};});}
async function preserved(){const actual=await sentinel();assert.deepEqual(actual,report.synthetic);return actual;}
async function buildIs(build){const values=await page.locator('meta[name="sukun-build"]').evaluateAll(nodes=>nodes.map(n=>n.content));assert(values.length>0);assert(values.every(x=>x===build),JSON.stringify(values));return values;}
(async()=>{try{
report.baselineSourceHashes=Object.fromEntries(['index.html','sw.js','sukun-build-r1137.json','sukun-site-assets-r1137.json'].map(f=>[f,sha(fs.readFileSync(path.join(baseline,f)))]));
report.sourceHashes=Object.fromEntries(['index.html','sw.js','sukun-build-r1138.json','sukun-site-assets-r1138.json'].map(f=>[f,sha(fs.readFileSync(path.join(root,f)))]));
server=http.createServer((req,res)=>{if(!online){report.blocked.push(req.url);req.socket.destroy();return}let url=new URL(req.url,'http://127.0.0.1');if(url.pathname==='/g8-test.html'){res.writeHead(200,{'Content-Type':'text/html'}).end('<!doctype html><title>Disposable G8 acceptance</title>');return}const file=path.resolve(serving,'.'+(url.pathname==='/'?'/index.html':decodeURIComponent(url.pathname)));if(!file.startsWith(serving+path.sep)){res.writeHead(403).end();return}fs.readFile(file,(e,b)=>{if(e){res.writeHead(404).end();return}report.requests.push({at:new Date().toISOString(),release:serving===baseline?'baseline':'candidate',path:url.pathname,sha256:sha(b)});res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'}).end(b)});});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-gpu']});context=await browser.newContext({locale:'tr-TR',serviceWorkers:'allow'});await context.route('**/*',route=>{const u=route.request().url();return u.startsWith(origin+'/')||/^(data|blob):/.test(u)?route.continue():route.abort()});page=await context.newPage();page.setDefaultTimeout(60000);report.browser=browser.version();
await page.goto(origin+'/g8-test.html');await page.evaluate(()=>{window.__g8WorkerEvents=[];navigator.serviceWorker.addEventListener('message',e=>__g8WorkerEvents.push({...e.data,observedAt:new Date().toISOString()}))});
await page.evaluate(async()=>{localStorage.setItem('sukun.esmaCount',JSON.stringify({'G8 synthetic counter':37}));localStorage.setItem('sukun.obDone','1');localStorage.setItem('sukun.onboardSeen','1');const db=await new Promise((resolve,reject)=>{const q=indexedDB.open('sukunRec',1);q.onupgradeneeded=()=>q.result.createObjectStore('clips');q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error)});const wav=new ArrayBuffer(204),v=new DataView(wav),t=(offset,s)=>{for(let i=0;i<s.length;i++)v.setUint8(offset+i,s.charCodeAt(i))};t(0,'RIFF');v.setUint32(4,196,true);t(8,'WAVEfmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,8000,true);v.setUint32(28,16000,true);v.setUint16(32,2,true);v.setUint16(34,16,true);t(36,'data');v.setUint32(40,160,true);await new Promise((resolve,reject)=>{const tx=db.transaction('clips','readwrite');tx.objectStore('clips').put(new Blob([wav],{type:'audio/wav'}),'g8-synthetic-clip');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});db.close();await navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'});await navigator.serviceWorker.ready;});
await page.waitForFunction(()=>!!navigator.serviceWorker.controller);report.synthetic=await sentinel();
await check('Baseline r1137 installs and verifies real cached release',()=>status('r1137'));
serving=root;
await check('Candidate waiting worker verifies and activates r1138',async()=>{
  // Retain the exact reply before asserting. A worker can become controlling
  // while still activating, so registration state alone cannot prove success.
  report.activation={startedAt:new Date().toISOString()};
  const result=await page.evaluate(async()=>{
    const reg=await navigator.serviceWorker.getRegistration();
    const row=w=>w?{state:w.state,scriptURL:w.scriptURL}:null;
    const snapshot=()=>({at:new Date().toISOString(),controller:row(navigator.serviceWorker.controller),active:row(reg.active),waiting:row(reg.waiting),installing:row(reg.installing)});
    await reg.update();let worker;
    for(let i=0;i<240;i++){worker=reg.waiting;if(worker)break;await new Promise(r=>setTimeout(r,250))}
    if(!worker)throw Error('No waiting candidate after update');
    const before=snapshot(),requestedAt=Date.now();
    const response=await new Promise((resolve,reject)=>{
      const ch=new MessageChannel(),t=setTimeout(()=>{ch.port1.close();reject(Error('skip timeout'))},60000);
      ch.port1.onmessage=e=>{clearTimeout(t);ch.port1.close();resolve(e.data)};
      worker.postMessage({type:'SKIP_WAITING'},[ch.port2]);
    });
    return{before,response,responseElapsedMs:Date.now()-requestedAt,afterReply:snapshot()};
  });
  Object.assign(report.activation,result);
  if(result.response?.ok!==true){
    // Observe the uncertain outcome without retrying SKIP_WAITING or changing
    // caches. Later activation does not turn an unsuccessful protocol reply
    // into a pass; these samples only distinguish a timeout from bad bytes.
    report.activation.afterFailure=await page.evaluate(async()=>{
      const samples=[],start=Date.now(),reg=await navigator.serviceWorker.getRegistration();
      do{
        const active=reg.active,controller=navigator.serviceWorker.controller;
        samples.push({at:new Date().toISOString(),active:active?.state||null,controller:controller?.state||null,waiting:reg.waiting?.state||null});
        if(active?.state==='activated'||!active)break;
        await new Promise(r=>setTimeout(r,500));
      }while(Date.now()-start<30000);
      return samples;
    });
    try{report.activation.statusAfterFailure=await ask({type:'STATUS'})}catch(error){report.activation.statusAfterFailureError=String(error)}
  }
  assert.equal(result.response?.ok,true,JSON.stringify(report.activation));
  assert.equal(result.response.v,'r1138');assert.equal(result.response.complete,true);
  await page.waitForFunction(()=>navigator.serviceWorker.controller?.state==='activated');
  return{...report.activation,status:await status('r1138')};
});
await check('Upgrade preserves synthetic personal recording and counter',preserved);
await check('Retained real baseline is offered for verified rollback',async()=>{const list=await ask({type:'RECOVERY_LIST'});assert.equal(list.ok,true);assert.equal(list.current,'r1138');assert(list.versions.some(x=>x.build==='r1137'));report.previous=list.versions.find(x=>x.build==='r1137');return list});
online=false;await context.setOffline(true);
await check('Candidate reopens offline with recent extracted styles and Berhetiyye consistency styles available',async()=>{await page.goto(origin+'/nero.html',{waitUntil:'load',timeout:120000});await buildIs('r1138');const styles=await page.evaluate(async()=>{const out=[];for(const id of ['sukun-r1029-surface-clarity','sukun-r1031-personal-centre-glass','sukun-r917-scene-info','sukun-r1018-recording-panel-layout','sukun-r1125-berhet-consistency','sukun-r1133-premium-jewels','sukun-r1135-responsive','sukun-r1137-fit','sukun-r1138-dock-fit','sukun-r1138-panels']){const el=document.getElementById(id);if(!el)throw Error('Missing '+id);const r=await fetch(el.href);if(!r.ok)throw Error('Uncached '+el.href);const text=await r.text();out.push({id,href:el.getAttribute('href'),bytes:new TextEncoder().encode(text).length,loaded:!!el.sheet,rules:el.sheet?.cssRules.length})}return out});assert(styles.every(x=>x.loaded&&x.rules>0&&x.bytes>0));const runtime=await page.evaluate(async()=>{const files=['frequency-workbench-r1120.js','frequency-workbench-r1120.css','frequency-sets-r1120.js','frequency-sets-r1120.css'];const rows=[];for(const name of files){const response=await fetch('./assets/runtime/'+name);if(!response.ok)throw Error('Uncached '+name);rows.push({name,bytes:(await response.arrayBuffer()).byteLength})}if(!window.SukunFrequencyR1120||!window.SukunFrequencySetsR1120)throw Error('Frequency APIs unavailable offline');return rows});return{styles,runtime,status:await status('r1138'),preserved:await preserved()}});
await check('Supported rollback pins retained real r1137',async()=>{const r=await ask({type:'RECOVERY_ROLLBACK',confirm:true,cache:report.previous.cache,build:'r1137'});assert.equal(r.ok,true,JSON.stringify(r));return r});
await check('Rollback reopens r1137 offline and preserves synthetic data',async()=>{await page.goto(origin+'/nero.html',{waitUntil:'load',timeout:120000});await buildIs('r1137');return{status:await status('r1137'),preserved:await preserved()}});
await check('Supported current recovery restores r1138 offline and preserves data',async()=>{const r=await ask({type:'RECOVERY_CURRENT',confirm:true});assert.equal(r.ok,true,JSON.stringify(r));await page.goto(origin+'/nero.html',{waitUntil:'load',timeout:120000});await buildIs('r1138');return{status:await status('r1138'),preserved:await preserved()}});
}catch(e){report.fatal=e.stack;report.workerEvents=await page?.evaluate(()=>window.__g8WorkerEvents).catch(()=>null);report.registration=await page?.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();const row=w=>w?{state:w.state,scriptURL:w.scriptURL}:null;return{controller:row(navigator.serviceWorker.controller),active:row(r?.active),waiting:row(r?.waiting),installing:row(r?.installing)}}).catch(()=>null);console.error(e)}finally{if(browser)await browser.close();if(server)await new Promise(r=>server.close(r));report.finishedAt=new Date().toISOString();report.passed=report.checks.length;report.expectedChecks=8;report.sourceSha256=sha(fs.readFileSync(path.join(root,'index.html')));report.scriptSha256=sha(fs.readFileSync(__filename));fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:report.passed,total:report.expectedChecks,fatal:report.fatal,output}));if(report.fatal||report.passed!==report.expectedChecks)process.exitCode=1;}})();
