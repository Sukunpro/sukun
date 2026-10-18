'use strict';
// The known r1108 inline body is the baseline, rather than a regenerated copy
// of the new file. Runtime/SRI/inventory gates become mandatory at r1109.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const output=path.resolve(process.argv[3]||path.join(root,'tests/r1109/evidence/category-flow-extraction.json'));
const TARGET='css/category-flow-r1109.css',BASELINE='cea8152b97516fb5bb7908c8868d190179cebe0c66d9fae548411d53487c1dd8';
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex'),read=name=>fs.readFileSync(path.join(root,name)),results=[];
const shell=read('index.html'),alias=read('nero.html'),html=shell.toString('utf8'),css=read(TARGET),build=read('version.txt').toString().trim();
assert(/^r\d+$/.test(build),'Invalid current release identity');
const finalized=Number(build.slice(1))>=1109;
const tags=[...html.matchAll(/<(?:style|link)\b[^>]*\bid=["']r976-category-flow["'][^>]*>/g)];
const targetTag=tags[0]?.[0]||'',targetIndex=tags[0]?.index??-1,external=/^<link\b/.test(targetTag);
const phase=finalized?'finalized':external?'shell-integrated-before-finalizer':'baseline-before-shell-integration';
function check(name,work){try{const evidence=work();results.push({name,passed:true,...(evidence?{evidence}:{})});}catch(error){results.push({name,passed:false,error:String(error.stack||error)});}}
function pending(name){results.push({name,passed:null,skipped:true,reason:'Release finalizer has not advanced version.txt to r1109.'});}
function attribute(tag,name){return tag.match(new RegExp('\\b'+name+'=["\']([^"\']*)["\']'))?.[1]||null;}
const local=url=>String(url||'').replace(/^\.\//,'').split(/[?#]/,1)[0];

check('Extracted CSS bytes equal the frozen r1108 inline baseline',()=>{assert.equal(css.length,1987);assert.equal(sha(css),BASELINE);return{bytes:css.length,sha256:sha(css)};});
check('The extracted block introduces no relative asset, import or font dependency',()=>{const text=css.toString('utf8').replace(/\/\*[\s\S]*?\*\//g,'');assert.equal((text.match(/\{/g)||[]).length,8);assert(!/url\s*\(|@import\b|@font-face\b/i.test(text));assert(!/<\/?(?:script|style)\b/i.test(text));});
check('Public index and nero URL aliases remain byte-identical',()=>{assert.deepEqual(shell,alias);return{bytesEach:shell.length,sha256:sha(shell)};});
check('Exactly one category-flow ID remains in the shell',()=>{assert.equal(tags.length,1);assert(targetIndex>=0);if(finalized)assert(external,'Finalized extraction must use the shared stylesheet');if(external){assert.equal(attribute(targetTag,'rel'),'stylesheet');assert.equal(local(attribute(targetTag,'href')),TARGET);assert(!new RegExp('<style\\b[^>]*id=["\']r976-category-flow["\']').test(html));}else{assert(!finalized);const match=html.match(/<style id="r976-category-flow">([\s\S]*?)<\/style>/);assert(match);assert.equal(sha(Buffer.from(match[1])),BASELINE);}return{phase,external};});
check('Cascade position stays directly between cadence and tooltip owners',()=>{const before=html.match(/<script\b[^>]*\bid=["']sukun-r981-cadence["'][^>]*>[\s\S]*?<\/script>/);assert(before);const after=html.match(/<style\b[^>]*\bid=["']sukun-r976-tooltip-help["'][^>]*>/);assert(after);assert(before.index<targetIndex&&targetIndex<after.index);const end=external?targetIndex+targetTag.length:html.indexOf('</style>',targetIndex)+8;assert(/^\s*$/.test(html.slice(before.index+before[0].length,targetIndex)));assert(/^\s*$/.test(html.slice(end,after.index)));});
if(finalized){
 check('Shared CSS URL follows the current release and has exact SRI',()=>{assert(external);assert.equal(attribute(targetTag,'href'),'./'+TARGET+'?v='+build);assert.equal(attribute(targetTag,'integrity'),'sha256-'+Buffer.from(BASELINE,'hex').toString('base64'));});
 check('Build marker and service worker require the same unique CSS member',()=>{const marker=JSON.parse(read('sukun-build-'+build+'.json')),worker=read('sw.js').toString(),match=worker.match(/const REQUIRED_RUNTIME = (\[[\s\S]*?\]);/);assert(match);const runtime=JSON.parse(match[1]);const a=marker.runtime.filter(row=>local(row.url)===TARGET),b=runtime.filter(row=>local(row.url)===TARGET);assert.equal(a.length,1);assert.equal(b.length,1);assert.deepEqual(a,b);assert.equal(a[0].sha256,BASELINE);assert.equal(a[0].url,'./'+TARGET+'?v='+build);assert.equal(marker.shell.sha256,sha(shell));});
 check('Deployment inventory includes the unchanged shared CSS bytes',()=>{const inventory=JSON.parse(read('sukun-site-assets-'+build+'.json'));assert.equal(inventory.build,build);const rows=inventory.files.filter(row=>row.path===TARGET);assert.equal(rows.length,1);assert.equal(rows[0].sha256,BASELINE);assert.equal(rows[0].bytes,1987);});
}else{
 pending('Shared CSS release URL and SRI after finalization');
 pending('Unique build marker and service worker dependency after finalization');
 pending('Deployment inventory membership after finalization');
}
const report={suite:'r1109 category-flow extraction',build,phase,method:'Frozen r1108 inline-body SHA-256 baseline versus extracted bytes, exact shell ID/cascade anchors, public URL alias equality, and finalized SRI/runtime/inventory metadata. No browser rendering or audio playback claim.',browserExecuted:false,limitations:['Static byte and dependency checks do not establish native CSS loading timing, visible layout or offline startup behavior.'],sourceFiles:{'index.html':{bytes:shell.length,sha256:sha(shell)},'nero.html':{bytes:alias.length,sha256:sha(alias)},[TARGET]:{bytes:css.length,sha256:sha(css)}},finishedAt:new Date().toISOString(),passed:results.filter(x=>x.passed===true).length,total:results.length,skipped:results.filter(x=>x.skipped).length,results};
fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({suite:report.suite,build,phase,passed:report.passed,total:report.total,skipped:report.skipped,output,failed:results.filter(x=>x.passed===false)},null,2));if(results.some(x=>x.passed===false))process.exitCode=1;
