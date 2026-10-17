'use strict';
// Node-only actual production function checks. The complete portal lifecycle
// and native media remain covered by the separate Chromium .js suites.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const source=fs.readFileSync(path.join(root,'assets/berhetiyye-gate/portal-r1080.js'),'utf8');
function section(name,next) {
 const start=source.indexOf('  function '+name+'('),end=source.indexOf('  function '+next+'(',start);
 assert(start>=0&&end>start,'Actual portal function boundaries: '+name);
 return source.slice(start,end);
}
function reading() {
 const state={phase:'idle'},window={SukunReadingAudioR1064:{snapshot:()=>state},R170:{Player:{playing:false,paused:false}},SukunSessionState:{peek:()=>({playing:false,preparing:false})},SukunPhysicalRecordingBusyR696:()=>false,speechSynthesis:{speaking:false,pending:false}};
 const context=vm.createContext({window});vm.runInContext(section('microphoneBusy','readingBusy')+section('readingBusy','stopInvitation'),context);
 return {context,window,state,busy:()=>context.readingBusy()};
}
function access() {
 const seals=[],state={open:true,revoking:false,authenticated:true,phase:'ready',entering:true};
 const context=vm.createContext({state,usableGrant:()=>false,finishSeal:(...args)=>seals.push(args)});
 vm.runInContext(section('invalidateAccess','emitState'),context);
 return {context,state,seals};
}
function invitation() {
 const voices=[],button={textContent:'invitation',isConnected:true};
 const context=vm.createContext({state:{open:true,authenticated:true},document:{hidden:false},settings:{effects:true,volume:.35},epoch:1,invitationAudioURL:'labelled-fixture.mp3',invitationAudio:null,usableGrant:()=>true,invalidateAccess:()=>{throw Error('Unexpected access invalidation');},readingBusy:()=>false,t:x=>x,Promise,
  Audio:function(url){this.url=url;this.paused=true;this.currentTime=0;this.play=()=>{this.paused=false;return new Promise((resolve,reject)=>{this.resolve=resolve;this.reject=reject;});};this.pause=()=>{this.paused=true;};voices.push(this);}});
 vm.runInContext(section('stopInvitation','syncReadingMix')+section('invite','abortable'),context);
 return {context,voices,button};
}
test('independent modern reader prepares/plays before physical audio without permitting gate narration',()=>{
 const f=reading();for(const phase of ['preparing','playing']){f.state.phase=phase;assert.equal(f.busy(),true,phase);}
 for(const phase of ['idle','paused','ended','error']){f.state.phase=phase;assert.equal(f.busy(),false,phase);}
});
test('existing smart and physical voice observations remain authoritative',()=>{
 const f=reading();f.window.R170.Player.playing=true;assert.equal(f.busy(),true);f.window.R170.Player.paused=true;assert.equal(f.busy(),false);f.window.SukunPhysicalRecordingBusyR696=()=>true;assert.equal(f.busy(),true);
});
test('a superseded invitation rejection cannot replace the live source label',async()=>{
 const f=invitation();f.context.invite(f.button);f.context.invite(f.button);f.voices[1].resolve();f.voices[0].reject(Error('superseded'));await Promise.resolve();await Promise.resolve();
 assert.equal(f.button.textContent,'invitation');assert.equal(f.voices[0].paused,true);assert.equal(f.voices[1].paused,false);assert.equal(f.context.invitationAudio,f.voices[1]);
});
test('a current invitation rejection still reports unavailability',async()=>{
 const f=invitation();f.context.invite(f.button);f.voices[0].reject(Error('native playback unavailable'));await Promise.resolve();await Promise.resolve();assert.equal(f.button.textContent,'voiceUnavailable');
});
test('external revocation invalidates ready presentation without invoking private transport',()=>{
 const f=access();f.context.syncAccess({detail:{unlocked:false}});assert.equal(f.state.entering,false);assert.deepEqual(f.seals,[['revoked',false]]);
});
test('external revocation also fences pending verification before it has authenticated',()=>{
 const f=access();f.state.authenticated=false;f.state.phase='verifying';f.context.syncAccess({detail:{unlocked:false}});assert.deepEqual(f.seals,[['revoked',false]]);
 const untouched=access();untouched.state.authenticated=false;untouched.state.phase='challenge';untouched.context.syncAccess({detail:{unlocked:false}});assert.deepEqual(untouched.seals,[],'Locked idle password input is not constantly reset');
});
test('the gate-owned lock event retains its own revocation and closing state',()=>{
 const f=access();f.state.revoking=true;f.state.authenticated=false;f.state.phase='closing';f.context.syncAccess({detail:{unlocked:false}});assert.deepEqual(f.seals,[]);assert.equal(f.state.phase,'closing');
});
