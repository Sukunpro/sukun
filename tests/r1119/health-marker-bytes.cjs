'use strict';
// Execute the shipped reader against exact full marker/asset bytes, not a
// compact {build,runtime} replacement. No browser or private storage involved.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||'.'),out=path.resolve(process.argv[3]||path.join(root,'tests/r1119/evidence/health-marker-bytes.json'));
const build=fs.readFileSync(path.join(root,'version.txt'),'utf8').trim(),markerPath='sukun-build-'+build+'.json';
const raw=fs.readFileSync(path.join(root,markerPath)),marker=JSON.parse(raw),source=fs.readFileSync(path.join(root,'assets/runtime/health-r940.js'),'utf8');
const start=source.indexOf('  async function responseBytes('),end=source.indexOf('  function sampleExplicit()',start);assert(start>0&&end>start);
const hash=b=>crypto.createHash('sha256').update(b).digest('hex'),results=[];
async function run(bytes,{header=true,timeout=false}={}){
 const calls=[];let active=0,maxActive=0;
 const c={URL,Response,AbortController,DOMException,TextDecoder,Uint8Array,crypto:crypto.webcrypto,build,now:()=>Date.now(),location:{href:'https://test.invalid/sukun/nero.html',origin:'https://test.invalid'},navigator:{onLine:true},path:u=>new URL(u).pathname,token:String,status:(code,status,title,evidence)=>({code,status,evidence}),setTimeout:(fn,ms)=>setTimeout(fn,timeout?10:ms),clearTimeout};
 c.fetch=async(url,options)=>{
  calls.push(url);const name=new URL(url).pathname.replace('/sukun/','');assert.equal(options.credentials,'same-origin');assert.equal(options.cache,'no-store');assert(options.signal);
  if(name===markerPath){
   if(timeout)return new Promise((resolve,reject)=>{const abort=()=>reject(new DOMException('Aborted','AbortError'));options.signal.addEventListener('abort',abort,{once:true});if(options.signal.aborted)abort()});
   const body=header?bytes:new ReadableStream({start(controller){for(let i=0;i<bytes.length;i+=1024)controller.enqueue(new Uint8Array(bytes.subarray(i,i+1024)));controller.close();}});
   return new Response(body,{headers:header?{'content-length':String(bytes.length)}:{}});
  }
  assert(marker.runtime.some(e=>new URL(e.url,'https://test.invalid/').pathname.slice(1)===name),'Unlisted request '+name);
  active++;maxActive=Math.max(active,maxActive);try{await new Promise(r=>setImmediate(r));const body=fs.readFileSync(path.join(root,name));return new Response(body,{headers:{'content-length':String(body.length)}})}finally{active--}
 };
 vm.runInNewContext(source.slice(start,end),c);return{result:await c.integrityCheck(),calls,maxActive};
}
async function test(name,fn){try{results.push({name,passed:true,evidence:await fn()})}catch(e){results.push({name,passed:false,error:e.stack})}}
(async()=>{
 await test('Exact shipped full marker and all mandatory assets verify under unchanged byte/concurrency budgets',async()=>{
  assert(raw.length>32768&&raw.length<65536);assert.equal(marker.runtime.length,129);
  const x=await run(raw);assert.equal(x.result.status,'PASS');const e=x.result.evidence;assert.equal(e.expected,129);assert.equal(e.matched,129);assert.equal(e.configurationErrors,0);assert(e.bytes>0&&e.bytes<=9437184);assert(e.mediaBytes>0&&e.mediaBytes<=33554432);assert(x.maxActive<=2);assert.equal(x.calls.length,130);return{markerBytes:raw.length,markerSha256:hash(raw),expected:e.expected,coreBytes:e.bytes,mediaBytes:e.mediaBytes,requests:x.calls.length,maxConcurrent:x.maxActive};
 });
 const exact=Buffer.concat([raw,Buffer.alloc(65536-raw.length,32)]);
 await test('A valid 65536-byte marker remains bounded and verifies unchanged runtime entries',async()=>{const x=await run(exact);assert.equal(x.result.status,'PASS');assert.equal(x.result.evidence.matched,129);return{markerBytes:exact.length,maxConcurrent:x.maxActive}});
 for(const header of [true,false])await test('65537-byte '+(header?'declared':'streamed')+' marker is rejected before any asset request',async()=>{const bytes=Buffer.concat([exact,Buffer.from(' ')]),x=await run(bytes,{header});assert.equal(x.result.status,'NOT_MEASURED');assert.equal(x.result.evidence.reason,'SIZE_LIMIT');assert.equal(x.calls.length,1);assert.equal(x.maxActive,0);return{markerBytes:bytes.length,reason:x.result.evidence.reason,requests:x.calls.length}});
 await test('Actual full marker with 130 entries fails closed before any asset download',async()=>{const value={...marker,runtime:[...marker.runtime,{url:'./assets/runtime/extra-test.js?v='+build,sha256:'0'.repeat(64)}]},bytes=Buffer.from(JSON.stringify(value));const x=await run(bytes);assert.equal(x.result.status,'FAIL');assert.equal(x.result.evidence.reason,'MARKER_INVALID');assert.equal(x.calls.length,1);return{entries:value.runtime.length,requests:x.calls.length,reason:x.result.evidence.reason}});
 await test('Malformed full-marker JSON remains a configuration failure without asset fetches',async()=>{const x=await run(Buffer.from('{bad'));assert.equal(x.result.status,'FAIL');assert.equal(x.result.evidence.reason,'MARKER_INVALID_JSON');assert.equal(x.calls.length,1);return x.result.evidence});
 await test('Marker fetch still passes the abort signal and times out without asset fetches',async()=>{const x=await run(raw,{timeout:true});assert.equal(x.result.status,'NOT_MEASURED');assert.equal(x.calls.length,1);assert.equal(x.result.evidence.reason,'Aborted');return x.result.evidence});
 const report={build,method:'Actual shipped integrity reader in VM with exact full build-marker and asset bytes over controlled same-origin Fetch responses. Header and streaming size boundaries plus abort; no compact marker substitution, browser or user storage.',scriptSha256:hash(fs.readFileSync(__filename)),sourceFiles:{'assets/runtime/health-r940.js':hash(Buffer.from(source)),[markerPath]:hash(raw)},sourceSha256:hash(fs.readFileSync(path.join(root,'index.html'))),passed:results.filter(x=>x.passed).length,total:results.length,results};fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));if(report.passed!==report.total)process.exitCode=1;
})();
