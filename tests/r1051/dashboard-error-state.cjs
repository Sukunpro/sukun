'use strict';
// Actual dashboard function, visible session listener and shared I18N writer.
// DOM and canonical/lifecycle inputs are controlled; no real browser audio.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const labels={idle:'hazır',preparing:'hazırlanıyor',playing:'çalıyor',paused:'duraklatıldı',interrupted:'kesildi',recovering:'toparlanıyor',stopping:'duruyor',error:'Ses açılamadı'};
function production(file){
 const html=fs.readFileSync(path.join(root,file),'utf8');
 const start=html.indexOf('function dashUpdate(){'),end=html.indexOf('/* ═══ 4) GLOBAL ARAMA',start);
 const iStart=html.indexOf('const I18N = {'),iEnd=html.indexOf('window.I18N=I18N;',iStart)+'window.I18N=I18N;'.length;
 assert(start>0&&end>start&&iStart>0&&iEnd>iStart,'shipped dashboard and translator boundaries');
 const listener=html.match(/let dashboardSessionPhase='';[\s\S]*?window\.addEventListener\('sukun:sessionchange',[\s\S]*?\},\{passive:true\}\);/);
 assert(listener,'visible-only phase-filtered presentation listener');
 const dict={};
 for(const tr of Object.values(labels)){
  const escaped=JSON.stringify(tr).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const found=html.match(new RegExp(escaped+'\\s*:\\s*("(?:[^"\\\\]|\\\\.)*")'));
  assert(found,'shipped English mapping '+tr);dict[tr]=JSON.parse(found[1]);
 }
 return{file,dashboard:html.slice(start,end),locale:html.slice(iStart,iEnd),listener:listener[0],dict};
}
const sources=['index.html','nero.html'].map(production),source=sources[0];
assert.equal(sources[1].dashboard,source.dashboard,'both shipped entrypoints use the same dashboard');
assert.equal(sources[1].listener,source.listener,'both entrypoints use the same presentation listener');
assert.deepEqual(sources[1].dict,source.dict,'both entrypoints retain the same status translations');
function fixture({life='playing',phase='ERROR',lang='tr',missingSession=false,brokenSession=false}={}){
 const nodes=new Map(),listeners=new Map(),forbidden=[];let sessionPhase=phase,reads=0,dashboardReads=0;
 function reject(name){forbidden.push(name);throw Error('Presentation invoked '+name);}
 class Element{
  constructor(id){this.id=id;this.tagName='SPAN';this.firstChild=null;this.childNodes=[];this.textWrites=0;this.flags=new Set();this.classList={toggle:(key,on)=>on?this.flags.add(key):this.flags.delete(key)};}
  get textContent(){return this.firstChild?.nodeValue||'';}
  set textContent(value){this.textWrites++;this.firstChild={nodeType:3,nodeValue:String(value),parentElement:this};this.childNodes=[this.firstChild];}
  closest(){return null;}
 }
 for(const id of ['prDashboard','prDz','prDm','prDf','prDNow','prState'])nodes.set(id,new Element(id));
 const c={console,Date,Math,Number,String,Object,Map,Set,document:{hidden:false,getElementById:id=>nodes.get(id)||null},
  AudioLife:Object.freeze({state:life,set:()=>reject('lifecycle.set'),busy:()=>reject('lifecycle.busy')}),
  Z:Object.freeze({auto:true,count:0,total:0}),FR:Object.freeze({playing:false,c:123}),
  todayLog:()=>{dashboardReads++;return[]},todayTekke:()=>[],dayZkTemizle:()=>({}),dayKey:()=> 'controlled-day',currentZikir:()=> 'Yâ Rahmân',
  S:{get:()=>({}),set:()=>reject('storage.write')},PRERR:{push:()=>reject('dashboard.error')},
  addEventListener(type,fn){if(!listeners.has(type))listeners.set(type,[]);listeners.get(type).push(fn)},
  setTimeout:()=>reject('timer'),requestAnimationFrame:()=>reject('graphics'),audioLifeSchedule:()=>reject('lifecycle.schedule')};
 c.window=c;
 if(!missingSession)c.SukunSessionState={peek:()=>Object.freeze({phase:sessionPhase}),snapshot(){reads++;if(brokenSession)throw Error('unavailable read');return Object.freeze({phase:sessionPhase})},command:()=>reject('session.command')};
 for(const name of ['speechSynthesis','AudioContext','indexedDB','caches','PlaybackController'])Object.defineProperty(c,name,{get:()=>reject(name)});
 vm.createContext(c);vm.runInContext(source.locale,c);Object.assign(c.I18N.D,source.dict);c.I18N.lang=lang;
 vm.runInContext(source.dashboard+'\n'+source.listener,c);
 const pristine=JSON.stringify({life:c.AudioLife.state,z:c.Z,frequency:c.FR});
 function clean(){assert.deepEqual(forbidden,[]);assert.equal(JSON.stringify({life:c.AudioLife.state,z:c.Z,frequency:c.FR}),pristine);}
 return{c,nodes,listeners,clean,update:()=>c.dashUpdate(),phase:value=>{sessionPhase=value},get reads(){return reads},get dashboardReads(){return dashboardReads},status:()=>nodes.get('prState'),emit:(detail={phase:sessionPhase})=>listeners.get('sukun:sessionchange').forEach(fn=>fn({detail}))};
}
const results=[];function test(name,fn){try{fn();results.push({name,passed:true})}catch(error){results.push({name,passed:false,error:error.stack})}}
for(const lang of ['tr','en']){
 test(lang+': canonical error overrides busy automatic intent and removes playing highlight',()=>{
  const f=fixture({lang});f.update();assert.equal(f.status().textContent,lang==='en'?'Audio could not be opened':'Ses açılamadı');assert(!f.status().flags.has('on'));assert.equal(f.c.Z.auto,true);assert.equal(f.c.Z.count,0);f.clean();
 });
 test(lang+': visible session events show error, retry and finished states without lifecycle work',()=>{
  const f=fixture({lang,phase:'PLAYING'});f.update();assert.equal(f.status().textContent,lang==='en'?'playing':'çalıyor');assert(f.status().flags.has('on'));
  f.phase('ERROR');f.emit();assert.equal(f.status().textContent,lang==='en'?'Audio could not be opened':'Ses açılamadı');assert(!f.status().flags.has('on'));
  f.phase('PLAYING');f.emit();assert.equal(f.status().textContent,lang==='en'?'playing':'çalıyor');assert(f.status().flags.has('on'));
  f.c.AudioLife=Object.freeze({...f.c.AudioLife,state:'idle'});f.phase('IDLE');f.emit();assert.equal(f.status().textContent,lang==='en'?'ready':'hazır');assert(!f.status().flags.has('on'));assert.deepEqual(f.c.Z,{auto:true,count:0,total:0});assert.deepEqual(f.c.FR,{playing:false,c:123});assert.deepEqual(f.c.document.hidden,false);
 });
 test(lang+': normal lifecycle labels retain ambient, frequency, idle and pause semantics',()=>{
  for(const [life,label]of Object.entries(labels).filter(([state])=>state!=='error')){
   const f=fixture({lang,life,phase:'IDLE'});f.update();assert.equal(f.status().textContent,lang==='en'?source.dict[label]:label);assert.equal(f.status().flags.has('on'),life==='playing');f.clean();
  }
 });
}
test('TR → EN → TR uses actual shared writer and preserves Turkish producer source',()=>{
 const f=fixture();f.update();assert.equal(f.status().firstChild.__o,'Ses açılamadı');f.c.I18N.lang='en';f.update();assert.equal(f.status().textContent,'Audio could not be opened');assert.equal(f.status().firstChild.__o,'Ses açılamadı');f.c.I18N.lang='tr';f.update();assert.equal(f.status().textContent,'Ses açılamadı');f.clean();
});
test('repeated unchanged error renders do not rewrite the status text',()=>{const f=fixture({lang:'en'});f.update();const before=f.status().textWrites;for(let i=0;i<30;i++)f.update();assert.equal(f.status().textWrites,before);f.clean()});
test('hidden session changes schedule no dashboard, graphics or lifecycle work',()=>{const f=fixture({phase:'PLAYING'});f.c.document.hidden=true;f.phase('ERROR');f.emit();assert.equal(f.reads,0);assert.equal(f.dashboardReads,0);assert.equal(f.status().textWrites,0);f.c.document.hidden=false;f.emit();assert.equal(f.status().textContent,'Ses açılamadı');f.clean()});
test('3,600 count-only session publications perform no additional dashboard or canonical reads',()=>{const f=fixture({phase:'PLAYING'});f.update();const before=f.dashboardReads,reads=f.reads;for(let count=1;count<=3600;count++)f.emit({phase:'PLAYING',count,revision:count});assert.equal(f.dashboardReads,before);assert.equal(f.reads,reads);assert.equal(f.status().textContent,'çalıyor');f.clean()});
test('legacy events use a canonical phase read and refresh only when that phase changes',()=>{const f=fixture({phase:'PLAYING'});f.update();const before=f.dashboardReads;f.emit({});assert.equal(f.dashboardReads,before);f.phase('ERROR');f.emit({});assert.equal(f.dashboardReads,before+1);assert.equal(f.status().textContent,'Ses açılamadı');f.emit({});assert.equal(f.dashboardReads,before+1);f.clean()});
test('missing and unavailable canonical reads preserve the existing lifecycle label',()=>{for(const options of [{missingSession:true},{brokenSession:true}]){const f=fixture(options);f.update();assert.equal(f.status().textContent,'çalıyor');assert(f.status().flags.has('on'));f.clean()}});
test('early dashboard without the translator still presents the canonical error',()=>{const f=fixture();delete f.c.I18N;f.update();assert.equal(f.status().textContent,'Ses açılamadı');assert(!f.status().flags.has('on'));f.clean()});
const report={passed:results.filter(r=>r.passed).length,total:results.length,scope:'Shipped dashboard, session listener and I18N writer with controlled DOM/read inputs. No audio, counter, storage, lifecycle or timer commands; no physical browser or audible-output claim.',results};
console.log(JSON.stringify(report,null,2));if(report.passed!==report.total)process.exitCode=1;
