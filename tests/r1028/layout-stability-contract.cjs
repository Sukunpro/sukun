'use strict';
// Source-level geometry contracts, not browser/compositor or physical Android QA.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const rootPath = path.resolve(process.argv[2] || path.join(__dirname, '../..'));
const html = fs.readFileSync(path.join(rootPath, 'index.html'), 'utf8');
const ux = fs.readFileSync(path.join(rootPath, 'assets/runtime/tekke-ux-r992.js'), 'utf8');
const css = fs.readFileSync(path.join(rootPath, 'assets/runtime/tekke-ux-r992.css'), 'utf8');
let checks = 0;
const check = (condition, message) => { assert.ok(condition, message); checks++; };
const functions = ux.slice(ux.indexOf(' function fitScene(){'), ux.indexOf(' function compactCard(){'));
check(functions.includes('function fitViewport(){'), 'extract production viewport and scene functions');
function fixture(stable = true) {
  const values = new Map(), writes = [];
  let baseHeight = 700;
  const stage = {clientHeight: 450, clientWidth: 360};
  const root = {hidden: false, dataset: {tkEntered: '1'}, contains: n => !!n?.insideTekke,
    style: {setProperty(k,v) {values.set(k,v); writes.push([k,v]);}},
    get clientHeight() {const v = values.get('--tkux-view-height'); return v === '100svh' || !v ? baseHeight : parseFloat(v);}};
  const context = {root, stage, values, writes,
    window: {innerWidth: 390, innerHeight: 780, visualViewport: {width:390,height:700,scale:1},
      screen: {orientation:{type:'portrait-primary'}}, CSS: {supports:()=>stable}},
    document: {activeElement: null, documentElement:{clientWidth:390}},
    safe: (fn,d) => {try {return fn();} catch (_) {return d;}},
    $: s => s === '#stage' ? stage : s === '#center' ? {} : null};
  vm.createContext(context);
  vm.runInContext('let viewportHeight=0,viewportWidth=0,viewportOrientation="",viewportStyle="",overlay=null,huSize=0;'+functions+'\nthis.inspect=()=>({viewportHeight,viewportWidth,viewportStyle,huSize});this.setOverlay=v=>overlay=v;', context);
  return {...context, setBaseHeight: n => {baseHeight=n;}};
}
const a = fixture();
a.fitViewport(); a.fitScene();
check(a.values.get('--tkux-view-height') === '100svh', 'native small viewport is the Tekke height authority');
check(a.values.get('--tkux-hu-size') === '252px', 'symbol uses a bounded square');
const initialWrites = a.writes.length;
for (const h of [710,730,780,720,700,650,699,700]) {a.window.visualViewport.height=h; a.fitViewport(); a.fitScene();}
check(a.writes.length === initialWrites, 'toolbar-only viewport changes do not rewrite Tekke or symbol size');
a.stage.clientHeight=100; a.fitScene();
check(a.writes.length === initialWrites, 'caption/stage content height does not resize the symbol');
for (let i=0; i<100; i++) {a.fitViewport(); a.fitScene();}
check(a.writes.length === initialWrites, 'repeated presentation refresh stays geometry-idempotent');
a.window.visualViewport.scale=1.5; a.window.visualViewport.height=450; a.fitViewport();
check(a.writes.length === initialWrites, 'pinch zoom does not rewrite the established app height');
a.window.visualViewport.scale=1; a.document.activeElement={insideTekke:true,tagName:'INPUT',type:'text'};
a.window.visualViewport.height=360; a.fitViewport();
check(a.values.get('--tkux-view-height') === '360px', 'focused keyboard can intentionally reduce the available height');
a.window.visualViewport.height=700; a.fitViewport();
check(a.values.get('--tkux-view-height') === '100svh', 'keyboard dismissal restores the same native viewport authority');
a.document.activeElement={insideTekke:true,tagName:'INPUT',type:'range'};
a.window.visualViewport.height=360; a.fitViewport();
check(a.values.get('--tkux-view-height') === '100svh', 'range input is not treated as a keyboard');
a.window.visualViewport.height=700; a.root.dataset.tkEntered='0';
const entranceWrites=a.writes.length; a.stage.clientWidth=200; a.fitScene();
check(a.writes.length === entranceWrites, 'hidden entrance preview cannot alter the symbol budget');
a.root.dataset.tkEntered='1';a.setOverlay('settings');a.fitScene();
check(a.writes.length === entranceWrites, 'settings overlay cannot alter the symbol budget');
a.setOverlay(null);a.root.hidden=true;a.fitViewport();a.fitScene();
check(a.writes.length === entranceWrites, 'closed Tekke does not change its geometry');
const b=fixture(false);b.fitViewport();
check(b.values.get('--tkux-view-height')==='700px', 'older engine uses an explicit pixel fallback');
for(const h of [720,780,680,700]) {b.window.visualViewport.height=h;b.fitViewport();}
check(b.writes.length===1, 'fallback ignores toolbar-height variation');
b.window.innerWidth=740;b.window.innerHeight=390;b.window.screen.orientation.type='landscape-primary';b.window.visualViewport.height=350;b.fitViewport();
check(b.values.get('--tkux-view-height')==='350px', 'real orientation/width change updates the fallback');
const natural = html.slice(html.indexOf('function naturalHeight(shell,body,footer,grip){'), html.indexOf('\nlet exitRevealSeq=0;'));
check(natural.startsWith('function naturalHeight('), 'extract production dock intrinsic sizing');
const miniContext={B:{classList:{contains: n=>n==='r920-dock'}},mode:()=> 'mini',getComputedStyle:()=> {throw new Error('Mini must not read live child animation boxes');}};
vm.createContext(miniContext);vm.runInContext(natural,miniContext);
for(let i=0;i<120;i++) assert.equal(miniContext.naturalHeight(null,null,null,null),68);
checks++;
check(/#tk\[data-tk-ux="r992"\]\{[^}]*height:var\(--tkux-view-height,100svh\)!important/s.test(css), 'Tekke CSS consumes stable height with the scoped selector');
check(/body\.r699-layout\.r588-dock-ready #r170Now\.r588-authority\{[^}]*transform:none!important[^}]*transition:none!important/s.test(html), 'active dock root has static transform and no size transition');
check(/html body #r433DockPeek\{animation:none!important;transition:none!important;filter:none!important\}/.test(html), 'floating peek already cancels legacy breathing animation');
const styleFunction=html.match(/function r706Style\(style,key,value,priority=''\)[^\n]+/)[0];
const setYFunction=html.match(/function setY\(n,persist=false\)[^\n]+/)[0];
const dragWrites=[];
function styleStore(initial={}) {
  const values=new Map(Object.entries(initial)), priorities=new Map();
  return {getPropertyValue:k=>values.get(k)||'',getPropertyPriority:k=>priorities.get(k)||'',
    setProperty(k,v,p=''){values.set(k,v);priorities.set(k,p);dragWrites.push([k,v,p]);}};
}
const rootStyle=styleStore({'--r699-host-h':'68px','--r699-bottom':'84px'}),hostStyle=styleStore();
const dragContext={root:{style:rootStyle},B:{classList:{contains:n=>n==='r699-dock-active'}},
  $:()=>({style:hostStyle}),px:n=>Math.round(n*10)/10+'px',
  viewport:()=>({layoutH:780,bottom:700}),save:()=>{throw new Error('No persistence during presentation probes');}};
vm.createContext(dragContext);vm.runInContext('let y=0;'+styleFunction+'\n'+setYFunction,dragContext);
for(const y of [-20,-100,-300,-50,0])dragContext.setY(y,false);
check(rootStyle.getPropertyValue('--r699-host-h')==='68px', 'drag positions never rewrite the dock height');
check(dragWrites.every(([key])=>!['width','height','min-height','max-height','transform','scale','zoom'].includes(key)), 'drag writer changes only position and content-reserve variables');
const lastDragWrites=dragWrites.length;for(let i=0;i<120;i++)dragContext.setY(0,false);
check(dragWrites.length===lastDragWrites, 'repeated unchanged drag reconciliation makes no extra style writes');
check(rootStyle.getPropertyValue('--r699-content-reserve')==='84px', 'docked reserve is deterministic after return to its original position');
console.log(JSON.stringify({total:checks,passed:checks,failed:0,scope:'Production-source synthetic geometry contracts. Not device or browser layout proof.'},null,2));
