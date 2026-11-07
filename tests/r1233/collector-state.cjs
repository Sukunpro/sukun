'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..')),candidate=root,build=fs.readFileSync(path.join(root,'version.txt'),'utf8').trim(),marker=JSON.parse(fs.readFileSync(path.join(root,`sukun-build-${build}.json`))),make=require('../r1017/health_ui_fixture.cjs')(candidate);
const collector=fs.readFileSync(path.join(candidate,'assets/runtime/health-r940.js'),'utf8'),rows=[];
async function test(name,fn){try{const evidence=await fn();rows.push({name,passed:true,evidence});}catch(e){rows.push({name,passed:false,error:e.stack});}}
function fixture({online=true,missing=false,controller=true,workerError=false}={}){
 const h=make(false),c=h.c;c.document.head.querySelector('meta').setAttribute('content',build);c.navigator.onLine=online;
 c.sessionStorage={getItem:k=>h.store.get(k)||null,setItem:(k,v)=>h.store.set(k,v)};c.MessageChannel=MessageChannel;
 c.setTimeout=setTimeout;c.clearTimeout=clearTimeout;
 const observed={db:0,audio:0,commands:0};c.indexedDB={open(){observed.db++;throw Error('no database scans');}};
 c.navigator.serviceWorker.controller=controller?{postMessage(msg,ports){assert.equal(msg.type,'STATUS');ports[0].postMessage({v:build,complete:true,error:workerError});}}:null;
 c.fetch=async url=>{h.fetches.push(url);const u=new URL(url),name=u.pathname.replace('/sukun/','');if(name==='sukun-latest.json'){if(!online)throw new Error('offline');const r=new Response(JSON.stringify({build}));Object.defineProperty(r,'url',{value:url});return r;}if(missing&&name.includes('/assets/runtime/'))throw new TypeError('offline missing');return new Response(fs.readFileSync(path.join(root,name)));};
 const session=Object.freeze({phase:'PAUSED',activeMode:'esma',activeIndex:5,count:20,target:100,epoch:7,owner:'user',requestId:99});
 c.SukunSessionState={peek:()=>session,snapshot:()=>session,start(){observed.commands++;},pause(){observed.commands++;},stop(){observed.commands++;}};
 c.SukunTempo={snapshot:()=>({value:2,pendingGesture:false,cancelledGestures:0})};c.speechSynthesis={getVoices:()=>[],speak(){observed.audio++;}};
 h.store.set('user.preference.fixture','preserve');h.store.set('recording.fixture','unchanged-test-bytes');
 vm.runInContext(collector,c);return {...h,observed,session};
}
function view(h,report){return h.c.SukunHealthViewR943.summarize(report).areas.flatMap(x=>x.checks).find(x=>x.code==='RUNTIME_INTEGRITY');}
(async()=>{
 for(const online of [true,false])await test((online?'online':'offline')+' full collector detailed check preserves paused count, tempo, storage and transport',async()=>{
  const h=fixture({online}),initial=JSON.stringify(h.session),r=await h.c.SukunHealthR940.run({deep:true,online:true});
  assert.equal(r.checks.find(x=>x.code==='RUNTIME_INTEGRITY').status,'PASS');assert.equal(r.checks.find(x=>x.code==='SERVER_VERSION').status,online?'PASS':'NOT_MEASURED');
  assert.equal(r.checks.find(x=>x.code==='DEVICE_AUDIO').status,'NOT_MEASURED');assert.equal(r.current.session.count,20);assert.equal(r.current.tempo.value,2);
  assert.equal(JSON.stringify(h.session),initial);assert.deepEqual(h.observed,{db:0,audio:0,commands:0});assert.deepEqual(h.transportCalls,[]);
  assert.equal(h.store.get('user.preference.fixture'),'preserve');assert.equal(h.store.get('recording.fixture'),'unchanged-test-bytes');
  assert.equal(r.lastRun.offline,!online);return {files:r.checks.find(x=>x.code==='RUNTIME_INTEGRITY').evidence.matched,physicalAudio:'NOT_MEASURED',server:r.checks.find(x=>x.code==='SERVER_VERSION').status};
 });
 await test('quick check is network-free and does not command the service worker',async()=>{const h=fixture(),r=await h.c.SukunHealthR940.run();assert.equal(h.fetches.length,0);assert.deepEqual(h.transportCalls,[]);assert.deepEqual(h.observed,{db:0,audio:0,commands:0});assert.equal(r.checks.find(x=>x.code==='RUNTIME_INTEGRITY').status,'NOT_MEASURED');});
 await test('repeated reads remain passive and preserve all stores',async()=>{const h=fixture(),before=JSON.stringify([...h.store]);for(let i=0;i<5;i++)h.c.SukunHealthR940.read();assert.equal(JSON.stringify([...h.store]),before);assert.equal(h.fetches.length,0);assert.deepEqual(h.observed,{db:0,audio:0,commands:0});});
 await test('repeated concurrent runs share one in-flight check',async()=>{const h=fixture(),a=h.c.SukunHealthR940.run({deep:true,online:false}),b=h.c.SukunHealthR940.run({deep:true,online:false});assert.equal(a,b);await a;assert.equal(h.fetches.length,marker.runtime.length+1);});
 for(const language of ['tr','en'])await test(language+' presenter explicitly describes offline hash scope',async()=>{const h=fixture({online:false});h.c.I18N.lang=language;const r=await h.c.SukunHealthR940.run({deep:true}),v=view(h,r);assert(v);assert.match(v.detail||v.description||JSON.stringify(v),language==='tr'?/Çevrimdışı erişilen dosyalar/:/Files accessible offline/);return {text:v.detail||v.description||v};});
 for(const language of ['tr','en'])await test(language+' presenter does not imply offline launch on an uncontrolled page',async()=>{const h=fixture({controller:false});h.c.I18N.lang=language;const r=await h.c.SukunHealthR940.run({deep:true}),v=view(h,r);assert(v);assert.match(v.detail||v.description||JSON.stringify(v),language==='tr'?/çevrimdışı açılışı doğrulamaz/:/do not verify an offline launch/);});
 const out=process.argv[3]||null,report={scope:'Full production collector and presenter in controlled VM with native streams, crypto and MessageChannel, no real user recordings or physical-device claim',passed:rows.filter(x=>x.passed).length,total:rows.length,rows};if(out)fs.writeFileSync(out,JSON.stringify(report,null,2));console.log(JSON.stringify({passed:report.passed,total:report.total,failed:rows.filter(x=>!x.passed),out},null,2));if(report.passed!==report.total)process.exitCode=1;
})();
