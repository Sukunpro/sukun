'use strict';
// Tree-based DOM seam: ids on detached nodes are deliberately invisible to
// document.getElementById, matching the browser ownership boundary.
const assert=require('node:assert/strict'),vm=require('node:vm');
function verifyMount(source){
 const events={};let document;
 function matches(node,token){
  const m=token.match(/^(\w+)?(?:#([\w-]+))?(?:\.([\w-]+))?(?:\[([\w-]+)\])?$/);assert(m,'Unsupported fixture selector '+token);
  return(!m[1]||node.tagName===m[1].toUpperCase())&&(!m[2]||node.id===m[2])&&(!m[3]||node.className.split(/\s+/).includes(m[3]))&&(!m[4]||(m[4]==='id'?!!node.id:m[4].startsWith('data-')?Object.hasOwn(node.dataset,m[4].slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())):Object.hasOwn(node.attrs,m[4])));
 }
 function descendants(root){return root.children.flatMap(n=>[n,...descendants(n)])}
 function select(root,selector){const parts=selector.trim().split(/\s+/);return descendants(root).filter(n=>{if(!matches(n,parts.at(-1)))return false;let parent=n.parentElement;for(let i=parts.length-2;i>=0;i--){while(parent&&!matches(parent,parts[i]))parent=parent.parentElement;if(!parent)return false;parent=parent.parentElement}return true})}
 class Node{
  constructor(tag){this.tagName=tag.toUpperCase();this.children=[];this.parentElement=null;this.dataset={};this.attrs={};this.events={};this.id='';this.className='';this.type=this.tagName==='SELECT'?'select-one':'';this._text='';this.open=false;this.classList={toggle:(name,on)=>{const list=new Set(this.className.split(/\s+/).filter(Boolean));on?list.add(name):list.delete(name);this.className=[...list].join(' ')}};}
  get isConnected(){let n=this;while(n.parentElement)n=n.parentElement;return n===document.body}
  get firstElementChild(){return this.children[0]||null}get options(){return this.tagName==='SELECT'?this.children:undefined}
  get textContent(){return this._text+this.children.map(n=>n.textContent).join('')}set textContent(x){this._text=String(x);for(const n of this.children)n.parentElement=null;this.children=[]}
  append(...nodes){for(const n of nodes){n.remove();this.children.push(n);n.parentElement=this}}
  remove(){if(this.parentElement){const p=this.parentElement;p.children.splice(p.children.indexOf(this),1);this.parentElement=null}}
  after(n){assert(this.parentElement);const parent=this.parentElement;n.remove();parent.children.splice(parent.children.indexOf(this)+1,0,n);n.parentElement=parent}
  setAttribute(k,v){this.attrs[k]=String(v)}getAttribute(k){return this.attrs[k]??null}
  addEventListener(name,fn){(this.events[name]||=[]).push(fn)}focus(){document.activeElement=this}
  closest(selector){for(let n=this;n;n=n.parentElement)if(matches(n,selector))return n;return null}
  querySelectorAll(s){return select(this,s)}querySelector(s){return this.querySelectorAll(s)[0]||null}
 }
 document={readyState:'loading',activeElement:null,createElement:tag=>new Node(tag),getElementById:id=>descendants(document.body).find(n=>n.id===id)||null,querySelectorAll:s=>select(document.body,s),addEventListener:(name,fn)=>{(events[name]||=[]).push(fn)}};document.body=new Node('body');
 const add=(id,parent,tag='div')=>{const n=new Node(tag);n.id=id;parent.append(n);return n},tab=add('tab-frq',document.body),host=add('frequencyWorkbenchR1120',tab),advanced=add('frequencyAdvancedR1120',tab,'details');advanced.append(new Node('summary'));
 const frVol=add('frVol',tab,'input');frVol.setAttribute('aria-describedby','existing-help');add('existing-help',tab,'p');add('harmSayi',advanced);add('harmSeri',advanced);
 const detached=new Node('input');detached.id='detached-probe';assert.equal(document.getElementById(detached.id),null);host.append(detached);assert.equal(document.getElementById(detached.id),detached);detached.remove();assert.equal(document.getElementById(detached.id),null);
 const c={document,window:null,I18N:{lang:'tr'},FR:{c:180,b:7.83,mode:'bin',vol:.5,pink:false,harmonik:0,harmSeri:'dogal',uzam:false,uzamHiz:22,wave:'sine',balL:1,balR:1,noise:'off',noiseVol:0,filterOn:false,lpf:2000,hpf:80,levelProfile:'legacy',fm:false,am:false,rm:false,pwm:false},FR2:{on:false,c:180,b:7.83},addEventListener:(name,fn)=>{(events[name]||=[]).push(fn)}};c.window=c;vm.createContext(c);vm.runInContext(source,c);const before=JSON.stringify({fr:c.FR,fr2:c.FR2});c.SukunFrequencyR1120.mount();
 const groups={channels:['fr1120-balL','fr1120-balR'],noise:['fr1120-noise','fr1120-noiseVol'],filters:['fr1120-filterOn','fr1120-lpf','fr1120-hpf'],level:['frVol','fr1120-levelProfile'],octaves:['fr1120-octDown','fr1120-octUp'],harmonics:['harmSayi','harmSeri']};
 for(const [topic,ids]of Object.entries(groups)){
  const panel=document.getElementById('fr1120-'+topic+'-help');assert(panel?.isConnected,topic+' panel connected');const refs=panel.querySelectorAll('p[id]').map(n=>n.id);assert(refs.length,topic+' actual paragraphs');
  for(const id of ids){const control=document.getElementById(id);assert(control?.isConnected,id+' control connected');const actual=(control.getAttribute('aria-describedby')||'').split(/\s+/);assert.deepEqual(actual,id==='frVol'?['existing-help',...refs]:refs,id+' mounted description');for(const ref of actual)assert(document.getElementById(ref),ref+' resolves');}
  if(['channels','noise','filters','level'].includes(topic)){const row=document.getElementById(ids.at(-1)).closest('.fr1120-row');assert.equal(row.parentElement.children[row.parentElement.children.indexOf(row)+1],panel,topic+' help directly follows its row')}
 }
 const count=()=>descendants(tab).length,first=count();c.SukunFrequencyR1120.mount();assert.equal(count(),first,'repeat mount does not duplicate controls/help');
 const savedRef=document.getElementById('fr1120-filterOn').getAttribute('aria-describedby'),filterHelp=document.getElementById('fr1120-filters-help');filterHelp.open=true;
 for(const lang of ['en','tr']){c.I18N.lang=lang;for(const f of events['sukun:languagechange']||[])f();assert.equal(filterHelp.open,true);assert.equal(document.getElementById('fr1120-filterOn').getAttribute('aria-describedby'),savedRef);for(const n of filterHelp.querySelectorAll('[data-fr-tr]'))assert.equal(n.textContent,n.dataset[lang==='en'?'frEn':'frTr'])}
 assert.equal(JSON.stringify({fr:c.FR,fr2:c.FR2}),before,'mount and localization do not change audio settings');
 return{groups:Object.keys(groups).length,associatedControls:Object.values(groups).flat().length,connectedOnlyLookup:true,repeatedMountStable:true,languageSwitchStable:true};
}
module.exports={verifyMount};
if(require.main===module){const fs=require('node:fs'),path=require('node:path');console.log(JSON.stringify(verifyMount(fs.readFileSync(process.argv[2]||path.join(__dirname,'../../assets/runtime/frequency-workbench-r1120.js'),'utf8'))))}
