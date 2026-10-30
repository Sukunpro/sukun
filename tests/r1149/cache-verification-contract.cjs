'use strict';
// Exact shipped cache verifier. Synthetic historical bytes exercise all digest
// admissions without a browser, personal data, network or production writes.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..')),output=process.argv[3];
const source=fs.readFileSync(path.join(root,'sw.js'),'utf8'),hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const base='https://sukun.test/sw.js',build='r1148',name='sukun-r1148-synthetic-concurrent-verification';
const results=[];
async function test(name,fn){try{results.push({name,passed:true,evidence:await fn()});}catch(error){results.push({name,passed:false,error:error.stack||String(error)});}}
function fixture(mode){
 const stores=new Map(),writes=[],reads=[];let active=0,maxActive=0;
 const entries=Array.from({length:7},(_,i)=>({url:'./assets/runtime/synthetic-'+i+'.js?v='+build,bytes:'void '+i+';'}));
 const marker={build,runtime:entries.map(e=>({url:e.url,sha256:hash(e.bytes)}))};
 const html='<meta name="sukun-build" content="'+build+'">'+marker.runtime.map(e=>'<script src="'+e.url+'" integrity="sha256-'+Buffer.from(e.sha256,'hex').toString('base64')+'"></script>').join('');marker.shell={sha256:hash(html)};
 if(mode==='duplicate')marker.runtime[6]={...marker.runtime[0]};
 const absolute=x=>new URL(typeof x==='string'?x:x.url,base).href;
 const store=new Map(),put=(key,value)=>store.set(absolute(key),new Response(typeof value==='string'?value:JSON.stringify(value)));
 stores.set(name,store);put('./nero.html',html);put('./manifest.webmanifest',{short_name:'SÜKÛN',start_url:'./nero.html?v='+build});put('./sukun-build-'+build+'.json',marker);put('./sukun-cache-meta-'+build+'.json',{v:build,cache:name,complete:true});
 for(const [i,e] of entries.entries())if(mode!=='missing'||i!==6)put(e.url,mode==='corrupt'&&i===6?'tampered':e.bytes);
 const caches={async open(cacheName){if(!stores.has(cacheName))stores.set(cacheName,new Map());const map=stores.get(cacheName);return{async match(key){const url=absolute(key);reads.push(url);return map.get(url)?.clone();},async put(key,value){writes.push({name:cacheName,key:absolute(key)});map.set(absolute(key),value.clone());}};}};
 const subtle={async digest(...args){active++;maxActive=Math.max(active,maxActive);try{await new Promise(setImmediate);return await crypto.webcrypto.subtle.digest(...args);}finally{active--;}}};
 const context={console,URL,Promise,Math,Number,String,Object,Set,Map,Array,Uint8Array,TextEncoder,Response,Headers,AbortController,DOMException,crypto:{subtle},btoa,setTimeout,clearTimeout,Date,caches,self:{location:new URL(base),clients:{matchAll:async()=>[]},addEventListener(){}},testCacheName:name};
 vm.createContext(context);vm.runInContext(source,context,{filename:'shipped-sw.js'});
 return{run:()=>vm.runInContext('recoveryVerifyCache(testCacheName,true)',context),reads,writes,get maxActive(){return maxActive;},runtimeReads:()=>reads.filter(url=>url.includes('/assets/runtime/synthetic-'))};
}
(async()=>{
 await test('All exact runtime bytes pass with at most three concurrent digests',async()=>{const f=fixture(),result=await f.run();assert.equal(result?.build,build);assert.equal(result.runtimeCount,7);assert.equal(f.runtimeReads().length,7);assert.equal(f.maxActive,3);assert.equal(f.writes.length,1);assert.equal(f.writes[0].name,'sukun-recovery-control-v1');return{runtimeReads:f.runtimeReads().length,maxConcurrentDigests:f.maxActive};});
 for(const mode of ['corrupt','missing'])await test(mode+' final runtime fails closed without proof enrollment',async()=>{const f=fixture(mode);assert.equal(await f.run(),null);assert.equal(f.writes.length,0);assert(f.runtimeReads().some(url=>url.includes('synthetic-6')));assert(f.maxActive<=3);});
 await test('Duplicate versioned runtime URLs fail before any runtime read',async()=>{const f=fixture('duplicate');assert.equal(await f.run(),null);assert.equal(f.runtimeReads().length,0);assert.equal(f.writes.length,0);});
 const report={build:'r1149',method:'Complete shipped worker evaluated in Node VM. Synthetic seven-member historical cache, actual Response and native SHA-256; asynchronous digest delivery measures the bound. No browser or physical-device timing claim.',sourceSha256:hash(source),passed:results.filter(r=>r.passed).length,total:results.length,allPassed:results.every(r=>r.passed),results};
 if(output){fs.mkdirSync(path.dirname(path.resolve(output)),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');}console.log(JSON.stringify(report,null,2));if(!report.allPassed)process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1;});
