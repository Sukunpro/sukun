'use strict';
// Run with NODE_PATH pointing to dependencies linkedom@0.18.12 and css-tree@3.2.1.
// DOM and source contracts only: no browser rendering, device, or actual audio.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const {parseHTML}=require('linkedom'),css=require('css-tree'),core=require('../r729/test_source.cjs');
const root=path.resolve(__dirname,'../..'),html=fs.readFileSync(path.join(root,'nero.html'),'utf8');
const results=[];
async function test(name,fn){try{await fn();results.push({name,status:'PASS'})}catch(e){results.push({name,status:'FAIL',error:e.stack})}}
function fixture(){
 const {document,window:dom}=parseHTML(`<!doctype html><html><body class="sukun-zikir-tab r716-shell sukun-jewel-r798">
 <div id="r717Scene"></div><main id="tab-zkr"><div id="zCats"><button data-c="esma">Esma</button><button data-c="berhet">Berhetiyye</button></div>
 <div class="zTools"><button id="zListToggle">Listeyi aç</button></div><div id="zList" class="compactOneRow"></div><div id="zStage"></div>
 <article class="card zCtl"><div class="zCounterActions"><button id="undoBtn"><b>−1</b><span>Geri</span></button><button id="autoBtn"><span>▶</span><b>Başlat</b></button><button id="plusBtn"><b>+1</b><span>Ekle</span></button></div>
 <div id="cntSub">Hedef 20</div><details id="r679ZikirAyarBox"><summary>Zikir Ayarları</summary><div class="r679SettingsBody">
 <div class="sldRow"><label>Tempo</label><input id="tempoSld" type="range" value="1.2"></div><div id="targetPremium"><input id="targetInput" value="20"></div><div class="zOpts"><input type="checkbox" id="option"></div></div></details><div id="zBar"></div><div id="zMegaHost"></div>
 <details id="esmaSeyir99"><summary>99 İsim</summary><div class="r168Buttons"><button id="es99Start">Başla</button><button id="es99Pause" hidden></button><button id="es99Stop">Bitir</button></div></details>
 <details id="berhetSeyir"><summary>28 İsim</summary><div class="r168Buttons"><button id="bsStart">Başla</button><button id="bsPause" hidden></button><button id="bsStop">Bitir</button></div></details></article></main>
 <button id="r433DockPeek"><span class="r433Txt">Oynatıcıyı göster</span></button></body></html>`);
 Object.defineProperty(document,'readyState',{value:'complete'});
 Object.defineProperty(document,'activeElement',{value:null,writable:true});
 Object.defineProperty(dom.HTMLElement.prototype,'open',{configurable:true,get(){return this.hasAttribute('open')},set(v){v?this.setAttribute('open',''):this.removeAttribute('open')}});
 dom.HTMLElement.prototype.scrollIntoView=function(){this.dataset.scrolled='1'};
 dom.HTMLElement.prototype.focus=function(){document.activeElement=this};
 Object.defineProperty(dom.HTMLSelectElement.prototype,'value',{configurable:true,get(){return [...this.options].find(o=>o.hasAttribute('selected'))?.getAttribute('value')||this.options[0]?.getAttribute('value')||''},set(v){for(const o of this.options)o.toggleAttribute('selected',o.getAttribute('value')===String(v))}});
 const create=document.createElement.bind(document);
 document.createElement=(tag,...rest)=>{const el=create(tag,...rest);if(tag==='dialog'){
  el.showModal=()=>{el.open=true};el.close=()=>{el.open=false;el.dispatchEvent(new dom.Event('close'))};
 }return el};
 const store=new Map(),pending=[],frames=new Map(),timers=new Map(),events=new dom.EventTarget();let seq=0,unlocked=false,source=null;
 const Z={cat:'esma',idx:0,count:19},ZIKIR={esma:{items:[{tr:'Rahman'},{tr:'Rahim'}]},berhet:{items:Array.from({length:28},(_,i)=>({tr:i===9?'Hûtîrin':'İsim '+i}))},fav:{items:[{_src:'berhet',_i:9}]}};
 const listeners=[];
 const c={document,console,URL,Promise,Math,JSON,Set,Map,Number,String,Object,Array,RegExp,Event:dom.Event,CustomEvent:dom.CustomEvent,
  addEventListener:events.addEventListener.bind(events),dispatchEvent:events.dispatchEvent.bind(events),removeEventListener:events.removeEventListener.bind(events),
  localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v))},
  requestAnimationFrame:f=>{frames.set(++seq,f);return seq},cancelAnimationFrame:id=>frames.delete(id),setTimeout:(f,ms)=>{timers.set(++seq,{f,ms});return seq},clearTimeout:id=>timers.delete(id),
  Image:class{set src(v){this.url=v;pending.push(this)}},
  Z,ZIKIR,zItem:()=>ZIKIR[Z.cat]?.items[Z.idx],SukunSecretPolicy:{unlocked:()=>unlocked},currentZikirState:{snapshot:()=>source,subscribe:f=>listeners.push(f)}};
 c.window=c;const context=vm.createContext(c),run=s=>vm.runInContext(s,context,{timeout:1000}),load=id=>run(core.script(root,id));
 load('sukun-r833-visual-context');
 const $=id=>document.getElementById(id);
 let categoryClicks=0,listClicks=0;
 for(const b of document.querySelectorAll('#zCats button'))b.addEventListener('click',()=>{categoryClicks++;Z.cat=b.dataset.c;Z.idx=0;Z.count=0;$('zList').classList.add('compactOneRow')});
 $('zListToggle').addEventListener('click',()=>{listClicks++;$('zList').classList.toggle('compactOneRow')});
 return{document,c,dom,Z,ZIKIR,store,pending,frames,timers,$,load,run,context,unlock:v=>unlocked=v,source:v=>source=v,
  clicks:()=>({categoryClicks,listClicks}),notify:()=>listeners.forEach(f=>f()),
  frame(){const q=[...frames.values()];frames.clear();q.forEach(f=>f())},
  async image(suffix,ok=true){const im=pending.find(i=>i.url.includes(suffix));assert(im,'requested image '+suffix);ok?im.onload():im.onerror();await Promise.resolve();await Promise.resolve()},
  event(type){c.dispatchEvent(new dom.Event(type))}};
}
function place(f){
 const src=core.script(root,'r616-friendly-ui-runtime');
 f.c.$=f.$;f.c.q=(s,r=f.document)=>r.querySelector(s);f.c.r704Attr=(el,k,v)=>el.setAttribute(k,v);
 f.run(src.slice(src.indexOf('function fold('),src.indexOf('function zikirSnapshot(')));
 f.c.placeZikir();
}
const style=html.match(/<style id="sukun-r835-controls">([\s\S]*?)<\/style>/)[1];
const parsed=css.parse(style,{positions:true}),declarations=[];
// Rank scoped author-important declarations by specificity and source order.
// This is not browser layout/computed style: inheritance/UA rules are not modeled.
function specificity(n){
 if(n.type==='IdSelector')return 1e6;
 if(['AttributeSelector','ClassSelector'].includes(n.type))return 1e3;
 if(n.type==='TypeSelector')return n.name==='*'?0:1;
 if(n.type==='PseudoElementSelector')return 1;
 if(n.type==='PseudoClassSelector'){
  if(n.name==='where')return 0;
  if(['is','not','has'].includes(n.name))return Math.max(0,...n.children.toArray().map(specificity));
  return 1e3;
 }
 if(n.type==='SelectorList')return Math.max(0,...n.children.toArray().map(specificity));
 return n.children?n.children.toArray().reduce((sum,x)=>sum+specificity(x),0):0;
}
css.walk(parsed,{visit:'Rule',enter(rule){if(rule.prelude.type!=='SelectorList')return;
 rule.prelude.children.forEach(s=>{const sel=css.generate(s),weight=specificity(s);rule.block.children.forEach(d=>{if(d.type==='Declaration')declarations.push({sel,weight,order:declarations.length,prop:d.property,value:css.generate(d.value),important:d.important})})})}});
function rules(el,prop){const shorthand=prop.startsWith('background-')?'background':prop.startsWith('font-')?'font':null;return declarations.filter(d=>(d.prop===prop||d.prop===shorthand)&&!d.sel.includes('::')&&el.matches(d.sel)).sort((a,b)=>a.weight-b.weight||a.order-b.order)}
function finalRule(el,prop){return rules(el,prop).at(-1)?.value}
(async()=>{
 await test('Locked category fails closed; unlock alone does not style ordinary Esma',()=>{
  const f=fixture();f.Z.cat='berhet';assert.equal(f.c.SukunVisualContext.snapshot().mode,'generic');f.unlock(true);assert.equal(f.c.SukunVisualContext.snapshot().mode,'berhet');f.Z.cat='esma';assert.equal(f.c.SukunVisualContext.snapshot().mode,'generic');
 });
 await test('Unloaded indexes and throwing access provider cannot activate premium',()=>{
  const f=fixture();f.Z.cat='berhet';f.unlock(true);for(const i of [-1,28,.5,NaN]){f.Z.idx=i;assert(!f.c.SukunVisualContext.snapshot().berhet)}f.Z.idx=0;f.c.SukunSecretPolicy.unlocked=()=>{throw Error('initializing')};assert(!f.c.SukunVisualContext.snapshot().berhet);
 });
 await test('Favorite and active smart session resolve their actual source',()=>{
  const f=fixture();f.unlock(true);f.Z.cat='fav';assert.equal(f.c.SukunVisualContext.snapshot().index,9);assert(f.c.SukunVisualContext.snapshot().berhet);
  f.source({source:'smart',session:{active:true},cat:'esma',idx:1});assert.equal(f.c.SukunVisualContext.snapshot().mode,'generic');f.Z.cat='esma';f.source({source:'smart',session:{active:true},cat:'berhet',idx:9});assert(f.c.SukunVisualContext.snapshot().berhet);
 });
 await test('Hûtîrin automatically loads a packaged Süleyman scene and preserves count',async()=>{
  const f=fixture();f.unlock(true);f.Z.cat='berhet';f.Z.idx=9;f.load('sukun-r831-hard-fix-runtime');await f.image('berhetiyye-palace.png');
  assert.equal(f.document.documentElement.dataset.r835Theme,'berhet');assert.equal(f.document.documentElement.dataset.r832Scene,'palace');assert.equal(f.Z.count,19);
 });
 await test('All nine explicit backgrounds resolve; invalid choice returns to auto',async()=>{
  const f=fixture();f.unlock(true);f.Z.cat='berhet';f.load('sukun-r831-hard-fix-runtime');
  const a=f.c.SukunR832VisualAuthority;assert.equal(a.scenes.length,10);
  for(const sc of a.scenes.filter(x=>x.file)){assert(fs.existsSync(path.join(root,sc.file)));assert(a.setScene(sc.id));await f.image(sc.file);assert.equal(a.snapshot().scene,sc.id)}
  a.setScene('does-not-exist');await Promise.resolve();await Promise.resolve();assert.equal(f.store.get('sukun.berhet.background.r832'),'auto');
 });
 await test('Slow earlier scene cannot overwrite a newer selection',async()=>{
  const f=fixture();f.unlock(true);f.Z.cat='berhet';f.load('sukun-r831-hard-fix-runtime');const a=f.c.SukunR832VisualAuthority;
  a.setScene('water');a.setScene('night');await f.image('scene-07');assert.equal(a.snapshot().scene,'night');await f.image('scene-03');await f.image('berhetiyye-palace');assert.equal(a.snapshot().scene,'night');
 });
 await test('Relock and 99 Esma transition cancel pending premium paints',async()=>{
  const f=fixture();f.unlock(true);f.Z.cat='berhet';f.load('sukun-r831-hard-fix-runtime');const a=f.c.SukunR832VisualAuthority;
  f.Z.cat='esma';a.sync();await f.image('berhetiyye-palace');assert.equal(a.snapshot().bgmode,'generic');assert(!f.document.documentElement.style.getPropertyValue('--r832-berhet-bg'));
  f.Z.cat='berhet';a.setScene('wind');f.unlock(false);f.event('sukun:secretaccesschange');f.frame();await f.image('scene-04');assert.equal(a.snapshot().bgmode,'generic');assert.equal(a.setScene('night'),false);assert(f.document.documentElement.style.getPropertyValue('--r835-scene').includes('sukun-sanctuary-r717'));assert.equal(f.Z.count,19);
 });
 await test('Failed selected image displays fallback and can be retried',async()=>{
  const f=fixture();f.unlock(true);f.Z.cat='berhet';f.load('sukun-r831-hard-fix-runtime');const a=f.c.SukunR832VisualAuthority;a.setScene('staff');await f.image('scene-02',false);assert.equal(a.snapshot().scene,'palace');assert.equal(a.snapshot().error,'staff');
  a.setScene('staff');const requests=f.pending.filter(i=>i.url.includes('scene-02'));assert.equal(requests.length,2);requests[1].onload();await Promise.resolve();await Promise.resolve();assert.equal(a.snapshot().scene,'staff');
 });
 await test('Counter notifications do not issue repeated image downloads',async()=>{
  const f=fixture();f.unlock(true);f.Z.cat='berhet';f.load('sukun-r831-hard-fix-runtime');await f.image('berhetiyye-palace');const before=f.pending.length;
  for(let i=0;i<100;i++){f.notify();f.frame()}assert.equal(f.pending.length,before);
 });
 await test('Chooser contains every mapped scene and changes through its real control',async()=>{
  const f=fixture();f.unlock(true);f.Z.cat='berhet';f.load('sukun-r829-final-completion-runtime');f.load('sukun-r831-hard-fix-runtime');const a=f.c.SukunR832VisualAuthority,s=f.$('r829SceneSel');
  assert.equal(s.options.length,10);assert.equal(f.$('r829BerhetScenes').children.length,10);s.value='seal';s.dispatchEvent(new f.dom.Event('change',{bubbles:true}));await f.image('scene-06');assert.equal(a.snapshot().scene,'seal');
  f.unlock(false);a.sync();assert(f.$('r829BerhetSceneQuick').hidden);assert(f.$('r829BerhetSceneBox').hidden);
 });
 await test('Esma shortcut is always present; Berhetiyye appears only after unlock',()=>{
  const f=fixture();f.load('sukun-r835-shortcuts');const nav=f.$('r835ZikirShortcuts'),b=nav.querySelector('[data-zikir-list="berhet"]');assert(!nav.querySelector('[data-zikir-list="esma"]').hidden);assert(b.hidden);assert(!f.c.SukunR835Shortcuts.open('berhet'));assert.equal(f.clicks().categoryClicks,0);
  f.unlock(true);f.event('sukun:secretaccesschange');assert(!b.hidden);f.unlock(false);f.event('sukun:secretaccesschange');assert(b.hidden);
  f.c.SukunSecretPolicy.unlocked=()=>{throw Error('unavailable')};f.c.SukunR835Shortcuts.sync();assert(b.hidden);assert(!f.c.SukunR835Shortcuts.open('berhet'));
 });
 await test('Same-category shortcut expands list without resetting selection or counter',()=>{
  const f=fixture();place(f);f.Z.idx=1;f.load('sukun-r835-shortcuts');f.$('r835ZikirShortcuts').querySelector('[data-zikir-list="esma"]').click();assert(f.$('r616ZikirPicker').open);assert(!f.$('zList').classList.contains('compactOneRow'));assert.equal(f.Z.idx,1);assert.equal(f.Z.count,19);assert.deepEqual(f.clicks(),{categoryClicks:0,listClicks:1});
 });
 await test('Unlocked Berhetiyye shortcut uses the existing category click path once',()=>{
  const f=fixture();place(f);f.unlock(true);f.load('sukun-r835-shortcuts');f.$('r835ZikirShortcuts').querySelector('[data-zikir-list="berhet"]').click();assert.equal(f.Z.cat,'berhet');assert.equal(f.clicks().categoryClicks,1);assert(!f.$('zList').classList.contains('compactOneRow'));
 });
 await test('Original layout keeps tempo, target and options inside settings body',()=>{
  const f=fixture();place(f);const body=f.document.querySelector('.r679SettingsBody');assert(body.contains(f.$('tempoSld')));assert(body.contains(f.$('targetPremium')));assert(body.contains(f.$('option')));assert(f.$('r616ZikirSound').contains(f.$('zBar')));assert(f.$('r616ZikirTools').contains(f.$('zMegaHost')));
 });
 await test('Settings opens via visible button and restores the same live inputs on close',()=>{
  const f=fixture();place(f);f.load('sukun-r829-final-completion-runtime');f.load('sukun-r830-settings-runtime');const quick=f.$('r829QuickSettings').querySelector('.qOpen'),tempo=f.$('tempoSld');let inputs=0;tempo.addEventListener('input',()=>inputs++);quick.focus();quick.click();
  const d=f.$('r835SettingsDialog');assert(d.open);assert(d.contains(tempo));assert(d.contains(f.$('targetPremium')));assert(d.contains(f.$('option')));assert.equal(f.Z.count,19);
  f.c.placeZikir();assert(d.contains(tempo));assert(d.contains(f.$('option')));tempo.value='2.4';tempo.dispatchEvent(new f.dom.Event('input',{bubbles:true}));assert.equal(inputs,1);assert.equal(f.$('r829Tempo').value,'2.4');
  d.querySelector('header button').click();assert(!d.open);assert(f.$('r679ZikirAyarBox').contains(tempo));assert.equal(f.document.activeElement,quick);assert.equal(tempo.value,'2.4');
 });
 await test('Repeated settings bind/open creates one dialog and no duplicate controls',()=>{
  const f=fixture();place(f);f.load('sukun-r830-settings-runtime');const api=f.c.SukunR830SettingsFix;
  for(let i=0;i<5;i++){api.bind();f.$('r679ZikirAyarBox').querySelector('summary').click();assert(api.snapshot().settingsOpen);api.open();api.close()}
  assert.equal(f.document.querySelectorAll('#r835SettingsDialog').length,1);assert.equal(f.document.querySelectorAll('#tempoSld').length,1);assert.equal(f.Z.count,19);
 });
 await test('Escape with settings open preserves Tefekkür; plain Escape still exits',async()=>{
  const e=core.environment();let dialog=null;const original=e.document.querySelector;e.document.querySelector=s=>s==='dialog[open]'?dialog:original(s);core.load(e,root,'sukun-r530-tefekkur-mode-runtime');e.event(e.document,'DOMContentLoaded');e.timer(0);await e.c.SUKUN_TEFEKKUR.enter();dialog={};e.event(e.document,'keydown',{key:'Escape'});assert(e.c.SUKUN_TEFEKKUR.active());dialog=null;e.event(e.document,'keydown',{key:'Escape'});assert(!e.c.SUKUN_TEFEKKUR.active());
 });
 await test('Scoped CSS parses without recovery and important layer has no predecessor',()=>{
  let recovered=0;css.parse(style,{onParseError:()=>recovered++});assert.equal(recovered,0);assert.equal((html.match(/@layer\s+sukun-controls/g)||[]).length,1);assert.equal((html.match(/@layer\b/g)||[]).length,1);assert(declarations.every(d=>d.important));
 });
 await test('CSS matches generic 99 controls and premium controls in their own contexts',()=>{
  const f=fixture(),r=f.document.documentElement;r.dataset.r835Theme='generic';assert(finalRule(f.$('es99Start'),'background-image').includes('linear-gradient'));assert(finalRule(f.$('es99Stop'),'background-image').includes('linear-gradient'));assert(!finalRule(f.$('autoBtn'),'background-image').includes('url'));
  r.dataset.r835Theme='berhet';assert(!finalRule(f.$('es99Stop'),'background-image').includes('url'));assert(finalRule(f.$('bsStop'),'background-image').includes('control-exit.png'));assert(finalRule(f.$('bsStart'),'background-image').includes('btn-primary-wide.png'));assert(finalRule(f.$('autoBtn'),'background-image').includes('btn-primary-wide.png'));assert.equal(finalRule(f.$('plusBtn').querySelector('b'),'font'),'600 23px/1 system-ui');assert.equal(finalRule(f.$('plusBtn').querySelector('span'),'display'),'none');
  for(const mode of ['generic','berhet']){r.dataset.r835Theme=mode;assert.equal(finalRule(f.$('bsPause'),'display'),'none');assert.equal(finalRule(f.$('es99Pause'),'display'),'none');assert.equal(finalRule(f.$('bsStop'),'display'),'flex')}
 });
 await test('Collapsed player explicitly removes blur in both contexts',()=>{
  const f=fixture();for(const mode of ['generic','berhet']){f.document.documentElement.dataset.r835Theme=mode;const e=f.$('r433DockPeek');assert.equal(finalRule(e,'backdrop-filter'),'none');assert.equal(finalRule(e,'-webkit-backdrop-filter'),'none');assert.equal(finalRule(e,'box-shadow'),'none');assert(finalRule(e,'background').startsWith('transparent'))}
 });
 const out={kind:'DOM-and-source-contracts',browserRun:false,physicalDeviceRun:false,total:results.length,passed:results.filter(x=>x.status==='PASS').length,results};out.failed=out.total-out.passed;
 fs.writeFileSync(path.join(__dirname,'ui-results.json'),JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify(out,null,2));if(out.failed)process.exitCode=1;
})();
