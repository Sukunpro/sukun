'use strict';
// Deterministic DOM visibility/RAF lifecycle evidence, not physical pixels.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const source=fs.readFileSync(path.join(root,'assets/runtime/presentation-r979.js'),'utf8');
function hub(){return{listeners:new Map(),addEventListener(type,fn){const list=this.listeners.get(type)||[];list.push(fn);this.listeners.set(type,list);},dispatchEvent(event){for(const fn of [...this.listeners.get(event.type)||[]])fn(event);return true;}};}
function fire(target,type,extra={}){target.dispatchEvent({type,isTrusted:true,...extra});}
function fixture(options={}){
 let now=10_000,next=0,restores=0,scrolls=0;const jobs=new Map(),frames=new Map(),forbidden=[],notifications=[],nodes=new Map();
 class Element{
  constructor(id){Object.assign(this,hub());this.id=id;this.hidden=false;this.isConnected=true;this.style={};this.dataset={};this.parentElement=null;this.children=[];this.classes=new Set();this.rect={top:0,left:0,width:360,height:650,right:360,bottom:650};this.classList={contains:n=>this.classes.has(n),add:(...names)=>names.forEach(n=>this.classes.add(n)),remove:(...names)=>names.forEach(n=>this.classes.delete(n))};}
  append(...children){for(const child of children){child.parentElement=this;this.children.push(child);}}
  setAttribute(name,value){this[name]=String(value);}
  get firstElementChild(){return this.children[0];}get lastElementChild(){return this.children.at(-1);}
  getBoundingClientRect(){return{...this.rect};}
  scrollIntoView(){scrolls++;if(options.repairScroll!==false)nodes.get('r920Practice').rect={top:0,left:0,width:360,height:650,right:360,bottom:650};}
 }
 const document=Object.assign(hub(),{hidden:!!options.hidden,readyState:options.loading?'loading':'complete'}),context=hub();
 const html=new Element('html'),body=new Element('body');html.lang='tr';html.append(body);document.documentElement=html;document.body=body;
 function add(id,parent=body){const node=new Element(id);parent.append(node);nodes.set(id,node);return node;}
 const wrap=add('wrap'),nav=add('r616BottomNav',wrap),practice=add('r920Practice',wrap),counter=add('r920Counter',practice),selected=new Element('selected-tab');selected.dataset.t=options.tab||'zkr';
 for(const name of ['amb','frq','zkr','rx','ntf']){const node=add('tab-'+name,wrap);node.hidden=name!==selected.dataset.t;}
 practice.hidden=!!options.practiceHidden;if(options.practiceMissing)nodes.delete('r920Practice');
 if(options.tef)body.classList.add('sukun-tefekkur-mode');if(options.practiceOn)body.classList.add('r920-practice-on');
 if(options.tabHidden)nodes.get('tab-zkr').hidden=true;
 if(options.openingFlags)body.classList.add('r608-opening-active','r610-opening-active');
 if(options.liveOpening||options.expiredOpening){const curtain=add('acilisPerde');if(options.expiredOpening){curtain.hidden=true;curtain.classList.add('bitti');}}
 if(options.offscreen)practice.rect={top:1000,left:0,width:360,height:650,right:360,bottom:1650};
 if(options.noSurface){wrap.style.display='none';nav.style.display='none';nodes.get('tab-'+selected.dataset.t).style.display='none';practice.style.display='none';}
 document.getElementById=id=>nodes.get(id)||null;
 document.querySelector=selector=>{
  if(selector==='body > .wrap')return wrap;
  if(selector==='.tab.act[data-t]')return selected;
  if(selector==='section[id^="tab-"]:not([hidden])')return [...nodes.values()].find(n=>n.id.startsWith('tab-')&&!n.hidden)||null;
  if(selector==='dialog[open]')return options.dialog?new Element('dialog'):null;
  throw Error('Unsupported selector '+selector);
 };
 document.createElement=tag=>{const node=new Element('generated-'+tag);return node;};
 const getComputedStyle=node=>({display:'block',visibility:'visible',opacity:node===body&&options.openingFlagsHide&&['r608-opening-active','r610-opening-active'].some(n=>body.classList.contains(n))?'0':'1',contentVisibility:'visible',...node.style});
 Object.assign(context,{document,Date:{now:()=>now},performance:{now:()=>now},innerHeight:800,innerWidth:400,scrollX:0,scrollY:0,
  getComputedStyle,CustomEvent:class{constructor(type,init={}){this.type=type;this.detail=init.detail;}},
  setTimeout(fn,ms){jobs.set(++next,{fn,when:now+ms});return next;},clearTimeout:id=>jobs.delete(id),
  requestAnimationFrame(fn){frames.set(++next,fn);return next;},cancelAnimationFrame:id=>frames.delete(id)});
 context.window=context;
 context.addEventListener=context.addEventListener.bind(context);
 context.SukunPracticeUI={restorePresentation(){restores++;if(options.restoreThrows)throw Error('presentation failure');if(options.repair!==false){const p=nodes.get('r920Practice');if(p){p.hidden=false;p.style.display='block';}wrap.style.display='block';nav.style.display='block';nodes.get('tab-zkr').hidden=false;nodes.get('tab-zkr').style.display='block';}return options.restoreResult!==false;}};
 for(const name of ['AudioContext','webkitAudioContext','MediaRecorder','AudioLife','SukunSessionState','SukunCountCorrection','SukunTabOwner','SukunAudioSessionRegistry','SukunTickSound','SukunPhysicalRecordingBusyR696','SUKUN_TEFEKKUR','localStorage','sessionStorage','indexedDB','caches','fetch','location'])Object.defineProperty(context,name,{get(){forbidden.push(name);throw Error('Forbidden presentation dependency '+name);}});
 context.addEventListener('sukun:presentationrecovery',event=>notifications.push(event.detail));
 vm.createContext(context);vm.runInContext(source,context);
 function advance(ms){const until=now+ms;for(;;){const entry=[...jobs].filter(([,j])=>j.when<=until).sort((a,b)=>a[1].when-b[1].when||a[0]-b[0])[0];if(!entry)break;now=Math.max(now,entry[1].when);jobs.delete(entry[0]);entry[1].fn();}now=until;}
 function paint(){now+=16;const batch=[...frames.values()];frames.clear();for(const fn of batch)fn(now);}
 function settle(){advance(120);paint();paint();}
 function hide(){document.hidden=true;fire(document,'visibilitychange');}
 function wake(reason='visible'){document.hidden=false;if(reason==='visible')fire(document,'visibilitychange');else if(reason==='resume')fire(document,'resume');else fire(context,'pageshow',{persisted:true});}
 function finish(reason){if(reason==='boot'){if(options.loading)fire(document,'DOMContentLoaded');}else if(reason==='visible')wake();else if(reason==='resume')wake('resume');else if(reason==='pageshow-persisted')fire(context,'pageshow',{persisted:true});else fire(context,reason,{persisted:false});settle();}
 return{context,document,body,wrap,nav,practice,counter,selected,nodes,jobs,frames,forbidden,notifications,options,advance,paint,settle,hide,wake,finish,
  snapshot:()=>JSON.parse(JSON.stringify(context.SukunPresentationRecovery.snapshot())),get now(){return now;},get restores(){return restores;},get scrolls(){return scrolls;}};
}
function passive(f){assert.deepEqual(f.forbidden,[]);}
function settled(f){assert.equal(f.jobs.size,0);assert.equal(f.frames.size,0);passive(f);}
const results=[];
async function test(name,fn){try{await fn();results.push({name,status:'PASS'});}catch(error){results.push({name,status:'FAIL',error:error.stack});}}
(async()=>{
 for(const reason of ['boot','visible','focus','pageshow','pageshow-persisted','resume'])await test('Healthy '+reason+' observes DOM/frame without restoring or scrolling',()=>{
  const f=fixture();if(reason!=='boot')f.finish('boot');if(reason==='focus')f.advance(1200);f.finish(reason);assert.equal(f.restores,0);assert.equal(f.scrolls,0);assert.equal(f.snapshot().state,'ready');assert.equal(f.snapshot().lastProbe.domSurfaceVisible,true);assert.equal(f.snapshot().lastProbe.frameObserved,true);settled(f);
 });
 await test('Loading boot waits for DOMContentLoaded and still leaves a healthy renderer untouched',()=>{
  const f=fixture({loading:true});assert.equal(f.jobs.size,0);assert.equal(f.restores,0);f.finish('boot');assert.equal(f.restores,0);assert.equal(f.snapshot().checks,1);settled(f);
 });
 for(const practiceMissing of [false,true])await test('Intentionally hidden'+(practiceMissing?' or absent':'')+' practice remains untouched on a different visible tab',()=>{
  const f=fixture({tab:'amb',practiceHidden:true,practiceMissing});f.finish('boot');for(const reason of ['visible','pageshow','pageshow-persisted','resume'])f.finish(reason);assert.equal(f.restores,0);assert.equal(f.scrolls,0);assert.equal(f.selected.dataset.t,'amb');assert.equal(f.nodes.get('tab-zkr').hidden,true);assert.equal(f.practice.hidden,true);assert.equal(f.snapshot().state,'ready');assert.equal(f.snapshot().lastProbe.selectedTab,'tab-amb');assert.equal(f.snapshot().lastProbe.roots.practice.inViewport,false);settled(f);
 });
 await test('Healthy tef surface does not render again even if non-owning practice is hidden',()=>{
  const f=fixture({tef:true,practiceHidden:true});f.finish('boot');f.hide();f.advance(30*60*1000);f.wake();f.settle();assert.equal(f.restores,0);assert.equal(f.practice.hidden,true);assert.equal(f.snapshot().state,'ready');settled(f);
 });
 await test('Hidden tef tab is repaired directly and re-probed without a needless practice render',()=>{
  const f=fixture({tef:true,tabHidden:true,practiceHidden:true});f.finish('boot');assert.equal(f.nodes.get('tab-zkr').hidden,false);assert.equal(f.restores,0);assert.equal(f.snapshot().state,'recovered');assert.deepEqual(f.snapshot().lastRepair.actions,['show-tefekkur-tab']);settled(f);
 });
 await test('Broken owning practice in tef is restored exactly once and verified on the next frame',()=>{
  const f=fixture({tef:true,practiceOn:true,practiceHidden:true});f.finish('boot');assert.equal(f.restores,1);assert.equal(f.practice.hidden,false);assert.equal(f.snapshot().state,'recovered');assert.equal(f.snapshot().lastProbe.domSurfaceVisible,true);assert.deepEqual(f.snapshot().lastRepair.actions,['refresh-practice']);settled(f);
 });
 await test('Expired opening flags that alone hide a healthy surface are cleared before deciding on restoration',()=>{
  const f=fixture({openingFlags:true,openingFlagsHide:true,expiredOpening:true});f.finish('boot');assert.equal(f.restores,0);assert.equal(f.body.classList.contains('r608-opening-active'),false);assert.equal(f.body.classList.contains('r610-opening-active'),false);assert.equal(f.snapshot().state,'recovered');assert.equal(f.snapshot().lastProbe.domSurfaceVisible,true);assert.deepEqual(f.snapshot().lastRepair.actions,['clear-r608-opening-active','clear-r610-opening-active']);settled(f);
 });
 await test('Live opening suppresses restoration and preserves its opening flags',()=>{
  const f=fixture({openingFlags:true,openingFlagsHide:true,liveOpening:true});f.finish('boot');assert.equal(f.restores,0);assert.equal(f.body.classList.contains('r608-opening-active'),true);assert.equal(f.body.classList.contains('r610-opening-active'),true);assert.equal(f.snapshot().state,'ready');assert.equal(f.snapshot().lastProbe.openingActive,true);settled(f);
 });
 await test('No visible DOM surface restores once even outside tef mode',()=>{
  const f=fixture({noSurface:true});f.finish('boot');assert.equal(f.restores,1);assert.equal(f.snapshot().state,'recovered');assert.equal(f.snapshot().lastProbe.domSurfaceVisible,true);settled(f);
 });
 await test('Missing first RAF uses bounded repair and does not report a physical visibility pass',()=>{
  const f=fixture();f.advance(120);assert.equal(f.frames.size,1);f.advance(800);assert.equal(f.restores,1);f.advance(800);assert.equal(f.snapshot().state,'attention');assert.equal(f.snapshot().lastProbe.frameObserved,false);assert.equal(f.snapshot().lastProbe.domSurfaceVisible,true);settled(f);
 });
 for(const minutes of [30,45,120])await test('Virtual '+minutes+'-minute lock cancels work and healthy unlock requires no renderer restoration',()=>{
  const f=fixture();f.finish('boot');const checks=f.snapshot().checks;f.hide();assert.equal(f.snapshot().state,'hidden');settled(f);f.advance(minutes*60*1000);assert.equal(f.snapshot().checks,checks);assert.equal(f.restores,0);settled(f);f.wake();f.settle();assert.equal(f.restores,0);assert.equal(f.snapshot().checks,checks+1);assert.equal(f.snapshot().state,'ready');assert.equal(f.scrolls,0);settled(f);
 });
 await test('Stale frame from before hide and a superseded resume never restores or commits a probe',()=>{
  const f=fixture({tef:true,practiceOn:true,practiceHidden:true});f.advance(120);const beforeHide=[...f.frames.values()][0];f.hide();f.advance(45*60*1000);beforeHide();assert.equal(f.restores,0);assert.equal(f.snapshot().checks,0);assert.equal(f.snapshot().state,'hidden');settled(f);
  f.wake('resume');f.advance(120);const oldResume=[...f.frames.values()][0];fire(f.context,'pageshow',{persisted:true});oldResume();assert.equal(f.restores,0);assert.equal(f.snapshot().checks,0);f.settle();assert.equal(f.restores,1);assert.equal(f.snapshot().checks,1);assert.equal(f.snapshot().state,'recovered');settled(f);
 });
 await test('Hide after repair cancels the stale settle frame; subsequent healthy resume does not repair twice',()=>{
  const f=fixture({tef:true,practiceOn:true,practiceHidden:true});f.advance(120);f.paint();assert.equal(f.restores,1);const stale=[...f.frames.values()][0];f.hide();f.advance(30*60*1000);stale();assert.equal(f.snapshot().checks,0);assert.equal(f.snapshot().state,'hidden');f.wake();f.settle();assert.equal(f.restores,1);assert.equal(f.snapshot().checks,1);assert.equal(f.snapshot().state,'ready');settled(f);
 });
 await test('Input after return preserves an intentional offscreen focus position',()=>{
  const f=fixture({tef:true,practiceOn:true});f.finish('boot');f.hide();f.advance(30*60*1000);f.practice.rect={top:1000,left:0,width:360,height:650,right:360,bottom:1650};f.wake();fire(f.document,'pointerdown');f.settle();assert.equal(f.scrolls,0);assert.equal(f.snapshot().state,'attention');passive(f);
 });
 await test('Broken focus outside viewport is positioned only on an untouched foreground return',()=>{
  const f=fixture({tef:true,practiceOn:true});f.finish('boot');f.hide();f.advance(30*60*1000);f.practice.rect={top:1000,left:0,width:360,height:650,right:360,bottom:1650};f.wake();f.settle();assert.equal(f.scrolls,1);assert.equal(f.snapshot().state,'recovered');assert(f.snapshot().lastRepair.actions.includes('restore-focus-position'));settled(f);
 });
 for(const restoreThrows of [false,true])await test('Unsuccessful presentation repair remains attention without transport intervention: '+(restoreThrows?'throws':'false'),()=>{
  const f=fixture({tef:true,practiceOn:true,practiceHidden:true,repair:false,restoreResult:false,restoreThrows});f.finish('boot');assert.equal(f.restores,1);assert.equal(f.snapshot().state,'attention');assert.equal(f.snapshot().lastProbe.domSurfaceVisible,false);settled(f);
 });
 await test('Manual recovery observes a healthy surface without forcing render or touching app state',()=>{
  const f=fixture({tab:'amb',practiceHidden:true});f.finish('boot');f.context.SukunPresentationRecovery.recover();f.advance(0);f.paint();f.paint();assert.equal(f.restores,0);assert.equal(f.scrolls,0);assert.equal(f.snapshot().state,'ready');settled(f);
 });
 await test('Snapshot is copied and stays passive after repeated healthy wake boundaries',()=>{
  const f=fixture();f.finish('boot');for(let i=0;i<8;i++){f.advance(1200);f.finish('focus');f.finish('pageshow');}const original=f.snapshot();const copy=f.snapshot();copy.lastProbe.domSurfaceVisible=false;copy.lastProbe.roots.wrap.blocker='fabricated';assert.deepEqual(f.snapshot(),original);assert.equal(f.restores,0);assert.equal(f.scrolls,0);settled(f);
 });
 const report={total:results.length,passed:results.filter(x=>x.status==='PASS').length,failed:results.filter(x=>x.status==='FAIL').length,scope:'Shipped presentation recovery executed in a controlled DOM/RAF VM. Virtual30/45/120-minute locks test timers, generation cancellation and visible-surface decisions only. DOM rectangles and delivered frames do not establish rendered pixels, physical Android unlock, audio output or real background transport.',results};console.log(JSON.stringify(report,null,2));if(report.failed)process.exitCode=1;
})();
