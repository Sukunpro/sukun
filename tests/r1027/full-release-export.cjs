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
 const manifestName='sukun-site-assets-'+current+'.json',manifest=JSON.parse(fs.readFileSync(path.join(root,manifestName),'utf8'));
 assert.equal(manifest.build,current);const allowed=new Set([...manifest.files.map(f=>f.path),manifestName]);
 for(const f of manifest.files)assert(fs.existsSync(path.join(root,f.path)),'Missing deployment file: '+f.path);
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const attr=(tag,key)=>tag.match(new RegExp('\\b'+key+'\\s*=\\s*["\\\']([^"\\\']*)["\\\']','i'))?.[1]||null;
 const deps=(html.match(/<(?:script|link)\b[^>]*>/gi)||[]).filter(tag=>/^<script/i.test(tag)?!!attr(tag,'src'):['stylesheet','manifest'].includes(attr(tag,'rel'))).map(tag=>({tagName:/^<script/i.test(tag)?'SCRIPT':'LINK',getAttribute:key=>attr(tag,key)}));
 const f={build:current,files:{get:p=>allowed.has(p)?fs.readFileSync(path.join(root,p)):undefined}},h=harness(f,{deps});
 const started=Date.now(),result=await h.api.exportSite({download:false});assert.equal(result.ok,true,JSON.stringify(result));
 const entries=await unzip(result.blob);assert.equal(entries.size,manifest.files.length+3);
 for(const file of manifest.files){const bytes=entries.get(file.path);assert(bytes,'Missing ZIP entry '+file.path);assert.equal(bytes.length,file.bytes);assert.equal(sha(bytes),file.sha256);}
 assert.equal(sha(entries.get(manifestName)),sha(fs.readFileSync(path.join(root,manifestName))));
 assert.equal(entries.get('recovery/SUKUN_KISISEL_YEDEK_'+current+'.json').toString(),'{"syntheticRecording":"AQID"}');
 const report={sourceRoot:root,build:current,sourceSha256:sha(source),ok:true,files:entries.size,zipBytes:result.blob.size,deploymentBytes:manifest.totalBytes,networkCalls:h.calls.length,syntheticPrivateCaptures:h.personalCalls.length,downloads:h.writes.length,elapsedMs:Date.now()-started,method:'Exact final production exporter with all deployment file bytes and SHA-256 inventory; synthetic personal JSON only; local controlled fetch and DOM, no live browser or personal data'};
 fs.writeFileSync(path.join(__dirname,'full-release-export-results.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
