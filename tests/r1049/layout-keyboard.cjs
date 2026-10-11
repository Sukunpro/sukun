'use strict';
// Actual shipped layout-picker code; minimal DOM and deterministic focus/timers.
// No full-page rendering, native pointer delivery, physical mobile or audio claim.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const match=html.match(/<script id="r618-layout-modes-runtime">([\s\S]*?)<\/script>/);assert(match,'real layout controller exists');
function fixture(mode='classic'){
 let document,at=0,serial=0;const jobs=new Map(),writes=[],reloads=[],calls={sync:0,repair:0,stop:0,closeTools:0};
 class Element{
  constructor(tag='div'){this.tagName=tag.toUpperCase();this.attrs={};this.dataset={};this.children=[];this.parentElement=null;this.hidden=false;this.disabled=false;this.tabIndex=0;this.listeners={};this.style={};this._text='';const classes=new Set();this.classList={add:(...v)=>v.forEach(x=>classes.add(x)),remove:(...v)=>v.forEach(x=>classes.delete(x)),contains:x=>classes.has(x),toggle:(x,v)=>{const n=v??!classes.has(x);n?classes.add(x):classes.delete(x);return n;}};this._classes=classes;}
  get id(){return this.attrs.id||''}set id(v){this.attrs.id=v}
  set className(v){this.attrs.class=v;this._classes.clear();for(const x of String(v).split(/\s+/))if(x)this._classes.add(x)}get className(){return [...this._classes].join(' ')}
  get isConnected(){return this===document.documentElement||!!this.parentElement?.isConnected}
  setAttribute(k,v){this.attrs[k]=String(v);if(k==='class')this.className=v;if(k==='hidden')this.hidden=true;if(k==='disabled')this.disabled=true;if(k==='tabindex')this.tabIndex=Number(v);if(k.startsWith('data-'))this.dataset[k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=String(v)}
  getAttribute(k){return this.attrs[k]??null}
  append(...nodes){for(const n of nodes){n.remove();this.children.push(n);n.parentElement=this;}}appendChild(n){this.append(n);return n}
  remove(){if(this.parentElement){this.parentElement.children.splice(this.parentElement.children.indexOf(this),1);this.parentElement=null}}
  insertAdjacentElement(position,n){assert.equal(position,'afterend');const p=this.parentElement,i=p.children.indexOf(this);n.remove();p.children.splice(i+1,0,n);n.parentElement=p;}
  matches(q){q=q.trim();let ok=true;q=q.replace(/:not\(\[([^\]]+)\]\)/g,(_,a)=>{const m=a.match(/^([^=]+)(?:="([^"]*)")?$/),key=m[1],value=m[2],present=key==='disabled'?this.disabled:key==='hidden'?this.hidden:key in this.attrs;if(present&&(value===undefined||String(key==='tabindex'?this.tabIndex:this.attrs[key])===value))ok=false;return ''});if(!ok)return false;const tag=q.match(/^[a-z]+/i);if(tag&&this.tagName!==tag[0].toUpperCase())return false;const id=q.match(/#([\w-]+)/);if(id&&this.id!==id[1])return false;for(const m of q.matchAll(/\.([\w-]+)/g))if(!this.classList.contains(m[1]))return false;for(const m of q.matchAll(/\[([\w-]+)(?:="([^\"]*)")?\]/g)){const key=m[1],value=m[2],got=key==='hidden'?(this.hidden?'':null):key==='disabled'?(this.disabled?'':null):this.getAttribute(key);if(value===undefined?got===null:got!==value)return false;}return true;}
  closest(q){return q.split(',').some(s=>this.matches(s))?this:this.parentElement?.closest(q)||null}
  contains(n){return this===n||this.children.some(c=>c.contains(n))}
  querySelectorAll(q){return this.children.flatMap(n=>[...(q.split(',').some(s=>n.matches(s))?[n]:[]),...n.querySelectorAll(q)])}
  querySelector(q){return this.querySelectorAll(q)[0]||null}
  set textContent(v){this._text=String(v);for(const n of [...this.children])n.remove()}get textContent(){return this._text+this.children.map(n=>n.textContent).join('')}
  set innerHTML(v){for(const n of [...this.children])n.remove();this._text='';const stack=[this];for(const m of String(v).matchAll(/<\/?([a-z][\w-]*)\b([^>]*)>/gi)){if(m[0][1]==='/'){if(stack.length>1)stack.pop();continue}const n=new Element(m[1]);for(const a of m[2].matchAll(/([\w-]+)(?:="([^"]*)")?/g))n.setAttribute(a[1],a[2]??'');stack.at(-1).append(n);if(!['INPUT','BR','IMG'].includes(n.tagName))stack.push(n)}}
  addEventListener(t,f){(this.listeners[t]??=[]).push(f)}
  dispatchEvent(e){e.target??=this;for(const f of this.listeners[e.type]||[])f.call(this,e);if(e.bubbles&&!e.stopped){if(this.parentElement)this.parentElement.dispatchEvent(e);else document.dispatchEvent(e)}return !e.defaultPrevented;}
  click(){if(!this.disabled)this.dispatchEvent(event('click',{bubbles:true,detail:1}))}
  focus(){if(this.isConnected)document.activeElement=this}
  getClientRects(){if(!this.isConnected||this.closest('[hidden],[inert]')||this.style.display==='none')return [];return [{left:0,top:0,width:44,height:44}]}
 }
 const event=(type,extra={})=>({type,defaultPrevented:false,stopped:false,preventDefault(){this.defaultPrevented=true},stopPropagation(){this.stopped=true},...extra});
 document={readyState:'complete',activeElement:null,listeners:{},addEventListener(t,f){(this.listeners[t]??=[]).push(f)},dispatchEvent(e){for(const f of this.listeners[e.type]||[])f(e)},createElement:t=>new Element(t)};
 document.documentElement=new Element('html');document.body=new Element('body');document.documentElement.append(document.body);document.body.dataset.r619Skin='ottoman';document.body.classList.add('r617-mode-'+mode);document.activeElement=document.body;
 document.getElementById=id=>document.documentElement.querySelector('#'+id);document.querySelectorAll=q=>document.documentElement.querySelectorAll(q);
 const add=(id,parent=document.body,tag='button')=>{const n=new Element(tag);n.id=id;parent.append(n);return n;};
 const dock=add('dock',document.body,'div'),ui=add('uiBtn',dock),outside=add('outsideControl');
 const prefs=new Map([['sukun.ui.shellMode',mode],['sukun.shell.r716','1'],['sukun.ui.shellSkin','ottoman'],['sukun.tema','kuzey'],['sukun.total','42']]);
 const initialPreferences=Object.fromEntries(prefs);
 const window={SukunAudioSessionRegistry:{aggregateState:()=> 'idle',sync(){calls.sync++},stopAll(){calls.stop++;return true}},SukunAudioGuard:{repair(){calls.repair++}},SukunFriendlyUI:{closeTools(){calls.closeTools++}}};
 const context={window,document,localStorage:{getItem:k=>prefs.get(k)??null,setItem(k,v){writes.push([k,v]);prefs.set(k,v)}},location:{reload:()=>reloads.push(at)},setTimeout:(fn,ms)=>{jobs.set(++serial,{fn,at:at+ms});return serial},clearTimeout:id=>jobs.delete(id),Promise,Math,Object,Array,Set,Number,String};
 vm.createContext(context);vm.runInContext(match[1],context);
 const tick=ms=>{const until=at+ms;let count=0;for(;;){const job=[...jobs].filter(([,v])=>v.at<=until).sort((a,b)=>a[1].at-b[1].at)[0];if(!job)break;assert(++count<1000);at=job[1].at;jobs.delete(job[0]);job[1].fn()}at=until};
 const get=document.getElementById,api=window.SukunLayoutModes,sheet=()=>get('r617ModeSheet'),option=m=>document.querySelectorAll('.r617ModeOption').find(n=>n.dataset.mode===m),key=(k,extra={})=>{const e=event('keydown',{key:k,...extra});document.dispatchEvent(e);return e};
 return {document,window,api,get,sheet,option,key,tick,event,outside,ui,prefs,initialPreferences,writes,reloads,calls};
}
const focusIs=(h,node)=>assert(h.document.activeElement===node,'Expected focus '+(node?.id||node?.dataset?.mode||node?.className||'none')+', observed '+(h.document.activeElement?.id||h.document.activeElement?.dataset?.mode||h.document.activeElement?.className||'none'));
const results=[];function test(name,run){try{run();results.push({name,passed:true})}catch(error){results.push({name,passed:false,error:error.stack})}}
for(const mode of ['classic','simple','focus']){
 test(`${mode}: unchanged stored mode and Feyz preference on mount`,()=>{const h=fixture(mode);h.tick(800);assert.equal(h.api.current(),mode);assert.deepEqual(Object.fromEntries(h.prefs),h.initialPreferences);assert.equal(h.writes.length,0);assert.equal(h.calls.stop,0)});
 test(`${mode}: native opener enters chosen-mode focus without persisting or stopping`,()=>{const h=fixture(mode),b=h.get('r617ModeBtn');b.focus();b.click();h.tick(20);assert(!h.sheet().hidden);focusIs(h,h.option(mode));assert.equal(h.option(mode).getAttribute('aria-checked'),'true');assert.equal(h.calls.stop,0);assert.equal(h.writes.length,0)});
 for(const target of ['classic','simple','focus'])test(`${mode}: public set(${target}) selects requested mode before explicit Apply`,()=>{const h=fixture(mode);h.api.set(target);h.tick(20);assert.equal(h.option(target).getAttribute('aria-checked'),'true');focusIs(h,h.option(target));assert.equal(h.api.current(),mode);assert.equal(h.writes.length,0);assert.equal(h.reloads.length,0);assert.equal(h.get('r617ModeApply').disabled,target===mode)});
 test(`${mode}: Escape returns focus to native opener`,()=>{const h=fixture(mode),b=h.get('r617ModeBtn');b.focus();b.click();h.tick(20);const e=h.key('Escape');assert(h.sheet().hidden);focusIs(h,b);assert(e.defaultPrevented);assert.equal(h.calls.stop,0)});
 test(`${mode}: close button returns focus to native opener`,()=>{const h=fixture(mode),b=h.get('r617ModeBtn');b.focus();b.click();h.tick(20);h.sheet().querySelector('.r617ModeClose').click();assert(h.sheet().hidden);focusIs(h,b)});
 test(`${mode}: scrim close returns focus to native opener`,()=>{const h=fixture(mode),b=h.get('r617ModeBtn');b.focus();b.click();h.tick(20);h.get('r617ModeScrim').click();assert(h.sheet().hidden);focusIs(h,b)});
}
test('Tab from final enabled control wraps to close button',()=>{const h=fixture();h.api.open();h.tick(20);h.option('focus').click();const last=h.get('r617ModeApply'),first=h.sheet().querySelector('.r617ModeClose');last.focus();const e=h.key('Tab');assert(e.defaultPrevented);focusIs(h,first)});
test('Shift+Tab from close button wraps to final enabled control',()=>{const h=fixture();h.api.open();h.tick(20);h.option('focus').click();h.sheet().querySelector('.r617ModeClose').focus();const e=h.key('Tab',{shiftKey:true});assert(e.defaultPrevented);focusIs(h,h.get('r617ModeApply'))});
test('Disabled same-mode Apply is excluded from backwards focus wrap',()=>{const h=fixture();h.api.open();h.tick(20);assert(h.get('r617ModeApply').disabled);h.sheet().querySelector('.r617ModeClose').focus();h.key('Tab',{shiftKey:true});focusIs(h,h.option('focus'))});
test('Hidden controls are excluded from backwards focus wrap',()=>{const h=fixture();h.api.open();h.tick(20);h.option('focus').hidden=true;h.sheet().querySelector('.r617ModeClose').focus();h.key('Tab',{shiftKey:true});focusIs(h,h.option('simple'))});
test('Tab from outside a visible modal enters its first control',()=>{const h=fixture();h.api.open();h.tick(20);h.outside.focus();const e=h.key('Tab');assert(e.defaultPrevented);focusIs(h,h.sheet().querySelector('.r617ModeClose'))});
test('Shift+Tab from outside visible modal enters final eligible control',()=>{const h=fixture();h.api.open();h.tick(20);h.outside.focus();const e=h.key('Tab',{shiftKey:true});assert(e.defaultPrevented);focusIs(h,h.option('focus'))});
test('Interior Tab remains native; application does not synthesize focus steps',()=>{const h=fixture();h.api.open();h.tick(20);h.option('classic').focus();const e=h.key('Tab');assert(!e.defaultPrevented);focusIs(h,h.option('classic'))});
test('Closed modal does not intercept Tab or Escape',()=>{const h=fixture();h.outside.focus();assert(!h.key('Tab').defaultPrevented);assert(!h.key('Escape').defaultPrevented);focusIs(h,h.outside)});
test('Close before delayed entry focus prevents hidden option stealing focus',()=>{const h=fixture(),b=h.get('r617ModeBtn');b.focus();b.click();h.api.close();h.tick(20);focusIs(h,b);assert(h.sheet().hidden)});
test('Reopening does not restore a stale option as the return target',()=>{const h=fixture();h.outside.focus();h.api.open();h.tick(20);h.api.open();h.tick(20);h.api.close();focusIs(h,h.outside)});
test('Disconnected opener falls back to existing layout button',()=>{const h=fixture();h.outside.focus();h.api.open();h.tick(20);h.outside.remove();h.api.close();focusIs(h,h.get('r617ModeBtn'))});
test('Duplicate close leaves newer outside focus alone',()=>{const h=fixture();h.get('r617ModeBtn').focus();h.api.open();h.tick(20);h.api.close();h.outside.focus();h.api.close();focusIs(h,h.outside)});
test('Unknown layout API request neither opens nor writes',()=>{const h=fixture();h.api.set('invented');assert(h.sheet().hidden);assert.equal(h.writes.length,0);assert.equal(h.calls.stop,0)});
test('Explicit Apply persists only chosen layout and reloads once',()=>{const h=fixture();h.api.set('focus');h.tick(20);h.get('r617ModeApply').click();assert.deepEqual(h.writes,[['sukun.ui.shellMode','focus']]);assert.equal(h.reloads.length,1);for(const [key,value]of Object.entries(h.initialPreferences))if(key!=='sukun.ui.shellMode')assert.equal(h.prefs.get(key),value);assert.equal(h.calls.stop,0)});
console.log(JSON.stringify({suite:'r1049 layout API and modal keyboard',source:root,passed:results.filter(v=>v.passed).length,total:results.length,scope:'Actual layout-controller source with modeled DOM focus, events, timers and idle registry endpoints. No browser compositor, audible audio, physical Android, real user storage or broader pointer-delivery assertion.',results},null,2));
if(results.some(v=>!v.passed))process.exitCode=1;
