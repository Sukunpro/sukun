'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),vm=require('vm'),assert=require('assert/strict');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..')),read=p=>fs.readFileSync(path.join(root,p)),json=p=>JSON.parse(read(p));
const html=read('index.html').toString(),sw=read('sw.js').toString(),version=read('version.txt').toString().trim(),build=json('sukun-build-'+version+'.json'),site=json('sukun-site-assets-'+version+'.json'),checks=[];
function check(name,fn){try{assert.notEqual(fn(),false);checks.push({name,passed:true});}catch(e){checks.push({name,passed:false,error:e.message});}}
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),local=u=>u.split('?')[0].replace(/^\.\//,'');
check('Version text identifies the current release',()=>/^r\d+$/.test(version));
check('App entrypoints are identical',()=>read('index.html').equals(read('nero.html')));
check('Every HTML build meta agrees',()=>{const a=[...html.matchAll(/<meta name="sukun-build" content="([^"]+)"/g)];return a.length>0&&a.every(x=>x[1]===version);});
check('HTML global build agrees',()=>html.includes("window.SUKUN_BUILD='"+version+"'"));
check('SW build and current cache identity agree',()=>sw.includes("const SURUM = '"+version+"'")&&sw.includes("const CACHE = 'sukun-"+version+"-"));
check('Manifest version and start URL agree',()=>json('manifest.webmanifest').version===version&&json('manifest.webmanifest').start_url==='./nero.html?v='+version);
check('Latest marker fields agree',()=>['latest','build','v'].every(k=>json('sukun-latest.json')[k]===version));
check('Build and site marker identity agree',()=>build.build===version&&site.build===version&&build.siteBackupManifestUrl==='./sukun-site-assets-'+version+'.json');
check('Build shell SHA-256 matches exact HTML',()=>build.shell.sha256===sha(read('nero.html')));
check('Automatic data recovery stays disabled',()=>build.automaticDataRecovery===false&&build.exactDataRestoreEnabled===false);
check('Blocked rollback safety remains',()=>build.blockedRollbackBuilds.includes('r1019'));
const runtime=JSON.parse(sw.match(/const REQUIRED_RUNTIME = (\[.*?\]);/s)[1]);
check('SW and build runtime entries agree',()=>JSON.stringify(runtime)===JSON.stringify(build.runtime));
check('Runtime paths are unique',()=>new Set(runtime.map(x=>local(x.url))).size===runtime.length);
for(const x of runtime)check('Runtime SHA-256 '+local(x.url),()=>sha(read(local(x.url)))===x.sha256);
let inline=0;for(const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){const type=m[1].match(/\btype=["']([^"']+)["']/)?.[1];if(/\bsrc=/.test(m[1])||type&&!['text/javascript','application/javascript'].includes(type))continue;const id=m[1].match(/\bid=["']([^"']+)["']/)?.[1]||'inline-'+inline;check('JavaScript parse '+id,()=>new vm.Script(m[2]));inline++;}
check('Service worker JavaScript parses',()=>new vm.Script(sw));
let external=0;for(const p of new Set(runtime.map(x=>local(x.url)).filter(p=>p.endsWith('.js')))){check('Runtime JavaScript parses '+p,()=>new vm.Script(read(p).toString()));external++;}
let sri=0;for(const tag of html.matchAll(/<(?:script|link)\b[^>]*integrity="sha256-[^"]+"[^>]*>/g)){const p=local(tag[0].match(/(?:src|href)="([^"]+)"/)[1]);check('HTML SRI '+p,()=>tag[0].includes('integrity="sha256-'+Buffer.from(sha(read(p)),'hex').toString('base64')+'"'));sri++;}
check('Site paths are safe and unique',()=>new Set(site.files.map(x=>x.path)).size===site.files.length&&site.files.every(x=>!x.path.startsWith('/')&&!x.path.split('/').some(x=>x==='..'||x==='.')&&!x.path.includes('\\')));
check('Site-manifest bytes sum matches totalBytes',()=>site.files.reduce((n,x)=>n+x.bytes,0)===site.totalBytes);
for(const x of site.files)check('Site file hash and size '+x.path,()=>read(x.path).length===x.bytes&&sha(read(x.path))===x.sha256);
for(const x of runtime)check('Runtime is in site inventory '+local(x.url),()=>site.files.some(f=>f.path===local(x.url)&&f.sha256===x.sha256));
check('External release notes match embedded notes',()=>JSON.stringify(json('surumler.json'))===JSON.stringify(JSON.parse(html.match(/<script id="surumNotlari" type="application\/json">([\s\S]*?)<\/script>/)[1])));
check('Newest release note identifies current build',()=>json('surumler.json')[0].v===version);
const report={build:version,method:'Complete local release bytes: identity, exact SHA-256 and sizes, HTML SRI, shipped JavaScript syntax. These are static assertions, not device/audio checks.',passed:checks.filter(x=>x.passed).length,total:checks.length,inlineScriptsParsed:inline,externalScriptsParsed:external,runtimeEntries:runtime.length,siteFiles:site.files.length,siteBytes:site.totalBytes,sriEntries:sri,checks};
fs.writeFileSync(path.join(__dirname,'release-integrity-results.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({...report,checks:checks.filter(x=>!x.passed)},null,2));process.exitCode=report.passed===report.total?0:1;
