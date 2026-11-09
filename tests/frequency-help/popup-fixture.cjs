'use strict';
// Actual popup owner, with the focus/scroll order recorded by native Chromium.
// No animation-time waits or replacements of production popup handlers.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
function verifyPopup(html){
 const nodes=new Map(),windowEvents=new Map(),documentEvents=new Map(),writes=[];
 const doc={activeElement:null,querySelectorAll(selector){return selector==='.qb[data-h]'?[...nodes.values()].filter(n=>n.dataset.h):[]},addEventListener(name,fn){if(!documentEvents.has(name))documentEvents.set(name,[]);documentEvents.get(name).push(fn)}};
 function element(id){
  if(nodes.has(id))return nodes.get(id);
  const attrs=new Map(),classes=new Set(),node={id,dataset:{},style:{},hidden:true,isConnected:true,innerHTML:'',offsetWidth:264,offsetHeight:176,rect:{left:27,top:1191.515625,bottom:1212.515625,width:21},setAttribute(k,v){attrs.set(k,String(v))},getAttribute(k){return attrs.get(k)||null},getBoundingClientRect(){return this.rect},focus(){doc.activeElement=this},closest(selector){return selector==='.qb'&&this.dataset.h?this:null},classList:{add(k){classes.add(k)},remove(k){classes.delete(k)},contains(k){return classes.has(k)},toggle(k,on){if(on)classes.add(k);else classes.delete(k)}}};
  nodes.set(id,node);return node;
 }
 const c={window:null,document:doc,I18N:{lang:'tr'},S:{get:()=>false,set(...args){writes.push(args)}},$:selector=>element(selector.slice(1)),addEventListener(name,fn){if(!windowEvents.has(name))windowEvents.set(name,[]);windowEvents.get(name).push(fn)},requestAnimationFrame:fn=>fn(),innerWidth:393,innerHeight:1000,clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),FR:{playing:false,carrier:174},FR2:{on:false}};c.window=c;
 const pink=element('frequency-question-5');pink.dataset.h='pink';pink.focus();
 const start=html.indexOf('const Q_HINTS='),end=html.indexOf('/* ── Sarmalayıcılar ── */',start);assert(start>=0&&end>start,'Production popup owner is present');
 vm.createContext(c);vm.runInContext(html.slice(start,end),c);
 const dispatch=(events,name,event={})=>{assert(events.has(name),'Registered '+name+' owner');for(const fn of events.get(name))fn(event)};
 const click=target=>{let prevented=false;dispatch(documentEvents,'click',{target,preventDefault(){prevented=true},stopPropagation(){}});return prevented};
 const bubble=element('qBubble'),text=element('qBubbleText'),snapshots=[];
 const before=JSON.stringify({fr:c.FR,fr2:c.FR2,writes});
 function assertOpen(stage){
  const snapshot={stage,key:vm.runInContext('qOpenKey',c),expanded:pink.getAttribute('aria-expanded'),hidden:bubble.hidden,shown:bubble.classList.contains('show'),top:Number.parseFloat(bubble.style.top)};snapshots.push(snapshot);
  assert.equal(snapshot.key,'pink',stage+': the focused question must survive scrolling');assert.equal(snapshot.expanded,'true',stage);assert.equal(snapshot.hidden,false,stage);assert.equal(snapshot.shown,true,stage);
  assert(snapshot.top>=8&&snapshot.top+bubble.offsetHeight<=c.innerHeight-8,stage+': popup fits viewport while its anchor moves');
 }
 assert(click(pink),'Native button activation is handled');
 // CI: Enter opens while the focused button is below the viewport. Smooth
 // focus scrolling then emits several scroll events before reaching its target.
 for(const top of [1132.515625,720.515625,545.515625]){pink.rect={...pink.rect,top,bottom:top+21};dispatch(windowEvents,'scroll');assertOpen('focus-scroll-'+top)}
 for(const lang of ['en','tr']){
  c.I18N.lang=lang;dispatch(windowEvents,'sukun:languagechange');dispatch(windowEvents,'scroll');assertOpen('language-'+lang);
  assert.equal(text.innerHTML,vm.runInContext('Q_HINTS.pink.'+lang,c));assert(pink.getAttribute('aria-label').includes(lang==='en'?'explanation':'açıklaması'));
 }
 let prevented=false;dispatch(documentEvents,'keydown',{key:'Escape',preventDefault(){prevented=true}});assert(prevented);assert.equal(bubble.hidden,true);assert.equal(pink.getAttribute('aria-expanded'),'false');assert.equal(doc.activeElement,pink);
 click(pink);assertOpen('reopen');click(pink);assert.equal(bubble.hidden,true,'Same question dismisses');
 click(pink);click({closest(){return null}});assert.equal(bubble.hidden,true,'Outside click dismisses');assert.equal(pink.getAttribute('aria-expanded'),'false');
 assert.equal(JSON.stringify({fr:c.FR,fr2:c.FR2,writes}),before,'Popup interactions do not touch audio state or storage');
 return{scrollEvents:5,languageRoundTrip:true,explicitDismissalsPreserved:true,audioAndStorageUnchanged:true,snapshots};
}
module.exports={verifyPopup};
if(require.main===module)console.log(JSON.stringify(verifyPopup(fs.readFileSync(process.argv[2]||'index.html','utf8')),null,2));
