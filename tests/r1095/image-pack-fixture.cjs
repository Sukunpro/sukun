'use strict';
// Controlled CacheStorage/network leaves around the complete production worker.
// Only the manifest's expected SHA can be replaced to exercise small, explicitly
// labelled fixture bytes. The worker implementation is neither copied nor mocked.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const origin='https://image-pack.test',scope=origin+'/sukun/';
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const image=(bytes,extra={})=>new Response(bytes,{headers:{'Content-Type':'image/webp',...extra}});
const tekkePath='./assets/scenes/tekke-r1014/berhet-billur.webp',tekkeBytes=Buffer.from('labelled core Tekke prerequisite');
function fixture(root,options={}){
 let source=fs.readFileSync(path.join(root,'sw.js'),'utf8');
 if(options.manifest){
  const digest=hash(Buffer.from(JSON.stringify(options.manifest)));
  const changed=source.replace(/(const IMAGE_PACK_SHA256\s*=\s*)['"][a-f0-9]{64}['"]/,"$1'"+digest+"'");
  assert.notEqual(changed,source,'Production manifest hash constant is available for the labelled fixture descriptor');source=changed;
  const build=source.match(/^const SURUM\s*=\s*'(r\d+)';/m)[1],manifestPath=source.match(/const IMAGE_PACK_MANIFEST\s*=\s*['"]([^'"]+)/)[1];
  const descriptors=[{url:manifestPath+'?v='+build,sha256:digest},{url:tekkePath+'?v='+build,sha256:hash(tekkeBytes)},...options.manifest.assets.filter(row=>row.kind==='navigation').map(row=>({url:row.url+'?v='+build,sha256:row.sha256}))];
  // Small fixture metadata still passes through the actual complete core
  // verifier, proof enrollment, manifest reader, package parser and handlers.
  source=source.replace(/^const REQUIRED_RUNTIME\s*=\s*\[[^\n]+\];/m,'const REQUIRED_RUNTIME = '+JSON.stringify(descriptors)+';');
 }
 const stores=options.stores||new Map(),calls={cache:[],fetch:[],estimate:[],recording:[]},listeners={},clients=new Map([['client-a',{id:'client-a',type:'window',url:scope+'nero.html'}],['client-b',{id:'client-b',type:'window',url:scope+'nero.html'}]]),controlled=new Set(['client-a','client-b']);
 let network=options.network||(async request=>{throw new TypeError('Labelled offline network failure: '+request.url)}),beforePut=null,beforeMatch=null,afterMatch=null,estimate=options.estimate||{quota:1024*1024*1024,usage:0};
 const absolute=value=>new URL(typeof value==='string'?value:value.url,scope+'sw.js').href;
 const storage=name=>{if(!stores.has(name))stores.set(name,new Map());return stores.get(name)};
 const caches={async open(name){calls.cache.push({operation:'open',name});const records=storage(name);return{
  async match(key,opt={}){const url=absolute(key);calls.cache.push({operation:'match',name,url});if(beforeMatch)await beforeMatch({name,url,opt});for(const [entry,response]of records)if(opt.ignoreSearch?new URL(entry).pathname===new URL(url).pathname:entry===url){const copy=response.clone();return afterMatch?afterMatch({name,url,opt,response:copy}):copy}},
  async put(key,response){const url=absolute(key);calls.cache.push({operation:'put',name,url});if(beforePut)await beforePut({name,url,response});records.set(url,response.clone());},
  async delete(key){const url=absolute(key);calls.cache.push({operation:'delete',name,url});return records.delete(url);},
  async keys(){calls.cache.push({operation:'keys',name});return [...records.keys()].map(url=>new Request(url));}
 }},async keys(){calls.cache.push({operation:'storage-keys'});return [...stores.keys()]},async delete(name){calls.cache.push({operation:'storage-delete',name});return stores.delete(name)}};
 const c={Response,Request,Headers,URL,TextEncoder,TextDecoder,Uint8Array,ArrayBuffer,Set,Map,WeakMap,Promise,Date,Error,TypeError,Number,DOMException,AbortController,ReadableStream,setTimeout,clearTimeout,crypto:crypto.webcrypto,btoa:value=>Buffer.from(value,'binary').toString('base64'),caches,
  indexedDB:new Proxy({},{get(){calls.recording.push('indexedDB');throw Error('Image preparation must never access recording IndexedDB')}}),
  fetch:async(request,opt)=>{const actual=request instanceof Request?new Request(request,opt):new Request(new URL(request,scope+'sw.js'),opt);calls.fetch.push(actual);const response=await network(actual);if(response instanceof Response&&!response.url)Object.defineProperty(response,'url',{value:actual.url});return response},
  self:{location:{href:scope+'sw.js',origin},registration:{scope,update:async()=>{}},navigator:{storage:{estimate:async()=>{calls.estimate.push(true);if(typeof estimate==='function')return estimate();return estimate}}},clients:{get:async id=>clients.get(id),matchAll:async(opt={})=>[...clients.values()].filter(client=>opt.includeUncontrolled||controlled.has(client.id))},addEventListener:(name,listener)=>listeners[name]=listener}};
 vm.createContext(c);vm.runInContext(source,c,{filename:'sw.js'});const run=code=>vm.runInContext(code,c),build=run('SURUM'),cache=run('CACHE'),artCache=run('ART_CACHE'),control=run('RECOVERY_CONTROL_CACHE'),required=run('REQUIRED_RUNTIME');
 function seed(name,url,response){storage(name).set(absolute(url),response.clone())}
 function begin(data,opt={}){
  const messages=[],jobs=[],id=opt.clientId===undefined?'client-a':opt.clientId;
  const event={data,source:id?{id}:null,ports:[{postMessage:value=>messages.push(JSON.parse(JSON.stringify(value)))}],waitUntil:job=>jobs.push(Promise.resolve(job))};
  listeners.message(event);
  const done=Promise.all(jobs).then(()=>({messages,result:messages.findLast(value=>value.kind==='result')||messages.at(-1)}));
  return {messages,done};
 }
 async function message(data,opt={}){const result=await begin(data,opt).done;assert.ok(result.result,'Production message handler must send a final reply');return result.result}
 return{c,run,source,build,cache,artCache,control,required,calls,stores,clients,controlled,absolute,storage,seed,begin,message,
  network:fn=>network=fn,beforePut:fn=>beforePut=fn,beforeMatch:fn=>beforeMatch=fn,afterMatch:fn=>afterMatch=fn,estimate:value=>estimate=value,
  async seedManifest(value=options.manifest){const entry=required.find(row=>row.url.split('?')[0]===run('IMAGE_PACK_MANIFEST'));assert.ok(entry,'Image package manifest belongs to the mandatory runtime graph');seed(cache,entry.url,new Response(JSON.stringify(value),{headers:{'Content-Type':'application/json'}}));}
  ,async seedCore(){
   assert.ok(options.manifest,'Small descriptor fixture is explicitly provided');
   const html='<meta name="sukun-build" content="'+build+'"><p>Labelled image-package core fixture</p>';
   const marker={build,v:build,shell:{sha256:hash(html)},runtime:JSON.parse(JSON.stringify(required))};
   seed(cache,'./nero.html',new Response(html,{headers:{'Content-Type':'text/html'}}));
   seed(cache,'./sukun-build-'+build+'.json',new Response(JSON.stringify(marker)));
   seed(cache,'./manifest.webmanifest',new Response(JSON.stringify({short_name:'SÜKÛN',start_url:'./nero.html?v='+build})));
   seed(cache,'./sukun-cache-meta-'+build+'.json',new Response(JSON.stringify({v:build,cache,complete:true,at:Date.now()})));
   await this.seedManifest();
   seed(cache,tekkePath+'?v='+build,image(tekkeBytes));
   for(const row of options.manifest.assets.filter(row=>row.kind==='navigation')){const entry=required.find(item=>item.url.split('?')[0]===row.url);const bytes=options.bytes?.get(row.url)||Buffer.from('labelled mandatory navigation');assert.equal(hash(bytes),row.sha256);seed(cache,entry.url,image(bytes))}
   assert.ok(await run('recoveryVerifyCache(CACHE,true)'),'Actual core verifier enrolls exact fixture metadata/bytes');
  }
 };
}
module.exports={fixture,hash,image,scope,origin};
