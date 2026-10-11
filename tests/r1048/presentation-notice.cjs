'use strict';
// Executes the shipped presentation runtime with controlled DOM geometry.
// Usage: node tests/r1048/presentation-notice.cjs [source root or JS file] [baseline]
// Hit-test uses controlled rectangles/stacking; this is not a rendered browser test.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const input=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const source=fs.statSync(input).isDirectory()?path.join(input,'assets/runtime/presentation-r979.js'):input;
const code=fs.readFileSync(source,'utf8'),variant=process.argv[3]==='baseline'?'baseline':'candidate',results=[];
function hub(){const events=new Map();return{addEventListener(t,f){events.set(t,[...(events.get(t)||[]),f]);},dispatchEvent(e){for(const f of events.get(e.type)||[])f(e);}};}
function fixture(width=390,height=740,dockHeight=68){
 let now=0,seq=0,restores=0;const jobs=new Map(),frames=new Map(),nodes=new Map(),mos=new Set(),ros=new Set(),forbidden=[];
 const context=hub(),document=Object.assign(hub(),{hidden:false,readyState:'complete'});
 function mutation(n,k){for(const o of mos)if(o.targets.some(x=>x.n===n&&(!x.options.attributeFilter||x.options.attributeFilter.includes(k))))o.callback();}
 function px(v,f=0){const n=parseFloat(v);return Number.isFinite(n)?n:f;}
 class Element{
  constructor(id,tag='div'){Object.assign(this,hub());this.id=id;this.tagName=tag;this.dataset={};this.attrs={};this.children=[];this.parentElement=null;this.isConnected=true;this._hidden=false;this._rect={top:0,left:0,width,height,right:width,bottom:height};this.textContent='';this.classes=new Set();
   this.style=new Proxy({},{set:(s,k,v)=>{const changed=s[k]!==v;s[k]=v;if(changed)mutation(this,'style');return true;}});
   this.classList={contains:n=>this.classes.has(n),add:(...names)=>{names.forEach(n=>this.classes.add(n));mutation(this,'class');},remove:(...names)=>{names.forEach(n=>this.classes.delete(n));mutation(this,'class');}};
  }
  get hidden(){return this._hidden;}set hidden(v){if(this._hidden!==!!v){this._hidden=!!v;mutation(this,'hidden');}}
  append(...xs){for(const x of xs){x.parentElement=this;this.children.push(x);}}
  get firstElementChild(){return this.children[0];}get lastElementChild(){return this.children.at(-1);}
  setAttribute(k,v){this.attrs[k]=String(v);}getAttribute(k){return this.attrs[k]??null;}
  contains(n){return this===n||this.children.some(c=>c.contains(n));}
  focus(){document.activeElement=this;}
  getBoundingClientRect(){
   let r={...this._rect};
   if(this.id==='r979PresentationNotice'){
    const w=px(this.style.width,Math.min(px(this.style.maxWidth,480),context.innerWidth-24));
    // Controlled paragraph wrapping models the relevant before/after box geometry.
    const textW=Math.max(20,w-28-(this.firstElementChild?.style.margin?.includes('42px')?42:0));
    const natural=28+Math.max(1,Math.ceil((this.firstElementChild?.textContent.length||0)*7.5/textW))*20+10+44;
    const h=Math.min(natural,px(this.style.maxHeight,natural)),left=px(this.style.left,(context.innerWidth-w)/2),top=px(this.style.top,context.innerHeight-18-h);
    r={top,left,width:w,height:h,right:left+w,bottom:top+h};
   }else if(this.parentElement?.id==='r979PresentationNotice'&&this.tagName==='button'){
    const a=this.parentElement.getBoundingClientRect(),close=this.id==='r979PresentationNoticeDismiss';
    r=close?{top:a.top+8,left:a.right-52,width:44,height:44}: {top:a.bottom-58,left:a.left+14,width:a.width-28,height:44};r.right=r.left+r.width;r.bottom=r.top+r.height;
   }
   return r;
  }
 }
 function add(id,tag='div',parent=document.body){const n=new Element(id,tag);nodes.set(id,n);parent?.append(n);return n;}
 const html=new Element('html'),body=new Element('body');html.lang='tr';html.append(body);document.documentElement=html;document.body=body;
 const wrap=add('wrap'),tab=add('tab-zkr','section',wrap),selected=add('selected','button',wrap);selected.dataset.t='zkr';
 const prior=add('prior','button',wrap);document.activeElement=prior;
 const nav=add('r616BottomNav'),dock=add('r170Now'),shell=add('r588DockShell','div',dock),play=add('r588Play','button',shell),stop=add('r588Stop','button',shell),peek=add('r433DockPeek','button');peek.hidden=true;
 nav.style.zIndex='10000';dock.style.zIndex=peek.style.zIndex='12000';nav.style.position=dock.style.position=peek.style.position='fixed';
 function rect(n,left,top,w,h){n._rect={left,top,width:w,height:h,right:left+w,bottom:top+h};}
 function layout(top=context.innerHeight-72-dockHeight){const w=Math.min(360,context.innerWidth-24),left=(context.innerWidth-w)/2;rect(dock,left,top,w,dockHeight);rect(shell,left,top,w,dockHeight);rect(play,left+w-106,top+dockHeight-54,44,44);rect(stop,left+w-54,top+dockHeight-54,44,44);rect(nav,0,context.innerHeight-56,context.innerWidth,56);rect(peek,(context.innerWidth-240)/2,context.innerHeight-120,240,48);}
 document.getElementById=id=>nodes.get(id)||null;
 document.querySelector=s=>s==='body > .wrap'?wrap:s==='.tab.act[data-t]'?selected:s==='section[id^="tab-"]:not([hidden])'?tab:null;
 document.createElement=tag=>{const n=new Element('generated-'+(++seq),tag);return n;};
 const visible=n=>{for(let e=n;e;e=e.parentElement)if(e.hidden||e.style.display==='none'||e.style.visibility==='hidden')return false;return true;};
 const layer=n=>{for(let e=n;e;e=e.parentElement){const z=parseInt(e.style.zIndex,10);if(Number.isFinite(z))return z;}return 0;};
 const pointer=n=>{for(let e=n;e;e=e.parentElement)if(e.style.pointerEvents)return e.style.pointerEvents;return 'auto';};
 document.elementFromPoint=(x,y)=>{
  const all=[];function visit(n){if(!visible(n))return;const r=n.getBoundingClientRect();if(x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom&&pointer(n)!=='none')all.push(n);n.children.forEach(visit);}visit(body);
  return all.map((n,i)=>({n,i})).sort((a,b)=>layer(b.n)-layer(a.n)||b.i-a.i)[0]?.n||null;
 };
 Object.assign(context,{document,innerWidth:width,innerHeight:height,scrollX:0,scrollY:0,Date:{now:()=>now},performance:{now:()=>now},
  getComputedStyle:n=>({display:visible(n)?'block':'none',visibility:'visible',opacity:'1',contentVisibility:'visible',pointerEvents:'auto',...n.style}),
  setTimeout(f,ms=0){const i=++seq;jobs.set(i,{f,at:now+ms});return i;},clearTimeout:i=>jobs.delete(i),requestAnimationFrame(f){const i=++seq;frames.set(i,f);return i;},cancelAnimationFrame:i=>frames.delete(i),
  CustomEvent:class{constructor(type,init={}){this.type=type;this.detail=init.detail;}},
  MutationObserver:class{constructor(callback){this.callback=callback;this.targets=[];}observe(n,options){this.targets.push({n,options});mos.add(this);}disconnect(){this.targets=[];mos.delete(this);}},
  ResizeObserver:class{constructor(callback){this.callback=callback;this.targets=[];}observe(n){this.targets.push(n);ros.add(this);}disconnect(){this.targets=[];ros.delete(this);}},
  SukunPracticeUI:{restorePresentation(){restores++;return false;}},fixtureCount:19,fixtureAudio:'playing'});
 context.window=context;layout();
 for(const key of ['AudioContext','AudioLife','SukunAudioSessionRegistry','SukunCountCorrection','localStorage','indexedDB','caches','fetch'])Object.defineProperty(context,key,{get(){forbidden.push(key);throw Error('Forbidden presentation dependency '+key);}});
 vm.createContext(context);vm.runInContext(code,context,{filename:source});
 function advance(ms){const end=now+ms;for(;;){const next=[...jobs].filter(([,j])=>j.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!next)break;now=next[1].at;jobs.delete(next[0]);next[1].f();}now=end;}
 function paint(){now+=16;const fs=[...frames.values()];frames.clear();fs.forEach(f=>f(now));}
 function fire(n,type,extra={}){n.dispatchEvent({type,defaultPrevented:false,preventDefault(){this.defaultPrevented=true;},...extra});}
 function geometry(size,top){dockHeight=size;layout(top);for(const o of ros)o.callback();mutation(dock,'style');advance(0);}
 function resize(w,h){context.innerWidth=w;context.innerHeight=h;layout();fire(context,'resize');advance(0);}
 advance(1720);
 const notice=body.children.find(n=>n.id==='r979PresentationNotice');assert(notice&&!notice.hidden,'Actual missing-RAF notice did not appear');
 return{context,document,dock,nav,play,stop,peek,notice,prior,geometry,resize,fire,advance,paint,forbidden,jobs,frames,mos,ros,get restores(){return restores;}};
}
function checkControls(f,items=[f.play,f.stop]){const evidence=[];for(const n of items){const r=n.getBoundingClientRect(),hit=f.document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);evidence.push({id:n.id,hit:hit?.id});assert.equal(hit?.id,n.id,'Pointer hit for '+n.id+' belongs to '+hit?.id);n.focus();assert.equal(f.document.activeElement,n,'Notice must not trap keyboard focus away from controls');}return evidence;}
function passive(f){assert.deepEqual(f.forbidden,[]);assert.equal(f.context.fixtureCount,19);assert.equal(f.context.fixtureAudio,'playing');}
function test(name,fn){try{results.push({name,status:'PASS',evidence:fn()});}catch(e){results.push({name,status:'FAIL',error:e.message});}}
for(const [device,w,h] of [['mobile',390,740],['desktop',1180,800]])for(const [mode,size] of [['mini',68],['midi',220],['max',420]])test(device+' '+mode+' protects Pause and Stop hit regions',()=>{const f=fixture(w,h,size),hits=checkControls(f),a=f.notice.getBoundingClientRect(),b=f.dock.getBoundingClientRect(),gap=Math.max(b.top-a.bottom,a.top-b.bottom);assert(gap>=8,'Notice intersects player instead of leaving a gap');passive(f);return{hits,gap};});
test('Active notice follows mode, drag and viewport resize',()=>{const f=fixture();f.document.body.classList.add('r588-mode-max');f.geometry(420);checkControls(f);f.geometry(220,20);checkControls(f);f.resize(340,480);checkControls(f);const r=f.notice.getBoundingClientRect();assert(r.left>=0&&r.right<=340&&r.top>=0&&r.bottom<=480);passive(f);return{rect:r};});
test('Short viewport fallback gives player stacking and pointer priority',()=>{const f=fixture(320,320,212);passive(f);return checkControls(f);});
test('Visual viewport offsets keep the warning within the visible mobile surface',()=>{const f=fixture();f.context.visualViewport={offsetTop:140,offsetLeft:18,height:360,width:300};f.fire(f.context,'resize');f.advance(0);const r=f.notice.getBoundingClientRect();assert(r.top>=140&&r.bottom<=500&&r.left>=18&&r.right<=318,'Notice must fit visual viewport rather than layout viewport');passive(f);return{rect:r};});
test('Hidden player floating restore control remains reachable',()=>{const f=fixture();f.dock.hidden=true;f.peek.hidden=false;f.document.body.classList.add('r433-dock-hidden');f.advance(0);passive(f);return checkControls(f,[f.peek]);});
test('TR/EN dismiss and Escape leave audio/count/attention unchanged and return focus',()=>{const f=fixture();f.document.documentElement.lang='en';f.fire(f.context,'sukun:languagechange');const close=f.notice.children.find(n=>n.id==='r979PresentationNoticeDismiss');assert(close,'Dismiss action missing');assert.equal(close.getAttribute('aria-label'),'Dismiss interface notice');f.document.documentElement.lang='tr';f.fire(f.context,'sukun:languagechange');assert.equal(close.getAttribute('aria-label'),'Görünüm uyarısını kapat');close.focus();f.fire(f.notice,'keydown',{key:'Escape'});assert(f.notice.hidden);assert.equal(f.document.activeElement,f.prior);assert.equal(f.context.SukunPresentationRecovery.snapshot().state,'attention');assert.equal(f.mos.size,0);assert.equal(f.ros.size,0);passive(f);return{state:'attention',count:19,audio:'playing'};});
test('Redisplay preserves the existing frame-based recovery without resetting transport',()=>{const f=fixture();f.fire(f.notice.lastElementChild,'click');f.advance(0);f.paint();f.paint();assert(f.notice.hidden);assert.equal(f.context.SukunPresentationRecovery.snapshot().state,'ready');assert.equal(f.restores,1);assert.equal(f.mos.size,0);assert.equal(f.ros.size,0);passive(f);return{state:'ready',count:19,audio:'playing'};});
test('Hide cancels placement observers/jobs without waiting for a graphic frame',()=>{const f=fixture();f.document.body.classList.add('r588-mode-midi');f.document.hidden=true;f.fire(f.document,'visibilitychange');assert(f.notice.hidden);assert.equal(f.jobs.size,0);assert.equal(f.frames.size,0);assert.equal(f.mos.size,0);assert.equal(f.ros.size,0);passive(f);return{jobs:0,frames:0,observers:0};});
const report={variant,source,sha256:crypto.createHash('sha256').update(code).digest('hex'),total:results.length,passed:results.filter(x=>x.status==='PASS').length,failed:results.filter(x=>x.status==='FAIL').length,scope:'Shipped runtime and handlers executed in controlled DOM/RAF, ResizeObserver and MutationObserver fixtures. Hit-test is modeled from controlled geometry/stacking, not browser-rendered pixels. No physical device unlock or real audio.',results};
fs.writeFileSync(path.join(__dirname,'presentation-notice-'+variant+'.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));if(report.failed)process.exitCode=1;
