'use strict';
// Production integrity checker with real release bytes and modeled same-origin
// HTTP responses. This verifies byte/hash bounds, not audible device playback.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const release=JSON.parse(fs.readFileSync(path.join(root,'sukun-latest.json'),'utf8')),build=release.build||release.latest;assert.match(build,/^r\d+$/);
const source=fs.readFileSync(path.join(root,'assets/runtime/health-r940.js'),'utf8');
const start=source.indexOf('  async function responseBytes('),end=source.indexOf('  function sampleExplicit()',start);
assert(start>0&&end>start);
const production=source.slice(start,end),hash=b=>crypto.createHash('sha256').update(b).digest('hex'),results=[];
const mediaNames=['yasin','fatiha','ayatul-kursi','ikhlas','falaq','nas'];
const mediaPath=name=>'assets/audio/arabic-r1065/'+name+'.mp3';
const entry=(p,b)=>({url:'./'+p+'?v='+build,sha256:hash(b)});
async function run(entries,bodies){
 const calls=[];let active=0,maxActive=0;
 const c={URL,Response,AbortController,DOMException,TextDecoder,Uint8Array,crypto:crypto.webcrypto,build,now:()=>Date.now(),location:{href:'https://test.invalid/sukun/nero.html',origin:'https://test.invalid'},navigator:{onLine:true},path:u=>new URL(u).pathname,token:String,status:(code,status,title,evidence)=>({code,status,evidence}),setTimeout,clearTimeout};
 c.fetch=async(url,options)=>{calls.push(url);const p=new URL(url).pathname.replace('/sukun/','');
  if(p==='sukun-build-'+build+'.json')return new Response(JSON.stringify({build,runtime:entries}));
  assert.equal(options.credentials,'same-origin');assert.equal(options.cache,'no-store');active++;maxActive=Math.max(maxActive,active);
  try{await new Promise(resolve=>setImmediate(resolve));assert(bodies.has(p),'unexpected asset download '+p);const b=bodies.get(p);return new Response(b,{headers:{'content-length':String(b.length)}});}finally{active--;}
 };
 vm.createContext(c);vm.runInContext(production,c);const result=await c.integrityCheck();return{result,calls,maxActive};
}
async function test(name,fn){await fn();results.push({name,status:'PASS'});}
(async()=>{
 await test('complete actual release verifies core, six Arabic recordings and exact portal invitation with separate byte totals',async()=>{
  const marker=JSON.parse(fs.readFileSync(path.join(root,'sukun-build-'+build+'.json'),'utf8')),bodies=new Map();
  assert.equal(marker.build,build);const entries=marker.runtime.map(e=>{const p=new URL(e.url,'https://test.invalid/').pathname.slice(1),b=fs.readFileSync(path.join(root,p));bodies.set(p,b);return{...e};});
  const {result:r,maxActive}=await run(entries,bodies);const invitationBytes=bodies.get('assets/berhetiyye-gate/invitation-tr.mp3')?.length||0;
  const mediaBytes=mediaNames.reduce((n,name)=>n+bodies.get(mediaPath(name)).length,0)+invitationBytes,allBytes=[...bodies.values()].reduce((n,b)=>n+b.length,0);
  assert.equal(r.status,'PASS');assert.equal(r.evidence.files.length,entries.length);assert(r.evidence.files.every(e=>e.status==='MATCH'));
  assert.equal(r.evidence.mediaBytes,mediaBytes);assert.equal(r.evidence.verifiedBytes,allBytes);assert.equal(r.evidence.bytes,allBytes-mediaBytes);assert(r.evidence.bytes<9437184);assert(mediaBytes<33554432);assert(maxActive<=2);
 });
 await test('bundled media still requires exact SHA-256 and cannot count corruption as a pass',async()=>{
  const bodies=new Map(mediaNames.map(name=>[mediaPath(name),Buffer.from('fixture '+name)])),entries=[...bodies].map(([p,b])=>({...entry(p,b),sha256:'0'.repeat(64)}));
  const {result:r}=await run(entries,bodies);assert.equal(r.status,'FAIL');assert.equal(r.evidence.mismatched,6);assert(r.evidence.files.every(e=>e.status==='HASH_MISMATCH'));
 });
 await test('unapproved media siblings, external origins, nested paths and invalid hashes are rejected before download',async()=>{
  const valid=hash(Buffer.from('fixture')),entries=[
   {url:'./assets/audio/arabic-r1065/other.mp3',sha256:valid},
   {url:'https://foreign.invalid/sukun/assets/audio/arabic-r1065/yasin.mp3',sha256:valid},
   {url:'./nested/assets/audio/arabic-r1065/yasin.mp3',sha256:valid},
   {url:'./assets/audio/arabic-r1065/yasin.mp3',sha256:'invalid'}
  ];const {result:r,calls}=await run(entries,new Map());assert.equal(r.status,'FAIL');assert.equal(r.evidence.configurationErrors,4);assert(r.evidence.files.every(e=>e.status==='INVALID_ENTRY'));assert.equal(calls.length,1);
 });
 await test('media above24MiB remains unverified and contributes no downloaded byte credit',async()=>{
  const p=mediaPath('yasin'),b=Buffer.alloc(25165825),{result:r}=await run([entry(p,b)],new Map([[p,b]]));
  assert.equal(r.status,'NOT_MEASURED');assert.equal(r.evidence.files[0].status,'SIZE_LIMIT');assert.equal(r.evidence.mediaBytes,0);assert.equal(r.evidence.verifiedBytes,0);
 });
 await test('aggregate media budget stays bounded at32MiB with a separate9MiB core limit',async()=>{
  const bodies=new Map([[mediaPath('yasin'),Buffer.alloc(25165824,1)],[mediaPath('fatiha'),Buffer.alloc(12582912,2)]]),entries=[...bodies].map(([p,b])=>entry(p,b));
  const {result:r,maxActive}=await run(entries,bodies);assert.equal(r.status,'NOT_MEASURED');assert.equal(r.evidence.mediaBytes,25165824);assert.equal(r.evidence.bytes,0);assert.equal(r.evidence.verifiedBytes,r.evidence.mediaBytes);assert.equal(r.evidence.files.filter(e=>e.status==='TOTAL_SIZE_LIMIT').length,1);assert(maxActive<=2);
 });
 console.log(JSON.stringify({source:path.join(root,'assets/runtime/health-r940.js'),collectorSha256:hash(Buffer.from(source)),passed:results.length,total:results.length,scope:'Exact production integrity functions with release files and controlled HTTP; no physical audio claim',results},null,2));
})().catch(error=>{console.error(error.stack||error);console.error('passed before failure:',results.map(r=>r.name));process.exitCode=1;});
