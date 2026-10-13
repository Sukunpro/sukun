'use strict';
// Production quick-controls + native event delegates + layout controller.
// DOM and the final session/audio command boundary are controlled endpoints.
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), assert = require('node:assert/strict');
function fixture(app, {language='tr', preference=null}={}) {
  let document;
  const attributeWrites=[];
  class Event {
    constructor(type, options={}) {this.type=type;this.bubbles=!!options.bubbles;Object.assign(this,options);}
    preventDefault(){this.defaultPrevented=true;} stopPropagation(){this.stopped=true;}
  }
  class Element {
    constructor(tag='div') {this.tagName=tag.toUpperCase();this.childNodes=[];this.parentElement=null;this.dataset={};this.attrs={};this.listeners={};this.hidden=false;this.disabled=false;this._text='';this.value='';this.checked=false;const classes=new Set(),values=new Map();this.classList={contains:n=>classes.has(n),add:(...ns)=>ns.forEach(n=>classes.add(n)),remove:(...ns)=>ns.forEach(n=>classes.delete(n)),toggle:(n,on)=>{on=on??!classes.has(n);on?classes.add(n):classes.delete(n);return on;}};this.style={setProperty:(k,v)=>values.set(k,String(v)),getPropertyValue:k=>values.get(k)||''};}
    get id(){return this.attrs.id||'';} set id(value){this.attrs.id=String(value);}
    get children(){return this.childNodes.filter(node=>node.tagName!=='#COMMENT');}
    get isConnected(){return this===document.root||!!this.parentElement?.isConnected;}
    get nextElementSibling(){const nodes=this.parentElement?.children||[];return nodes[nodes.indexOf(this)+1]||null;}
    get nextSibling(){const nodes=this.parentElement?.childNodes||[];return nodes[nodes.indexOf(this)+1]||null;}
    get previousElementSibling(){const nodes=this.parentElement?.children||[];return nodes[nodes.indexOf(this)-1]||null;}
    append(...nodes){for(const node of nodes){if(typeof node==='string'){this._text+=node;continue;}node.remove();this.childNodes.push(node);node.parentElement=this;}}
    prepend(...nodes){for(const node of [...nodes].reverse())this.insertBefore(node,this.childNodes[0]||null);}
    remove(){if(this.parentElement){this.parentElement.childNodes.splice(this.parentElement.childNodes.indexOf(this),1);this.parentElement=null;}}
    insertBefore(node,before){assert(!before||before.parentElement===this);node.remove();this.childNodes.splice(before?this.childNodes.indexOf(before):this.childNodes.length,0,node);node.parentElement=this;return node;}
    before(node){this.parentElement.insertBefore(node,this);} after(node){this.parentElement.insertBefore(node,this.nextSibling);} replaceWith(node){this.before(node);this.remove();}
    replaceChildren(...nodes){for(const node of [...this.childNodes])node.remove();this._text='';this.append(...nodes);}
    contains(node){return this===node||this.childNodes.some(child=>child.contains(node));}
    matches(selector){if(selector.startsWith('#'))return this.id===selector.slice(1);if(selector.startsWith('.'))return (this.attrs.class||'').split(' ').includes(selector.slice(1));const match=selector.match(/^([\w-]+)(?:\[([\w-]+)(?:="([^"]*)")?\])?$/);return !!match&&this.tagName===match[1].toUpperCase()&&(!match[2]||match[2] in this.attrs&&(!match[3]||this.attrs[match[2]]===match[3]));}
    querySelector(selector){return this.querySelectorAll(selector)[0]||null;}
    querySelectorAll(selector){const found=[];for(const node of this.children){if(node.matches(selector))found.push(node);found.push(...node.querySelectorAll(selector));}return found;}
    closest(selector){return this.matches(selector)?this:this.parentElement?.closest(selector)||null;}
    setAttribute(key,value){attributeWrites.push([this.id,key,String(value)]);this.attrs[key]=String(value);if(key==='hidden')this.hidden=true;if(key.startsWith('data-'))this.dataset[key.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=String(value);}
    getAttribute(key){return this.attrs[key]??null;} removeAttribute(key){delete this.attrs[key];if(key==='hidden')this.hidden=false;}
    addEventListener(type,callback){(this.listeners[type]??=[]).push(callback);}
    dispatchEvent(event){event.target??=this;event.currentTarget=this;this['on'+event.type]?.call(this,event);for(const fn of this.listeners[event.type]||[])fn.call(this,event);if(event.bubbles&&!event.stopped)this.parentElement?.dispatchEvent(event);return !event.defaultPrevented;}
    click(){if(!this.disabled)this.dispatchEvent(new Event('click',{bubbles:true}));}
    focus(){document.activeElement=this;}
    get textContent(){return this._text+this.childNodes.map(node=>node.textContent).join('');} set textContent(value){this.replaceChildren();this._text=String(value);}
    get innerHTML(){return this._html||this.textContent;} set innerHTML(source){this.replaceChildren();this._html=source;const stack=[this];for(const part of source.match(/<[^>]+>|[^<]+/g)||[]){if(part.startsWith('</')){stack.pop();continue;}if(part.startsWith('<')){const match=part.match(/^<([\w-]+)/);if(!match)continue;const node=new Element(match[1]);for(const attr of part.slice(match[0].length,-1).matchAll(/([\w-]+)(?:="([^"]*)")?/g))node.setAttribute(attr[1],attr[2]??'');stack.at(-1).append(node);if(!/\/$/.test(part.slice(0,-1))&&!['INPUT','IMG','BR','HR'].includes(node.tagName))stack.push(node);}else stack.at(-1)._text+=part;}}
    get options(){return this.children.flatMap(node=>node.tagName==='OPTGROUP'?node.children:[node]);}
    cloneNode(deep){const node=new Element(this.tagName);node.attrs={...this.attrs};node.dataset={...this.dataset};node.hidden=this.hidden;node._text=this._text;node.value=this.value;if(deep)node.append(...this.childNodes.map(child=>child.cloneNode(true)));return node;}
  }
  document={root:new Element('main'),activeElement:null,hidden:false,createElement:tag=>new Element(tag),createComment:()=>new Element('#comment'),getElementById(id){return this.root.querySelector('#'+id);}};
  document.body=new Element('body');document.root.append(document.body);
  const root=new Element('section');root.id='r920Practice';document.body.append(root);
  const add=(id,parent=root,tag='div',className='')=>{const node=new Element(tag);node.id=id;if(className)node.setAttribute('class',className);parent.append(node);return node;};
  add('identity',root,'div','r920Identity');const frame=add('r924WheelFrame'),stats=add('stats',root,'div','r920Stats');add('r920Target',add('goal',stats,'span'),'b');const remaining=add('remaining',stats,'span');add('r920Remaining',remaining,'b');
  add('nav',root,'div','r920Transport');for(const id of ['r920TefEnter','r920TefExit','r920Minus','r920Play','r920Plus','r920Stop','r920Counter'])add(id,root,'button');
  for(const id of ['r968ManualHint','r920Phase','r920Actions','r920JourneySettings','r679ZikirAyarBox','r920ViewOptions','r920More','r920VoiceSource'])add(id);
  for(const id of ['r920WheelSelect','r920SceneSelect','r923EsmaSceneSelect'])add(id,root,'select').innerHTML='<option value="auto">Automatic</option><option value="other">Other</option>';
  const $=id=>document.getElementById(id),state={activeMode:'esma',phase:'IDLE',audioSource:'USER_RECORDING',recordingOrigin:'personal',sourceOrigin:'personal',sourceLabel:'Kendi kayıt',canonical:{mode:'esma',index:0}},commands=[],writes=[],windowEvents=new Map(),storage=new Map();
  if(preference!=null)storage.set('sukun.zikir.quickControls.focus.v1',String(preference));
  let allowed=true,refreshes=0;
  const window={SukunSessionState:{version:'r919',peek:()=>state,snapshot:()=>state},SukunCountCorrection:{status:()=>({allowed,reason:allowed?'':'Cannot adjust now'})},SukunSceneEngine:{snapshot:()=>({scene:'auto',esmaChoice:'auto'})},SukunWheels:{snapshot:()=>({choices:{esma:'wheel',berhet:'wheel'}}),catalog:{esma:[{id:'wheel',title:'Emerald'}],berhet:[{id:'wheel',title:'Amethyst'}]},choose(){}},SukunPracticeUI:{refresh(){refreshes++;}},I18N:{lang:language,writeText:(node,value)=>{if(node&&node.textContent!==String(value))node.textContent=String(value);},writeAttr:(node,key,value)=>{if(node&&node.getAttribute(key)!==String(value))node.setAttribute(key,value);}},addEventListener(type,fn){if(!windowEvents.has(type))windowEvents.set(type,[]);windowEvents.get(type).push(fn);},dispatchEvent(event){for(const fn of windowEvents.get(event.type)||[])fn(event);}};
  const command=(name,args)=>{commands.push({name,args});if(name!=='adjust')state.phase=name==='stop'?'IDLE':name==='pause'?'PAUSED':'PLAYING';};
  const localStorage={getItem:key=>storage.get(key)??null,setItem(key,value){storage.set(key,String(value));writes.push([key,String(value)]);}};
  const context={document,window,Event,$,root,wake(){},snap:()=>state,command,manual:delta=>command('adjust',{delta}),localStorage,Z:{tempo:1},Number,Math,Object,String,Set,Date,JSON,safe:(fn,fallback=null)=>{try{return fn();}catch{return fallback;}},text:window.I18N.writeText,attr:window.I18N.writeAttr};
  vm.createContext(context);
  // The shared source-text API is declared before the existing-session guard;
  // retain our controlled final command boundary while executing that API.
  vm.runInContext(fs.readFileSync(path.join(app,'assets/runtime/session-r919.js'),'utf8'),context);
  const native=fs.readFileSync(path.join(app,'assets/runtime/interface-r920.js'),'utf8');
  const play=native.split('\n').find(line=>line.includes("$('r920Play').onclick=")),stop=native.match(/\$\('r920Stop'\)\.onclick=\(\)=>command\('stop'\);/),adjust=native.split('\n').find(line=>line.includes("$('r920Plus').onclick="));assert(play&&stop&&adjust,'native command boundaries');vm.runInContext(play+'\n'+stop[0]+'\n'+adjust,context);
  const summaryStart=native.indexOf('function readingSummary(s){'),summaryEnd=native.indexOf('\nfunction render(){',summaryStart);assert(summaryStart>=0&&summaryEnd>summaryStart,'reading-summary production boundary');vm.runInContext(native.slice(summaryStart,summaryEnd),context);
  const dock=fs.readFileSync(path.join(app,'assets/runtime/dock-r920.js'),'utf8'),dockStart=dock.indexOf(' function miniPresentation(mode){'),dockEnd=dock.indexOf('\n function mount(){',dockStart);assert(dockStart>=0&&dockEnd>dockStart,'mini-dock production boundary');vm.runInContext(dock.slice(dockStart,dockEnd),context);
  const wheels=fs.readFileSync(path.join(app,'assets/runtime/wheels-r924.js'),'utf8'),start=wheels.indexOf('/* r932: stationary shortcuts'),end=wheels.indexOf('/* r950: read-only light');assert(start>=0&&end>start,'quick control production boundary');vm.runInContext(wheels.slice(start,end),context);window.SukunWheelQuickControls.connect(root);
  vm.runInContext(fs.readFileSync(path.join(app,'assets/runtime/berhet-layout-r938.js'),'utf8'),context);
  function sync(mode='esma',tef=false){state.activeMode=mode;root.dataset.mode=mode;root.dataset.phase=state.phase;document.body.classList.toggle('sukun-tefekkur-mode',tef);$('r920TefExit').hidden=!tef;$('r920TefEnter').hidden=tef;window.SukunWheelQuickControls.render();window.SukunBerhetLayout.sync(root,tef);}
  return {context,document,root,frame,stats,window,$,state,commands,storage,writes,attributeWrites,Event,sync,reading:()=>context.readingSummary(state),dock:()=>context.miniPresentation('mini'),setAllowed:value=>{allowed=value;},refreshes:()=>refreshes,add};
}
module.exports={fixture};
