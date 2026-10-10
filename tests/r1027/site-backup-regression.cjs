'use strict';
// Exact production exporter, controlled same-origin fetch/DOM/ownership, and
// synthetic private bytes only. No browser profile, server mutation or download.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict'),crypto=require('crypto');
const root=path.resolve(process.argv[2]||path.resolve(__dirname,'../..'));
const source=fs.readFileSync(path.join(root,'assets/runtime/site-backup-r1020.js'),'utf8');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex'),encode=x=>Buffer.from(typeof x==='string'?x:JSON.stringify(x));
const current=fs.readFileSync(path.join(root,'index.html'),'utf8').match(/name="sukun-build" content="(r\d+)"/)[1];
let count=0;const results=[];
async function test(name,fn){await fn();results.push({name,ok:true});count++;console.log('PASS '+name);}
function fixture(build=current,edit){
 const shell=encode('<!doctype html><html><meta name="sukun-build" content="'+build+'"><script src="./assets/runtime/site-backup-r1020.js?v='+build+'"></script></html>');
 const files=new Map([['index.html',shell],['nero.html',shell],['sw.js',encode("'use strict'; const SURUM = '"+build+"';")],['manifest.webmanifest',encode({short_name:'SÜKÛN',start_url:'./nero.html?v='+build})],['sukun-latest.json',encode({v:build,build,latest:build})],['LICENSE',encode('Synthetic license fixture')],['assets/runtime/site-backup-r1020.js',encode(source)],['assets/art.bin',Buffer.from([1,2,3,4])]]);
 const marker={build,siteBackupManifestUrl:'./sukun-site-assets-'+build+'.json',shell:{url:'./nero.html',sha256:sha(shell)},runtime:[{url:'./assets/runtime/site-backup-r1020.js?v='+build,sha256:sha(source)}]};
 const value={build,files,marker};if(edit)edit(value);
 files.set('sukun-build-'+build+'.json',encode(marker));
 const manifest={schema:1,build,files:[...files].map(([p,b])=>({path:p,bytes:b.length,sha256:sha(b)}))};manifest.totalBytes=manifest.files.reduce((n,f)=>n+f.bytes,0);
 files.set('sukun-site-assets-'+build+'.json',encode(manifest));
 return {...value,manifest};
}
function harness(f,opts={}){
 const calls=[],personalCalls=[],writes=[],urls=[],lease={current:()=>true};let api;
 const document={readyState:'loading',documentElement:{lang:'en'},querySelector:()=>({content:opts.meta===undefined?f.build:opts.meta}),querySelectorAll:()=>opts.deps||[],getElementById:()=>null,addEventListener(){},createElement:()=>({style:{},click(){writes.push('download')},remove(){}}),body:{append(){}}};
 const w={SUKUN_BUILD:opts.windowBuild===undefined?f.build:opts.windowBuild,location:{href:'https://example.invalid/sukun/nero.html',origin:'https://example.invalid'},I18N:{lang:'en'},crypto:crypto.webcrypto,addEventListener(){},SukunTabOwner:{maintenance:async(_,work)=>opts.noLease?false:work(lease)},SukunRecoveryData:{capturePortable:async o=>{personalCalls.push(o);return opts.personal?opts.personal({api,lease}):{file:new Blob(['{"syntheticRecording":"AQID"}'],{type:'application/json'})};}},fetch:async(url,options)=>{
  const u=new URL(url),p=u.pathname.slice('/sukun/'.length);calls.push({path:p,url,options});
  assert.equal(u.origin,'https://example.invalid');assert.equal(u.searchParams.get('v'),f.build);assert.equal(options.redirect,'error');assert.equal(options.credentials,'same-origin');
  if(opts.fetch){const result=await opts.fetch({path:p,options,api,lease,files:f.files});if(result!==undefined)return result;}
  const bytes=f.files.get(p);return new Response(bytes||'Missing',{status:bytes?200:404,headers:{'content-length':String(bytes?.length??7)}});
 }};
 class TestURL extends URL{}TestURL.createObjectURL=b=>{urls.push(b);return 'blob:synthetic';};TestURL.revokeObjectURL=()=>{};
 const timers=[];const context={window:w,document,URL:TestURL,Blob,TextEncoder,TextDecoder,Uint8Array,Uint32Array,DataView,AbortController,MutationObserver:class{},setTimeout:(fn,ms)=>{if(ms===60000){timers.push(fn);return 1;}return setTimeout(fn,ms);},clearTimeout};
 vm.createContext(context);vm.runInContext(source,context,{filename:'site-backup-r1020.js'});api=w.SukunSiteBackup;
 return {api,w,calls,personalCalls,writes,urls,lease,timers};
}
function crc(bytes){let x=0xffffffff;for(const b of bytes){x^=b;for(let k=0;k<8;k++)x=x&1?0xedb88320^(x>>>1):x>>>1;}return (x^0xffffffff)>>>0;}
async function unzip(blob){const b=Buffer.from(await blob.arrayBuffer()),out=new Map();let at=0;while(b.readUInt32LE(at)===0x04034b50){assert.equal(b.readUInt16LE(at+8),0);const size=b.readUInt32LE(at+18),n=b.readUInt16LE(at+26),extra=b.readUInt16LE(at+28),name=b.subarray(at+30,at+30+n).toString(),start=at+30+n+extra,data=b.subarray(start,start+size);assert(!out.has(name));assert.equal(crc(data),b.readUInt32LE(at+14));out.set(name,data);at=start+size;}assert.equal(b.readUInt32LE(at),0x02014b50);assert.equal(b.readUInt32LE(b.length-22),0x06054b50);assert.equal(b.readUInt16LE(b.length-12),out.size);return out;}
async function errorCase(f,opts,code,privateReads){const h=harness(f,opts);const r=await h.api.exportSite({download:false});assert.equal(r.ok,false);assert.equal(r.error,code);assert.equal(h.writes.length,0);assert.equal(h.api.snapshot().busy,false);if(privateReads!==undefined)assert.equal(h.personalCalls.length,privateReads);return h;}
function updateManifest(f,fn){fn(f.manifest);f.files.set('sukun-site-assets-'+f.build+'.json',encode(f.manifest));}
(async()=>{
 for(const build of [...new Set([current,'r1027','r1042'])])await test(build+' coherent complete ZIP, SHA-256, STORE CRC, dynamic filenames and README',async()=>{const f=fixture(build),h=harness(f),r=await h.api.exportSite({download:false});assert.equal(r.ok,true);assert(r.filename.startsWith('SUKUN_'+build+'_'));assert.equal(h.api.version,build);const entries=await unzip(r.blob);assert.equal(entries.size,f.files.size+2);for(const [name,data]of f.files)assert.equal(sha(entries.get(name)),sha(data));assert(entries.get('recovery/OKU_README.txt').toString().includes('recovery/SUKUN_KISISEL_YEDEK_'+build+'.json'));assert.equal(entries.get('recovery/SUKUN_KISISEL_YEDEK_'+build+'.json').toString(),'{"syntheticRecording":"AQID"}');assert.equal(h.calls.filter(c=>c.path===`sukun-build-${build}.json`).length,1);assert.equal(h.writes.length,0);});
 await test('zero-byte deployment files are valid complete ZIP entries',async()=>{const f=fixture(undefined,f=>f.files.set('.nojekyll',Buffer.alloc(0))),h=harness(f),r=await h.api.exportSite({download:false});assert.equal(r.ok,true);const entries=await unzip(r.blob);assert.equal(entries.get('.nojekyll').length,0);});
 await test('window/meta mismatch rejected before network/personal read',async()=>{const h=await errorCase(fixture(),{meta:'r999'},'SITE_UNSUPPORTED_BUILD',0);assert.equal(h.calls.length,0);});
 await test('malformed build rejected before network',()=>errorCase(fixture(),{meta:'../../r1027',windowBuild:'../../r1027'},'SITE_UNSUPPORTED_BUILD',0));
 await test('missing build rejected safely',()=>errorCase(fixture(),{meta:'',windowBuild:''},'SITE_UNSUPPORTED_BUILD',0));
 await test('metadata-only current build supported',async()=>{const h=harness(fixture(),{windowBuild:''});assert((await h.api.exportSite({download:false})).ok);});
 await test('different inventory build fails',async()=>{const f=fixture();updateManifest(f,m=>m.build='r999');await errorCase(f,{},'SITE_MANIFEST_INVALID',0);});
 await test('marker/inventory runtime digest mismatch fails',async()=>{const f=fixture(undefined,f=>f.marker.runtime[0].sha256='0'.repeat(64));await errorCase(f,{},'SITE_MANIFEST_INVALID',0);});
 await test('cross-origin marker manifest URL rejected',()=>errorCase(fixture(undefined,f=>f.marker.siteBackupManifestUrl='https://evil.invalid/inventory.json'),{},'SITE_MANIFEST_INVALID',0));
 await test('different marker release rejected',()=>errorCase(fixture(undefined,f=>f.marker.build='r999'),{},'SITE_MANIFEST_INVALID',0));
 await test('conflicting marker v rejected',()=>errorCase(fixture(undefined,f=>f.marker.v='r999'),{},'SITE_MANIFEST_INVALID',0));
 await test('marker shell/inventory mismatch rejected',()=>errorCase(fixture(undefined,f=>f.marker.shell.sha256='0'.repeat(64)),{},'SITE_MANIFEST_INVALID',0));
 await test('missing required file rejected',async()=>{const f=fixture();updateManifest(f,m=>{m.files=m.files.filter(x=>x.path!=='sw.js');m.totalBytes=m.files.reduce((n,x)=>n+x.bytes,0);});await errorCase(f,{},'SITE_MANIFEST_INCOMPLETE',0);});
 await test('marker response hash checked before personal read',async()=>{const f=fixture();f.files.set('sukun-build-'+f.build+'.json',encode({...f.marker,unexpected:true}));await errorCase(f,{},'SITE_ASSET_HASH',0);});
 await test('runtime cross-origin URLs rejected',()=>errorCase(fixture(undefined,f=>f.marker.runtime[0].url='https://evil.invalid/asset.js?v='+f.build),{},'SITE_MANIFEST_INVALID',0));
 await test('runtime wrong release URLs rejected',()=>errorCase(fixture(undefined,f=>f.marker.runtime[0].url='./assets/runtime/site-backup-r1020.js?v=r999'),{},'SITE_MANIFEST_INVALID',0));
 await test('duplicate runtime paths rejected',()=>errorCase(fixture(undefined,f=>f.marker.runtime.push(f.marker.runtime[0])),{},'SITE_MANIFEST_INVALID',0));
 for(const p of ['../escape.js','/absolute.js','assets/%2e%2e/escape.js','assets\\escape.js','assets/a?query=1','assets//a','recovery/OKU_README.txt'])await test('unsafe/reserved inventory path: '+p,async()=>{const f=fixture();updateManifest(f,m=>m.files.push({path:p,bytes:0,sha256:sha('')}));await errorCase(f,{},'SITE_MANIFEST_INVALID',0);});
 await test('duplicate inventory paths rejected',async()=>{const f=fixture();updateManifest(f,m=>m.files.push(m.files[0]));await errorCase(f,{},'SITE_MANIFEST_INVALID',0);});
 await test('altered asset hash rejects complete archive',async()=>{const f=fixture();f.files.set('assets/art.bin',Buffer.from([4,3,2,1]));await errorCase(f,{},'SITE_ASSET_HASH',1);});
 await test('short asset rejected',async()=>{const f=fixture();f.files.set('assets/art.bin',Buffer.from([1,2]));await errorCase(f,{},'SITE_ASSET_SIZE',1);});
 await test('stream overflow rejected without trusting compressed content length',async()=>{await errorCase(fixture(),{fetch:({path})=>path==='assets/art.bin'?new Response(Buffer.alloc(10),{headers:{'content-length':'2','content-encoding':'gzip'}}):undefined},'SITE_ASSET_SIZE',1);});
 await test('missing asset rejects archive',async()=>{const f=fixture();f.files.delete('assets/art.bin');await errorCase(f,{},'SITE_ASSET_MISSING',1);});
 await test('different SW release rejected even with matching inventory hash',()=>errorCase(fixture(undefined,f=>f.files.set('sw.js',encode("const SURUM = 'r999';"))),{},'SITE_MANIFEST_INVALID',1));
 await test('different web manifest release rejected even with matching hash',()=>errorCase(fixture(undefined,f=>f.files.set('manifest.webmanifest',encode({short_name:'SÜKÛN',start_url:'./nero.html?v=r999'}))),{},'SITE_MANIFEST_INVALID',1));
 await test('latest changed during deployment rejects mixed archive',()=>errorCase(fixture(undefined,f=>f.files.set('sukun-latest.json',encode({v:'r999',build:'r999',latest:'r999'}))),{},'SITE_MANIFEST_INVALID',1));
 await test('wrong HTML release rejected despite matching declared hash',()=>errorCase(fixture(undefined,f=>{const s=encode('<meta name="sukun-build" content="r999">');f.files.set('index.html',s);f.files.set('nero.html',s);f.marker.shell.sha256=sha(s);}),{},'SITE_MANIFEST_INVALID',1));
 await test('duplicate consistent build meta tags supported',async()=>{const f=fixture(undefined,f=>{const s=encode('<meta name="sukun-build" content="'+f.build+'"><meta name="sukun-build" content="'+f.build+'">');f.files.set('index.html',s);f.files.set('nero.html',s);f.marker.shell.sha256=sha(s);}),h=harness(f);assert.equal((await h.api.exportSite({download:false})).ok,true);});
 await test('any conflicting duplicate build meta tag rejected',()=>errorCase(fixture(undefined,f=>{const s=encode('<meta name="sukun-build" content="'+f.build+'"><meta name="sukun-build" content="r999">');f.files.set('index.html',s);f.files.set('nero.html',s);f.marker.shell.sha256=sha(s);}),{},'SITE_MANIFEST_INVALID',1));
 await test('site total memory bound before personal capture',async()=>{const f=fixture();updateManifest(f,m=>{for(let i=0;i<9;i++)m.files.push({path:'big'+i,bytes:64*1024*1024,sha256:sha('')});m.totalBytes=m.files.reduce((n,x)=>n+x.bytes,0);});await errorCase(f,{},'SITE_MEMORY_LIMIT',0);});
 await test('estimated working memory bound before personal capture',async()=>{const f=fixture();updateManifest(f,m=>{for(let i=0;i<5;i++)m.files.push({path:'big'+i,bytes:64*1024*1024,sha256:sha('')});m.totalBytes=m.files.reduce((n,x)=>n+x.bytes,0);});await errorCase(f,{},'SITE_MEMORY_LIMIT',0);});
 await test('large personal Blob fails before file fetching/ZIP allocation',async()=>{class BigBlob extends Blob{get size(){return 128*1024*1024;}}const h=await errorCase(fixture(),{personal:()=>({file:new BigBlob(['synthetic'])})},'SITE_MEMORY_LIMIT',1);assert.equal(h.calls.length,2);});
 await test('cancellation while preparing personal data retains no archive',()=>errorCase(fixture(),{personal:({api})=>{api.cancel();return {file:new Blob(['synthetic'])};}},'SITE_CANCELLED',1));
 await test('ownership lease loss cancels before download',()=>errorCase(fixture(),{personal:({lease})=>{lease.current=()=>false;return {file:new Blob(['synthetic'])};}},'SITE_CANCELLED',1));
 await test('release change during export aborts',async()=>{const f=fixture();let h;h=harness(f,{personal:()=>{h.w.SUKUN_BUILD='r999';return {file:new Blob(['synthetic'])};}});assert.equal((await h.api.exportSite({download:false})).error,'SITE_UNSUPPORTED_BUILD');});
 await test('cancel aborts an in-flight network reader and releases busy state',async()=>{const f=fixture(),h=harness(f,{fetch:({path,options})=>path===`sukun-build-${f.build}.json`?new Promise((resolve,reject)=>options.signal.addEventListener('abort',()=>reject(Error('aborted')),{once:true})):undefined});const running=h.api.exportSite({download:false});for(let i=0;i<8;i++)await Promise.resolve();assert.equal(h.api.snapshot().busy,true);assert.equal(h.api.cancel(),true);assert.equal((await running).error,'SITE_CANCELLED');assert.equal(h.api.snapshot().busy,false);assert.equal(h.personalCalls.length,0);});
 await test('concurrent calls cannot begin two captures',async()=>{let release;const h=harness(fixture(),{personal:()=>new Promise(resolve=>{release=()=>resolve({file:new Blob(['synthetic'])});})});const running=h.api.exportSite({download:false});while(!release)await new Promise(r=>setTimeout(r,0));assert.equal((await h.api.exportSite({download:false})).error,'SITE_BUSY');release();assert.equal((await running).ok,true);assert.equal(h.personalCalls.length,1);});
 await test('maintenance denied does not access storage or fetch',async()=>{const h=await errorCase(fixture(),{noLease:true},'SITE_BUSY',0);assert.equal(h.calls.length,0);});
 await test('personal capture failure does not produce partial ZIP',()=>errorCase(fixture(),{personal:()=>({ok:false})},'SITE_PERSONAL_UNAVAILABLE',1));
 await test('double export blocked until first download Blob released',async()=>{const h=harness(fixture());assert((await h.api.exportSite()).ok);assert.equal(h.writes.length,1);assert.equal((await h.api.exportSite()).error,'SITE_DOWNLOAD_PENDING');assert.equal(h.writes.length,1);h.timers.forEach(f=>f());assert.equal(h.api.snapshot().downloadPending,false);});
 await test('optional Google font stylesheet remains permissible',async()=>{const h=harness(fixture(),{deps:[{tagName:'LINK',getAttribute:k=>({rel:'stylesheet',href:'https://fonts.googleapis.com/css2?family=Amiri'}[k])}]});assert((await h.api.exportSite({download:false})).ok);});
 await test('external executable dependency rejected',()=>errorCase(fixture(),{deps:[{tagName:'SCRIPT',getAttribute:k=>k==='src'?'https://evil.invalid/x.js':null}]},'SITE_EXTERNAL_DEPENDENCY',0));
 fs.writeFileSync(path.join(__dirname,'site-backup-results.json'),JSON.stringify({sourceRoot:root,sourceSha256:sha(source),method:'Exact production exporter with synthetic release inventory and controlled VM endpoints; no real user data or browser',passed:count,results},null,2));console.log(`${count}/${count} passed`);
})().catch(e=>{console.error(e);process.exitCode=1;});
