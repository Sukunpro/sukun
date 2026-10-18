'use strict';
// Frozen r1109 inline CSS is the baseline. This verifies byte identity and the
// release dependency boundary, not rendered layout or tooltip interaction.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const output=path.resolve(process.argv[3]||path.join(root,'tests/r1110/evidence/tooltip-help-extraction.json'));
const TARGET='css/tooltip-help-r1110.css',BASELINE='b5f598abc3d9660977742bb285802a691b21587e4c4eaf371af1bd31ece5b4da';
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex'),read=name=>fs.readFileSync(path.join(root,name)),results=[];
const shell=read('index.html'),alias=read('nero.html'),html=shell.toString('utf8'),css=read(TARGET),build=read('version.txt').toString().trim();
assert(/^r\d+$/.test(build),'Invalid current release identity');
const finalized=Number(build.slice(1))>=1110;
const tags=[...html.matchAll(/<(?:style|link)\b[^>]*\bid=["']sukun-r976-tooltip-help["'][^>]*>/g)];
const targetTag=tags[0]?.[0]||'',targetIndex=tags[0]?.index??-1,external=/^<link\b/.test(targetTag);
const phase=finalized?'finalized':external?'shell-integrated-before-finalizer':'baseline-before-shell-integration';
const local=url=>String(url||'').replace(/^\.\//,'').split(/[?#]/,1)[0];
function attribute(tag,name){return tag.match(new RegExp('\\b'+name+'=["\']([^"\']*)["\']'))?.[1]||null;}
function check(name,work){try{const evidence=work();results.push({name,passed:true,...(evidence?{evidence}:{})});}catch(error){results.push({name,passed:false,error:String(error.stack||error)});}}
function pending(name){results.push({name,passed:null,skipped:true,reason:'Release finalizer has not advanced version.txt to r1110.'});}

check('Shared help CSS matches the exact frozen r1109 inline body',()=>{assert.equal(css.length,1721);assert.equal(sha(css),BASELINE);return{bytes:css.length,sha256:sha(css)};});
check('Existing CSS layer and fixed rules have no asset, import, font or executable dependency',()=>{const text=css.toString('utf8').replace(/\/\*[\s\S]*?\*\//g,'');assert.equal((text.match(/\{/g)||[]).length,5);assert(/@layer sukun-r920-contract\s*\{/.test(text));assert(!/url\s*\(|@import\b|@font-face\b/i.test(text));assert(!/<\/?(?:script|style)\b/i.test(text));});
check('Index and nero public aliases remain byte-identical',()=>{assert.deepEqual(shell,alias);return{bytesEach:shell.length,sha256:sha(shell)};});
check('Help stylesheet retains one exact ID and an unchanged CSS source',()=>{assert.equal(tags.length,1);assert(targetIndex>=0);if(finalized)assert(external,'Finalized extraction must use the shared stylesheet');if(external){assert.equal(attribute(targetTag,'rel'),'stylesheet');assert.equal(local(attribute(targetTag,'href')),TARGET);assert(!/<style\b[^>]*id=["']sukun-r976-tooltip-help["']/.test(html));}else{assert(!finalized);const match=html.match(/<style id="sukun-r976-tooltip-help">([\s\S]*?)<\/style>/);assert(match);assert.equal(sha(Buffer.from(match[1])),BASELINE);}return{phase,external};});
check('Help CSS keeps direct cascade adjacency between category flow and progress adapter',()=>{const before=html.match(/<link\b[^>]*\bid=["']r976-category-flow["'][^>]*>/),after=html.match(/<script\b[^>]*\bid=["']r982-progress-journal-adapter["'][^>]*>/);assert(before);assert(after);assert(before.index<targetIndex&&targetIndex<after.index);const end=external?targetIndex+targetTag.length:html.indexOf('</style>',targetIndex)+8;assert(/^\s*$/.test(html.slice(before.index+before[0].length,targetIndex)));assert(/^\s*$/.test(html.slice(end,after.index)));});
if(finalized){
 check('Shared help CSS has a current version URL and exact SRI',()=>{assert(external);assert.equal(attribute(targetTag,'href'),'./'+TARGET+'?v='+build);assert.equal(attribute(targetTag,'integrity'),'sha256-'+Buffer.from(BASELINE,'hex').toString('base64'));});
 check('Build marker and service worker share one exact required help CSS dependency',()=>{const marker=JSON.parse(read('sukun-build-'+build+'.json')),worker=read('sw.js').toString(),match=worker.match(/const REQUIRED_RUNTIME = (\[[\s\S]*?\]);/);assert(match);const runtime=JSON.parse(match[1]);const a=marker.runtime.filter(row=>local(row.url)===TARGET),b=runtime.filter(row=>local(row.url)===TARGET);assert.equal(a.length,1);assert.equal(b.length,1);assert.deepEqual(a,b);assert.equal(a[0].sha256,BASELINE);assert.equal(a[0].url,'./'+TARGET+'?v='+build);assert.equal(marker.shell.sha256,sha(shell));});
 check('Deployment inventory retains the exact shared help CSS bytes',()=>{const inventory=JSON.parse(read('sukun-site-assets-'+build+'.json'));assert.equal(inventory.build,build);const rows=inventory.files.filter(row=>row.path===TARGET);assert.equal(rows.length,1);assert.equal(rows[0].sha256,BASELINE);assert.equal(rows[0].bytes,1721);});
}else{
 pending('Shared help CSS release URL and SRI after finalization');
 pending('Unique build marker and service worker dependency after finalization');
 pending('Deployment inventory membership after finalization');
}
const report={suite:'r1110 tooltip-help extraction',build,phase,method:'Frozen r1109 inline-body SHA-256 baseline versus extracted bytes, exact stylesheet ID/cascade anchors, public URL alias equality, and finalized SRI/runtime/inventory metadata. No browser rendering or audio playback claim.',browserExecuted:false,limitations:['Static byte and dependency checks do not establish native CSS loading timing, visible layout, focus interaction or offline startup behavior.'],sourceFiles:{'index.html':{bytes:shell.length,sha256:sha(shell)},'nero.html':{bytes:alias.length,sha256:sha(alias)},[TARGET]:{bytes:css.length,sha256:sha(css)}},finishedAt:new Date().toISOString(),passed:results.filter(x=>x.passed===true).length,total:results.length,skipped:results.filter(x=>x.skipped).length,results};
fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({suite:report.suite,build,phase,passed:report.passed,total:report.total,skipped:report.skipped,output,failed:results.filter(x=>x.passed===false)},null,2));if(results.some(x=>x.passed===false))process.exitCode=1;
