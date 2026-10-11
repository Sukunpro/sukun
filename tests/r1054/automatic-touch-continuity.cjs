'use strict';
const path=require('node:path'),assert=require('node:assert/strict');
const {fixture}=require('./touch-motion-fixture.cjs');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..')),results=[];
async function test(name,fn){try{await fn();results.push({name,passed:true})}catch(error){results.push({name,passed:false,error:error.stack})}}
function continuous(f,before){const s=f.snapshot();assert.equal(s.phase,'PLAYING');assert.equal(f.frame.dataset.motion,'running');assert.equal(f.api.snapshot().activePointers,0);assert.equal(f.api.snapshot().holding,false);assert.equal(f.api.snapshot().keyboardHolding,false);assert.equal(f.api.snapshot().manualAngle,0);assert.deepEqual(f.transportState(),before);assert.equal(f.actions.length,0);assert.equal(f.jobs.size,0)}
(async()=>{
 for(const kind of ['single','28','99']){
  await test(`selected ${kind} automatic owner stays running during a long touch and touch focus`,async()=>{
   const f=fixture(root);await f.start(kind);const before=f.transportState();f.down();f.focus();f.advance(30000);continuous(f,before);f.up();continuous(f,before);f.advance(120);continuous(f,before);
  });
  await test(`selected ${kind} multi-touch, foreign releases and cancellation never acquire a visual hold`,async()=>{
   const f=fixture(root);await f.start(kind);const before=f.transportState();f.down(1);f.down(2);f.up(99);f.up(1);f.advance(30000);continuous(f,before);f.up(2,'pointercancel');f.down(3,'mouse',f.stone,2);f.up(3);continuous(f,before);
  });
  await test(`selected ${kind} counting remains blocked while the automatic owner plays`,async()=>{
   const f=fixture(root);await f.start(kind);const before=f.transportState();f.down();f.focus();const result=await f.c.SukunSessionState.command('adjust',{delta:1});assert.equal(result.accepted,false);assert.equal(f.c.SukunManualCounter.count(),false);assert.equal(f.frame.dataset.motion,'running');assert.deepEqual(f.transportState(),before);assert.equal(f.actions.length,0);assert.equal(f.api.snapshot().manualSteps,0);
  });
  await test(`selected ${kind} explicit pause still pauses its real owner and touch cannot resume it`,async()=>{
   const f=fixture(root);await f.start(kind);const time=f.media.currentTime,result=await f.c.SukunSessionState.command('pause');await f.flush();assert.equal(result.accepted,true);assert.equal(f.snapshot().phase,'PAUSED');assert.equal(f.frame.dataset.motion,'paused');assert.equal(f.media.paused,true);assert.equal(f.media.currentTime,time);assert.equal(f.actions.filter(a=>a==='registry.pauseAll').length,1);assert.equal(f.actions.filter(a=>a==='media.pause').length,1);f.actions.length=0;const before=f.transportState();f.down();f.focus();f.advance(30000);f.up();assert.equal(f.frame.dataset.motion,'paused');assert.deepEqual(f.transportState(),before);assert.equal(f.actions.length,0);assert.equal(f.jobs.size,0);
  });
 }
 await test('keyboard focus freezes CSS through internal focus changes; leaving clears it without transport commands',async()=>{
  const f=fixture(root);await f.start('28');const before=f.transportState();f.keyboard();f.focus();assert.equal(f.api.snapshot().keyboardHolding,true);assert.equal(f.frame.dataset.motion,'paused');f.leave(f.counter);f.focus(f.counter);assert.equal(f.frame.dataset.motion,'paused');f.leave();assert.equal(f.frame.dataset.motion,'running');assert.equal(f.api.snapshot().keyboardHolding,false);assert.deepEqual(f.transportState(),before);assert.equal(f.actions.length,0);assert.equal(f.jobs.size,0);
 });
 await test('touch anywhere clears a keyboard hold before pointer focus and release',async()=>{
  const f=fixture(root);await f.start('99');const before=f.transportState();f.keyboard('Enter',true);assert.equal(f.frame.dataset.motion,'paused');f.down(1,'touch',f.outside);assert.equal(f.frame.dataset.motion,'running');f.focus();f.advance(30000);f.up();continuous(f,before);
 });
 await test('hidden return and blur retire keyboard focus; prior ordinary touch cannot delay eligible rotation',async()=>{
  const f=fixture(root);await f.start();const before=f.transportState();f.keyboard();f.focus();await f.visible(true);assert.equal(f.frame.dataset.motion,'paused');assert.equal(f.api.snapshot().keyboardHolding,false);await f.visible(false);continuous(f,before);f.keyboard('Enter',true);f.emit('blur');continuous(f,before);
 });
 await test('motion preference and reduced-motion gates still override automatic touches without pausing media',async()=>{
  const f=fixture(root);await f.start();const before=f.transportState();f.toggle.checked=false;f.toggle.onchange();f.down();f.focus();assert.equal(f.frame.dataset.motion,'paused');assert.equal(f.api.snapshot().enabled,false);f.toggle.checked=true;f.toggle.onchange();continuous(f,before);f.reduced.matches=true;f.reduced.fire('change');f.down(2);assert.equal(f.frame.dataset.motion,'paused');assert.deepEqual(f.transportState(),before);f.reduced.matches=false;f.reduced.fire('change');continuous(f,before);
 });
 await test('performance and Tekke eligibility gates retain their visual-only pause policy',async()=>{
  const f=fixture(root);await f.start('28');const before=f.transportState();f.document.documentElement.dataset.r920Performance='saving';f.emit('sukun:performancechange');f.down();assert.equal(f.frame.dataset.motion,'paused');f.document.documentElement.dataset.r920Performance='normal';f.emit('sukun:performancechange');continuous(f,before);f.document.getElementById('tk').hidden=false;f.emit('tekke:opened');assert.equal(f.frame.dataset.motion,'paused');f.document.getElementById('tk').hidden=true;f.emit('tekke:closed');continuous(f,before);
 });
 await test('motion observes pointerdown passively with no pointer release hooks, timer or pointer ownership API',async()=>{
  const f=fixture(root);assert.equal(f.api.version,'r1054');assert(!/setTimeout|clearTimeout|setPointerCapture|preventDefault|stopPropagation|pointers\s*=|releaseTimer/.test(f.motion));assert(!f.listeners.some(l=>['pointerup','pointercancel'].includes(l.type)));const down=f.listeners.filter(l=>l.type==='pointerdown');assert.equal(down.length,1);assert.equal(down[0].opt.capture,true);assert.equal(down[0].opt.passive,true);await f.start();const before=f.transportState();for(let i=0;i<100;i++){f.down(i);f.focus();f.up(i)}continuous(f,before);
 });
 const report={method:'Actual production session selection, derive and command routes, count gates and motion controller with controlled DOM/native legacy owners. No physical compositor, device timing or audible-output claim.',passed:results.filter(r=>r.passed).length,total:results.length,results};console.log(JSON.stringify(report,null,2));if(report.passed!==report.total)process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1});
