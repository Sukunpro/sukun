'use strict';
// Frozen r1110 CSS and owner-script bodies define the extraction boundary.
// These checks do not claim native layout or offline startup acceptance.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const output=path.resolve(process.argv[3]||path.join(root,'tests/r1111/evidence/notification-layout-extraction.json'));
const ID='r589-notification-layout-authority',TARGET='css/notification-layout-r1111.css';
const BASELINE='dba02fc702f8320cf6ed05d847ac70df68c31ef43441be962484ecaad096e27f';
const OWNER_BASELINE='adf8413a3ade0ded1668144a6e749274bd5e2304618c7b8f00d936d747fa30bf';
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex'),read=name=>fs.readFileSync(path.join(root,name)),results=[];
const shell=read('index.html'),alias=read('nero.html'),html=shell.toString('utf8'),css=read(TARGET),build=read('version.txt').toString().trim();
assert(/^r\d+$/.test(build),'Invalid current release identity');
const finalized=Number(build.slice(1))>=1111;
const tags=[...html.matchAll(/<(?:style|link)\b[^>]*\bid=["']r589-notification-layout-authority["'][^>]*>/g)];
const targetTag=tags[0]?.[0]||'',targetIndex=tags[0]?.index??-1,external=/^<link\b/.test(targetTag);
const phase=finalized?'finalized':external?'shell-integrated-before-finalizer':'baseline-before-shell-integration';
const local=url=>String(url||'').replace(/^\.\//,'').split(/[?#]/,1)[0];
function attribute(tag,name){return tag.match(new RegExp('\\b'+name+'=["\']([^"\']*)["\']'))?.[1]||null;}
function check(name,work){try{const evidence=work();results.push({name,passed:true,...(evidence?{evidence}:{})});}catch(error){results.push({name,passed:false,error:String(error.stack||error)});}}
function pending(name){results.push({name,passed:null,skipped:true,reason:'Release finalizer has not advanced version.txt to r1111.'});}

check('Notification layout CSS retains all frozen r1110 bytes',()=>{assert.equal(css.length,4990);assert.equal(sha(css),BASELINE);return{bytes:css.length,sha256:sha(css)};});
check('Extracted layout contains no asset, import, font, variable or executable dependency',()=>{const text=css.toString('utf8').replace(/\/\*[\s\S]*?\*\//g,'');assert.equal((text.match(/\{/g)||[]).length,23);assert(/@media\s*\(max-width:390px\)/.test(text));assert(!/url\s*\(|@import\b|@font-face\b|\bfont(?:-family)?\s*:|var\s*\(/i.test(text));assert(!/<\/?(?:script|style)\b/i.test(text));});
check('Index and nero URL aliases remain byte-identical',()=>{assert.deepEqual(shell,alias);return{bytesEach:shell.length,sha256:sha(shell)};});
check('Notification layout keeps its exact single ID and source body',()=>{assert.equal(tags.length,1);assert(targetIndex>=0);if(finalized)assert(external,'Finalized extraction must use the shared stylesheet');if(external){assert.equal(attribute(targetTag,'rel'),'stylesheet');assert.equal(local(attribute(targetTag,'href')),TARGET);assert(!/<style\b[^>]*id=["']r589-notification-layout-authority["']/.test(html));}else{assert(!finalized);const match=html.match(/<style id="r589-notification-layout-authority">([\s\S]*?)<\/style>/);assert(match);assert.equal(sha(Buffer.from(match[1])),BASELINE);}return{phase,external};});
check('Layout keeps direct cascade adjacency between mini transport and notification owner',()=>{const before=html.match(/<(style|link)\b[^>]*\bid=["']r590-mini-transport-fit["'][^>]*>/),after=html.match(/<script\b[^>]*\bid=["']r589-notification-owner-runtime["'][^>]*>/);assert(before);assert(after);assert(before.index<targetIndex&&targetIndex<after.index);const beforeEnd=before[1]==='link'?before.index+before[0].length:html.indexOf('</style>',before.index)+8;const end=external?targetIndex+targetTag.length:html.indexOf('</style>',targetIndex)+8;assert(/^\s*$/.test(html.slice(beforeEnd,targetIndex)));assert(/^\s*$/.test(html.slice(end,after.index)));});
check('Existing notification owner remains unchanged and never owns stylesheet text',()=>{const owner=html.match(/<script id="r589-notification-owner-runtime">([\s\S]*?)<\/script>/);assert(owner);assert.equal(Buffer.byteLength(owner[1]),1348);assert.equal(sha(Buffer.from(owner[1])),OWNER_BASELINE);assert(!owner[1].includes(ID));return{ownerBytes:1348,ownerSha256:OWNER_BASELINE};});
if(finalized){
 check('Shared layout CSS has a current release URL and exact SRI',()=>{assert(external);assert.equal(attribute(targetTag,'href'),'./'+TARGET+'?v='+build);assert.equal(attribute(targetTag,'integrity'),'sha256-'+Buffer.from(BASELINE,'hex').toString('base64'));});
 check('Build marker and service worker require one identical layout dependency',()=>{const marker=JSON.parse(read('sukun-build-'+build+'.json')),worker=read('sw.js').toString(),match=worker.match(/const REQUIRED_RUNTIME = (\[[\s\S]*?\]);/);assert(match);const runtime=JSON.parse(match[1]);const a=marker.runtime.filter(row=>local(row.url)===TARGET),b=runtime.filter(row=>local(row.url)===TARGET);assert.equal(a.length,1);assert.equal(b.length,1);assert.deepEqual(a,b);assert.equal(a[0].sha256,BASELINE);assert.equal(a[0].url,'./'+TARGET+'?v='+build);assert.equal(marker.shell.sha256,sha(shell));});
 check('Deployment inventory includes unchanged notification layout bytes',()=>{const inventory=JSON.parse(read('sukun-site-assets-'+build+'.json'));assert.equal(inventory.build,build);const rows=inventory.files.filter(row=>row.path===TARGET);assert.equal(rows.length,1);assert.equal(rows[0].sha256,BASELINE);assert.equal(rows[0].bytes,4990);});
}else{
 pending('Shared layout CSS release URL and SRI after finalization');
 pending('Unique build marker and service worker dependency after finalization');
 pending('Deployment inventory membership after finalization');
}
const report={suite:'r1111 notification layout extraction',build,phase,method:'Frozen r1110 inline CSS and adjacent notification-owner SHA-256 baselines, exact ID/cascade anchors, public URL alias equality, and finalized SRI/runtime/inventory metadata. No browser rendering or audio playback claim.',browserExecuted:false,limitations:['Static byte and dependency checks do not establish native center/drawer geometry, filter interaction, CSS loading timing or offline startup behavior.'],sourceFiles:{'index.html':{bytes:shell.length,sha256:sha(shell)},'nero.html':{bytes:alias.length,sha256:sha(alias)},[TARGET]:{bytes:css.length,sha256:sha(css)}},finishedAt:new Date().toISOString(),passed:results.filter(x=>x.passed===true).length,total:results.length,skipped:results.filter(x=>x.skipped).length,results};
fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({suite:report.suite,build,phase,passed:report.passed,total:report.total,skipped:report.skipped,output,failed:results.filter(x=>x.passed===false)},null,2));if(results.some(x=>x.passed===false))process.exitCode=1;
