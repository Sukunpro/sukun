'use strict';
// Frozen r1111 CSS and external owner bytes define this extraction boundary.
// These checks do not establish browser layout, asset loading timing or playback acceptance.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const output=path.resolve(process.argv[3]||path.join(root,'tests/r1112/evidence/tekke-set-card-extraction.json'));
const ID='sukun-r990-tekke-set-style',TARGET='css/tekke-set-card-r1112.css',OWNER='assets/runtime/tekke-set-r990.js';
const BASELINE='ad93851820e98e0f238459cc95fc26e89b1227f1174095a715e542c74e9470c7';
const OWNER_BASELINE='1e3b3baf822bd83a1f24cae1cab28aee9f54312aa644f8b3eaca07d8ad8a6f0a';
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex'),read=name=>fs.readFileSync(path.join(root,name)),results=[];
const shell=read('index.html'),alias=read('nero.html'),html=shell.toString('utf8'),css=read(TARGET),build=read('version.txt').toString().trim();
assert(/^r\d+$/.test(build),'Invalid current release identity');
const finalized=Number(build.slice(1))>=1112;
const tags=[...html.matchAll(/<(?:style|link)\b[^>]*\bid=["']sukun-r990-tekke-set-style["'][^>]*>/g)];
const targetTag=tags[0]?.[0]||'',targetIndex=tags[0]?.index??-1,external=/^<link\b/.test(targetTag);
const phase=finalized?'finalized':external?'shell-integrated-before-finalizer':'baseline-before-shell-integration';
const local=url=>String(url||'').replace(/^\.\//,'').split(/[?#]/,1)[0];
function attribute(tag,name){return tag.match(new RegExp('\\b'+name+'=["\']([^"\']*)["\']'))?.[1]||null;}
function check(name,work){try{const evidence=work();results.push({name,passed:true,...(evidence?{evidence}:{})});}catch(error){results.push({name,passed:false,error:String(error.stack||error)});}}
function pending(name){results.push({name,passed:null,skipped:true,reason:'Release finalizer has not advanced version.txt to r1112.'});}

check('Tekke set card CSS retains all frozen r1111 bytes',()=>{assert.equal(css.length,7182);assert.equal(sha(css),BASELINE);return{bytes:css.length,sha256:sha(css)};});
check('Extracted card CSS introduces no asset, import, font-face, variable or executable dependency',()=>{const text=css.toString('utf8').replace(/\/\*[\s\S]*?\*\//g,'');assert.equal((text.match(/\{/g)||[]).length,33);assert(!/url\s*\(|@import\b|@font-face\b|var\s*\(/i.test(text));assert(!/(?:^|[;{])\s*--[\w-]+\s*:/m.test(text));assert(!/<\/?(?:script|style)\b/i.test(text));});
check('Index and nero URL aliases remain byte-identical',()=>{assert.equal(shell.length,alias.length,'Shell alias byte lengths differ');assert.equal(sha(shell),sha(alias),'Shell alias SHA-256 values differ');return{bytesEach:shell.length,sha256:sha(shell)};});
check('Tekke card keeps its exact single ID and source body',()=>{assert.equal(tags.length,1);assert(targetIndex>=0);if(finalized)assert(external,'Finalized extraction must use the shared stylesheet');if(external){assert.equal(attribute(targetTag,'rel'),'stylesheet');assert.equal(local(attribute(targetTag,'href')),TARGET);assert(!/<style\b[^>]*id=["']sukun-r990-tekke-set-style["']/.test(html));}else{assert(!finalized);const match=html.match(/<style id="sukun-r990-tekke-set-style">([\s\S]*?)<\/style>/);assert(match);assert.equal(sha(Buffer.from(match[1])),BASELINE);}return{phase,external};});
check('Card keeps direct cascade adjacency after Tekke set owner and before Tekke UX stylesheet',()=>{const before=html.match(/<script\b[^>]*\bid=["']sukun-r990-tekke-set["'][^>]*>/);const after=[...html.matchAll(/<link\b[^>]*>/g)].find(match=>local(attribute(match[0],'href'))==='assets/runtime/tekke-ux-r992.css');assert(before);assert(after);assert.equal(local(attribute(before[0],'src')),OWNER);assert(before.index<targetIndex&&targetIndex<after.index);const beforeClose=html.indexOf('</script>',before.index);assert(beforeClose>=before.index);const beforeEnd=beforeClose+9,end=external?targetIndex+targetTag.length:html.indexOf('</style>',targetIndex)+8;assert(/^\s*$/.test(html.slice(beforeEnd,targetIndex)));assert(/^\s*$/.test(html.slice(end,after.index)));});
check('Existing Tekke set owner remains unchanged and never owns stylesheet text',()=>{const owner=read(OWNER);assert.equal(owner.length,27409);assert.equal(sha(owner),OWNER_BASELINE);assert(!owner.toString('utf8').includes(ID));return{ownerBytes:owner.length,ownerSha256:OWNER_BASELINE};});
if(finalized){
 check('Shared card CSS has a current release URL and exact SRI',()=>{assert(external);assert.equal(attribute(targetTag,'href'),'./'+TARGET+'?v='+build);assert.equal(attribute(targetTag,'integrity'),'sha256-'+Buffer.from(BASELINE,'hex').toString('base64'));});
 check('Build marker and service worker require one identical card dependency',()=>{const marker=JSON.parse(read('sukun-build-'+build+'.json')),worker=read('sw.js').toString(),match=worker.match(/const REQUIRED_RUNTIME = (\[[\s\S]*?\]);/);assert(match);const runtime=JSON.parse(match[1]);const a=marker.runtime.filter(row=>local(row.url)===TARGET),b=runtime.filter(row=>local(row.url)===TARGET);assert.equal(a.length,1);assert.equal(b.length,1);assert.deepEqual(a,b);assert.equal(a[0].sha256,BASELINE);assert.equal(a[0].url,'./'+TARGET+'?v='+build);assert.equal(marker.shell.sha256,sha(shell));});
 check('Deployment inventory includes unchanged Tekke card bytes',()=>{const inventory=JSON.parse(read('sukun-site-assets-'+build+'.json'));assert.equal(inventory.build,build);const rows=inventory.files.filter(row=>row.path===TARGET);assert.equal(rows.length,1);assert.equal(rows[0].sha256,BASELINE);assert.equal(rows[0].bytes,7182);});
}else{
 pending('Shared card CSS release URL and SRI after finalization');
 pending('Unique build marker and service worker dependency after finalization');
 pending('Deployment inventory membership after finalization');
}
const owner=read(OWNER),report={suite:'r1112 Tekke set card CSS extraction',build,phase,method:'Frozen r1111 inline CSS and external Tekke-set owner SHA-256 baselines, exact ID/cascade anchors, public URL alias equality, and finalized SRI/runtime/inventory metadata. No browser rendering or audio playback claim.',browserExecuted:false,limitations:['Static byte and dependency checks do not establish native Tekke card geometry, control interaction, CSS loading timing or offline startup behavior.'],sourceFiles:{'index.html':{bytes:shell.length,sha256:sha(shell)},'nero.html':{bytes:alias.length,sha256:sha(alias)},[TARGET]:{bytes:css.length,sha256:sha(css)},[OWNER]:{bytes:owner.length,sha256:sha(owner)}},finishedAt:new Date().toISOString(),passed:results.filter(x=>x.passed===true).length,total:results.length,skipped:results.filter(x=>x.skipped).length,results};
fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({suite:report.suite,build,phase,passed:report.passed,total:report.total,skipped:report.skipped,output,failed:results.filter(x=>x.passed===false)},null,2));if(results.some(x=>x.passed===false))process.exitCode=1;
