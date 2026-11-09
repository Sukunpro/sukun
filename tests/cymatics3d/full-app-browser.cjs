'use strict';
// Byte-exact full application. Native UI, AudioContext and software WebGL.
// No replacement analyser, oscillator, render loop, media play, clock or bridge.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {fixture,hash}=require('../r1064/browser-fixture.cjs');
const EXPECTED_CHECKS=14;
if(process.argv.includes('--check-source')){
 const source=fs.readFileSync(__filename,'utf8');new(require('node:vm').Script)(source);
 const declared=(source.match(/await check\('/g)||[]).length;assert.equal(declared,EXPECTED_CHECKS);
 console.log(JSON.stringify({sourceOnly:true,declaredChecks:declared,expectedChecks:EXPECTED_CHECKS,nativeExecuted:false}));process.exit(0);
}
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const output=path.resolve(process.argv[3]||'/tmp/cymatics-full-app-native.json');
const sourceFiles=['index.html','nero.html','assets/runtime/cymatics-3d.js','js/frequency-hub-r1101.js'];
const report={suite:'Full application cymatics response',build:fs.readFileSync(path.join(root,'version.txt'),'utf8').trim(),startedAt:new Date().toISOString(),expectedChecks:EXPECTED_CHECKS,browserExecuted:false,checks:[],testSha256:hash(fs.readFileSync(__filename)),sourceHashes:Object.fromEntries(sourceFiles.map(name=>[name,hash(fs.readFileSync(path.join(root,name)))])),limitations:[
 'Disposable Linux Chromium, native Web Audio and SwiftShader WebGL. No physical speaker, microphone, salt plate, mobile device or acoustic acceptance.',
 'The shared fixture controls device speech only, blocks external traffic and service workers, and serves exact local release files. Production audio, media admission, animation and clock functions are unchanged.',
 'The real 15-minute frequency timer is selected through the UI to keep the foreground frequency on its supported live route. Native rendered-background playback is not measured or claimed by this suite.',
 'Public production APIs configure a deterministic idle frequency preset and perform initial cleanup. Carrier edits, play/stop, gain changes, tool navigation and 2D/3D selections use browser input. Reduced motion uses browser media emulation.',
 'Canvas PNG hashes are compared within the same browser run, never against machine-specific golden images. They prove changing/stationary visible frames, not correspondence to a physical experiment.'
]};
let f,p;
function save(){
 report.total=report.checks.length;report.passed=report.checks.filter(row=>row.passed).length;
 report.allPassed=report.browserExecuted&&report.sourceUnchanged===true&&report.testUnchanged===true&&!report.fatal&&report.total===EXPECTED_CHECKS&&report.passed===EXPECTED_CHECKS;
 fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
}
async function state(){return p.evaluate(()=>{
 const view=window.SukunCymatics3D,hub=window.SukunFrequencyHubR1101?.snapshot?.();
 return {view:view?.snapshot?.(),input:view?.input?.(),frequency:{playing:FR.playing,c:FR.c,b:FR.b,vol:FR.vol,mode:FR.mode,left:FR.oL?.frequency.value,right:FR.oR?.frequency.value},context:typeof ctx==='undefined'?null:ctx?.state,sampleRate:typeof ctx==='undefined'?null:ctx?.sampleRate,hub,background:window.SukunBackgroundMix?.snapshot?.(),badge:document.getElementById('cymLive')?.textContent,canvas2DVisible:!!document.getElementById('cymCanvas')?.getClientRects().length,canvas3DCount:document.querySelectorAll('#cym3dHost canvas').length,canvas3DVisible:!!document.querySelector('#cym3dHost canvas')?.getClientRects().length};
});}
async function check(name,fn){
 assert(report.checks.length<EXPECTED_CHECKS,'Unexpected extra check');
 try{const evidence=await fn();report.checks.push({name,passed:true,evidence});}
 catch(error){report.checks.push({name,passed:false,error:error.stack||String(error),state:await state().catch(()=>null)});save();throw error;}
 save();console.log(JSON.stringify({name,passed:true,completed:report.checks.length,expected:EXPECTED_CHECKS}));
}
async function idle(){await p.waitForFunction(()=>!window.SukunInteractionGateR732?.active?.(),null,{timeout:15000});}
async function tap(selector){await idle();const el=p.locator(selector);assert.equal(await el.count(),1,'Unique control: '+selector);await el.scrollIntoViewIfNeeded();await el.click();}
async function showCanvas(){const selector=await p.evaluate(()=>SukunCymatics3D.mode==='3d'?'#cym3dHost canvas':'#cymCanvas');await p.locator(selector).scrollIntoViewIfNeeded();await p.waitForTimeout(150);return selector;}
async function choose(mode){await p.locator('#cymView').selectOption(mode);await p.waitForFunction(mode=>{const s=SukunCymatics3D.snapshot();return s.mode===mode&&s.active&&!s.loading&&!s.error&&(mode!=='3d'||s.scene?.active);},mode,{timeout:15000});await showCanvas();}
async function armTimer(){await tap('[data-fr-tool="overview"]');await tap('#ns .timer-btn[data-min="15"]');await tap('[data-fr-tool="cymatics"]');await p.waitForFunction(()=>SukunFrequencyHubR1101.snapshot().selectedTool==='cymatics');}
async function tune(hz){
 await p.locator('#cymNum').fill(String(hz));await p.locator('#cymNum').press('Tab');
 await p.waitForFunction(hz=>FR.c===hz&&Math.abs(parseFloat(document.getElementById('cymHzTag').textContent)-hz)<.01,hz);
 if(await p.evaluate(()=>FR.playing))await p.waitForFunction(hz=>Math.abs(FR.oL.frequency.value-(hz-FR.b/2))<.5&&Math.abs(FR.oR.frequency.value-(hz+FR.b/2))<.5,hz,{timeout:10000});
 await showCanvas();
}
async function playing(){
 await p.waitForFunction(()=>FR.playing&&ctx.state==='running'&&SukunCymatics3D.input().level>.0001,null,{timeout:12000});await showCanvas();
 const s=await state();assert(s.hub.timer?.remaining>0,'Real timer must keep the live route owned');assert(!s.background?.mutedLive,'Live output must not be replaced by native rendered audio');
 for(const key of ['isPlaying','binaural','noise','special'])assert.equal(s.hub.native[key],false,'No retired Neuro synth: '+key);assert.equal(s.hub.native.sharedContext,true);return s;
}
async function phaseMoves(){await showCanvas();const before=(await state()).view.scene.phase;await p.waitForFunction(before=>SukunCymatics3D.snapshot().scene?.phase>before+.015,before,{timeout:8000});return{before,after:(await state()).view.scene.phase};}
async function phaseStill(){await showCanvas();await p.waitForTimeout(350);const before=(await state()).view.scene.phase;await p.waitForTimeout(450);const after=(await state()).view.scene.phase;assert.equal(after,before,'Actual render phase must remain still');return{before,after};}
async function imagePair(expectChanged){
 const selector=await showCanvas();await p.waitForTimeout(250);
 // Element screenshots sample Chromium's composed canvas output, including WebGL.
 let first=hash(await p.locator(selector).screenshot({animations:'allow'})),second=first;const attempts=[];
 // The 2D renderer intentionally fades old pixels after motion stops. Observe
 // bounded convergence rather than mistaking its short trail for particle motion.
 for(let i=0;i<(expectChanged?1:8);i++){
  await p.waitForTimeout(450);second=hash(await p.locator(selector).screenshot({animations:'allow'}));attempts.push({first,second});
  if(expectChanged||first===second)break;first=second;
 }
 if(expectChanged)assert.notEqual(first,second,'Measured input must change rendered canvas pixels');else assert(attempts.at(-1).first===attempts.at(-1).second,'Stopped/reduced canvas pixels must converge and stay stable');
 return {selector,...attempts.at(-1),changed:attempts.at(-1).first!==attempts.at(-1).second,attempts};
}
async function levels(){await showCanvas();return p.evaluate(async()=>{const values=[];for(let i=0;i<12;i++){values.push(SukunCymatics3D.input().level);await new Promise(r=>setTimeout(r,25));}return{values,mean:values.reduce((a,b)=>a+b,0)/values.length};});}
async function gain(percent){const slider=p.locator('#frVol');await slider.scrollIntoViewIfNeeded();await slider.focus();await p.keyboard.press('Home');for(let i=0;i<percent;i++)await p.keyboard.press('ArrowRight');await slider.press('Tab');assert(Math.abs(await p.evaluate(()=>FR.vol)-percent/100)<.0001);await p.waitForTimeout(1000);await showCanvas();}
async function stop(){await tap('#cymPlayBtn');await p.waitForFunction(()=>!FR.playing);await showCanvas();await p.waitForFunction(()=>SukunCymatics3D.input().level===0,null,{timeout:10000});await p.waitForTimeout(1600);}
function modes(s){return [s.input.n,s.input.m,s.input.nextN,s.input.nextM,s.input.mix];}
(async()=>{try{
 f=await fixture(root,{width:720,height:1000,webgl:true,seed:{'sukun.obDone':'1','sukun.onboardSeen':'1','sukun.obSeenBuild':JSON.stringify(report.build),'sukun.perf':'"tam"','sukun.theme':'"feyz"'}});p=f.page;report.browser=f.browser.version();report.browserExecuted=true;
 await p.emulateMedia({reducedMotion:'no-preference'});
 // Await authored startup completion; never delete/force-hide an overlay.
 await p.waitForFunction(()=>{const el=document.getElementById('sukun-auto-intro');return !el||el.hidden||['none'].includes(getComputedStyle(el).display)||getComputedStyle(el).visibility==='hidden';},null,{timeout:20000});
 await p.waitForFunction(()=>{const el=document.getElementById('dailyCard');return !el||(!el.classList.contains('daily-active')&&!el.classList.contains('fade-out-splash')&&(el.hidden||getComputedStyle(el).display==='none'||getComputedStyle(el).visibility==='hidden'));},null,{timeout:15000});
 await p.evaluate(async()=>{SukunAudioSessionRegistry.stopAll('qa:cymatics-full-app-reset');await SukunR698Transport.whenStopped();window.__cymNativeInputs=[];for(const type of ['click','input','change'])document.addEventListener(type,event=>{if(event.target.id||event.target.dataset?.frTool)__cymNativeInputs.push({type,id:event.target.id,tool:event.target.dataset.frTool||null,trusted:event.isTrusted});},true);});
 await tap('.tab[data-t="frq"]');await p.waitForFunction(()=>!!window.SukunFrequencyR1120);
 const configured=await p.evaluate(()=>SukunFrequencyR1120.apply({mode:'bin',c:438,b:8,vol:.4,pink:false,harmonik:0,uzam:false,wave:'sine',balL:1,balR:1,noise:'off',noiseVol:0,filterOn:false,levelProfile:'legacy',fm:false,am:false,rm:false,pwm:false,secondary:{on:false,c:180,b:8}},{play:false}));assert.equal(configured.ok,true);
 await tap('#r1101FrequencyToolsToggle');await armTimer();await choose('2d');
 await check('Idle 2D entry keeps playback stopped',async()=>{const s=await state();assert.equal(s.frequency.playing,false);assert.equal(s.input.level,0);assert.equal(s.view.mode,'2d');assert(s.canvas2DVisible);return s;});
 await check('438 Hz trusted play drives the real 2D canvas',async()=>{await tune(438);await tap('#cymPlayBtn');const s=await playing();await p.evaluate(()=>{window.__cymAudioGraph=FR.E;});assert.equal(s.frequency.c,438);assert(Math.abs(s.frequency.left-434)<.5&&Math.abs(s.frequency.right-442)<.5);const pixels=await imagePair(true);report.model438=modes(s);return{s,pixels};});
 await check('715 Hz retunes the same graph and changes the shared model',async()=>{await tune(715);const s=await playing();assert.equal(await p.evaluate(()=>FR.E===__cymAudioGraph),true);assert.equal(s.frequency.c,715);assert(Math.abs(s.frequency.left-711)<.5&&Math.abs(s.frequency.right-719)<.5);assert.notDeepEqual(modes(s),report.model438);report.model715=modes(s);return{s,pixels:await imagePair(true)};});
 await check('Native frequency gain changes measured level without another synth',async()=>{await gain(10);const quiet=await levels();await gain(40);const loud=await levels();assert(quiet.mean>.0001);const ratio=loud.mean/quiet.mean;assert(ratio>3.5&&ratio<4.5,'Native 10→40% gain should scale measured RMS approximately fourfold: '+ratio);assert.equal(await p.evaluate(()=>FR.E===__cymAudioGraph),true);return{quiet,loud,ratio,state:await playing()};});
 await check('3D enters native WebGL and moves on measured 715 Hz',async()=>{await choose('3d');const s=await playing();assert.equal(s.canvas3DCount,1);assert(s.canvas3DVisible&&!s.canvas2DVisible);assert.equal(s.view.scene.particles,700);const version=await p.locator('#cym3dHost canvas').evaluate(canvas=>{const gl=canvas.getContext('webgl2');return gl?.getParameter(gl.VERSION);});assert.match(version,/WebGL/i);await p.evaluate(()=>{window.__cymRenderer=SukunCymatics3D.instance;window.__cymCanvas3D=SukunCymatics3D.instance.canvas;});return{s,version,phase:await phaseMoves(),pixels:await imagePair(true)};});
 await check('3D 438 and 715 Hz use the same ordered model as 2D',async()=>{const rows=[];for(const hz of [438,715]){await tune(hz);const s=await playing();assert.deepEqual(modes(s),hz===438?report.model438:report.model715);assert.equal(await p.evaluate(()=>FR.E===__cymAudioGraph&&SukunCymatics3D.instance===__cymRenderer),true);rows.push({hz,state:s,phase:await phaseMoves(),pixels:await imagePair(true)});}return rows;});
 await check('Repeated 2D to 3D switches retain one renderer and audio graph',async()=>{const rows=[];for(const mode of ['2d','3d','2d','3d']){await choose(mode);const s=await playing();assert.equal(s.canvas3DCount,1);assert.equal(await p.evaluate(()=>FR.E===__cymAudioGraph&&SukunCymatics3D.instance===__cymRenderer&&SukunCymatics3D.instance.canvas===__cymCanvas3D),true);rows.push({mode,state:s,pixels:await imagePair(true)});}return rows;});
 await check('Stop in 3D clears signal and stops real rendered motion',async()=>{await stop();const s=await state();assert.equal(s.frequency.playing,false);assert.equal(s.input.level,0);assert.equal(s.hub.timer,null);return{s,phase:await phaseStill(),pixels:await imagePair(false)};});
 await check('Explicit restart resumes 3D without replacing the renderer',async()=>{await armTimer();await tap('#cymPlayBtn');const s=await playing();assert.equal(s.frequency.c,715);assert.equal(await p.evaluate(()=>SukunCymatics3D.instance===__cymRenderer),true);await p.evaluate(()=>{window.__cymAudioGraph=FR.E;});return{s,phase:await phaseMoves(),pixels:await imagePair(true)};});
 await check('Reduced-motion 3D is static while the real audio stays active',async()=>{await p.emulateMedia({reducedMotion:'reduce'});await p.waitForFunction(()=>SukunCymatics3D.snapshot().reduced);const s=await playing();assert(s.input.level>.0001&&s.view.reduced);return{s,phase:await phaseStill(),pixels:await imagePair(false)};});
 await check('Reduced-motion 2D is static while frequency edits still retune audio',async()=>{await choose('2d');await tune(438);const s=await playing();assert(s.view.reduced);assert.equal(s.frequency.c,438);assert.deepEqual(modes(s),report.model438);return{s,pixels:await imagePair(false)};});
 await check('Restoring motion resumes both 2D and 3D without new audio ownership',async()=>{await p.emulateMedia({reducedMotion:'no-preference'});await p.waitForFunction(()=>!SukunCymatics3D.snapshot().reduced);const two=await imagePair(true);await choose('3d');const three=await imagePair(true),phase=await phaseMoves();assert.equal(await p.evaluate(()=>FR.E===__cymAudioGraph&&SukunCymatics3D.instance===__cymRenderer),true);return{two,three,phase,state:await playing()};});
 await check('Stop in 2D and leave-return navigation cannot restart sound or motion',async()=>{await choose('2d');await stop();const first=await imagePair(false);await tap('[data-fr-tool="overview"]');await p.waitForFunction(()=>!SukunCymatics3D.snapshot().active);await tap('[data-fr-tool="cymatics"]');await showCanvas();await p.waitForFunction(()=>SukunCymatics3D.snapshot().active);await p.waitForTimeout(1600);const s=await state();assert.equal(s.frequency.playing,false);assert.equal(s.input.level,0);assert.equal(s.canvas3DCount,1);return{first,state:s,returned:await imagePair(false)};});
 await check('Exact served app and trusted controls complete without runtime errors',async()=>{const e=f.evidence();assert.deepEqual(e.pageErrors,[]);assert.deepEqual(e.failedRequests,[]);assert(!e.consoleErrors.some(x=>/integrity|digest|syntaxerror|referenceerror|typeerror/i.test(x)),e.consoleErrors.join('\n'));for(const[name,row]of Object.entries(e.served))assert.equal(hash(fs.readFileSync(path.join(root,name))),row.sha256,'Byte-exact served resource: '+name);const events=await p.evaluate(()=>__cymNativeInputs);assert(events.some(x=>x.id==='cymPlayBtn'&&x.type==='click'&&x.trusted),'Play/Stop must use trusted clicks');assert(events.some(x=>x.id==='frVol'&&x.type==='input'&&x.trusted),'Gain must use trusted keyboard input');assert(events.some(x=>x.id==='cymNum'&&x.type==='input'&&x.trusted),'Hz edits must use trusted input');return{evidence:e,events};});
 }catch(error){report.fatal=error.stack||String(error);console.error(error);}
 finally{
  if(f){report.finalState=await state().catch(()=>null);report.browserEvidence=f.evidence();try{await f.close();}catch(error){report.fatal=(report.fatal||'')+'\nCleanup failed: '+String(error);}}
  report.sourceUnchanged=sourceFiles.every(name=>report.sourceHashes[name]===hash(fs.readFileSync(path.join(root,name))));report.testUnchanged=report.testSha256===hash(fs.readFileSync(__filename));report.finishedAt=new Date().toISOString();save();
  console.log(JSON.stringify({output,passed:report.passed,total:report.total,expectedChecks:EXPECTED_CHECKS,allPassed:report.allPassed,fatal:report.fatal}));if(!report.allPassed)process.exitCode=1;
 }
})();
