'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||'.'),baseline=path.resolve(process.argv[3]||'../sukun-g8-recovery');
const output=path.resolve(process.argv[4]||path.join(root,'tests/r1119/evidence/recording-panel-contract.json'));
const read=(r,p)=>fs.readFileSync(path.join(r,p)),hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const a=read(baseline,'index.html').toString(),b=read(root,'index.html').toString(),row=JSON.parse(read(root,'tests/r1119/extracted-css.json'));
const checks=[],check=(name,fn)=>{try{checks.push({name,passed:true,evidence:fn()})}catch(e){checks.push({name,passed:false,error:e.message})}};
const old='r1118',fresh='r1119';
check('Exact source CSS body preserved, including whitespace and layer placement',()=>{
 const match=a.match(new RegExp('<style id="'+row.id+'">([\\s\\S]*?)</style>'));assert(match);
 const css=read(root,row.path);assert.equal(css.toString(),match[1]);assert.equal(css.length,2126);assert.equal(hash(css),row.sha256);
 assert(!/@import|url\(|var\(/.test(css.toString()));return{bytes:css.length,sha256:hash(css)};
});
check('All existing style owners retain exact order and unique relocated owner',()=>{
 const ids=s=>[...s.matchAll(/<(?:style|link)\b[^>]*id="([^"]+)"/g)].map(x=>x[1]);assert.deepEqual(ids(b),ids(a));
 const tag=b.match(new RegExp('<link[^>]*id="'+row.id+'"[^>]*>'))?.[0];assert(tag);assert.equal(b.split('id="'+row.id+'"').length,2);
 assert(tag.includes('href="./'+row.path+'?v=r1119"'));assert(tag.includes('integrity="sha256-'+crypto.createHash('sha256').update(read(root,row.path)).digest('base64')+'"'));
 assert(b.indexOf('id="'+row.previousOwner+'"')<b.indexOf(tag));assert(b.indexOf(tag)<b.indexOf('id="'+row.nextOwner+'"'));
 return{count:ids(b).length,tag};
});
check('Existing script order and inline bodies preserved except release identity and notes; expected external SRI updates verified',()=>{
 const scripts=s=>[...s.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].map(x=>({attrs:x[1],body:x[2]}));
 const left=scripts(a),allRight=scripts(b),locale=allRight.filter(x=>x.attrs===' id="sukun-r1119-release-locale"');assert.equal(locale.length,1);
 const right=allRight.filter(x=>x!==locale[0]);assert.equal(left.length,right.length);let exact=0,identity=0,notes=0;
 for(let i=0;i<left.length;i++){
  let attrs=left[i].attrs.replaceAll('?v='+old,'?v='+fresh);
  for(const file of ['assets/runtime/startup-intro-r1027.js','assets/runtime/health-r940.js'])if(attrs.includes(file)){const digest=(r)=>crypto.createHash('sha256').update(read(r,file)).digest('base64');attrs=attrs.replace(digest(baseline),digest(root));}
  assert.equal(attrs,right[i].attrs,'script attributes at '+i);
  if(left[i].body===right[i].body){exact++;continue;}
  if(left[i].attrs.includes('id="surumNotlari"')){notes++;continue;}
  assert.equal(left[i].body.replaceAll('?v='+old,'?v='+fresh).replaceAll("SUKUN_BUILD='"+old,"SUKUN_BUILD='"+fresh).replaceAll("sukunBuild='"+old,"sukunBuild='"+fresh),right[i].body,'script body at '+i);identity++;
 }
 for(const id of ['r514-core-letaif-kayit','r514-core-akis-nefs','sukun-r1018-locale-notes']){
  const source=s=>s.match(new RegExp('<script id="'+id+'">([\\s\\S]*?)</script>'))?.[1];assert(source(a));assert.equal(source(a),source(b));
 }
 assert(locale[0].body.startsWith('if(window.I18N?.D)Object.assign(window.I18N.D,'));
 return{originalCount:left.length,exact,identity,notes,addedReleaseLocaleOnly:1};
});
check('All prior deployment members retained; changes limited to metadata and two exact health diagnostic constants',()=>{
 const oldInventory=JSON.parse(read(baseline,'sukun-site-assets-r1118.json')).files,newInventory=JSON.parse(read(root,'sukun-site-assets-r1119.json')).files;
 const names=new Set(newInventory.map(x=>x.path)),allowed=new Set(['index.html','nero.html','sw.js','surumler.json','version.txt','manifest.webmanifest','sukun-latest.json','assets/runtime/startup-intro-r1027.js','assets/runtime/health-r940.js']);let exact=0;
 for(const f of oldInventory){if(f.path==='sukun-build-r1118.json'){assert(names.has('sukun-build-r1119.json'));continue}assert(names.has(f.path),f.path);if(allowed.has(f.path))continue;assert(read(root,f.path).equals(read(baseline,f.path)),f.path);exact++;}
 assert.equal(read(baseline,'assets/runtime/startup-intro-r1027.js').toString().replaceAll('?v=r1118','?v=r1119'),read(root,'assets/runtime/startup-intro-r1027.js').toString());
 assert.equal(read(baseline,'assets/runtime/health-r940.js').toString().replace('const maxRuntimeEntries=128,','const maxRuntimeEntries=129,').replace('fetchBytes(markerURL.href,32768,controller)','fetchBytes(markerURL.href,65536,controller)'),read(root,'assets/runtime/health-r940.js').toString());
 return{unchangedMembers:exact,previousMembers:oldInventory.length,currentMembers:newInventory.length,healthDiagnosticChanges:{maxRuntimeEntries:[128,129],maxMarkerBytes:[32768,65536]}};
});
check('Entrypoints, current release inventory, worker mandatory asset and safety settings agree',()=>{
 assert(read(root,'index.html').equals(read(root,'nero.html')));const build=JSON.parse(read(root,'sukun-build-r1119.json'));const sw=read(root,'sw.js').toString();const runtime=JSON.parse(sw.match(/const REQUIRED_RUNTIME = (\[.*?\]);/s)[1]);assert.deepEqual(runtime,build.runtime);
 assert(runtime.some(x=>x.url==='./'+row.path+'?v=r1119'&&x.sha256===row.sha256));assert.equal(build.automaticDataRecovery,false);assert.equal(build.exactDataRestoreEnabled,false);assert(build.blockedRollbackBuilds.includes('r1019'));assert.equal(build.g8SharedCssExtractedBytes,32821);assert.equal(build.g8SharedCssExtractions,9);
 return{runtimeEntries:runtime.length,automaticDataRecovery:false,exactDataRestoreEnabled:false};
});
const report={build:'r1119',baseline:'r1118',method:'Read-only exact source, asset, ownership and release-contract assertions; not browser, microphone or physical-device acceptance.',sourceSha256:hash(read(root,'index.html')),baselineSha256:hash(read(baseline,'index.html')),checks,passed:checks.filter(x=>x.passed).length,total:checks.length};
fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));if(report.passed!==report.total)process.exitCode=1;
