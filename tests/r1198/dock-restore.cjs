const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const html=require('../helpers/shipped-shell.cjs').readShippedShell('nero.html');
function script(id){const m=html.match(new RegExp('<script id="'+id+'">([\\s\\S]*?)</script>'));assert(m,id);return m[1]}
const nodes={},docHandlers={},windowHandlers={},storage={},session={name:'Berhetihin',count:94,target:622};
class Classes{constructor(...v){this.s=new Set(v)}contains(x){return this.s.has(x)}add(x){this.s.add(x)}remove(x){this.s.delete(x)}toggle(x,force){let yes=force===undefined?!this.s.has(x):!!force;yes?this.s.add(x):this.s.delete(x);return yes}}
class El{
 constructor(id=''){this.id=id;this.dataset={};this.classList=new Classes();this.hidden=false;this.textContent='';this.attrs={};this.listeners={};this.style={removeProperty(){}};this.children={}}
 set innerHTML(v){this._html=v;if(this.id==='r433DockOps')for(const id of ['r433DetailBtn','r433HideBtn','r433DockMeta'])nodes[id]=new El(id);if(this.id==='r433DockPeek'){this.children['.r433Txt']=new El();this.children['.r433Sub']=new El()}}
 get innerHTML(){return this._html||''} querySelector(s){return this.children[s]||null} appendChild(e){nodes[e.id]=e} setAttribute(k,v){this.attrs[k]=String(v)}getAttribute(k){return this.attrs[k]||null} removeAttribute(k){delete this.attrs[k];if(k==='hidden')this.hidden=false} addEventListener(ev,fn){(this.listeners[ev]??=[]).push(fn)}
}
nodes.r170Now=new El('r170Now');nodes.r422NowInfo=new El('r422NowInfo');nodes.r422NowCurrent=new El('r422NowCurrent');nodes.r422NowCurrent.textContent='Berhetihin';
const body=new El('body');body.classList=new Classes('r431-dock-visible','r591-flow-active');
const doc={body,hidden:false,visibilityState:'visible',getElementById:id=>nodes[id]||null,createElement:()=>new El(),addEventListener:(ev,fn,opt)=>(docHandlers[ev]??=[]).push({fn,capture:opt===true||!!opt?.capture})};
const window={SukunUniversalDock:{owner:()=> 'zikir'},currentZikirState:{snapshot:()=>({auto:true,...session})},currentFlowState:{snapshot:()=>({active:true})},addEventListener:(ev,fn)=>(windowHandlers[ev]??=[]).push(fn)};
const c={window,document:doc,navigator:{vibrate(){}},localStorage:{getItem:k=>storage[k],setItem:(k,v)=>storage[k]=v},requestAnimationFrame:fn=>{fn();return 1},cancelAnimationFrame(){},setTimeout:()=>1,clearTimeout(){},console};vm.createContext(c);
vm.runInContext(script('r433-dock-ops-runtime'),c);vm.runInContext(script('r592-dock-collapse-runtime'),c);
function clickPeek(){const p=nodes.r433DockPeek;let stopped=false;const event={target:{closest:s=>s==='#r433DockPeek'?p:null},preventDefault(){},stopImmediatePropagation(){stopped=true}};for(const h of docHandlers.click||[]){if(h.capture&&!stopped)h.fn(event)}if(!stopped)for(const fn of p.listeners.click||[])fn(event);return stopped}
function assertRestored(){assert.equal(window.SukunDockVisibility.isHidden(),false);assert.equal(body.classList.contains('r433-dock-hidden'),false);assert.equal(body.classList.contains('r592-dock-collapsed'),false);assert.equal(nodes.r433DockPeek.hidden,true);assert.deepEqual(session,{name:'Berhetihin',count:94,target:622})}
window.SukunDockCollapse.set(true);assert.equal(body.classList.contains('r592-dock-collapsed'),true);assert.equal(clickPeek(),true);assertRestored();
window.SukunDockVisibility.setHidden(true);assert.equal(clickPeek(),false);assertRestored();
// A separately reconstructed peek must be bound even when the ops node already exists.
delete nodes.r433DockPeek;window.SukunDockVisibility.setHidden(true);assert(nodes.r433DockPeek.listeners.click?.length===1);assert.equal(clickPeek(),false);assertRestored();
window.SukunDockVisibility.refresh();window.SukunDockVisibility.refresh();assert.equal(nodes.r433DockPeek.listeners.click.length,1);
console.log('PASS: collapsed and independent hidden states restore; reconstructed peek binds once; session state preserved.');
