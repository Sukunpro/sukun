'use strict';
// Actual shipped performance control and translator with synthetic DOM/graphics.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const runtime=html.match(/<script id="r173-visual-runtime">([\s\S]*?)<\/script>/)[1];
const iStart=html.indexOf('const I18N = {'),iEnd=html.indexOf('window.I18N=I18N;',iStart)+'window.I18N=I18N;'.length;
assert(iStart>0&&iEnd>iStart,'Production I18N must be available');
const locale=html.slice(iStart,iEnd),ids=['r1042PerfCurrent','r1042PerfSummary','r1042PerfChoice','r1042PerfTam','r1042PerfDengeli','r1042PerfPil','r1042PerfSleep','r1042PerfScene'];
function hub(){const listeners=new Map();return{listeners,addEventListener(type,fn){const list=listeners.get(type)||[];list.push(fn);listeners.set(type,list);},dispatchEvent(event){for(const fn of [...listeners.get(event.type)||[]])fn(event);return true;}};}
function fire(target,type,extra={}){target.dispatchEvent({type,isTrusted:true,...extra});}
function fixture(options={}){
 let now=0,next=0;const jobs=new Map(),nodes=new Map(),writes=[],forbidden=[],graphics={sleep:0,wake:0,static:0};
 class Element{
  constructor(id,tag='P'){Object.assign(this,hub());this.id=id;this.tagName=tag;this.dataset={};this.attributes={};this.hidden=false;this.textWrites=0;this.childNodes=[];this.classList={contains:()=>false};}
  get textContent(){return this.firstChild?.nodeValue||'';}
  set textContent(text){this.textWrites++;this.firstChild={nodeType:3,nodeValue:String(text),parentElement:this};this.childNodes=[this.firstChild];}
  closest(selector){return selector.includes('[data-noi18n]')&&this.id==='prPerfBtn'?this:null;}
  getAttribute(name){return this.attributes[name]??null;}
  setAttribute(name,value){this.attributes[name]=String(value);}
 }
 function add(id,tag){const node=new Element(id,tag);nodes.set(id,node);return node;}
 const button=add('prPerfBtn','BUTTON');if(!options.noHints)for(const id of ids)add(id);
 const document=Object.assign(hub(),{hidden:false,readyState:'complete',body:{dataset:{perf:'dengeli'}},documentElement:{dataset:{},lang:options.lang||'tr'}}),context=hub(),store=new Map();
 if(options.mode)store.set('sukun.perf',JSON.stringify(options.mode));
 store.set('sukun.performance.r920','balanced');
 document.getElementById=id=>nodes.get(id)||null;
 Object.assign(context,{document,console,NodeFilter:{SHOW_TEXT:4},performance:{now:()=>now},
  localStorage:{getItem:key=>store.get(key)||null,setItem(key,value){writes.push([key,value]);store.set(key,value);}},
  S:{set(key,value){writes.push([key,value]);store.set(key,value);}},
  matchMedia:()=>({matches:!!options.reduced,addEventListener(){}}),
  setTimeout(fn,ms){jobs.set(++next,{fn,when:now+ms});return next;},clearTimeout:id=>jobs.delete(id),
  CustomEvent:class{constructor(type,init={}){this.type=type;this.detail=init.detail;}},
  CIZ:{isler:new Map([['synthetic',{}]]),basla(){graphics.wake++;}},
  HV:{stopAll(){graphics.sleep++;}},SPEC:{stop(){graphics.sleep++;}},cymPauseVisual(){graphics.sleep++;},
  MUHR:{draw(){graphics.static++;},wake(){graphics.wake++;}},FRM:{draw(){graphics.static++;},wake(){graphics.wake++;}}});
 context.window=context;
 for(const name of ['AudioContext','webkitAudioContext','AudioLife','SukunSessionState','SukunCountCorrection','SukunAudioSessionRegistry','SukunTabOwner','indexedDB','caches','fetch','Z'])Object.defineProperty(context,name,{get(){forbidden.push(name);throw Error('Unexpected performance API '+name);}});
 vm.createContext(context);vm.runInContext(locale,context);context.I18N.lang=options.lang||'tr';context.I18N.apply=()=>{};vm.runInContext(runtime,context);
 function advance(ms){const until=now+ms;for(;;){const found=[...jobs].filter(([,j])=>j.when<=until).sort((a,b)=>a[1].when-b[1].when||a[0]-b[0])[0];if(!found)break;now=found[1].when;jobs.delete(found[0]);found[1].fn();}now=until;}
 advance(90);
 return{context,document,button,nodes,writes,forbidden,graphics,store,jobs,add,advance,perf:context.SukunPerformance,
  language(lang){context.I18N.set(lang);advance(0);},text:id=>nodes.get(id)?.textContent};
}
function clean(f){assert.deepEqual(f.forbidden,[]);assert.equal(f.jobs.size,0);}
const results=[];async function test(name,fn){try{await fn();results.push({name,status:'PASS'});}catch(error){results.push({name,status:'FAIL',error:error.stack});}}
(async()=>{
 await test('Existing mode button owns one closed comparison help and accessible current explanation',()=>{
  const help=html.match(/<details class="prPerfHelp" id="r1042PerfHelp">([\s\S]*?)<\/details>/);assert(help);assert(!/\bopen\b/.test(help[0].split('>')[0]));
  assert.match(html,/<button class="prPerfBtn" id="prPerfBtn"[^>]*aria-describedby="r1042PerfCurrent r1042PerfChoice r1042PerfSleep"/);
  for(const id of ids)assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1,id);
  assert(!/select|input|button/.test(help[1]),'Help cannot create a competing mode selector');
 });
 for(const mode of ['tam','dengeli','pil'])await test('Turkish '+mode+' selection shows its description and all three comparisons',()=>{
  const f=fixture({mode}),names={tam:'Tam',dengeli:'Dengeli',pil:'Pil'};assert.equal(f.button.textContent,names[mode]);assert(f.text('r1042PerfCurrent').startsWith(names[mode]+':'));
  for(const [id,name]of [['r1042PerfTam','Tam'],['r1042PerfDengeli','Dengeli'],['r1042PerfPil','Pil']])assert(f.text(id).startsWith(name+':'));
  assert.equal(f.button.title,f.text('r1042PerfCurrent'));assert.match(f.text('r1042PerfChoice'),/isteğe bağlıdır/);assert.match(f.text('r1042PerfChoice'),/istediğin zaman/);clean(f);
 });
 for(const mode of ['tam','dengeli','pil'])await test('TR → EN → TR updates actual dictionary/text writer without changing '+mode+' or preferences',()=>{
  const f=fixture({mode}),before=Object.fromEntries(ids.map(id=>[id,f.text(id)])),modeWrites=f.writes.filter(x=>x[0]==='sukun.perf').length;
  f.language('en');const names={tam:'Full',dengeli:'Balanced',pil:'Battery'};assert.equal(f.button.textContent,names[mode]);assert(f.text('r1042PerfCurrent').startsWith(names[mode]+':'));
  for(const id of ids){assert.notEqual(f.text(id),before[id],id);assert.equal(f.nodes.get(id).firstChild.__o,before[id],id+' keeps Turkish producer source');assert.equal(f.context.I18N.D[before[id]],f.text(id));}
  assert.match(f.text('r1042PerfChoice'),/optional/);assert.match(f.text('r1042PerfChoice'),/at any time/);assert.match(f.text('r1042PerfSleep'),/does not switch to Battery automatically/);assert.match(f.text('r1042PerfSleep'),/does not pause audio or counting/);assert.match(f.text('r1042PerfScene'),/separate choice/);
  f.language('tr');for(const id of ids)assert.equal(f.text(id),before[id],id);assert.equal(f.perf.mode,mode);assert.equal(f.document.body.dataset.perf,mode);assert.equal(f.writes.filter(x=>x[0]==='sukun.perf').length,modeWrites);clean(f);
 });
 await test('Actual button cycles Balanced → Battery → Full → Balanced and uses only the existing preference',()=>{
  const f=fixture();for(const mode of ['pil','tam','dengeli']){fire(f.button,'click');assert.equal(f.perf.mode,mode);assert.equal(f.document.body.dataset.perf,mode);assert.equal(f.store.get('sukun.perf'),JSON.stringify(mode));}
  assert.equal(f.store.get('sukun.performance.r920'),'balanced');assert(f.writes.every(x=>x[0]==='sukun.perf'));assert.equal(f.button.listeners.get('click').length,1);clean(f);
 });
 for(const mode of ['tam','dengeli','pil'])await test('Hidden graphics sleep preserves selected '+mode+' without preference/audio/count work',()=>{
  const f=fixture({mode}),writes=f.writes.length;f.document.hidden=true;fire(f.document,'visibilitychange');fire(f.context,'pagehide');assert(f.graphics.sleep>0);assert.equal(f.perf.mode,mode);assert.equal(f.document.body.dataset.perf,mode);assert.equal(f.writes.length,writes);
  f.document.hidden=false;fire(f.document,'visibilitychange');fire(f.context,'pageshow');assert.equal(f.perf.mode,mode);assert.equal(f.writes.length,writes);assert(mode==='pil'?f.graphics.static>0:f.graphics.wake>0);clean(f);
 });
 await test('Reduced-motion preference does not silently replace an explicit Full mode',()=>{
  const f=fixture({mode:'tam',reduced:true});assert.equal(f.perf.mode,'tam');assert.equal(f.document.body.dataset.perf,'tam');assert.equal(f.text('r1042PerfCurrent'),f.text('r1042PerfTam'));clean(f);
 });
 await test('Unchanged explanation renders perform no additional text writes',()=>{
  const f=fixture({lang:'en'}),counts=ids.map(id=>f.nodes.get(id).textWrites);for(let i=0;i<10;i++)f.perf.render();assert.deepEqual(ids.map(id=>f.nodes.get(id).textWrites),counts);assert.equal(f.perf.mode,'dengeli');clean(f);
 });
 await test('Later DOM hydration fills English explanations and does not bind a second cycle handler',()=>{
  const f=fixture({lang:'en',noHints:true});for(const id of ids)f.add(id);fire(f.context,'sukun:domhydrate');fire(f.context,'sukun:domhydrate');assert.match(f.text('r1042PerfCurrent'),/^Balanced:/);assert.match(f.text('r1042PerfSummary'),/^Compare visual modes$/);assert.equal(f.button.listeners.get('click').length,1);clean(f);
 });
 await test('Actual effective-mode protection preserves every user mode and disables automatic switching',()=>{
  const start=html.indexOf("let perf={requested:document.body.dataset.perf||'dengeli'"),end=html.indexOf('/* ── 5. Session memory',start);assert(start>0&&end>start);
  const f=fixture({mode:'tam'});vm.runInContext(html.slice(start,end),f.context);const n=f.writes.length;
  for(const [mode,effective]of [['tam','gorsel'],['dengeli','dengeli'],['pil','pil']]){f.perf.apply(mode,false,false);f.document.hidden=true;assert.equal(f.context.SukunAdaptivePerformance.apply(),effective);const s=f.context.SukunAdaptivePerformance.snapshot();assert.equal(s.requested,mode);assert.equal(s.automaticSwitching,false);assert.equal(f.perf.mode,mode);}
  assert.equal(f.writes.length,n);clean(f);
 });
 await test('Actual draw budgets support mode descriptions and separate scene Saving limitation',()=>{
  const start=html.indexOf('_frameBudgetMs(audioCoupled=false){'),end=html.indexOf('  _init(){',start);assert(start>0&&end>start);const f=fixture();const budget=vm.runInContext('({'+html.slice(start,end)+'})',f.context);
  for(const [mode,effective,ms]of [['tam','gorsel',16.5],['dengeli','dengeli',33],['pil','pil',125]]){f.document.body.dataset.perf=mode;f.document.body.dataset.perfEffective=effective;assert.equal(budget._frameBudgetMs(),ms);}
  f.document.body.dataset.perf='tam';f.document.body.dataset.perfEffective='gorsel';f.document.documentElement.dataset.r920Performance='saving';assert.equal(budget._frameBudgetMs(),125);assert.equal(budget._frameBudgetMs(true),16.5,'Scene quality cannot slow the legacy audio-coupled job');clean(f);
 });
 await test('Separate scene quality retains its real profile/key and does not become a global Battery preference',()=>{
  assert.match(html,/let profile=safe\(\(\)=>localStorage\.getItem\('sukun\.performance\.r920'\),'balanced'\)/);
  assert.match(html,/if\(!\['cinematic','balanced','saving'\]\.includes\(value\)\)return false;/);
  assert.match(html,/profile==='saving'\)\{clearTransition\(\);clearTimeout\(warmTimer\)/);
  assert.match(html,/profile!=='saving'&&!navigator\.connection\?\.saveData&&!document\.hidden/);
  const f=fixture({lang:'en'});assert.match(f.text('r1042PerfScene'),/disables scene transitions and preloading of the next scene/);clean(f);
 });
 const report={total:results.length,passed:results.filter(x=>x.status==='PASS').length,failed:results.filter(x=>x.status==='FAIL').length,scope:'Shipped global mode button, original I18N dictionary/writer, production effective-mode mapping and draw budgets with synthetic DOM/graphics endpoints. Confirms TR/EN descriptions, user selection, separate scene quality and no audio/count commands. Does not measure physical frames, battery drain or Android background playback.',results};console.log(JSON.stringify(report,null,2));if(report.failed)process.exitCode=1;
})();
