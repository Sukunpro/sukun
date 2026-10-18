'use strict';
// Production health collector/presenter with cached synthetic presentation facts.
// These tests do not run a browser, inspect raster pixels, or exercise audio.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const output=path.resolve(process.argv[3]||path.join(root,'tests/r1108/evidence/health-presentation-context.json'));
const files=['assets/runtime/health-r940.js','assets/runtime/health-view-r943.js'];
const collector=fs.readFileSync(path.join(root,files[0]),'utf8');
const createFixture=require('../r1017/health_ui_fixture.cjs')(root);
const plain=value=>JSON.parse(JSON.stringify(value));
const frozen=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(frozen);Object.freeze(value);}return value;};
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const observation=(context='startup',state='ready',extra={})=>({version:'r1108',state,checks:1,recoveries:0,lastReason:'boot',lastContext:context,lastAt:1792340000000,lastProbe:{at:1792340000000,reason:'boot',hidden:false,frameObserved:true,domSurfaceVisible:true,roots:{}},lastRepair:null,...extra});
function fixture(input,lang='tr',previous=null){
 const h=createFixture(false),calls={snapshot:0,recover:0,probe:0,dom:0,db:0};let cached=input;
 h.c.I18N.lang=lang;h.c.sessionStorage={getItem:key=>h.store.get(key)||null,setItem:(key,value)=>h.store.set(key,value)};
 if(previous)h.store.set('sukun.health.r940',previous);
 h.c.SukunPresentationRecovery={snapshot(){calls.snapshot++;return cached;},recover(){calls.recover++;throw Error('health must not repair presentation');},probe(){calls.probe++;throw Error('health must not probe presentation');}};
 h.c.indexedDB={open(){calls.db++;throw Error('health must not open a database');},databases(){calls.db++;throw Error('health must not list databases');}};
 vm.runInContext(collector,h.c,{filename:files[0]});
 return {...h,calls,set:value=>cached=value};
}
const row=report=>report.checks.find(check=>check.code==='PRESENTATION');
const shown=(h,report)=>h.c.SukunHealthViewR943.summarize(report).areas.find(area=>area.id==='response').checks.find(check=>check.code==='PRESENTATION');
function assertPassive(h,before){assert.equal(h.calls.recover,0);assert.equal(h.calls.probe,0);assert.equal(h.calls.db,0);assert.equal(h.transportCalls.length,0);assert.equal(h.fetches.length,0);assert.equal(h.timers.size,before.timers);assert.equal(JSON.stringify([...h.store]),before.store);}
const baselines=h=>({timers:h.timers.size,store:JSON.stringify([...h.store])});
async function integrityFixture(entries,bodies){
 const calls=[],build='r1108',start=collector.indexOf('  async function responseBytes('),end=collector.indexOf('  function sampleExplicit()',start);assert(start>0&&end>start);
 const c={URL,Response,AbortController,DOMException,TextDecoder,Uint8Array,crypto:crypto.webcrypto,build,now:()=>Date.now(),location:{href:'https://fixture.invalid/sukun/nero.html',origin:'https://fixture.invalid'},navigator:{onLine:true},path:url=>new URL(url).pathname,token:String,status:(code,status,title,evidence)=>({code,status,evidence}),setTimeout,clearTimeout};
 c.fetch=async url=>{const p=new URL(url).pathname.replace('/sukun/','');calls.push(p);if(p==='sukun-build-r1108.json')return new Response(JSON.stringify({build,runtime:entries}));assert(bodies.has(p),'unexpected download '+p);const bytes=bodies.get(p);return new Response(bytes,{headers:{'content-length':String(bytes.length)}});};
 vm.createContext(c);vm.runInContext(collector.slice(start,end),c);return{result:await c.integrityCheck(),calls};
}
const results=[];
async function test(name,fn){try{await fn();results.push({name,passed:true});}catch(error){results.push({name,passed:false,error:error.stack||String(error)});}}
(async()=>{
 for(const context of ['startup','foreground','return','manual'])await test('Cached '+context+' context survives collector, event history, and checkpoint round trip',async()=>{
  const input=frozen(observation(context,'recovered')),before=JSON.stringify(input),h=fixture(input),r=h.c.SukunHealthR940.read();
  assert.equal(r.current.presentation.lastContext,context);assert.equal(row(r).evidence.lastContext,context);assert.equal(row(r).status,'OBSERVED');assert.equal(row(r).title,'Arayüz görünürlük gözlemi');assert.equal(JSON.stringify(input),before);
  await h.c.dispatch('sukun:presentationrecovery');const event=h.c.SukunHealthR940.read().timeline.find(event=>event.kind==='presentation');assert.equal(event.evidence.lastContext,context);
  h.d.hidden=true;for(const listener of h.d.listeners.visibilitychange||[])listener({});const saved=h.store.get('sukun.health.r940');assert(saved,'checkpoint missing');
  const next=fixture(null,'tr',saved),p=next.c.SukunHealthR940.read().previous;assert.equal(p.presentation.lastContext,context);assert.equal(p.events.find(event=>event.kind==='presentation').evidence.lastContext,context);assert.equal(next.calls.recover,0);
 });
 const contexts={startup:{tr:/^İlk açılış gözlemi\./,en:/^Startup observation\./},foreground:{tr:/^Ön plandaki görünüm gözlemi\./,en:/^Foreground view observation\./},return:{tr:/^Ekrana dönüş gözlemi\./,en:/^Return to screen observation\./},manual:{tr:/^İstenen görünüm denetimi\./,en:/^Requested view check\./}};
 for(const lang of ['tr','en'])for(const [context,expect] of Object.entries(contexts))await test(lang+' friendly presentation text preserves '+context+' without creating physical display success',()=>{
  const h=fixture(frozen(observation(context,'attention')),lang),before=baselines(h),r=h.c.SukunHealthR940.read(),v=shown(h,r);
  assert.match(v.detail,expect[lang]);assert.equal(v.status,'WARN');assert.match(v.label,lang==='en'?/^Interface visibility observation$/:/^Arayüz görünürlük gözlemi$/);assert.match(v.detail,lang==='en'?/Actual display pixels were not measured\./:/Gerçek ekran pikselleri ölçülmedi\./);assert(!/doğrulandı|was verified\.|restored on return/i.test(v.detail));
  if(context!=='return')assert(!/Ekrana dönüş|Return to screen|on return/i.test(v.detail));
  assertPassive(h,before);
 });
 for(const invalid of [undefined,null,'boot','visible','focus','__proto__','constructor',false,{},[]])await test('Legacy or invalid context '+String(invalid)+' stays unknown and neutral',()=>{
  const h=fixture(observation('startup','ready',{lastContext:invalid,lastReason:'visible'}),'en'),r=h.c.SukunHealthR940.read(),v=shown(h,r);assert.equal(row(r).evidence.lastContext,'unknown');assert.equal(r.current.presentation.lastContext,'unknown');assert.match(v.detail,/^View observation\./);assert(!/return/i.test(v.detail));
  const direct=shown(h,{checks:[{code:'PRESENTATION',status:'OBSERVED',evidence:{state:'ready',lastContext:invalid}}]});assert.match(direct.detail,/^View observation\./);
 });
 for(const lang of ['tr','en'])await test(lang+' unverified startup remains unverified in local evidence and wording',()=>{
  const h=fixture(observation('startup','unverified',{lastProbe:{frameObserved:false,domSurfaceVisible:true}}),lang),r=h.c.SukunHealthR940.read(),v=shown(h,r);
  assert.equal(row(r).evidence.state,'unverified');assert.equal(r.current.presentation.state,'unverified');assert.equal(v.status,'OBSERVED');assert.match(v.detail,lang==='en'?/drawing response could not be verified/:/çizim yanıtı doğrulanamadı/);assert(!/return|dönüş|toparlandı/i.test(v.detail));assert(!/view repair|Görünüm düzeltmesi/.test(v.detail));
 });
 for(const lang of ['tr','en'])await test(lang+' initial ready state without a completed probe does not imply successful observation',()=>{
  const h=fixture(observation('startup','ready',{checks:0,lastProbe:null,lastAt:0}),lang),v=shown(h,h.c.SukunHealthR940.read());assert.match(v.detail,lang==='en'?/No completed view observation yet\./:/Henüz tamamlanmış bir görünüm gözlemi yok\./);assert(!/drawing information was observed|çizim bilgisi gözlendi/.test(v.detail));
 });
 await test('Presenter labels hidden, pending, recovered, and missing observations without claiming a new probe',()=>{
  const h=fixture(observation()),before=baselines(h),expected={hidden:/in the background/,checking:/in progress/,recovered:/view repair was recorded/,ready:/drawing information was observed/,unknown:/No completed view observation/};h.c.I18N.lang='en';
  for(const [state,pattern] of Object.entries(expected)){h.set(observation('foreground',state,state==='unknown'?{lastProbe:null}:{}));const r=h.c.SukunHealthR940.read(),v=shown(h,r);assert.match(v.detail,pattern);assert(!/Return to screen|on return/.test(v.detail));}
  assertPassive(h,before);
 });
 await test('Repeated report, summary, plain text, and AI payload reads stay passive and context does not leave the AI allowlist',()=>{
  const h=fixture(frozen(observation('startup','unverified')),'en'),before=baselines(h);const summaries=[];
  for(const context of ['startup','foreground','return','manual']){h.set(frozen(observation(context,'unverified')));const r=h.c.SukunHealthR940.read(),v=h.c.SukunHealthViewR943;
   v.summarize(r);v.plainReport(r);v.reportKey(r);const ai=v.aiPayload(r);summaries.push(JSON.stringify(ai));assert(!JSON.stringify(ai).includes('lastContext'));assert.equal(row(r).evidence.checks,1);assert.equal(row(r).evidence.recoveries,0);
  }
  assert.equal(new Set(summaries).size,1);assertPassive(h,before);
 });
 await test('Missing producer omits the optional presentation check without inventing startup or return',()=>{
  const h=fixture(null,'en'),before=baselines(h),r=h.c.SukunHealthR940.read();assert.equal(row(r),undefined);assert.equal(r.current.presentation,null);assert.equal(shown(h,r),undefined);assertPassive(h,before);
 });
 await test('New Kandil stylesheet is accepted by exact path and hash while sibling, nested, and remote files stay untrusted',async()=>{
  const name='css/kandil-preferences-r1108.css',bytes=fs.readFileSync(path.join(root,name)),entry=url=>({url,sha256:hash(bytes)}),bodies=new Map([[name,bytes]]);
  const good=await integrityFixture([entry('./'+name+'?v=r1108')],bodies);assert.equal(good.result.status,'PASS');assert.equal(good.result.evidence.files[0].status,'MATCH');assert.equal(good.result.evidence.configurationErrors,0);
  const mixed=await integrityFixture([entry('./'+name+'?v=r1108'),entry('./css/kandil-preferences-r1109.css?v=r1108'),entry('./css/nested/kandil-preferences-r1108.css?v=r1108'),entry('https://external.invalid/sukun/'+name+'?v=r1108')],bodies);assert.equal(mixed.result.status,'FAIL');assert.equal(mixed.result.evidence.matched,1);assert.equal(mixed.result.evidence.configurationErrors,3);assert.equal(mixed.calls.length,2,'only the marker and exact allowed asset may be fetched');
 });
 const report={suite:'r1108 contextual passive presentation health evidence',build:'r1108',method:'Production health collector and presenter execute against bounded synthetic cached presentation snapshots. Historical events and lifecycle checkpoints are round-tripped with audio commands, recovery calls, database access and network trapped.',browserExecuted:false,limitations:['This deterministic VM suite does not verify raster pixels, native browser semantics, physical Android return from lock, or audible sound.'],sourceFiles:Object.fromEntries(files.map(file=>{const data=fs.readFileSync(path.join(root,file));return[file,{sha256:hash(data),bytes:data.length}];})),scriptSha256:hash(fs.readFileSync(__filename)),finishedAt:new Date().toISOString(),passed:results.filter(result=>result.passed).length,total:results.length,results};
 fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({suite:report.suite,passed:report.passed,total:report.total,browserExecuted:false,output,failed:results.filter(result=>!result.passed)},null,2));if(report.passed!==report.total)process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1;});
