'use strict';
// Controlled clock for the real layout owner's functions; no network or user storage.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../../assets/runtime/berhet-layout-r938.js'),'utf8');
let now=0,nextId=0,state={phase:'PLAYING',activeMode:'berhet',activeIndex:9,journeyKind:'28'},timers=new Map();
const node=()=>({dataset:{},hidden:false,attrs:{},textContent:'',contains(el){return el===this},getAttribute(k){return this.attrs[k]??null},setAttribute(k,v){this.attrs[k]=String(v)},remove(){},focus(){document.activeElement=this},querySelector(){return null}});
const nodes={'r1056ReadingSummary':node(),'r1242FocusControlsLabel':node(),'r1056SettingsCaption':node(),'r1056SettingsChevron':node()},document={activeElement:null,getElementById:id=>nodes[id]||null};
const window={addEventListener(){},I18N:{lang:'tr'},SukunSessionState:{peek:()=>state}};
const context={window,document,localStorage:{getItem:()=>null,setItem(){}},setTimeout(fn,delay){const id=++nextId;timers.set(id,{at:now+delay,fn});return id},clearTimeout(id){timers.delete(id)}};
const marker="window.addEventListener?.('sukun:languagechange'";
assert(source.includes(marker));
// Expose only test hooks in the in-memory copy; production source is unchanged.
const hooks=`window.__test={init(h,t,b,f,p){host=h;toggle=t;body=b;focusToggle=f;panel=p;lastTef=true;open=false;focusControlsVisible=false},sync:syncSettingsAutoHide,reveal:revealSettings,reset:resetSettingsAutoHide,setOpen,restore,labels,setTef(v){lastTef=v},setControls(v){focusControlsVisible=v;labels()}};\n`;
vm.runInNewContext(source.replace(marker,hooks+marker),context);
const api=window.__test,host=node(),toggle=node(),body=node(),eye=node(),panel=node();api.init(host,toggle,body,eye,panel);
const snap=()=>window.SukunBerhetLayout.snapshot();
function tick(ms){const end=now+ms;for(;;){const found=[...timers].filter(([,t])=>t.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!found)break;const [id,t]=found;timers.delete(id);now=t.at;t.fn()}now=end}
function sync(){api.sync(true)}
function hidden(expected){assert.equal(snap().settingsAutoHidden,expected);assert.equal(host.dataset.r1242SettingsHidden,String(expected));}
function restart(){api.reset();state={phase:'PLAYING',activeMode:'berhet',activeIndex:9,journeyKind:'28'};document.activeElement=null;api.setTef(true);api.setOpen(false);sync()}
restart();assert.equal(timers.size,1);tick(9999);hidden(false);tick(1);hidden(true);assert.equal(eye.attrs['data-r1242-eye'],'true');
tick(599999);hidden(true);tick(1);hidden(false);tick(4999);hidden(false);tick(1);hidden(true);tick(594999);hidden(true);tick(1);hidden(false);tick(5000);hidden(true);
// Explicit reveal cancels both periodic stages for the current playback stretch.
api.reveal();hidden(false);assert.equal(snap().settingsRevealHeld,true);assert.equal(timers.size,0);tick(1200000);sync();hidden(false);assert.equal(timers.size,0);
state.phase='PAUSED';sync();assert.equal(snap().settingsRevealHeld,false);state.phase='PLAYING';sync();tick(10000);hidden(true);
// Selection and terminal state restore immediately; selection starts a fresh countdown.
state.activeIndex=10;sync();hidden(false);tick(9999);hidden(false);tick(1);hidden(true);state.smartSession={terminal:true};sync();hidden(false);assert.equal(timers.size,0);
restart();tick(10000);state.phase='FINISHED';sync();hidden(false);assert.equal(timers.size,0);
restart();tick(10000);api.setTef(false);api.sync(false);hidden(false);assert.equal(timers.size,0);api.setTef(true);sync();tick(10000);hidden(true);
// Initial preparation cannot start a countdown, but clip preparation after
// PLAYING must preserve elapsed time, periodic visibility and manual holds.
restart();state.phase='PAUSED';sync();state.phase='PREPARING';sync();assert.equal(timers.size,0);tick(10000);hidden(false);state.phase='PLAYING';sync();tick(4000);state.phase='PREPARING';sync();assert.equal(timers.size,1);tick(5999);hidden(false);tick(1);hidden(true);
state.phase='PLAYING';sync();tick(599999);hidden(true);state.phase='PREPARING';sync();tick(1);hidden(false);tick(5000);hidden(true);
api.reveal();state.phase='PLAYING';sync();state.phase='PREPARING';sync();assert.equal(snap().settingsRevealHeld,true);assert.equal(timers.size,0);hidden(false);
// A different selection still resets even if its first state is PREPARING.
state.activeIndex=11;sync();hidden(false);assert.equal(snap().settingsRevealHeld,false);assert.equal(timers.size,0);state.phase='PLAYING';sync();tick(10000);hidden(true);
// Canonical journey kind is nested on the production session snapshot.
restart();state.journey={kind:'28'};sync();tick(10000);hidden(true);state.journey={kind:'single'};state.phase='PREPARING';sync();hidden(false);assert.equal(timers.size,0);state.phase='PLAYING';sync();tick(10000);hidden(true);
// Opening settings or focusing reading controls protects the editing session.
restart();tick(5000);api.setOpen(true);hidden(false);assert.equal(timers.size,0);api.setOpen(false);sync();tick(10000);hidden(false);assert.equal(snap().settingsRevealHeld,true);
restart();document.activeElement=nodes.r1056ReadingSummary;tick(10000);hidden(false);assert.equal(snap().settingsRevealHeld,true);assert.equal(timers.size,0);
restart();tick(10000);tick(600000);document.activeElement=nodes.r1056ReadingSummary;tick(5000);hidden(false);assert.equal(timers.size,0);
// Focus is never left on a disclosure that the timeout hides.
restart();document.activeElement=toggle;tick(10000);hidden(true);assert.equal(document.activeElement,eye);
// The accessible name and eye presentation are separate from easy-controls state.
api.setControls(true);assert.equal(eye.attrs['aria-expanded'],'true');assert.equal(eye.attrs['data-r1242-eye'],'true');assert.match(eye.attrs['aria-label'],/Kontrolleri göster/);assert.equal(eye.attrs['data-layer-action'],'show');assert.equal(nodes.r1242FocusControlsLabel.textContent,'Kontrolleri göster');api.reveal();assert.equal(eye.attrs['data-r1242-eye'],'false');assert.equal(eye.attrs['data-layer-action'],'hide');assert.equal(nodes.r1242FocusControlsLabel.textContent,'Kontrolleri gizle');window.I18N.lang='en';api.labels();assert.equal(eye.attrs['aria-label'],'Hide controls');api.setControls(false);assert.equal(eye.attrs['aria-label'],'Show controls');assert.equal(eye.attrs['data-r1242-eye'],'true');
// Restore is the existing layout teardown and must leave no pending callbacks.
restart();assert.equal(timers.size,1);api.restore();assert.equal(timers.size,0);assert.equal(host.dataset.r1242SettingsHidden,undefined);tick(1200000);assert.equal(snap().active,false);
assert.equal(window.SukunBerhetLayout.version,'r1056');assert.equal(window.SukunBerhetLayout.revision,'r1242');
assert.match(source,/id="r1242FocusControlsLabel"/);assert.match(source,/class="rControlsLayers" aria-hidden="true"/);
console.log('PASS r1242 initial 10s hide, 10min/5s periodic visibility, selection/pause/end/exit reset, manual reveal/edit protection, accessible eye and teardown');
