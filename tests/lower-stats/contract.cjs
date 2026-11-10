'use strict';
// Production preference/UI module with a deliberately small DOM/storage seam.
// Pixel geometry and native browser interaction remain browser-suite obligations.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..');
const source=fs.readFileSync(path.join(root,'assets/runtime/lower-stats-r1236.js'),'utf8');
const css=fs.readFileSync(path.join(root,'css/lower-stats-r1236.css'),'utf8');
const wheelSource=fs.readFileSync(path.join(root,'assets/runtime/wheels-r924.js'),'utf8');
const layoutSource=fs.readFileSync(path.join(root,'assets/runtime/berhet-layout-r938.js'),'utf8');
const KEY='sukun.practice.tefStats.v2',LEGACY='sukun.practice.tefStats.v1';
const plain=value=>JSON.parse(JSON.stringify(value));
let passed=0,total=0;const failures=[];
function test(name,fn){total++;try{fn();passed++;console.log('PASS '+name)}catch(error){failures.push({name,message:error.message});console.error('FAIL '+name+'\n'+error.stack)}}
function fixture(options={}){
 const events={},storage=new Map(),writes=[];let renders=0;
 if(Object.hasOwn(options,'legacy'))storage.set(LEGACY,options.legacy);
 if(Object.hasOwn(options,'v2'))storage.set(KEY,typeof options.v2==='string'?options.v2:JSON.stringify(options.v2));
 let documentRoot;
 const doc={activeElement:null,getElementById:id=>documentRoot.querySelector('#'+id),createElement:tag=>new Node(tag)};
 class Node{
  constructor(tag='div',id=''){
   this.tagName=tag.toUpperCase();this.children=[];this.parentElement=null;this.dataset={};this.attributes=new Map();this.textContent='';this.value='';this.hidden=false;this.id=id;
   const properties=new Map();this.style={getPropertyValue:key=>properties.get(key)||'',setProperty:(key,value)=>properties.set(key,String(value)),removeProperty:key=>properties.delete(key)};
  }
  get id(){return this.attributes.get('id')||''}set id(value){if(value)this.attributes.set('id',value);else this.attributes.delete('id')}
  get isConnected(){return this===documentRoot||!!this.parentElement?.isConnected}
  get nextElementSibling(){if(!this.parentElement)return null;return this.parentElement.children[this.parentElement.children.indexOf(this)+1]||null}
  get lastElementChild(){return this.children.at(-1)||null}
  getAttribute(key){return this.attributes.has(key)?this.attributes.get(key):null}
  setAttribute(key,value){this.attributes.set(key,String(value))}
  removeAttribute(key){this.attributes.delete(key)}
  set innerHTML(value){
   this.html=value;for(const child of this.children)child.parentElement=null;this.children=[];
   const stack=[this];
   for(const match of value.matchAll(/<\/?([a-z][\w-]*)([^>]*)>/gi)){
    const [token,tag,attributes]=match;if(token.startsWith('</')){stack.pop();continue}
    const node=new Node(tag);for(const attr of attributes.matchAll(/([\w:-]+)(?:="([^"]*)")?/g))node.setAttribute(attr[1],attr[2]||'');
    stack.at(-1).append(node);if(!token.endsWith('/>')&&!['input','br','img','hr','meta','link'].includes(tag.toLowerCase()))stack.push(node);
   }
  }
  matches(selector){return selector.startsWith('#')?this.id===selector.slice(1):selector.startsWith('.')?(this.getAttribute('class')||'').split(/\s+/).includes(selector.slice(1)):this.tagName===selector.toUpperCase()}
  querySelectorAll(selector){const found=[];for(const child of this.children){if(child.matches(selector))found.push(child);found.push(...child.querySelectorAll(selector))}return found}
  querySelector(selector){return this.querySelectorAll(selector)[0]||null}
  append(...nodes){for(const node of nodes){node.remove();node.parentElement=this;this.children.push(node)}}
  insertBefore(node,reference){if(!reference){this.append(node);return}assert.equal(reference.parentElement,this,'insertBefore reference belongs to parent');if(node===reference)return;node.remove();this.children.splice(this.children.indexOf(reference),0,node);node.parentElement=this}
  remove(){if(this.parentElement)this.parentElement.children=this.parentElement.children.filter(child=>child!==this);this.parentElement=null}
  contains(node){return !!node&&(node===this||this.children.some(child=>child.contains(node)))}
  focus(){for(let node=this;node;node=node.parentElement)if(node.hidden)return;if(this.isConnected)doc.activeElement=this}
 }
 documentRoot=new Node('body');
 const host=new Node('section','r920Practice'),hero=new Node('div','r938Hero'),stats=new Node(),optionsNode=new Node('details','r920ViewOptions');stats.setAttribute('class','r920Stats');
 const targetCard=new Node('span'),remainCard=new Node('span'),target=new Node('b','r920Target'),remain=new Node('b','r920Remaining');
 const exit=new Node('button','r920TefExit'),editor=new Node('div','r1227CountEntry'),editorInput=new Node('input','r1227CountValue'),toggle=new Node('button','r1056FocusControlsToggle');
 documentRoot.append(host);host.append(hero,optionsNode,editor,toggle);hero.append(stats);targetCard.append(target);remainCard.append(remain);stats.append(targetCard,remainCard,exit);editor.append(editorInput);
 host.dataset.r1056FocusControls=options.controls===false?'hidden':'shown';
 const win={I18N:{lang:'tr'},SukunCountEntry:{render(){renders++}},addEventListener:(name,fn)=>events[name]=fn};
 vm.runInNewContext(source,{window:win,document:doc,localStorage:{getItem:key=>{if(options.readDenied)throw Error('storage read denied');return storage.has(key)?storage.get(key):null},setItem:(key,value)=>{if(options.writeDenied)throw Error('storage write denied');writes.push([key,value]);storage.set(key,value)}}});
 const api=win.SukunLowerStats,$=id=>doc.getElementById(id);
 const sync=(tef=true)=>api.sync(host,tef);
 const controls=value=>{host.dataset.r1056FocusControls=value?'shown':'hidden';api.syncControls(value)};
 return {api,host,hero,stats,options:optionsNode,editor,editorInput,target,remain,exit,toggle,doc,$,documentRoot,win,storage,writes,events,sync,controls,renders:()=>renders};
}
test('automatic sizing switches between ordinary and reflection',()=>{const f=fixture();f.sync(false);assert.equal(f.host.dataset.r1236Stats,'normal');f.sync(true);assert.equal(f.host.dataset.r1236Stats,'compact');assert.equal(f.api.snapshot().automatic,true);f.sync(false);assert.equal(f.host.dataset.r1236Stats,'normal')});
test('single easy-control owner hides duplicate cards only in reflection',()=>{const f=fixture({controls:false});f.sync(false);assert.equal(f.api.hidden(),false);f.sync(true);assert.equal(f.api.hidden(),true);assert.equal(f.host.dataset.r1236Stats,'hidden');f.controls(true);assert.equal(f.api.hidden(),false);assert.equal(f.host.dataset.r1236Stats,'compact');f.controls(false);f.sync(false);assert.equal(f.host.dataset.r1236Stats,'normal')});
test('legacy size and eye values are ignored but retained for rollback',()=>{for(const legacy of ['normal','compact','hidden'])for(const v2 of ['bad',{size:0,visible:false},{size:100,visible:true}]){const f=fixture({legacy,v2});const before=[...f.storage];f.sync();assert.equal(f.host.dataset.r1236Stats,'compact');f.controls(false);f.controls(true);assert.deepEqual([...f.storage],before);assert.equal(f.writes.length,0)}});
test('storage unavailable never blocks automatic mode',()=>{const f=fixture({readDenied:true,writeDenied:true});f.sync();f.controls(false);assert.equal(f.api.hidden(),true);f.controls(true);assert.equal(f.api.hidden(),false);assert.equal(f.writes.length,0)});
test('no slider, eye, substitute control or preference setters are created',()=>{const f=fixture();for(let i=0;i<5;i++){f.sync(i%2===0);f.controls(i%2===0)}for(const id of ['r1237StatsControls','r1237StatsSize','r1237StatsEye','r1237StatsSmaller','r1237StatsLarger'])assert.equal(f.$(id),null);assert.equal(f.api.setSize,undefined);assert.equal(f.api.setVisible,undefined);assert.equal(f.api.focusTarget(),f.toggle);assert.equal(f.writes.length,0)});
test('hiding focused cards or editor transfers focus to the single toggle',()=>{const f=fixture();f.sync();for(const target of [f.target,f.remain,f.editorInput]){f.controls(true);target.focus();f.controls(false);assert.equal(f.doc.activeElement,f.toggle);assert.equal(f.api.focusTarget(),f.toggle)}});
test('unrelated exit focus survives hide/show and remains independent',()=>{const f=fixture();f.sync();f.exit.focus();for(const state of [false,true,false]){f.controls(state);assert.equal(f.doc.activeElement,f.exit);assert.equal(f.exit.hidden,false)}});
test('repeated sync does not render editor or write storage unnecessarily',()=>{const f=fixture();f.sync();const renders=f.renders();for(let i=0;i<20;i++){f.sync();f.controls(true)}assert.equal(f.renders(),renders);f.controls(false);assert.equal(f.renders(),renders+1);f.controls(false);assert.equal(f.renders(),renders+1);f.controls(true);assert.equal(f.renders(),renders+2);assert.equal(f.writes.length,0)});
test('teardown restores clean presentation and does not remove native nodes',()=>{const f=fixture();f.sync();f.controls(false);f.api.beforeRestore({});assert.equal(f.api.hidden(),true);f.api.beforeRestore(f.host);assert.equal(f.api.hidden(),false);assert.equal(f.host.dataset.r1236Stats,undefined);assert.equal(f.target.parentElement.parentElement,f.stats);assert.equal(f.exit.parentElement,f.stats);f.controls(true);f.sync();assert.equal(f.host.dataset.r1236Stats,'compact')});
test('automatic CSS retains black diamond and count touch targets',()=>{assert.match(css,/border-image:var\(--sukun-gem-dark\) 210 540 fill/);assert.match(css,/width:min\(100%,clamp\(288px,65vw,340px\)\)/);assert.match(css,/data-r1236-stats="compact"/);assert.match(css,/\.r920Stats>span>b\s*\{[^}]*min-height:44px!important/);assert.match(css,/data-r1236-stats="hidden"[^}]+\.r920Stats>span\s*\{display:none!important/);assert(!/r1237Stats|r1237-stats-size|transform:scale/.test(css));assert(!/#r924WheelFrame|#r920Counter|#wheelTargetUX|#wheelRemainingUX/.test(css));assert.match(css,/forced-colors:active/)});
test('existing exit is outside the hidden cards',()=>{assert.match(css,/\.r920Stats>#r920TefExit:not\(\[hidden\]\)\s*\{[^}]*grid-column:1\/-1!important;grid-row:auto!important/);assert.match(layoutSource,/exit.nextElementSibling!==focusToggle/)});
test('one disclosure and original editor focus fallback remain',()=>{assert.match(layoutSource,/aria-controls','r1056PrimaryControls r1056FinishRow r968ManualHint r920Target r920Remaining'/);assert.match(layoutSource,/window\.SukunLowerStats\?\.syncControls\?\.\(visible\);window\.SukunCountEntry\?\.render\?\.\(\)/);assert.match(wheelSource,/const hidden=controls\?\.focusControlsVisible===false\|\|!!window.SukunLowerStats\?\.hidden\?\.\(\)/);assert.equal((wheelSource.match(/SukunLowerStats\?\.focusTarget\?\.\(\)/g)||[]).length,3)});
test('complete wheel renderer bytes remain unchanged',()=>{const renderer=wheelSource.split('/* r1227: compact silent remaining entry.')[0];assert.equal(crypto.createHash('sha256').update(renderer).digest('hex'),'a78d4c2c4db94611ea410c967a3e15dbb8393f1c8e04addeb5499a2baa5c19fb')});
console.log(JSON.stringify({passed,total,failures,scope:'Automatic lower-statistics production module with controlled DOM; no pixel or full-release claim.'}));if(failures.length)process.exitCode=1;
