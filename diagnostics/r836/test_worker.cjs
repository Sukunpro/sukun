'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');const root=path.resolve(__dirname,'../..'),code=fs.readFileSync(path.join(root,'sw.js'),'utf8'),results=[];
async function test(name,fn){try{await fn();results.push({name,status:'PASS'})}catch(e){results.push({name,status:'FAIL',error:e.stack})}}
function fixture(){
 const scope='https://example.test/sukun/',events={},maps=new Map();let online=true,override={};
 const url=x=>new URL(typeof x==='string'?x:x.url,scope).href;
 class Req extends Request{constructor(x,o){super(typeof x==='string'?url(x):x,o)}}
 const caches={async open(name){if(!maps.has(name)){const data=new Map();maps.set(name,{data,async put(k,r){data.set(url(k),r.clone())},async match(k,o={}){for(const [u,r]of data){const a=new URL(u),b=new URL(url(k));if(o.ignoreSearch?a.pathname===b.pathname:u===b.href)return r.clone()}}})}return maps.get(name)},async keys(){return [...maps.keys()]}};
 const self={location:new URL('sw.js',scope),registration:{update:async()=>{}},clients:{claim:async()=>{},matchAll:async()=>[]},skipWaiting:async()=>{},addEventListener:(k,f)=>events[k]=f};
 const c={self,caches,URL,Request:Req,Response,AbortController,Promise,setTimeout,clearTimeout,console,fetch:async req=>{if(!online)throw Error('offline');const p=new URL(url(req)).pathname.slice('/sukun/'.length);if(p in override)return override[p]();const file=path.join(root,p);return fs.existsSync(file)?new Response(fs.readFileSync(file)):new Response('missing',{status:404})}};
 vm.createContext(c);vm.runInContext(code,c);return{c,caches,request:p=>new Req(p),offline:()=>online=false,override};
}
(async()=>{
 await test('HTML build parser accepts either metadata attribute order',()=>{const f=fixture();assert.equal(f.c.buildOfHtml('<meta content="r836" name="sukun-build"/>'),'r836');assert.equal(f.c.buildOfHtml('<meta name="sukun-build" content="r836">'),'r836')});
 await test('Matching HTML, manifest and marker form a complete shell',async()=>{const f=fixture(),m=await f.c.prepareShell();assert(m.complete);assert.equal(m.errors.length,0)});
 await test('Mismatched manifest leaves shell incomplete without killing worker installation',async()=>{const f=fixture();f.override['manifest.webmanifest']=()=>new Response(JSON.stringify({short_name:'SÜKÛN',start_url:'./nero.html?v=r999'}));const m=await f.c.prepareShell();assert(!m.complete);assert(!m.manifest)});
 await test('Mismatched HTML is never committed as the new shell',async()=>{const f=fixture();f.override['nero.html']=()=>new Response('<meta name="sukun-build" content="r999">');const m=await f.c.prepareShell();assert(!m.complete);assert(!m.shell);assert.equal(await f.c.cachedShellFrom('sukun-r836-20260916a'),null)});
 await test('Offline versioned manifest remains JSON and resolves from current cache',async()=>{const f=fixture();await f.c.prepareShell();f.offline();const r=await f.c.assetResponse(f.request('manifest.webmanifest?v=r836'));assert.equal((await r.json()).version,'r836')});
 await test('Missing images return 404, never application HTML',async()=>{const f=fixture();await f.c.prepareShell();const r=await f.c.assetResponse(f.request('assets/not-present.png'));assert.equal(r.status,404);assert(!(await r.text()).includes('sukun-build'))});
 await test('Current cached asset takes priority over older release asset',async()=>{const f=fixture();const old=await f.caches.open('sukun-r798-old'),cur=await f.caches.open('sukun-r836-20260916a');await old.put('assets/a.png',new Response('old'));await cur.put('assets/a.png',new Response('current'));f.offline();assert.equal(await(await f.c.assetResponse(f.request('assets/a.png'))).text(),'current')});
 await test('Offline navigation falls back to the verified current shell',async()=>{const f=fixture();await f.c.prepareShell();f.offline();const r=await f.c.navigationResponse(f.request('nero.html?v=r836'));assert.equal(f.c.buildOfHtml(await r.text()),'r836')});
 await test('Newer network HTML is served and not replaced with stale cached HTML',async()=>{const f=fixture();await f.c.prepareShell();f.override['nero.html']=()=>new Response('<meta name="sukun-build" content="r837">');assert.equal(f.c.buildOfHtml(await(await f.c.navigationResponse(f.request('nero.html'))).text()),'r837')});
 await test('Failed refresh preserves the previously cached verified shell',async()=>{const f=fixture();await f.c.prepareShell();f.offline();await f.c.prepareShell();const shell=await f.c.cachedShellFrom('sukun-r836-20260916a');assert.equal(shell.build,'r836')});
 await test('Concurrent shell requests share a preparation and failures can be retried',async()=>{const f=fixture();f.offline();const a=f.c.prepareShell(),b=f.c.prepareShell();assert.equal(a,b);assert(!(await a).complete);assert.notEqual(f.c.prepareShell(),a)});
 const out={total:results.length,passed:results.filter(x=>x.status==='PASS').length,results};out.failed=out.total-out.passed;fs.writeFileSync(path.join(__dirname,'worker-results.json'),JSON.stringify(out,null,2));console.log(JSON.stringify(out,null,2));if(out.failed)process.exitCode=1;
})();
