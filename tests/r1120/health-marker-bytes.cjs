'use strict';
// Execute the shipped reader against exact full marker/asset bytes, not a
// compact {build,runtime} replacement. No browser or private storage involved.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||'.'),out=path.resolve(process.argv[3]||path.join(root,'tests/r1120/evidence/health-marker-bytes.json'));
const build=fs.readFileSync(path.join(root,'version.txt'),'utf8').trim(),markerPath='sukun-build-'+build+'.json';
const raw=fs.readFileSync(path.join(root,markerPath)),marker=JSON.parse(raw),source=fs.readFileSync(process.env.SUKUN_HEALTH_COLLECTOR||path.join(root,'assets/runtime/health-r940.js'),'utf8');
const expectedEntries=marker.runtime.length,entryLimit=192;
// Optional audio packs are outside mandatory runtime from r1213 onward.
const expectedMediaBytes=marker.runtime.filter(e=>/\/assets\/audio\/arabic-r1065\/[^/]+\.mp3|\/assets\/berhetiyye-gate\/invitation-tr\.mp3/.test(e.url)).reduce((n,e)=>n+fs.statSync(path.join(root,new URL(e.url,'https://test.invalid/').pathname)).size,0);
const start=source.indexOf('  async function responseBytes('),end=source.indexOf('  function sampleExplicit()',start);assert(start>0&&end>start);
const hash=b=>crypto.createHash('sha256').update(b).digest('hex'),results=[];
async function run(bytes,{header=true,timeout=false,assetBodies={}}={}){
 const calls=[];let active=0,maxActive=0;
 const c={URL,Response,AbortController,DOMException,TextDecoder,Uint8Array,crypto:crypto.webcrypto,build,now:()=>Date.now(),location:{href:'https://test.invalid/sukun/nero.html',origin:'https://test.invalid'},navigator:{onLine:true},path:u=>new URL(u).pathname,token:String,status:(code,status,title,evidence)=>({code,status,evidence}),setTimeout:(fn,ms)=>setTimeout(fn,timeout?10:ms),clearTimeout};
 c.fetch=async(url,options)=>{
  calls.push(url);const name=new URL(url).pathname.replace('/sukun/','');assert.equal(options.credentials,'same-origin');assert.equal(options.cache,'no-store');assert(options.signal);
  if(name===markerPath){
   if(timeout)return new Promise((resolve,reject)=>{const abort=()=>reject(new DOMException('Aborted','AbortError'));options.signal.addEventListener('abort',abort,{once:true});if(options.signal.aborted)abort()});
   const body=header?bytes:new ReadableStream({start(controller){for(let i=0;i<bytes.length;i+=1024)controller.enqueue(new Uint8Array(bytes.subarray(i,i+1024)));controller.close();}});
   return new Response(body,{headers:header?{'content-length':String(bytes.length)}:{}});
  }
  assert(marker.runtime.some(e=>new URL(e.url,'https://test.invalid/').pathname.slice(1)===name)||Object.hasOwn(assetBodies,name),'Unlisted request '+name);
  active++;maxActive=Math.max(active,maxActive);try{await new Promise(r=>setImmediate(r));const body=assetBodies[name]||fs.readFileSync(path.join(root,name));return new Response(body,{headers:{'content-length':String(body.length)}})}finally{active--}
 };
 vm.runInNewContext(source.slice(start,end),c);return{result:await c.integrityCheck(),calls,maxActive};
}
async function test(name,fn){try{results.push({name,passed:true,evidence:await fn()})}catch(e){results.push({name,passed:false,error:e.stack})}}
(async()=>{
 await test('Exact shipped full marker and all mandatory assets verify under bounded byte/concurrency budgets',async()=>{
  assert(raw.length>32768&&raw.length<65536);assert(expectedEntries>0&&expectedEntries<=entryLimit);
  const x=await run(raw);assert.equal(x.result.status,'PASS');const e=x.result.evidence;assert.equal(e.expected,expectedEntries);assert.equal(e.matched,expectedEntries);assert.equal(e.configurationErrors,0);assert(e.bytes>0&&e.bytes<=12582912);assert.equal(e.mediaBytes,expectedMediaBytes);assert(e.mediaBytes<=33554432);assert(x.maxActive<=2);assert.equal(x.calls.length,expectedEntries+1);return{markerBytes:raw.length,markerSha256:hash(raw),expected:e.expected,coreBytes:e.bytes,mediaBytes:e.mediaBytes,requests:x.calls.length,maxConcurrent:x.maxActive};
 });
 await test('Exact Berhetiyye consistency stylesheet is verified while siblings, nesting and external paths stay rejected',async()=>{
  const name='css/berhet-consistency-r1125.css',entry=marker.runtime.find(e=>new URL(e.url,'https://test.invalid/').pathname.slice(1)===name);assert(entry,'New mandatory stylesheet is present');
  const valid=await run(Buffer.from(JSON.stringify({...marker,runtime:[entry]})));assert.equal(valid.result.status,'PASS');assert.equal(valid.result.evidence.matched,1);assert.equal(valid.calls.length,2);
  const invalid=['./css/other-r1125.css','./nested/css/berhet-consistency-r1125.css','https://evil.invalid/sukun/css/berhet-consistency-r1125.css'].map(url=>({url,sha256:entry.sha256}));invalid.push({...entry,sha256:'invalid'});
  const rejected=await run(Buffer.from(JSON.stringify({...marker,runtime:invalid})));assert.equal(rejected.result.status,'FAIL');assert.equal(rejected.result.evidence.configurationErrors,invalid.length);assert.equal(rejected.calls.length,1);assert.equal(rejected.maxActive,0);return{verified:valid.result.evidence.matched,rejected:rejected.result.evidence.configurationErrors,requests:rejected.calls.length};
 });
 if(build==='r1138')await test('Exact r1138 stylesheets verify while siblings, nesting and external paths remain rejected',async()=>{
  for(const name of ['css/berhet-dock-fit-r1138.css','css/berhet-panels-r1138.css']){
   const entry=marker.runtime.find(e=>new URL(e.url,'https://test.invalid/').pathname.slice(1)===name);assert(entry,'Mandatory stylesheet is present: '+name);
   const valid=await run(Buffer.from(JSON.stringify({...marker,runtime:[entry]})));assert.equal(valid.result.status,'PASS');assert.equal(valid.result.evidence.matched,1);
   const invalid=['./css/other-r1138.css','./nested/'+name,'https://evil.invalid/sukun/'+name].map(url=>({url,sha256:entry.sha256}));
   const rejected=await run(Buffer.from(JSON.stringify({...marker,runtime:invalid})));assert.equal(rejected.result.status,'FAIL');assert.equal(rejected.result.evidence.configurationErrors,invalid.length);assert.equal(rejected.calls.length,1);
  }
  return {exactPaths:2,rejectedVariants:6};
 });
 if(build==='r1149')await test('Exact r1149 stylesheets verify while siblings, nesting and external paths remain rejected',async()=>{
  const names=['css/berhet-hero-r1149.css','css/berhet-nav-r1149.css','css/berhet-quick-controls-r1149.css','css/berhet-session-fit-r1149.css'];
  for(const name of names){
   const entry=marker.runtime.find(e=>new URL(e.url,'https://test.invalid/').pathname.slice(1)===name);assert(entry,'Mandatory stylesheet is present: '+name);
   const valid=await run(Buffer.from(JSON.stringify({...marker,runtime:[entry]})));assert.equal(valid.result.status,'PASS');assert.equal(valid.result.evidence.matched,1);
   const invalid=['./css/other-r1149.css','./nested/'+name,'https://evil.invalid/sukun/'+name].map(url=>({url,sha256:entry.sha256}));
   const rejected=await run(Buffer.from(JSON.stringify({...marker,runtime:invalid})));assert.equal(rejected.result.status,'FAIL');assert.equal(rejected.result.evidence.configurationErrors,invalid.length);assert.equal(rejected.calls.length,1);assert.equal(rejected.maxActive,0);
  }
  return {exactPaths:names.length,rejectedVariants:names.length*3};
 });
 await test('Exact current branding verifies but remote, nested and sibling artwork stays rejected',async()=>{
  const name='./assets/branding/sukun-berhet-selected-r1172.png',entry=marker.runtime.find(e=>e.url.split('?')[0]===name);assert(entry);
  const valid=await run(Buffer.from(JSON.stringify({...marker,runtime:[entry]})));assert.equal(valid.result.status,'PASS');assert.equal(valid.result.evidence.matched,1);
  const invalid=['./assets/branding/other.png','./nested/assets/branding/sukun-berhet-selected-r1172.png','https://evil.invalid/assets/branding/sukun-berhet-selected-r1172.png'].map(url=>({...entry,url}));
  const rejected=await run(Buffer.from(JSON.stringify({...marker,runtime:invalid})));assert.equal(rejected.result.status,'FAIL');assert.equal(rejected.result.evidence.configurationErrors,3);assert.equal(rejected.calls.length,1);return{verified:1,rejected:3};
 });
 await test('Runtime files retain the 512 KiB cap with no larger catalogue exception',async()=>{
  const entry=marker.runtime.find(e=>e.url.includes('/assets/runtime/session-r919.js')),name=entry.url.split('?')[0].slice(2),body=Buffer.alloc(524289,32);
  const rejected=await run(Buffer.from(JSON.stringify({...marker,runtime:[{...entry,sha256:hash(body)}]})),{assetBodies:{[name]:body}});
  assert.equal(rejected.result.status,'NOT_MEASURED');assert.equal(rejected.result.evidence.files[0].status,'SIZE_LIMIT');assert.equal(rejected.result.evidence.matched,0);return{ordinaryLimit:524288};
 });
 await test('Exact r1215 stylesheets are admitted; remote, nested and unlisted siblings fail before fetch',async()=>{
  const names=['premium-layout','cinematic','atlas'].map(n=>'./css/'+n+'-r1215.css').concat(['embFonts','base-style','r699-layout-authority'].map(n=>'./css/legacy-r1215-'+n+'.css'));
  for(const name of names){const entry=marker.runtime.find(e=>e.url.split('?')[0]===name);assert(entry);const valid=await run(Buffer.from(JSON.stringify({...marker,runtime:[entry]})));assert.equal(valid.result.status,'PASS');
   const variants=['./nested/'+name.slice(2),'https://evil.invalid/sukun/'+name.slice(2),'./css/unlisted-r1215.css'].map(url=>({...entry,url}));const rejected=await run(Buffer.from(JSON.stringify({...marker,runtime:variants})));assert.equal(rejected.result.evidence.configurationErrors,3);assert.equal(rejected.calls.length,1);
  }return{exactPaths:names.length,rejectedVariants:names.length*3};
 });
 await test('Exact lower-stat stylesheet verifies while remote, nested and sibling paths are rejected',async()=>{
  const name='./css/lower-stats-r1236.css',entry=marker.runtime.find(e=>e.url.split('?')[0]===name);assert(entry);
  const valid=await run(Buffer.from(JSON.stringify({...marker,runtime:[entry]})));assert.equal(valid.result.status,'PASS');assert.equal(valid.result.evidence.matched,1);
  const variants=['./nested/css/lower-stats-r1236.css','https://evil.invalid/sukun/css/lower-stats-r1236.css','./css/lower-stats-other.css'].map(url=>({...entry,url}));
  const rejected=await run(Buffer.from(JSON.stringify({...marker,runtime:variants})));assert.equal(rejected.result.status,'FAIL');assert.equal(rejected.result.evidence.configurationErrors,3);assert.equal(rejected.calls.length,1);return{exactPaths:1,rejectedVariants:3};
 });
 await test('Aggregate core beyond 12 MiB stays bounded with unique valid paths',async()=>{
  const body=Buffer.alloc(524288,32),assetBodies={},runtime=Array.from({length:25},(_,i)=>{const name='assets/runtime/budget-fixture-'+i+'.js';assetBodies[name]=body;return{url:'./'+name,sha256:hash(body)}});
  const x=await run(Buffer.from(JSON.stringify({...marker,runtime})),{assetBodies});
  assert.equal(x.result.status,'NOT_MEASURED');assert.equal(x.result.evidence.complete,false);assert(x.result.evidence.bytes<=12582912);assert(x.result.evidence.unverified>0);assert(x.result.evidence.files.some(f=>f.status==='TOTAL_SIZE_LIMIT'));return{bytes:x.result.evidence.bytes,unverified:x.result.evidence.unverified};
 });
 const exact=Buffer.concat([raw,Buffer.alloc(65536-raw.length,32)]);
 await test('A valid 65536-byte marker remains bounded and verifies unchanged runtime entries',async()=>{const x=await run(exact);assert.equal(x.result.status,'PASS');assert.equal(x.result.evidence.matched,expectedEntries);return{markerBytes:exact.length,maxConcurrent:x.maxActive}});
 for(const header of [true,false])await test('65537-byte '+(header?'declared':'streamed')+' marker is rejected before any asset request',async()=>{const bytes=Buffer.concat([exact,Buffer.from(' ')]),x=await run(bytes,{header});assert.equal(x.result.status,'NOT_MEASURED');assert.equal(x.result.evidence.reason,'SIZE_LIMIT');assert.equal(x.calls.length,1);assert.equal(x.maxActive,0);return{markerBytes:bytes.length,reason:x.result.evidence.reason,requests:x.calls.length}});
 await test('The bounded 192-entry limit verifies unique fixture paths with actual source bytes',async()=>{
  const entry=marker.runtime.filter(e=>/\/assets\/runtime\//.test(e.url)).sort((a,b)=>fs.statSync(path.join(root,new URL(a.url,'https://test.invalid/').pathname)).size-fs.statSync(path.join(root,new URL(b.url,'https://test.invalid/').pathname)).size)[0];
  const body=fs.readFileSync(path.join(root,new URL(entry.url,'https://test.invalid/').pathname)),assetBodies={};
  const extra=Array.from({length:entryLimit-expectedEntries},(_,i)=>{const name='assets/runtime/capacity-fixture-'+i+'.js';assetBodies[name]=body;return{url:'./'+name,sha256:hash(body)}});
  const value={...marker,runtime:[...marker.runtime,...extra]},bytes=Buffer.from(JSON.stringify(value));assert(bytes.length<=65536);
  const x=await run(bytes,{assetBodies});assert.equal(x.result.status,'PASS');assert.equal(x.result.evidence.expected,entryLimit);assert.equal(x.result.evidence.matched,entryLimit);assert.equal(x.calls.length,entryLimit+1);assert(x.maxActive<=2);return{entries:value.runtime.length,requests:x.calls.length,maxConcurrent:x.maxActive};
 });
 await test('A 193-entry marker fails closed before any asset download',async()=>{const value={...marker,runtime:Array.from({length:entryLimit+1},(_,i)=>({...marker.runtime[i%expectedEntries]}))},bytes=Buffer.from(JSON.stringify(value));assert(bytes.length<=65536);const x=await run(bytes);assert.equal(x.result.status,'FAIL');assert.equal(x.result.evidence.reason,'MARKER_INVALID');assert.equal(x.calls.length,1);assert.equal(x.maxActive,0);return{entries:value.runtime.length,requests:x.calls.length,reason:x.result.evidence.reason}});
 await test('An admitted real runtime path with an incorrect hash remains a verification failure',async()=>{const entry=marker.runtime.find(e=>/\/assets\/runtime\//.test(e.url));assert(entry);const x=await run(Buffer.from(JSON.stringify({...marker,runtime:[{...entry,sha256:'0'.repeat(64)}]})));assert.equal(x.result.status,'FAIL');assert.equal(x.result.evidence.mismatched,1);assert.equal(x.result.evidence.matched,0);assert.equal(x.calls.length,2);return{mismatched:x.result.evidence.mismatched,requests:x.calls.length};});
 await test('Malformed full-marker JSON remains a configuration failure without asset fetches',async()=>{const x=await run(Buffer.from('{bad'));assert.equal(x.result.status,'FAIL');assert.equal(x.result.evidence.reason,'MARKER_INVALID_JSON');assert.equal(x.calls.length,1);return x.result.evidence});
 await test('Marker fetch still passes the abort signal and times out without asset fetches',async()=>{const x=await run(raw,{timeout:true});assert.equal(x.result.status,'NOT_MEASURED');assert.equal(x.calls.length,1);assert.equal(x.result.evidence.reason,'TIMEOUT');return x.result.evidence});

 await test('Retired Three.js dependency and sibling, nested or external variants fail before fetch',async()=>{
  const name='assets/vendor/three-r170/three.module.min.js';
  assert(!marker.runtime.some(e=>e.url.split('?')[0]==='./'+name));
  const urls=['./'+name,'./assets/vendor/three-r170/other.js','./nested/'+name,'https://evil.invalid/sukun/'+name];
  for(const url of urls){
   const rejected=await run(Buffer.from(JSON.stringify({...marker,runtime:[{url,sha256:'0'.repeat(64)}]})));
   assert.equal(rejected.result.status,'FAIL');assert.equal(rejected.result.evidence.configurationErrors,1);assert.equal(rejected.calls.length,1);assert.equal(rejected.maxActive,0);
  }
  assert(!source.includes('716800'),'Retired vendor size exception must not remain');
  return {invalidPaths:urls.length,assetRequests:0,ordinaryRuntimeLimit:524288};
 });
 const report={build,method:'Actual shipped integrity reader in VM with exact full build-marker and asset bytes over controlled same-origin Fetch responses. Header and streaming size boundaries plus abort; no compact marker substitution, browser or user storage.',scriptSha256:hash(fs.readFileSync(__filename)),sourceFiles:{'assets/runtime/health-r940.js':hash(Buffer.from(source)),[markerPath]:hash(raw)},sourceSha256:hash(fs.readFileSync(path.join(root,'index.html'))),passed:results.filter(x=>x.passed).length,total:results.length,results};fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));if(report.passed!==report.total)process.exitCode=1;
})();
