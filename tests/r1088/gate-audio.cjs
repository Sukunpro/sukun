'use strict';
// Controlled scheduling/lifecycle checks of the actual private gate audio bus.
// These do not prove audible output; the native browser suite observes real media.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const source=fs.readFileSync(path.join(root,'assets/berhetiyye-gate/audio-r1080.js'),'utf8');
function fixture({deferred=false,gesture=true}={}) {
  const contexts=[],forbidden=[];
  const deny=name=>()=>{forbidden.push(name);throw Error('Gate touched shared '+name);};
  const param=(value=0)=>({value,calls:[],setValueAtTime(v,t){this.value=v;this.calls.push(['set',v,t]);},linearRampToValueAtTime(v,t){this.value=v;this.calls.push(['linear',v,t]);},exponentialRampToValueAtTime(v,t){this.value=v;this.calls.push(['exponential',v,t]);},setTargetAtTime(v,t,k){this.value=v;this.calls.push(['target',v,t,k]);},cancelScheduledValues(t){this.calls.push(['cancel',t]);}});
  class Context {
    constructor(){this.state='suspended';this.currentTime=3;this.sampleRate=100;this.destination={kind:'private-destination'};this.nodes=[];this.resumes=[];contexts.push(this);}
    resume(){if(deferred)return new Promise(resolve=>this.resumes.push(()=>{this.state='running';resolve();}));this.state='running';return Promise.resolve();}
    close(){this.state='closed';return Promise.resolve();}
    node(kind){const n={kind,connections:[],disconnected:false,gain:param(),frequency:param(),Q:param(),threshold:param(),knee:param(),ratio:param(),attack:param(),release:param(),connect(to){this.connections.push(to);},disconnect(){this.disconnected=true;},start(at){this.started=at;},stop(at){this.stopped=at;}};this.nodes.push(n);return n;}
    createGain(){return this.node('gain');} createOscillator(){return this.node('oscillator');} createBufferSource(){return this.node('buffer-source');} createBiquadFilter(){return this.node('filter');} createConvolver(){return this.node('convolver');} createDynamicsCompressor(){return this.node('compressor');}
    createBuffer(channels,length){const data=Array.from({length:channels},()=>new Float32Array(length));return {getChannelData:c=>data[c]};}
  }
  const window={AudioContext:Context,speechSynthesis:{cancel:deny('speech.cancel')},AudioLife:{markUserPause:deny('global pause')},SesCapa:{start:deny('media-session'),stop:deny('media-stop')},SukunForegroundArbiter:{claim:deny('foreground-claim')}};
  const navigator={userActivation:{isActive:gesture}};
  vm.runInNewContext(source,{window,navigator,Promise,Math,Number,Set,Float32Array});
  const statuses=[],audio=window.createSukunPortalAudio({onStatus:s=>statuses.push(s)});
  return {audio,contexts,forbidden,statuses,navigator};
}
test('private gate effects require a gesture and never touch shared audio authority',async()=>{
  const f=fixture({gesture:false});assert.equal(await f.audio.enableFromGesture(),false);assert.equal(f.contexts.length,0);assert.equal(f.audio.play('knock'),false);
  f.navigator.userActivation.isActive=true;assert.equal(await f.audio.enableFromGesture(),true);assert.equal(f.contexts.length,1);assert.equal(f.audio.play('knock'),true);assert.equal(f.audio.snapshot().cue,'knock');assert(f.audio.snapshot().voices>0);assert.deepEqual(f.forbidden,[]);
});
test('ducking changes only gate bus output while retaining the selected user volume',async()=>{
  const f=fixture();await f.audio.enableFromGesture();f.audio.setVolume(.35);f.audio.setMix(.32);f.audio.play('unlocking');const c=f.contexts[0],output=c.nodes.find(n=>n.connections.includes(c.destination));
  assert.equal(f.audio.snapshot().volume,.35);assert.equal(f.audio.snapshot().mix,.32);assert(Math.abs(output.gain.value-.35*.32*.3)<1e-12);
  f.audio.setMix(1);assert.equal(output.gain.calls.at(-1)[0],'target');assert(Math.abs(output.gain.value-.105)<1e-12);assert.deepEqual(f.forbidden,[]);
});
test('all door success and failure cues remain on their own graph and can be cleared',async()=>{
  const f=fixture();await f.audio.enableFromGesture();
  for(const cue of ['knock','challenge','unlocking','opening','welcome','closing','locking','sealing','preview','rejected','sadness']){
    assert.equal(f.audio.play(cue),true,cue);assert.equal(f.audio.snapshot().cue,cue);assert(f.audio.snapshot().voices>0,cue);f.audio.stop({immediate:true});assert.equal(f.audio.snapshot().voices,0);assert.equal(f.audio.snapshot().retiring,0);
  }
  assert(f.contexts[0].nodes.every(n=>n.disconnected));assert.deepEqual(f.forbidden,[]);
});
test('mute invalidates pending resume so an old open cannot enable late sounds',async()=>{
  const f=fixture({deferred:true});const pending=f.audio.enableFromGesture();f.audio.setEnabled(false);f.contexts[0].resumes[0]();assert.equal(await pending,false);assert.equal(f.audio.snapshot().enabled,false);assert.equal(f.audio.play('knock'),false);
});
test('a newer gesture wins while stale enable result cannot retire replacement voices',async()=>{
  const f=fixture({deferred:true});const stale=f.audio.enableFromGesture();f.audio.setEnabled(false);const next=f.audio.enableFromGesture();const c=f.contexts[0];c.resumes[1]();assert.equal(await next,true);assert.equal(f.audio.play('opening'),true);const voices=f.audio.snapshot().voices;c.resumes[0]();assert.equal(await stale,false);assert.equal(f.audio.snapshot().enabled,true);assert.equal(f.audio.snapshot().voices,voices);assert.equal(f.audio.snapshot().cue,'opening');
});
test('zero-volume and zero-mix teardown only owned voices and do not reset preferences',async()=>{
  const f=fixture();await f.audio.enableFromGesture();f.audio.play('rejected');f.audio.setVolume(0);assert.equal(f.audio.snapshot().voices,0);assert.equal(f.audio.snapshot().volume,0);f.audio.setVolume(.2);f.audio.play('sadness');f.audio.setMix(0);assert.equal(f.audio.snapshot().voices,0);assert.equal(f.audio.snapshot().volume,.2);assert.equal(f.audio.play('welcome'),false);assert.deepEqual(f.forbidden,[]);
});
test('destroy invalidates resume, tears down graph, and closes only the private context',async()=>{
  const f=fixture({deferred:true});const pending=f.audio.enableFromGesture();f.audio.destroy();f.contexts[0].resumes[0]();assert.equal(await pending,false);assert.equal(f.audio.snapshot().destroyed,true);assert.equal(f.audio.play('knock'),false);assert.equal(f.audio.snapshot().voices,0);assert.deepEqual(f.forbidden,[]);
});
