'use strict';
const path=require('node:path'),fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {fixture}=require('../r1056/ui-controls-fixture.cjs');
const app=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const visible=n=>{for(;n;n=n.parentElement)if(n.hidden)return false;return true};
for(const mode of ['esma','berhet']){
 const f=fixture(app),play=f.$('r920Play'),tef=f.$('r920TefEnter');
 const restart=f.add('r920JourneyRestartAll',f.$('nav'),'button');
 f.reading();f.sync(mode,false);
 assert.equal(f.window.SukunBerhetLayout.snapshot().focusControlsVisible,false,'new install has only native wheel transport');
 assert.equal(f.$('r1056PrimaryControls').hidden,true);
 assert(visible(tef),'contemplation entry outside closed settings');
 assert(visible(f.$('r1056ReadingSource')),'audio source survives minimal controls');
 assert(!visible(restart),'restart follows the single easy-control disclosure');
 assert.equal(f.$('r920Play'),play,'native transport identity retained');
 f.window.SukunBerhetLayout.setFocusControls(true);f.$('r932EasyPlay').click();
 assert.equal(f.commands.length,1,'native delegated quick play has exactly one command');
 f.$('r1056ReadingSource').focus();f.window.SukunBerhetLayout.setFocusControls(false);
 assert.equal(f.document.activeElement,f.$('r1056ReadingSource'),'visible source retains focus');
 const count=f.commands.length;for(const focus of [true,false,true,false])f.sync(mode,focus);
 assert.equal(f.commands.length,count,'layout transitions never transport audio');
 f.root.hidden=true;f.window.SukunBerhetLayout.sync(f.root,false);f.root.hidden=false;f.sync(mode,false);
 assert.equal(f.$('r920Play'),play);assert.equal(f.$('r920TefEnter'),tef);assert(visible(tef));
 for(const preference of ['0','1']){const saved=fixture(app,{preference});saved.sync(mode,false);assert.equal(saved.$('r1056PrimaryControls').hidden,preference==='0','saved easy-control choice preserved');}
}
const f=fixture(app),nav=f.add('r616BottomNav',f.document.body,'nav'),pathNode=f.add('path',f.root,'div','r920Path');
f.document.body.classList.add('r616-ui');
f.add('journeys',nav,'button').setAttribute('data-r616-view','journeys');
const media={matches:true,addEventListener(){}};let savedState='idle',savedAt=0,openCount=0;
f.window.SukunProgressJournal={snapshot:()=>({saveState:savedState,savedAt})};
f.window.SukunDiscoveryR1158={open:key=>{assert.equal(key,'okumalar');openCount++}};
f.document.addEventListener=()=>{};
f.context.matchMedia=()=>media;f.context.requestAnimationFrame=()=>1;f.context.cancelAnimationFrame=()=>{};
f.context.ZIKIR={esma:{items:[{t:'Rahmân'},{t:'Rahîm'}]}};
f.state.activeIndex=0;f.state.journeyKind='99';f.sync('esma',false);
vm.runInContext(fs.readFileSync(path.join(app,'assets/runtime/premium-layout-r1215.js'),'utf8'),f.context);
f.window.SukunPremiumLayout.sync(f.root,false);
// Instrument actual DOM mutation surfaces, including no-op property writes:
// browsers may notify observers even when an attribute is assigned its old value.
let mutations=0;const tracked=new WeakSet();
function trackTree(node){
 if(!tracked.has(node)){
  tracked.add(node);
  for(const property of ['hidden','title']){let value=node[property];Object.defineProperty(node,property,{configurable:true,get:()=>value,set(next){mutations++;value=next}});}
  node.dataset=new Proxy(node.dataset,{set(target,key,value){mutations++;target[key]=value;return true}});
 }
 for(const child of node.children)trackTree(child);
}
const proto=Object.getPrototypeOf(f.root),textDescriptor=Object.getOwnPropertyDescriptor(proto,'textContent');
Object.defineProperty(proto,'textContent',{...textDescriptor,set(value){mutations++;textDescriptor.set.call(this,value)}});
const addClass=f.document.body.classList.add;f.document.body.classList.add=(...args)=>{mutations++;addClass(...args)};
function assertStableSync(label){
 trackTree(f.document.root);mutations=0;f.attributeWrites.length=0;
 for(let i=0;i<100;i++)f.window.SukunPremiumLayout.sync(f.root,false);
 assert.equal(mutations,0,label+': unchanged render causes no DOM property/text/dataset writes');
 assert.deepEqual(f.attributeWrites,[],label+': unchanged render causes no attribute writes');
}
assertStableSync('desktop');
const originalTitle=f.$('r1215ContextTitle').textContent;
f.root.dataset.r1211State='unavailable';f.state.journeyKind='single';
f.window.SukunPremiumLayout.sync(f.root,false);
assert.equal(f.$('r1215ContextTitle').textContent,originalTitle,'unavailable state does not repaint stale context');
delete f.root.dataset.r1211State;f.state.journeyKind='99';

const entry=f.$('r1215ReadingsEntry');assert.equal(entry.parentElement,nav);entry.click();assert.equal(openCount,1);
assert.equal(f.$('r1215NextName').textContent,'Rahîm');
assert.equal(f.$('r1215SaveState').textContent,'İlerleme bu cihazda saklanır','no fabricated saved badge before confirmed write');
savedState='pending';f.window.dispatchEvent(new f.Event('sukun:progressjournalstatus'));assert.equal(f.$('r1215SaveState').textContent,'Kaydediliyor…');
savedState='saved';savedAt=Date.now();f.window.dispatchEvent(new f.Event('sukun:progressjournalstatus'));assert.equal(f.$('r1215SaveState').textContent,'Bu cihazda kaydedildi');
savedState='error';f.window.dispatchEvent(new f.Event('sukun:progressjournalstatus'));assert.match(f.$('r1215SaveState').textContent,/Kaydedilemedi/);
media.matches=false;f.window.SukunPremiumLayout.sync(f.root,false);assert.equal(entry.parentElement,pathNode,'same reading button relocates at breakpoint');entry.click();assert.equal(openCount,2,'one owner after relocation');assertStableSync('mobile');
assert.equal(f.commands.length,0,'context rendering issues no playback or count commands');
f.state.activeMode='berhet';f.window.SukunSecretPolicy={unlocked:()=>false};f.window.SukunPremiumLayout.sync(f.root,false);assert.equal(f.$('r1215NextCard').hidden,true,'locked private names are not exposed');
// A saved Classic layout has no friendly nav and must still receive the
// shared materials/context without manufacturing navigation or changing mode.
nav.remove();f.document.body.classList.remove('r616-ui','r1215-premium');
f.window.SukunPremiumLayout.sync(f.root,false);
assert(f.document.body.classList.contains('r1215-premium'),'Classic receives premium surfaces');
assert(!f.document.body.classList.contains('r616-ui'),'Classic preference remains unchanged');
assert.equal(f.$('r1215ReadingsEntry'),null,'Classic retains its original section reading entry');
assert(f.$('r1215PracticeContext').isConnected,'Classic retains contextual session panel');assertStableSync('Classic');
assert.equal(f.commands.length,0);
// Exercise the real layout owners together. A second owner reparenting the
// same summary/exit would continually trigger subtree observers, even if the
// premium module itself was idempotent.
f.document.readyState='loading';
f.reading();f.add('r986Total');
vm.runInContext(fs.readFileSync(path.join(app,'assets/runtime/compact-ui-r1057.js'),'utf8'),f.context);
let structuralWrites=0;
for(const name of ['append','insertBefore','remove']){
 const original=proto[name];
 proto[name]=function(...args){
  if(name!=='remove'||this.parentElement)structuralWrites++;
  return original.apply(this,args);
 };
}
for(const tef of [false,true,false]){
 f.state.activeMode='esma';f.root.dataset.mode='esma';
 f.window.SukunBerhetLayout.sync(f.root,tef);trackTree(f.document.root);
 mutations=structuralWrites=0;f.attributeWrites.length=0;
 for(let i=0;i<100;i++)f.window.SukunBerhetLayout.sync(f.root,tef);
 assert.equal(mutations,0,'canonical + compact + premium stable state has no repeated DOM property writes');
 assert.equal(structuralWrites,0,'canonical + compact + premium do not fight over node placement');
 assert.deepEqual(f.attributeWrites,[],'canonical + compact + premium have no repeated attribute writes');
}
const css=fs.readFileSync(path.join(app,'css/premium-layout-r1215.css'),'utf8');
assert(css.includes('body.r1215-premium.r616-ui:not(.sukun-tefekkur-mode):not(:has(#tk:not([hidden])))>.wrap'),'sidebar space scoped to friendly shell');
assert(css.includes('body.r1215-premium.r616-ui:has(#r616BottomNav) #r986Sections'),'Classic native section access retained');
assert(css.includes('#r920Practice[data-r1211-state="unavailable"]>:not(#r1211PracticeUnavailable)'),'unavailable state suppresses all stale practice children');
assert(css.includes('#r920Practice [hidden] {display:none!important}'),'semantic hidden elements cannot be reopened by premium paint');
console.log('PASS r1215 premium: native controls, saved preferences, focus/restore, responsive reading entry, truthful save states, no playback mutation');
