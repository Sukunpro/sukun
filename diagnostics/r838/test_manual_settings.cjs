'use strict';
// Actual shipped markup and handlers in a DOM/VM. No real browser or audio device.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const {parseHTML}=require('linkedom'),core=require('../r729/test_source.cjs');
const root=path.resolve(__dirname,'../..'),html=fs.readFileSync(path.join(root,'nero.html'),'utf8'),results=[];
async function test(name,fn){try{await fn();results.push({name,status:'PASS'});}catch(e){results.push({name,status:'FAIL',error:e.stack});}}
function between(start,end){const a=html.indexOf(start),b=html.indexOf(end,a+start.length);assert(a>=0&&b>a,start);return html.slice(a,b);}
function fixture(full=false){
 const {document,window:dom}=parseHTML(full?html:'<!doctype html><html><body><main id="tab-zkr"><div id="zCountVisual" tabindex="0"></div><div id="r819CounterStage" tabindex="0" role="button"></div><div class="zCounterActions"><button id="tapBtn">Say</button><button id="plusBtn">+1</button></div></main><input id="input"><button id="control">Ayar</button><div id="editable" contenteditable="true"></div></body></html>');
 Object.defineProperty(document,'readyState',{value:'complete'});
 Object.defineProperty(document,'activeElement',{value:null,writable:true});
 Object.defineProperty(dom.HTMLElement.prototype,'open',{configurable:true,get(){return this.hasAttribute('open');},set(v){this.toggleAttribute('open',!!v);}});
 dom.HTMLElement.prototype.focus=function(){document.activeElement=this;};
 dom.HTMLElement.prototype.scrollIntoView=function(){};
 Object.defineProperty(dom.HTMLSelectElement.prototype,'value',{configurable:true,get(){return [...this.options].find(o=>o.hasAttribute('selected'))?.getAttribute('value')||this.options[0]?.getAttribute('value')||'';},set(v){for(const o of this.options)o.toggleAttribute('selected',o.getAttribute('value')===String(v));}});
 const create=document.createElement.bind(document);
 document.createElement=(tag,...rest)=>{const el=create(tag,...rest);if(tag==='dialog'){
  el.showModal=()=>{el.open=true;};el.close=()=>{el.open=false;el.dispatchEvent(new dom.Event('close'));};
 }return el;};
 const events=new dom.EventTarget(),timers=new Map(),store=new Map();let seq=0,clock=100000;
 const Z={cat:'esma',idx:0,count:7,total:107,target:33,auto:false,tempo:1,tick:false};
 const ZIKIR={esma:{items:[{},{}]},berhet:{items:Array.from({length:28},()=>({}))},fav:{items:[{_src:'berhet',_i:9}]}};
 const c={document,console,Promise,Math,JSON,Set,Map,Number,String,Object,Array,RegExp,Event:dom.Event,CustomEvent:dom.CustomEvent,
  Date:{now:()=>clock},performance:{now:()=>clock},setTimeout:(fn,ms)=>{timers.set(++seq,{fn,ms});return seq;},clearTimeout:id=>timers.delete(id),
  addEventListener:events.addEventListener.bind(events),dispatchEvent:events.dispatchEvent.bind(events),
  Z,ZIKIR,S:{get:(k,v)=>store.get(k)??v,set:(k,v)=>store.set(k,v)},$:s=>document.querySelector(s),
  pulses:0,audioStarts:0,saves:0,transitions:0,toastMessages:[],ac:()=>{c.audioStarts++;},pulseZ:()=>{c.pulses++;},tickSnd(){},zUI(){},toast:m=>c.toastMessages.push(m),
  setFill(){},saveSettings:()=>{c.saves++;},zAutoKur:()=>{c.reschedules++;},reschedules:0,
  ZikirTransitionTxn:{prepare:o=>o},r482CommitTransition:()=>{c.transitions++;}};
 c.window=c;const ctx=vm.createContext(c),run=code=>vm.runInContext(code,ctx,{timeout:1500}),$=id=>document.getElementById(id);
 function event(el,type,data={}){const e=new dom.Event(type,{bubbles:true,cancelable:true});Object.assign(e,data);el.dispatchEvent(e);return e;}
 function manual(){
  run(between('/* r836 — Only human input','try{window.SukunZikirRep=rep}'));
  run(between('function bindCounterInput(el){','function ensureStage(){'));
  run("bindCounterInput(document.getElementById('r819CounterStage'));");
  run(between('/* r160: yalnız GERÇEK TAP','document.addEventListener(\'click\',e=>{'));
  for(const id of ['tapBtn','plusBtn']){const s=html.match(new RegExp("\\$\\('#"+id+"'\\)\\.onclick=sukunManualRep;"));assert(s,'wired '+id);run(s[0]);}
  run(between('/* Boşluk tuşu ile sayım (zikir sekmesi açıkken) */',"window.addEventListener('pagehide'"));
 }
 function place(){const src=core.script(root,'r616-friendly-ui-runtime');c.$=$;c.q=(s,r=document)=>r.querySelector(s);c.r704Attr=(el,k,v)=>el.setAttribute(k,v);run(src.slice(src.indexOf('function fold('),src.indexOf('function zikirSnapshot(')));c.placeZikir();c.$=s=>document.querySelector(s);}
 function settings(){
  run('let BENDIR=false;let USUL="duyek";let _zAutoSon=0;');
  run(between("$('#tempoSld').addEventListener('input'","$('#targetSel').addEventListener('change'"));
  run(between("$('#usulSel').addEventListener('change'",'/* Usûl kalıpları:'));
  run(between("$('#optBendir').onclick=()=>{",'/* ── 8D mekânsal ses:'));
  run(core.script(root,'sukun-r830-settings-runtime'));
 }
 return {c,document,dom,run,$,event,manual,settings,place,timers,store,advance:ms=>clock+=ms};
}
(async()=>{
 await test('Automatic same-name wheel tap warns and cannot change any count or pulse',()=>{
  const f=fixture();f.manual();f.c.Z.auto=true;
  f.event(f.$('r819CounterStage'),'click',{detail:0});
  assert.equal(f.c.Z.count,7);assert.equal(f.c.Z.total,107);assert.equal(f.c.pulses,0);assert.equal(f.c.audioStarts,0);
  assert.match(f.$('r836ManualCountNotice').textContent,/önce duraklat/);assert(!f.$('r836ManualCountNotice').hidden);assert.equal(f.c.toastMessages.length,1);
 });
 await test('Automatic timer rep remains active while manual ring and plus are blocked',()=>{
  const f=fixture();f.manual();f.c.Z.auto=true;
  for(let i=0;i<5;i++){f.$('plusBtn').click();f.$('tapBtn').click();f.run('rep()');}
  assert.equal(f.c.Z.count,12);assert.equal(f.c.Z.total,112);assert.equal(f.c.pulses,5);assert.equal(f.c.toastMessages.length,1);
  f.advance(2000);f.$('plusBtn').click();assert.equal(f.c.toastMessages.length,2);assert.equal(f.document.querySelectorAll('#r836ManualCountNotice').length,1);
 });
 await test('Paused direct count allows one manual tap and clears the warning',()=>{
  const f=fixture();f.manual();f.c.Z.auto=true;f.c.SukunManualCounter.count();f.c.Z.auto=false;
  assert(f.c.SukunManualCounter.count());assert.equal(f.c.Z.count,8);assert(f.$('r836ManualCountNotice').hidden);
 });
 await test('Both 28 and 99 journeys guard the same name without depending on Z.auto',()=>{
  for(const [cat,api] of [['berhet','SukunBerhetiyyeSeyir'],['esma','SukunEsma99Seyir']]){
   const f=fixture();f.manual();f.c.Z.cat=cat;f.c.Z.idx=1;const state={run:true,paused:false,i:1};f.c[api]={state:()=>state};
   assert(!f.c.SukunManualCounter.count());assert.equal(f.c.Z.count,7);
   state.paused=true;assert(f.c.SukunManualCounter.count());assert.equal(f.c.Z.count,8);
  }
 });
 await test('Paused, held, stopped and different-name journeys do not create stale locks',()=>{
  const f=fixture();f.manual();const state={run:true,paused:false,i:1};f.c.SukunEsma99Seyir={state:()=>state};
  assert(f.c.SukunManualCounter.count());state.i=0;state.systemHold=true;assert(f.c.SukunManualCounter.count());state.systemHold=false;state.run=false;assert(f.c.SukunManualCounter.count());assert.equal(f.c.Z.count,10);
 });
 await test('Favorite resolves to its Berhetiyye source identity',()=>{
  const f=fixture();f.manual();f.c.Z.cat='fav';f.c.SukunBerhetiyyeSeyir={state:()=>({run:true,i:9})};assert.equal(f.c.SukunManualCounter.blockedBy(),'journey28');assert(!f.c.SukunManualCounter.count());assert.equal(f.c.Z.count,7);
 });
 await test('Smart zikir guards the same name; other steps, names and paused audio do not',()=>{
  const f=fixture();f.manual();const player={playing:true,paused:false,i:0,queue:[{type:'zikir',cat:'esma',idx:0}]};f.c.R170={Player:player};
  assert.equal(f.c.SukunManualCounter.blockedBy(),'smart');assert(!f.c.SukunManualCounter.count());player.queue[0].idx=1;assert(f.c.SukunManualCounter.count());player.queue[0].idx=0;player.paused=true;assert(f.c.SukunManualCounter.count());player.paused=false;player.queue[0].type='ambience';assert(f.c.SukunManualCounter.count());assert.equal(f.c.Z.count,10);
 });
 await test('Blocked tap at the target boundary cannot complete or advance a name',()=>{
  const f=fixture();f.manual();f.c.Z.count=32;f.c.Z.auto=true;assert(!f.c.SukunManualCounter.count());assert.equal(f.c.transitions,0);f.run('rep()');assert.equal(f.c.Z.count,33);assert.equal(f.c.transitions,1);
 });
 await test('Touch tap counts once; ensuing pointer click, scrolling, cancel and long press do not',()=>{
  const f=fixture();f.manual();const el=f.$('r819CounterStage'),data={pointerId:1,clientX:20,clientY:30,pointerType:'touch',isPrimary:true};
  f.event(el,'pointerdown',data);f.event(el,'pointerup',data);f.event(el,'click',{detail:1});assert.equal(f.c.Z.count,8);
  f.event(el,'pointerdown',data);f.event(el,'pointermove',{...data,clientY:80});f.event(el,'pointerup',data);
  f.event(el,'pointerdown',data);f.event(el,'pointercancel',data);f.event(el,'pointerup',data);
  f.event(el,'pointerdown',data);f.advance(700);f.event(el,'pointerup',data);assert.equal(f.c.Z.count,8);
 });
 await test('Keyboard counts once and holds do not repeat; automatic keyboard input warns',()=>{
  for(const id of ['r819CounterStage','zCountVisual']){
   const f=fixture();f.manual();const el=f.$(id);f.event(el,'keydown',{key:' ',code:'Space',repeat:false});assert.equal(f.c.Z.count,8);f.event(el,'keydown',{key:' ',code:'Space',repeat:true});assert.equal(f.c.Z.count,8);
   f.c.Z.auto=true;f.event(el,'keydown',{key:'Enter',code:'Enter'});assert.equal(f.c.Z.count,8);assert.equal(f.c.toastMessages.length,1);
  }
 });
 await test('Space on settings controls, editable content and open dialogs cannot count',()=>{
  const f=fixture();f.manual();for(const id of ['input','control','editable'])f.event(f.$(id),'keydown',{key:' ',code:'Space'});assert.equal(f.c.Z.count,7);
  const d=f.document.createElement('dialog');d.open=true;f.document.body.appendChild(d);f.event(f.document.body,'keydown',{code:'Space'});assert.equal(f.c.Z.count,7);d.remove();f.event(f.document.body,'keydown',{code:'Space'});assert.equal(f.c.Z.count,8);
 });
 await test('The actual full page exposes tempo and bendir at the counter in mini/midi modes',()=>{
  for(const mode of ['mode-mini','mode-midi']){
   const f=fixture(true);f.document.body.className=mode;f.place();f.settings();const entry=f.$('r836CounterSettings');assert(entry);entry.click();
   const d=f.$('r835SettingsDialog');assert(d.open);for(const id of ['tempoSld','optBendir','usulSel','zVolSld','optVib','optSpeak','targetPremium'])assert(d.contains(f.$(id)),id);
   assert(!f.$('optBendir').closest('.opt').hasAttribute('data-lvl'));assert.equal(f.document.querySelectorAll('#tempoSld').length,1);assert.equal(f.document.querySelectorAll('#optBendir').length,1);
   assert.equal(d.querySelector('.r679SettingsBody').firstElementChild,f.$('tempoSld').closest('.sldRow'));assert.equal(d.querySelector('.zOpts').firstElementChild,f.$('optBendir').closest('.opt'));
  }
 });
 await test('Actual tempo, bendir and rhythm handlers still mutate live state and storage',async()=>{
  const f=fixture(true);f.settings();f.$('r836CounterSettings').click();f.c.Z.auto=true;f.$('tempoSld').value='2.4';f.event(f.$('tempoSld'),'input');assert.equal(f.c.Z.tempo,2.4);assert.equal(f.c.reschedules,1);assert.equal(f.$('tempoVal').textContent,'2.4 sn');
  f.$('optBendir').click();await Promise.resolve();assert.equal(f.run('BENDIR'),true);assert.equal(f.c.audioStarts,1);assert.equal(f.$('optBendir').getAttribute('aria-checked'),'true');
  f.$('usulSel').value='sofyan';f.event(f.$('usulSel'),'change');assert.equal(f.run('USUL'),'sofyan');assert.equal(f.store.get('sukun.usul'),'sofyan');assert.equal(f.c.Z.count,7);
  f.c.SukunR830SettingsFix.close();f.$('r836CounterSettings').click();assert.equal(f.$('tempoSld').value,'2.4');assert.equal(f.$('optBendir').getAttribute('aria-checked'),'true');f.$('optBendir').click();await Promise.resolve();assert.equal(f.run('BENDIR'),false);assert.equal(f.c.saves,3);
 });
 await test('Opening settings repairs displaced nodes without cloning away event handlers',()=>{
  const f=fixture(true);f.settings();const tempo=f.$('tempoSld'),options=f.$('optBendir').closest('.zOpts');f.document.body.appendChild(tempo.closest('.sldRow'));f.document.body.appendChild(options);f.$('r836CounterSettings').click();
  const d=f.$('r835SettingsDialog');assert(d.contains(tempo));assert(d.contains(options));f.place();assert(d.contains(tempo));assert(d.contains(options));f.$('optBendir').click();assert(f.run('BENDIR'));assert.equal(f.document.querySelectorAll('#optBendir').length,1);
 });
 await test('Tefekkür moves the counter entry with its controls; settings preserve count and focus',()=>{
  const f=fixture(true);f.settings();const stage=f.document.createElement('section');stage.id='tfControlPanelTest';f.document.body.appendChild(stage);stage.appendChild(f.document.querySelector('.zCounterActions'));f.document.body.classList.add('sukun-tefekkur-mode');
  const entry=f.$('r836CounterSettings');assert(stage.contains(entry));entry.focus();entry.click();assert(f.$('r835SettingsDialog').open);f.c.SukunR830SettingsFix.bind();f.c.SukunR830SettingsFix.close();assert.equal(f.document.activeElement,entry);assert.equal(f.c.Z.count,7);assert.equal(f.document.querySelectorAll('#r836CounterSettings').length,1);assert(f.document.body.classList.contains('sukun-tefekkur-mode'));
 });
 await test('Canonical remount preserves settings entry and active original controls',()=>{const f=fixture(true);f.place();f.settings();const entry=f.$('r836CounterSettings'),notice=f.document.createElement('p');notice.id='r836ManualCountNotice';entry.parentElement.append(notice);f.c.$=f.$;f.c.r704Attr=(el,k,v)=>el.setAttribute(k,v);f.c.r704Text=(el,t)=>{el.textContent=t;};const src=core.script(root,'r530-tefekkur-canonical-runtime');f.run(src.slice(src.indexOf('function ensureExit('),src.indexOf('/* ── r530.')));for(let i=0;i<30;i++)f.c.mount();assert(entry.isConnected);assert(notice.isConnected);f.event(entry,'click');const d=f.$('r835SettingsDialog');assert(d.open);for(let i=0;i<10;i++)f.c.mount();assert(d.contains(f.$('tempoSld')));assert(d.contains(f.$('optBendir')));d.close();f.event(entry,'click');assert(d.open);});
 const out={kind:'shipped-markup-and-input-handlers',browserRun:false,physicalDeviceRun:false,total:results.length,passed:results.filter(x=>x.status==='PASS').length,results};out.failed=out.total-out.passed;
 fs.writeFileSync(path.join(__dirname,'manual-settings-results.json'),JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify({total:out.total,passed:out.passed,failed:out.failed,failures:results.filter(x=>x.status!=='PASS')},null,2));if(out.failed)process.exitCode=1;
})();
