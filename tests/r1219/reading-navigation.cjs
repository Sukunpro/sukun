'use strict';
// Real premium entry, delegated sidebar, discovery route and disclosure opener.
// Controlled DOM/timers/session endpoints reproduce the ancestor selector race.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const {fixture}=require('../r1056/ui-controls-fixture.cjs');
const app=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const html=fs.readFileSync(path.join(app,'nero.html'),'utf8');
const discovery=html.match(/<script id="sukun-r1158-discovery">([\s\S]*?)<\/script>/)?.[1];
const navigation=html.match(/\$\('r616BottomNav'\)\?\.addEventListener\('click',e=>\{[\s\S]*?\n  \}\);/)?.[0];
const practice=fs.readFileSync(path.join(app,'assets/runtime/interface-r920.js'),'utf8');
const sections=practice.slice(practice.indexOf('const sectionIds=new Set('),practice.indexOf('function mountSectionAccess(){'));
assert(discovery&&navigation&&sections.includes('function openSection('),'production boundaries exist');

function setup(desktop=true){
 const f=fixture(app),timers=[],frames=[],routes=[],reveals=[],sectionEvents=[];
 class CustomEvent extends f.Event {constructor(type,options={}){super(type,options);this.detail=options.detail??null}}
 f.context.CustomEvent=CustomEvent;f.window.CustomEvent=CustomEvent;
 f.window.addEventListener('sukun:practicesectionchange',event=>sectionEvents.push(event.detail.id));
 const proto=Object.getPrototypeOf(f.root),matches=proto.matches,query=proto.querySelector;
 proto.matches=function(selector){
  const attr=selector.match(/^\[([\w-]+)\]$/);if(attr)return this.getAttribute(attr[1])!==null;
  if(selector==='.tab[data-t="zkr"]')return this.classList.contains('tab')&&this.dataset.t==='zkr';
  return matches.call(this,selector);
 };
 proto.querySelector=function(selector){return selector===':scope > summary'?this.children.find(n=>n.tagName==='SUMMARY')||null:query.call(this,selector)};
 f.document.querySelector=selector=>f.document.root.querySelector(selector);
 f.document.addEventListener=()=>{};
 f.document.body.classList.add('r616-ui');f.document.body.setAttribute('data-r616-view','home');
 const nav=f.add('r616BottomNav',f.document.body,'nav');
 const home=f.add('home',nav,'button');home.setAttribute('data-r616-view','home');
 const journey=f.add('journeys',nav,'button');journey.setAttribute('data-r616-view','journeys');
 const tab=f.add('tab-zkr',f.document.body,'section');tab.hidden=true;tab.append(f.root);
 const tools=f.add('r616ZikirTools',tab,'details');tools.open=false;
 const readings=f.add('zmgOkumalar',tools,'details');readings.open=false;
 const summary=f.add('reading-summary',readings,'summary');
 const pathNode=f.add('path',f.root,'div','r920Path');
 let interaction=0;
 const go=view=>{routes.push(view);interaction++;f.document.body.dataset.r616View=view;tab.hidden=view!=='zikir';return true};
 f.window.SukunFriendlyUI={go};f.context.go=go;
 f.window.SukunViewportPolicy={captureNavigation:()=>({interaction}),navigationCurrent:t=>t.interaction===interaction};
 f.window.SukunNavigationR1066={reveal:(target,options)=>{reveals.push(target.id);options.focus?.focus();return true}};
 f.context.setTimeout=fn=>{timers.push(fn);return timers.length};
 f.context.requestAnimationFrame=fn=>{frames.push(fn);return frames.length};f.context.cancelAnimationFrame=()=>{};
 const media={matches:desktop,addEventListener(){}};f.context.matchMedia=()=>media;
 vm.runInContext(sections+'\nwindow.SukunPracticeUI.openSection=openSection;',f.context);
 vm.runInContext(navigation,f.context);
 vm.runInContext(discovery,f.context);
 vm.runInContext(fs.readFileSync(path.join(app,'assets/runtime/premium-layout-r1215.js'),'utf8'),f.context);
 f.window.SukunPremiumLayout.sync();
 const entry=f.$('r1215ReadingsEntry');assert(entry);
 const flush=()=>{for(let turns=0;timers.length||frames.length;turns++){assert(turns<100,'bounded timers');while(timers.length)timers.shift()();while(frames.length)frames.shift()()}};
 return {...f,entry,nav,home,journey,tools,readings,summary,tab,pathNode,media,routes,reveals,sectionEvents,flush,newInput:()=>interaction++};
}

for(const desktop of [true,false]){
 const f=setup(desktop);assert.equal(f.entry.parentElement,desktop?f.nav:f.pathNode);
 // Click the label, as a pointer/touch activation does, not only the button node.
 f.entry.querySelector('span').click();f.flush();
 assert.equal(f.tools.open,true,'Okumalar opens enclosing tools');
 assert.equal(f.readings.open,true,'Okumalar expands its destination');
 assert.equal(f.document.activeElement,f.summary,'reader heading receives focus');
 assert.deepEqual(f.routes,['zikir'],'one activation has exactly one route owner');
 assert.deepEqual(f.reveals,['zmgOkumalar']);
 assert.deepEqual(f.sectionEvents,['zmgOkumalar'],'successful reveal publishes the section identity');
 assert.equal(f.entry.getAttribute('aria-current'),'page','readings owns active navigation');
 assert(f.document.body.classList.contains('r920-details-open'));
 f.home.click();f.flush();assert.equal(f.tab.hidden,true,'ordinary sidebar navigation still works');
 f.entry.click();f.flush();assert.equal(f.tab.hidden,false,'repeated reading entry works');
 assert.equal(f.commands.length,0,'navigation never changes playback or count');
}
{
 const f=setup();f.entry.click();f.home.click();f.flush();
 assert.deepEqual(f.sectionEvents,[],'cancelled reveal publishes no section identity');
 assert.equal(f.tab.hidden,true);assert.equal(f.readings.open,false);assert.deepEqual(f.reveals,[],'new navigation cancels pending reveal');
}
{
 const f=setup();f.entry.click();f.newInput();f.flush();
 assert.equal(f.readings.open,false,'a later user gesture retains scroll ownership');
}
{
 const f=setup();f.tools.hidden=true;f.entry.click();f.flush();
 assert.equal(f.readings.open,false,'navigation does not expose intentionally hidden content');
}
{
 const f=setup();f.document.body.classList.add('sukun-tefekkur-mode');f.entry.click();f.flush();
 assert.deepEqual(f.routes,[],'blocked reading entry cannot fall through into body route');
 assert.equal(f.readings.open,false);
}
console.log('PASS r1219: desktop/mobile readings, one route owner, nested disclosures, focus, repeat entry, user cancellation and no playback changes');
