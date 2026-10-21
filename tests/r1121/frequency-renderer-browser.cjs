#!/usr/bin/env node
'use strict';
// Re-run the original native rendering scenarios against the renderer that the
// candidate actually loads. Do not import or reinterpret historical results.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const output=path.resolve(process.argv[3]||path.join(__dirname,'evidence/frequency-renderer-browser.json'));
const hash=data=>crypto.createHash('sha256').update(data).digest('hex');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const renderer=html.match(/src="\.\/(assets\/runtime\/background-mix-render-r\d+\.js)\?/)?.[1];assert(renderer,'Referenced native renderer');
const legacyPath=path.join(root,'tests/r1059/renderer.cjs');
let source=fs.readFileSync(legacyPath,'utf8');const original=source;
function replaceOnce(before,after){assert.equal(source.split(before).length-1,1,'Explicit source adaptation: '+before);source=source.replace(before,after);}
replaceOnce("require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES + '/playwright')","require('playwright')");
replaceOnce("'assets/runtime/background-mix-render-r1059.js'",JSON.stringify(renderer));
const report={suite:'r1121 referenced native renderer historical regressions',startedAt:new Date().toISOString(),browserExecuted:false,passed:0,total:0,allPassed:false,sourceHashes:{index:hash(html),renderer:hash(fs.readFileSync(path.join(root,renderer)))},renderer,testSha256:hash(fs.readFileSync(__filename)),historicalTestSha256:hash(original),adaptations:['Resolve Playwright through normal Node module resolution.','Point the unchanged rendering scenarios at the exact renderer referenced by index.html.','Supply SUKUN_CHROMIUM from CHROMIUM_PATH when configured.'],limitations:['Real Chromium OfflineAudioContext samples and virtual scheduling only; no audible listening, physical Android, actual screen lock, Bluetooth, OS audio focus or acoustic safety acceptance.']};
(async()=>{try{
 const processView={argv:['node',legacyPath,root],env:{...process.env,SUKUN_CHROMIUM:process.env.CHROMIUM_PATH||process.env.SUKUN_CHROMIUM||'/tmp/sukun-browser/chromium'},exitCode:0};
 let result=null;
 const sandbox={require,__dirname:path.dirname(legacyPath),process:processView,console:{...console,log:value=>{const parsed=JSON.parse(String(value));assert(!result,'Exactly one completed native report');result=parsed;},error:(...args)=>console.error(...args)}};
 await vm.runInNewContext(source,sandbox,{filename:legacyPath});
 assert.equal(processView.exitCode,0,'Historical native renderer suite failed');assert(result&&result.total>0&&result.passed===result.total,'Complete native renderer evidence is required');
 Object.assign(report,{browserExecuted:true,passed:result.passed,total:result.total,allPassed:true,results:result.results,nativeScope:result.scope});
 if(result.bundled)Object.assign(report,{bundled:result.bundled,bundledPassed:result.bundledPassed});
}catch(error){report.fatal=error.stack;}finally{report.finishedAt=new Date().toISOString();fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));if(!report.allPassed)process.exitCode=1;}})();
