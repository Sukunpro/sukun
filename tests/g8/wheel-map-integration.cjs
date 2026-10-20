'use strict';
// Only this test executes the unchanged first wheel module in a labelled VM.
// The maintenance tool and its extractor never execute production JavaScript.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const crypto=require('node:crypto'),vm=require('node:vm'),assert=require('node:assert/strict');
const {buildReferenceMap}=require('../../tools/visual-reference-map.cjs');
const {mapWheelCatalog}=require('../../tools/wheel-catalog-map.cjs');
const root=path.resolve(__dirname,'../..'),sourcePath='assets/runtime/wheels-r924.js';
const source=fs.readFileSync(path.join(root,sourcePath),'utf8');
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const normalize=rows=>JSON.parse(JSON.stringify(rows)).sort((a,b)=>a.alias<b.alias?-1:a.alias>b.alias?1:0);
const results=[],temporary=fs.mkdtempSync(path.join(os.tmpdir(),'sukun-wheel-map-integration-'));
function test(name,fn){try{const evidence=fn();results.push({name,passed:true,...(evidence?{evidence}:{})});}catch(error){results.push({name,passed:false,error:error.stack});}}
let executed=[];
function fixture(name,rows,omit,wheelSource=source){
 const dir=path.join(temporary,name);fs.mkdirSync(dir);
 const files={'index.html':'<!doctype html><html><body></body></html>','nero.html':'<!doctype html><html><body></body></html>',[sourcePath]:wheelSource};
 for(const row of rows)if(row.target!==omit)files[row.target]='synthetic image bytes for '+row.target;
 for(const [file,bytes] of Object.entries(files)){fs.mkdirSync(path.dirname(path.join(dir,file)),{recursive:true});fs.writeFileSync(path.join(dir,file),bytes);}
 fs.writeFileSync(path.join(dir,'version.txt'),'r1\n');
 fs.writeFileSync(path.join(dir,'sukun-site-assets-r1.json'),JSON.stringify({schema:1,build:'r1',files:Object.entries(files).map(([file,bytes])=>({path:file,bytes:Buffer.byteLength(bytes),sha256:hash(bytes)}))}));
 return dir;
}
try{
 test('Static wheel mappings match the actual production catalog in a controlled VM',()=>{
  const end=source.indexOf('\n/* r929:');assert(end>0,'Known first-module boundary must exist');
  const context={window:{addEventListener(){}},localStorage:{getItem(){return null;}}};
  new vm.Script(source.slice(0,end),{filename:sourcePath+'#catalog-only'}).runInNewContext(context,{timeout:1500});
  const catalog=context.window.SukunWheels.catalog;
  executed=normalize(Object.entries(catalog).flatMap(([family,rows])=>Array.from(rows,item=>({alias:'wheel:'+family+':'+item.id,target:item.src.replace(/^\.\//,'')}))));
  assert.equal(executed.length,54);assert.equal(new Set(executed.map(row=>row.target)).size,37);
  const actual=mapWheelCatalog(source);assert.deepEqual(actual.errors,[]);assert.deepEqual(actual.unresolved,[]);
  assert.deepEqual(normalize(actual.aliases.map(({alias,target})=>({alias,target}))),executed);
  return{familyCounts:{berhet:catalog.berhet.length,esma:catalog.esma.length},aliases:executed.length,uniqueTargets:37};
 });
 test('Main visual map requires every generated selection target to be inventoried and hash verified',()=>{
  assert.equal(executed.length,54);const dir=fixture('complete',executed),report=buildReferenceMap(dir);
  assert.equal(report.summary.errors,0);assert.equal(report.runtimeAliases.length,54);
  assert(report.runtimeAliases.every(row=>row.source===sourcePath&&row.builder&&row.family));
  assert.deepEqual(normalize(report.runtimeAliases.map(({alias,target})=>({alias,target}))),executed);
 });
 test('A missing dynamically generated target is an explicit alias-verification failure',()=>{
  assert.equal(executed.length,54);const missing='assets/wheels-r977/ceviz-naksi.webp';assert(executed.some(row=>row.target===missing));
  const dir=fixture('missing-generated-target',executed,missing),report=buildReferenceMap(dir);
  const failures=report.errors.filter(row=>row.code==='RUNTIME_ALIAS_TARGET_UNVERIFIED'&&row.target===missing);
  assert.equal(failures.length,2);assert(report.summary.errors>=2);
 });
 test('An unrelated identical template on the same line remains unresolved by exact offset',()=>{
  const expression='./assets/wheels-r977/${id}.webp';
  const declaration=source.indexOf('const nativeWheel='),lineEnd=source.indexOf('\n',declaration);assert(declaration>0&&lineEnd>declaration);
  const changed=source.slice(0,lineEnd)+'const unrelated=`'+expression+'`;'+source.slice(lineEnd);
  const report=buildReferenceMap(fixture('same-line-template',executed,null,changed));assert.equal(report.summary.errors,0);
  const unknown=report.unresolved.filter(row=>row.source===sourcePath&&row.code==='DYNAMIC_TEMPLATE'&&row.expression===expression);
  const known=report.resolvedObservations.filter(row=>row.source===sourcePath&&row.expression===expression);
  assert.equal(unknown.length,1);assert.equal(known.length,1);assert.equal(unknown[0].line,known[0].line);assert.notEqual(unknown[0].offset,known[0].offset);
  assert.equal(report.runtimeAliases.length,54);
 });
 test('Current production map preserves the original 88 scene and wheel selections plus reviewed dynamic variants',()=>{
  const report=buildReferenceMap(root);assert.equal(report.build,fs.readFileSync(path.join(root,'version.txt'),'utf8').trim());assert.equal(report.summary.errors,0);
  assert.equal(report.summary.verifiedImages,295);assert.equal(report.runtimeAliases.filter(row=>!row.source.startsWith('reviewed-dynamic:')).length,88);assert.equal(report.runtimeAliases.length,182);
  const mapped=report.runtimeAliases.filter(row=>row.source===sourcePath);
  assert.deepEqual(normalize(mapped.map(({alias,target})=>({alias,target}))),executed);
  assert(!report.unresolved.some(row=>row.code==='DYNAMIC_WHEEL_CATALOG'));
  return{verifiedImages:295,mappings:report.runtimeAliases.length,wheelMappings:mapped.length};
 });
}finally{fs.rmSync(temporary,{recursive:true,force:true});}
const report={suite:'G8 dynamic wheel mapping integration',method:'Compare static extraction with the unchanged first production catalog module in an explicitly controlled VM; separately verify main-map inventory membership on real temporary filesystem trees and current production bytes.',toolExecutesProduction:false,browserExecuted:false,sourceSha256:{[sourcePath]:hash(source),'tools/visual-reference-map.cjs':hash(fs.readFileSync(path.join(root,'tools/visual-reference-map.cjs'))),'tools/wheel-catalog-map.cjs':hash(fs.readFileSync(path.join(root,'tools/wheel-catalog-map.cjs')))},passed:results.filter(row=>row.passed).length,total:results.length,results};
console.log(JSON.stringify(report,null,2));if(report.passed!==report.total)process.exitCode=1;
