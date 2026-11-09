'use strict';
// Execute the exact shipped URL selector in a controlled DOM seam. No audio APIs
// are replaced or invoked; native preload reuse is checked separately in CI.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const script=fs.readFileSync(path.join(root,'assets/runtime/startup-intro-r1027.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const helper=script.slice(script.indexOf('  function introAssetURL('),script.indexOf('  function loadAsset(){'));
assert(helper.startsWith('  function introAssetURL('));
const integrity='sha256-GecAJ60xJdEWWgn9tSnIeIEEjChmCU6I4aFp5B995Fc=';
const base='https://example.test/sukun/index.html';
const fallback='./assets/audio/sukun-intro-signature-r1037.wav?v=r1184';
const current='./assets/audio/sukun-intro-signature-r1037.wav?v=r1241';
function link(href=current,extra={}){
  const attrs={href,integrity,crossorigin:'anonymous',type:'audio/wav',...extra};
  return {href:new URL(attrs.href,base).href,getAttribute:name=>attrs[name]??null};
}
function resolve(links=[],fail=false){
  const context=vm.createContext({URL,window:{location:{href:base}},document:{querySelectorAll:selector=>{
    assert.equal(selector,'link[rel="preload"][as="fetch"]');
    if(fail)throw Error('DOM unavailable');return links;
  }}});
  vm.runInContext(helper+';globalThis.resolve=introAssetURL;',context);
  return context.resolve(integrity);
}
const results=[];
function test(name,fn){try{fn();results.push({name,passed:true});}catch(e){results.push({name,passed:false,error:e.stack});}}
test('Same-origin verified preload reuses its exact URL and release query',()=>assert.equal(resolve([link()]),new URL(current,base).href));
test('Future release query is reused without another runtime version edit',()=>assert.equal(resolve([link(current.replace('r1241','r1242'))]),new URL(current.replace('r1241','r1242'),base).href));
test('Missing preload preserves the historical fallback',()=>assert.equal(resolve(),fallback));
test('Unavailable DOM preserves the fallback',()=>assert.equal(resolve([],true),fallback));
for(const [name,entry] of [
  ['cross-origin',link('https://evil.test/sukun/assets/audio/sukun-intro-signature-r1037.wav?v=r1241')],
  ['wrong pathname',link('./assets/audio/other.wav?v=r1241')],
  ['wrong integrity',link(current,{integrity:'sha256-invalid'})],
  ['missing integrity',link(current,{integrity:null})],
  ['credentialed preload mode',link(current,{crossorigin:'use-credentials'})],
  ['wrong MIME type',link(current,{type:'audio/mpeg'})],
  ['URL credentials',link('https://name:password@example.test/sukun/assets/audio/sukun-intro-signature-r1037.wav?v=r1241')],
  ['fragment',link(current+'#fragment')],
  ['unbounded query',link(current+'&extra=1')]
])test('Reject '+name,()=>assert.equal(resolve([entry]),fallback));
test('Invalid earlier link cannot hide a subsequent verified preload',()=>assert.equal(resolve([link(current,{integrity:'bad'}),link()]),new URL(current,base).href));
test('Actual shipped shell preload matches its WAV bytes and resolves exactly',()=>{
  const tag=html.match(/<link\b[^>]*rel="preload"[^>]*sukun-intro-signature-r1037\.wav[^>]*>/)[0];
  const attrs=Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(m=>[m[1],m[2]]));
  const bytes=fs.readFileSync(path.join(root,'assets/audio/sukun-intro-signature-r1037.wav'));
  assert.equal(attrs.integrity,'sha256-'+crypto.createHash('sha256').update(bytes).digest('base64'));
  assert.equal(resolve([link(attrs.href,attrs)]),new URL(attrs.href,base).href);
});
test('Fetch uses selected URL while cache, credentials, SRI and byte hash remain',()=>{
  assert.match(script,/window\.fetch\(introAssetURL\(options\.integrity\),options\)/);
  assert(script.includes("cache:'force-cache',credentials:'same-origin',integrity:'"+integrity+"'"));
  assert(script.includes('bytes.byteLength!==288044'));
  assert(script.includes("crypto.subtle.digest('SHA-256',bytes)"));
  assert(script.includes("actual!=='19e70027ad3125d1165a09fdb529c87881048c2866094e88e1a169e41f7de457'"));
  assert(script.includes('if(assetController)options.signal=assetController.signal;'));
});
const report={suite:'r1241 verified intro preload URL reuse',passed:results.filter(x=>x.passed).length,total:results.length,results,limitations:['Controlled URL-selection VM, not native preload consumption, acoustic output or physical device acceptance.']};
console.log(JSON.stringify(report,null,2));
if(report.passed!==report.total)process.exitCode=1;
