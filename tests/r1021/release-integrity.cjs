#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict'),vm=require('vm');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const read=p=>fs.readFileSync(path.join(root,p),'utf8'),json=p=>JSON.parse(read(p));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex');
const html=read('index.html'),sw=read('sw.js'),build=json('sukun-build-r1021.json'),results=[];
const test=(name,fn)=>{try{fn();results.push({name,passed:true})}catch(e){results.push({name,passed:false,error:e.message})}};
test('HTML entry points are byte identical',()=>assert.equal(html,read('nero.html')));
test('App, global and document build identities agree',()=>{assert.match(html,/<meta name="sukun-build" content="r1021"/);assert.match(html,/window\.SUKUN_BUILD='r1021'/);assert.match(html,/dataset\.sukunBuild='r1021'/);assert.doesNotMatch(html,/\?v=r1020(?:["'])/)});
test('Manifest and latest marker agree',()=>{const m=json('manifest.webmanifest'),l=json('sukun-latest.json');assert.equal(m.version,'r1021');assert.equal(m.start_url,'./nero.html?v=r1021');assert(m.shortcuts.every(s=>s.url.includes('v=r1021')));for(const k of ['latest','build','v'])assert.equal(l[k],'r1021')});
test('SW release identity and build marker agree',()=>{assert.match(sw,/const SURUM = 'r1021'/);assert.match(sw,/const CACHE = 'sukun-r1021-import-persistence-20261006-v1'/);assert.match(sw,/const BUILD_MARKER = '\.\/sukun-build-r1021\.json'/);assert.doesNotMatch(sw,/\?v=r1020(?:["'])/)});
test('Build records the exact final shell',()=>{assert.equal(build.build,'r1021');assert.equal(build.base,'r1020');assert.equal(build.shell.sha256,sha('nero.html'));assert.equal(build.tabOwnerRevision,'r1021')});
const runtime=JSON.parse(sw.match(/const REQUIRED_RUNTIME = (\[.*?\]);/s)[1]);
test('SW and marker runtime lists are identical',()=>assert.deepEqual(runtime,build.runtime));
for(const entry of runtime)test('Runtime integrity '+entry.url,()=>{assert(entry.url.endsWith('?v=r1021'));assert.equal(entry.sha256,sha(entry.url.split('?')[0].replace(/^\.\//,'')))});
for(const tag of html.matchAll(/<(?:script|link)\b[^>]*integrity="sha256-[^"]+"[^>]*>/g))test('HTML SRI '+tag[0].match(/(?:src|href)="([^"]+)"/)[1],()=>{const p=tag[0].match(/(?:src|href)="([^"]+)"/)[1].split('?')[0].replace(/^\.\//,'');const expected=Buffer.from(sha(p),'hex').toString('base64');assert(tag[0].includes('integrity="sha256-'+expected+'"'))});
test('Personal-data containment stays enabled',()=>{assert.equal(build.automaticDataRecovery,false);assert.equal(build.exactDataRestoreEnabled,false);assert(build.blockedRollbackBuilds.includes('r1019'));assert.match(html,/id="ydkIce" disabled/);assert.match(html,/id="bakImportBtn" disabled/);assert.doesNotMatch(sw,/indexedDB|deleteDatabase/)});
const assets=json('sukun-site-assets-r1021.json');
test('Site inventory matches final bytes',()=>{assert.equal(assets.build,'r1021');let bytes=0;for(const e of assets.files){assert.equal(e.sha256,sha(e.path),e.path);assert.equal(e.bytes,fs.statSync(path.join(root,e.path)).size,e.path);bytes+=e.bytes}assert.equal(assets.totalBytes,bytes)});
let parsed=0;
test('All active inline JavaScript bodies parse',()=>{for(const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){const type=m[1].match(/\btype=["']([^"']+)["']/)?.[1];if(/\bsrc=/.test(m[1])||type&&!['text/javascript','application/javascript'].includes(type))continue;new vm.Script(m[2]);parsed++}assert(parsed>200)});
const health=read('assets/runtime/health-r940.js'),a=health.indexOf('  function tabOwnerSnapshot()'),b=health.indexOf('  function evidenceContext(',a),healthSource=health.slice(a,b);
function ownerReport(failure){const state={version:'r981',revision:'r1021',method:'web-locks',protection:'web-lock-strict',owned:false,maintenance:false,pending:false,blocked:false,recoveryRequired:false,failureStage:'maintenance-busy-check',errorName:'ReferenceError',lockFallbackError:'',requestFailures:0,lastMaintenanceFailure:failure};const c={window:{SukunTabOwner:{snapshot:()=>state}},safe:fn=>{try{return fn()}catch{return null}},bool:Boolean};vm.createContext(c);return vm.runInContext(healthSource+';tabOwnerSnapshot()',c)}
test('Health retains bounded exact maintenance cause',()=>{const s=ownerReport({code:'maintenance-check-failed',stage:'maintenance-busy-check',errorName:'ReferenceError'});assert.equal(s.errorName,'ReferenceError');assert.equal(s.lastMaintenanceFailure.code,'maintenance-check-failed');assert.equal(s.lastMaintenanceFailure.stage,'maintenance-busy-check')});
test('Health excludes arbitrary error text and keys',()=>{const s=ownerReport({code:'private-recording-key',stage:'raw private stack',errorName:'raw secret',message:'never export',key:'private'});assert.equal(s.lastMaintenanceFailure.code,'maintenance-unavailable');assert.equal(s.lastMaintenanceFailure.stage,'unknown');assert.equal(s.lastMaintenanceFailure.errorName,'Error');assert.doesNotMatch(JSON.stringify(s),/private|secret|never export/)});
test('Health does not invent a prior failure',()=>assert.equal(ownerReport(null).lastMaintenanceFailure,null));
const report={method:'Static final-release integrity and source-executing metadata privacy checks; no physical/browser persistence claim',passed:results.filter(r=>r.passed).length,total:results.length,inlineScriptsParsed:parsed,runtimeFiles:runtime.length,siteFiles:assets.files.length,results};console.log(JSON.stringify(report,null,2));process.exitCode=report.passed===report.total?0:1;
