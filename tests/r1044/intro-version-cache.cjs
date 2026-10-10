'use strict';
// Read-only controlled fixture of exact shipped runtimeResponse. No browser/network/storage writes.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8'),intro=fs.readFileSync(path.join(root,'assets/runtime/startup-intro-r1027.js'),'utf8');
const source=sw.slice(sw.indexOf('async function runtimeResponse(request,entry){'),sw.indexOf('\nfunction isArt(url)'));
const build=sw.match(/^const SURUM = '(r\d+)';/m)[1],cacheName=sw.match(/^const CACHE = '([^']+)';/m)[1];
const url=intro.match(/window\.fetch\('([^']+\.wav\?v=r\d+)'/)[1];
const previous=JSON.parse(fs.readFileSync(path.join(root,'sukun-build-'+build+'.json'),'utf8')).base;
const oldURL=url.replace(/\?v=r\d+$/, '?v='+previous);
const runtime=JSON.parse(sw.match(/^const REQUIRED_RUNTIME = (\[[^\n]+\]);/m)[1]);
const base='https://example.test/sukun/',entry=runtime.find(e=>e.url.includes('/audio/sukun-intro-signature'));
const bytes=fs.readFileSync(path.join(root,'assets/audio/sukun-intro-signature-r1037.wav'));
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
async function run(requestURL,historical){
 let fetches=0;const caches={keys:async()=>historical?[cacheName,('sukun-'+previous+'-historical')]:[cacheName],open:async name=>({match:async(key)=>{
  const str=typeof key==='string'?key:key.url;
  if(name===cacheName&&str===entry.url)return new Response(bytes);
  if(historical&&name===('sukun-'+previous+'-historical')){
   if(str===('./sukun-build-'+previous+'.json'))return new Response(JSON.stringify({build:previous,runtime:[{url:oldURL,sha256:digest(bytes)}]}));
   if(str===oldURL)return new Response(bytes);
  }
  return undefined;
 }})};
 const c=vm.createContext({URL,Response,caches,CACHE:cacheName,SURUM:build,self:{location:{href:base}},
  isArt:u=>/\.(?:png|jpe?g|webp|svg)$/i.test(u.pathname)&&u.pathname.includes('/assets/'),
  vnum:s=>Number(s.replace(/^r/,'')),isAppCacheName:n=>n.startsWith('sukun-r'),cachedShellFrom:async n=>({build:n===('sukun-'+previous+'-historical')?previous:build}),
  sameOriginPath:p=>new URL(p,base).pathname,sha256Response:async r=>digest(Buffer.from(await r.arrayBuffer())),
  fetchFresh:async()=>{fetches++;return new Response(bytes)},put:async()=>{throw Error('Unexpected cache write')}});
 vm.runInContext(source+';globalThis.call=runtimeResponse;',c);
 const response=await c.call({url:new URL(requestURL,base).href},entry);
 return{request:requestURL,historicalVerifiedCache:historical,status:response.status,type:response.type,networkCalls:fetches};
}
(async()=>{
 assert.equal(url,entry.url,'Opening WAV request must match current verified runtime URL');
 const current=await run(url,false),oldMissing=await run(oldURL,false),retained=await run(oldURL,true);
 assert.equal(current.status,200);assert.equal(current.networkCalls,0);
 assert.equal(oldMissing.status,0);assert.equal(oldMissing.type,'error');assert.equal(oldMissing.networkCalls,0);
 assert.equal(retained.status,200);
 console.log(JSON.stringify({suite:'Current and historical opening WAV cache contract',passed:4,total:4,build,actualIntroURL:url,results:[current,oldMissing,retained],scope:'Exact SW runtimeResponse; synthetic verified CacheStorage, no real browser/network'},null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
