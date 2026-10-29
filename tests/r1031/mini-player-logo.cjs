'use strict';
// Source-owner contracts and real handler fixtures; browser pixel QA is separate.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),vm=require('node:vm');
const {normalizeApprovedSourceRow}=require('../helpers/dock-r1056-baseline.cjs');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),results=[];
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
function test(name,fn){try{fn();results.push({name,passed:true});}catch(error){results.push({name,passed:false,error:error.message});}}
const marker='/* r1031: Only the mini grip\'s decorative mark changes.';
const block=html.slice(html.indexOf(marker),html.indexOf('body.r920-dock.r588-mode-mini #r588DockShell .r588Main',html.indexOf(marker)));
const selector='html body.r920-dock.r588-mode-mini #r588DockShell>#r633DockGrip>span:first-child';
const script=id=>html.match(new RegExp('<script id="'+id+'">[\\s\\S]*?<\\/script>'))?.[0];
test('Mirrored entry points are identical',()=>assert.equal(html,fs.readFileSync(path.join(root,'nero.html'),'utf8')));
test('Approved complete transparent logo asset is reused unchanged',()=>assert.equal(sha(fs.readFileSync(path.join(root,'assets/branding/sukun-frameless-logo-r1029.png'))),'19686a971a82137067622b90a9984ac146e68c3e7e9b82395dfc19462f4ffdcd'));
test('Exactly two visual rules target only the existing mini grip decoration',()=>{assert(block.startsWith(marker));assert.equal((block.match(/\{/g)||[]).length,2);assert.equal((block.match(/html body\.r920-dock\.r588-mode-mini #r588DockShell>#r633DockGrip>span:first-child/g)||[]).length,2);assert(block.includes(selector+' {'));assert(block.includes(selector+'::before {'));assert(!/r588-mode-midi|r588-mode-max|r588Play|r730MiniTef|r920DockExpand|mediaSession/.test(block));});
test('Legacy oval paint is removed including the Berhetiyye material border',()=>{const face=block.slice(block.indexOf(selector),block.indexOf(selector+'::before'));for(const decl of ['background:none!important','box-shadow:none!important','border:0!important','border-radius:0!important'])assert(face.includes(decl));});
test('Full uncropped square canvas preserves the logo aspect ratio',()=>{for(const decl of ['width:64px!important;height:64px!important','left:50%!important;top:50%!important','transform:translate(-50%,-50%)!important',"background:url('./assets/branding/sukun-frameless-logo-r1029.png') center/contain no-repeat!important",'overflow:visible!important'])assert(block.includes(decl));assert(!/clip-path|mask-image|object-fit:cover|center\/cover|filter:|opacity:/.test(block));});
test('Visible approved alpha bounds fit inside the 44px target',()=>{const scale=64/512,offset=(44-64)/2,bbox=[156,91,357,420],shown=bbox.map(v=>offset+v*scale);assert.deepEqual(shown,[9.5,1.375,34.625,42.5]);assert(shown.every(v=>v>=0&&v<=44));assert.equal((bbox[2]-bbox[0])*scale,25.125);assert.equal((bbox[3]-bbox[1])*scale,41.125);});
test('Decoration cannot capture clicks and contributes no accessible text',()=>{assert.equal((block.match(/pointer-events:none!important/g)||[]).length,2);assert(block.includes('content:""!important'));assert.match(html,/grip\.innerHTML='<span aria-hidden="true"><\/span><small aria-hidden="true">↕<\/small>/);});
test('Mini grip keeps the existing 44px button at its original position',()=>{const rule=html.match(/body\.r920-dock\.r588-mode-mini #r588DockShell>#r633DockGrip \{([^}]+)\}/)[1];assert(rule.includes('top:12px!important;left:6px!important'));assert(rule.includes('width:44px!important;min-width:44px!important;height:44px!important;margin:0!important'));assert(!block.includes('touch-action:'));});
test('Focus, drag and grip owner match the shipped r1148 checkpoint and approved cleanup/filter boundaries',()=>{
 let owner=script('r633-flow-dock-placement-runtime');assert(owner);
 // Full owner bytes independently match main f0986e7 (r1148). Retain the
 // separate cleanup/filter pins and handler fixtures rather than accepting
 // any future owner change through a broad normalization.
 assert.equal(sha(owner),'fa97a2250c33b3a4c7e33783703e0815bcb154b48cf94cf97c01436af90a3182');
 // r1067 closes only an abandoned grip contact. Pin the complete reviewed
 // cleanup helper and three lifecycle call sites, then restore their r1066
 // bytes. Actual cleanup behavior is executed by r1067/scroll-lifecycle.cjs.
 const cleanupStart=owner.indexOf("function cancelDockDrag(reason='abandoned'){");
 const cleanupEnd=owner.indexOf("window.addEventListener('pageshow',()=>{activeTouches.clear();",cleanupStart);
 assert(cleanupStart>=0&&cleanupEnd>cleanupStart);
 assert.equal(sha(owner.slice(cleanupStart,cleanupEnd)),'1d160c26d95281f7978317135fd73dafdfc2fa477896e4a1d44f90bb7ef588ae');
 const originalLifecycle="// A contact abandoned when the window loses focus must not indefinitely\n// defer layout or leave whenIdle callbacks polling for a release that is gone.\nwindow.addEventListener('blur',()=>{activeTouches.clear();activePointers.clear();panQuietUntil=0;armPanEnd()},{passive:true});\nwindow.addEventListener('pagehide',()=>{activeTouches.clear();activePointers.clear();panPending=false;clearTimeout(panTimer);panTimer=0},{passive:true});\ndocument.addEventListener('visibilitychange',()=>{if(document.hidden){activeTouches.clear();activePointers.clear();panQuietUntil=0;clearTimeout(panTimer);panTimer=0}}, {passive:true});\n";
 owner=owner.slice(0,cleanupStart)+originalLifecycle+owner.slice(cleanupEnd);
 const start=owner.indexOf("const events=['sukun:r616viewchange'",owner.indexOf('// r929: content ResizeObserver'));
 const end=owner.indexOf('// Release inert/backdrop immediately.',start);assert(start>=0&&end>start);
 // Pin the reviewed authority event filter, including explicit skin and
 // selection-theme invalidation already shipped in main r1148. Restore only
 // this block before checking the original complete owner hash below.
 // tests/r1050/dock-progress-invalidation.cjs executes the actual new filter.
 assert.equal(sha(owner.slice(start,end)),'45bdd39f83a9bf761ca2e9e6c0afebb40f17f4a1623b9a2279560ea156badd42');
 const originalEvents="const events=['sukun:r616viewchange','sukun:r698modechange','sukun:tabchange','sukun:playbackchange','sukun:zikirnav','sukun:zikirrestart','sukun:miniflowglasschange','sukun:authoritychange','sukun:journey-advance','sukun:mediasessionwakeguard','pageshow'];events.forEach(ev=>window.addEventListener(ev,()=>schedule(ev),{passive:true}));\n";
 assert.equal(sha(owner.slice(0,start)+originalEvents+owner.slice(end)),'1d498c1b250ad691642e6a9373a2987bd4a28afe6149ce741691ea253de5eb6d');
 assert.equal(sha(script('r698-ui-integration-runtime')),'c6ca01aa6b2038c82726cc8f473e1b87f4dd7cdc86b800c18ce23ed3d7df2d41');assert.match(html,/#r588DockShell button:focus-visible \{outline:2px solid #c8dcb3!important;outline-offset:2px!important\}/);
});
test('Transport, mode and volume runtime remain untouched outside the approved accepted-source indicator',()=>assert.equal(sha(normalizeApprovedSourceRow(fs.readFileSync(path.join(root,'assets/runtime/dock-r920.js'),'utf8'))),'d9d86c7c21eb53e840b1f4fa968a3ab30b8c0e057dc2dc14a0704bae19ef3df0'));
const bind=html.slice(html.indexOf('function bindGrip(grip){'),html.indexOf('\nfunction naturalHeight',html.indexOf('function bindGrip(grip){')));
function fixture(){
 const listeners={},calls=[],timers=[],classList={add(...v){calls.push(['add',...v]);},remove(...v){calls.push(['remove',...v]);}},host={classList,getBoundingClientRect:()=>({height:68})},grip={dataset:{},addEventListener(type,fn){listeners[type]=fn;},setPointerCapture(id){calls.push(['capture',id]);},releasePointerCapture(id){calls.push(['release',id]);}};
 const c={drag:null,y:0,quietUntil:0,B:{classList},$:id=>id==='r170Now'?host:null,safe:fn=>fn(),visible:()=>true,viewport:()=>({height:800}),reserve:()=>8,setBounds:()=>({min:-500,max:0}),clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),setY(value,persist){c.y=value;calls.push(['position',value,persist]);},save:()=>calls.push(['save']),schedule:reason=>calls.push(['schedule',reason]),setTimeout:fn=>timers.push(fn),performance:{now:()=>100}};
 vm.runInNewContext(bind,c);c.bindGrip(grip);
 const fire=(type,overrides={})=>{const e={pointerId:1,pointerType:'touch',isPrimary:true,button:0,clientY:200,preventDefault(){calls.push(['prevent',type]);},stopImmediatePropagation(){calls.push(['stop',type]);},...overrides};listeners[type](e);};
 return {c,grip,calls,timers,fire};
}
test('Actual pointer handlers still move, release and suppress drag-end click',()=>{const f=fixture();f.fire('pointerdown');f.fire('pointermove',{clientY:120});assert.equal(f.c.y,-80);assert(f.calls.some(x=>x[0]==='capture'));f.fire('pointerup');assert.equal(f.c.drag,null);assert.equal(f.grip.dataset.r699SuppressClick,'1');f.fire('click');assert(f.calls.some(x=>x[0]==='stop'));for(const run of f.timers)run();assert.equal(f.grip.dataset.r699SuppressClick,undefined);});
test('A simple native click remains unsuppressed',()=>{const f=fixture();f.fire('pointerdown');f.fire('pointerup');f.fire('click');assert(!f.calls.some(x=>x[0]==='stop'));assert(!f.calls.some(x=>x[0]==='position'));});
test('Keyboard movement and bounds remain functional',()=>{const f=fixture();for(const [key,shiftKey,expected] of [['ArrowUp',false,-28],['ArrowUp',true,-108],['Home',false,-500],['End',false,0]]){f.fire('keydown',{key,shiftKey});assert.equal(f.c.y,expected);}assert.equal(f.calls.filter(x=>x[0]==='position'&&x[2]===true).length,4);});
test('Pointer cancellation and right mouse clicks keep existing behavior',()=>{const f=fixture();f.fire('pointerdown',{pointerType:'mouse',button:2});assert.equal(f.c.drag,null);f.fire('pointerdown');f.fire('pointercancel');assert.equal(f.c.drag,null);assert(f.calls.some(x=>x[0]==='release'));});
const report={total:results.length,passed:results.filter(r=>r.passed).length,failed:results.filter(r=>!r.passed).length,scope:'Exact production-owner hashes, CSS scope and source fit math, real pointer/keyboard handlers in synthetic fixtures. Not live CSSOM, browser pixels or physical-device QA.',results};
console.log(JSON.stringify(report,null,2));if(report.failed)process.exitCode=1;
