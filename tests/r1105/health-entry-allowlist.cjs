'use strict';
// Exact production integrity functions, real shipped shared controls and
// controlled same-origin HTTP. This does not model device audio or playback.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const release=JSON.parse(fs.readFileSync(path.join(root,'sukun-latest.json'),'utf8'));
const build=release.build||release.latest;
const source=fs.readFileSync(path.join(root,'assets/runtime/health-r940.js'),'utf8');
const start=source.indexOf('  async function responseBytes('),end=source.indexOf('  function sampleExplicit()',start);
assert(start>0&&end>start);
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const mandatory=[
 'css/berhet-controls-r1101.css','js/section-switch-r1101.js',
 'css/frequency-hub-r1101.css','js/frequency-hub-r1101.js',
 'css/ambience-compact-r1102.css','css/ambience-info-round-r1103.css',
 'css/ambience-readable-r1104.css','css/shared-readable-r1105.css',
 'css/kandil-preferences-r1108.css','css/player-branding-r1109.css',
 'css/category-flow-r1109.css','css/tooltip-help-r1110.css',
 'css/notification-layout-r1111.css','css/tekke-set-card-r1112.css'
];
const entry=(p,b)=>({url:'./'+p+'?v='+build,sha256:hash(b)}),results=[];
async function run(entries,bodies){
 const calls=[];let active=0,maxActive=0;
 const c={URL,Response,AbortController,DOMException,TextDecoder,Uint8Array,crypto:crypto.webcrypto,
  build,now:()=>Date.now(),location:{href:'https://test.invalid/sukun/nero.html',origin:'https://test.invalid'},
  navigator:{onLine:true},path:u=>new URL(u).pathname,token:String,
  status:(code,status,title,evidence)=>({code,status,evidence}),setTimeout,clearTimeout};
 c.fetch=async(url,options)=>{
  calls.push(url);const p=new URL(url).pathname.replace('/sukun/','');
  if(p==='sukun-build-'+build+'.json')return new Response(JSON.stringify({build,runtime:entries}));
  assert.equal(options.credentials,'same-origin');assert.equal(options.cache,'no-store');
  active++;maxActive=Math.max(maxActive,active);
  try{await new Promise(resolve=>setImmediate(resolve));assert(bodies.has(p),'Unexpected download '+p);
   const b=bodies.get(p);return new Response(b,{headers:{'content-length':String(b.length)}});
  }finally{active--;}
 };
 vm.createContext(c);vm.runInContext(source.slice(start,end),c);
 return{result:await c.integrityCheck(),calls,maxActive};
}
async function test(name,fn){await fn();results.push({name,status:'PASS'});}
(async()=>{
 await test('all fourteen mandatory shared controls verify exact shipped bytes under existing core budget',async()=>{
  const marker=JSON.parse(fs.readFileSync(path.join(root,'sukun-build-'+build+'.json'),'utf8'));
  const rootEntries=marker.runtime.filter(e=>/^\.\/(?:css|js)\//.test(e.url));
  assert.deepEqual(rootEntries.map(e=>new URL(e.url,'https://test.invalid/').pathname.slice(1)).sort(),[...mandatory].sort());
  const bodies=new Map(mandatory.map(p=>[p,fs.readFileSync(path.join(root,p))]));
  const {result:r,maxActive}=await run(rootEntries,bodies);
  assert.equal(r.status,'PASS');assert.equal(r.evidence.configurationErrors,0);
  assert.equal(r.evidence.files.length,14);assert(r.evidence.files.every(e=>e.status==='MATCH'));
  const bytes=[...bodies.values()].reduce((n,b)=>n+b.length,0);
  assert.equal(r.evidence.bytes,bytes);assert.equal(r.evidence.verifiedBytes,bytes);
  assert.equal(r.evidence.mediaBytes,0);assert(bytes<9437184);assert(maxActive<=2);
 });
 await test('unapproved CSS and JS siblings, versions and nested copies reject before any download',async()=>{
  const b=Buffer.from('unapproved'),entries=[
   'css/other.css','js/other.js','css/shared-readable-r1106.css',
   'nested/css/shared-readable-r1105.css','nested/js/section-switch-r1101.js'
  ].map(p=>entry(p,b));
  const {result:r,calls,maxActive}=await run(entries,new Map());
  assert.equal(r.status,'FAIL');assert.equal(r.evidence.configurationErrors,entries.length);
  assert(r.evidence.files.every(e=>e.status==='INVALID_ENTRY'));
  assert.equal(calls.length,1);assert.equal(maxActive,0);
 });
 await test('remote mandatory-looking controls and malformed hashes reject before any download',async()=>{
  const b=Buffer.from('fixture'),entries=[
   {...entry(mandatory[0],b),url:'https://foreign.invalid/sukun/'+mandatory[0]},
   {...entry(mandatory[1],b),sha256:'not-a-sha256'}
  ];
  const {result:r,calls,maxActive}=await run(entries,new Map());
  assert.equal(r.status,'FAIL');assert.equal(r.evidence.configurationErrors,2);
  assert(r.evidence.files.every(e=>e.status==='INVALID_ENTRY'));
  assert.equal(calls.length,1);assert.equal(maxActive,0);
 });
 await test('approved shared controls still reject corrupt content by SHA-256',async()=>{
  const p=mandatory[0],b=Buffer.from('corrupt content');
  const {result:r}=await run([{...entry(p,b),sha256:'0'.repeat(64)}],new Map([[p,b]]));
  assert.equal(r.status,'FAIL');assert.equal(r.evidence.configurationErrors,0);
  assert.equal(r.evidence.mismatched,1);assert.equal(r.evidence.files[0].status,'HASH_MISMATCH');
 });
 await test('approved shared controls retain 512 KiB per-file limit and no byte credit for oversized response',async()=>{
  const p=mandatory[0],b=Buffer.alloc(524289);
  const {result:r}=await run([entry(p,b)],new Map([[p,b]]));
  assert.equal(r.status,'NOT_MEASURED');assert.equal(r.evidence.configurationErrors,0);
  assert.equal(r.evidence.files[0].status,'SIZE_LIMIT');assert.equal(r.evidence.bytes,0);
  assert.equal(r.evidence.verifiedBytes,0);
 });
 const report={source:path.join(root,'assets/runtime/health-r940.js'),collectorSha256:hash(Buffer.from(source)),
  passed:results.length,total:results.length,scope:'Production integrity functions, real shipped shared controls and controlled HTTP; no physical playback claim',results};
 fs.mkdirSync(path.join(__dirname,'evidence'),{recursive:true});
 fs.writeFileSync(path.join(__dirname,'evidence/health-entry-allowlist.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report,null,2));
})().catch(error=>{console.error(error.stack||error);console.error('passed before failure:',results.map(r=>r.name));process.exitCode=1;});
