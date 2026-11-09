'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
// Reuse the independent legacy DOM fixture, without running its synchronous tests.
const oldPath=path.resolve(__dirname,'../r1120');
let fixtureSource=fs.readFileSync(path.join(oldPath,'manual-sets-contract.cjs'),'utf8').split('const tick=')[0];
fixtureSource=fixtureSource.replace('const context={console,document,','const context={navigator:{locks:globalThis.testLocks},console,document,');
fixtureSource=fixtureSource.replace('return data.get(key)??null;','return (globalThis.testData||data).get(key)??null;').replace('data.set(key,value);readAfterWrite=true;','(globalThis.testData||data).set(key,value);readAfterWrite=true;');
fixtureSource=fixtureSource.replace(' focus(){',' querySelectorAll(){return descendants(this).filter(n=>["INPUT","SELECT","TEXTAREA","BUTTON"].includes(n.tagName));}\n focus(){');
const {fixture,record}=new Function('require','__dirname',fixtureSource+'\nreturn {fixture,record};')(require,oldPath);
let tail=Promise.resolve(),checks=0;
globalThis.testLocks={request(name,opts,callback){assert.equal(name,'sukun.frequencySets.v2.write');assert.equal(opts.mode,'exclusive');const run=tail.then(callback);tail=run.catch(()=>{});return run;}};
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const check=(v,msg)=>{assert(v,msg);checks++;};
const key='sukun.frequencySets.v2';
const read=()=>JSON.parse(globalThis.testData.get(key));
const pair=()=>{globalThis.testData=new Map([[key,JSON.stringify({version:2,sets:[record()]})]]);return [fixture({language:'en'}),fixture({language:'en'})];};
const edit=(f,name)=>{f.button('Edit').click();f.name(name);};
(async()=>{
 let [a,b]=pair();for(const [f,name]of [[a,'A'],[b,'B']]){f.create();f.name(name);f.save();}await tick();
 check(read().sets.length===3,'parallel adds merge');check(!a.state().draftOpen&&!b.state().draftOpen,'successful saves close drafts');
 [a,b]=pair();edit(a,'A');edit(b,'B');a.save();b.save();await tick();check(read().sets[0].name==='A','first same-record edit wins');check(b.state().draftOpen&&b.id('r1120Setname').value==='B','losing draft preserved');check(/another tab/.test(b.id('r1120SetStatus').textContent),'stale edit explained');b.save();await tick();check(read().sets[0].name==='A','stale retry cannot overwrite');
 [a,b]=pair();edit(a,'Fresh');a.save();b.button('Delete').click();await tick();check(read().sets[0].name==='Fresh','stale queued delete does not erase edit');check(/another tab/.test(b.id('r1120SetStatus').textContent),'delete conflict explained');
 [a,b]=pair();edit(b,'Stale');a.button('Delete').click();b.save();await tick();check(read().sets.length===0,'stale edit cannot resurrect deleted record');check(b.state().draftOpen,'deleted-record draft preserved');
 [a,b]=pair();a.create();a.name('Double');a.save();a.save();await tick();check(read().sets.length===2,'repeated submit creates one record');
 [a,b]=pair();edit(a,'Quota');const raw=globalThis.testData.get(key);a.setWriteError(true);a.save();await tick();check(globalThis.testData.get(key)===raw,'failed write keeps data');check(a.state().draftOpen,'failed write keeps draft');a.setWriteError(false);a.save();await tick();check(read().sets[0].name==='Quota','failed write can retry');
 [a,b]=pair();edit(a,'Unverified');a.setVerifyError(true);a.save();await tick();check(a.state().readOnly&&a.state().draftOpen,'verification failure preserves draft and disables writes');check(/could not be verified/.test(a.id('r1120SetStatus').textContent),'verification not reported successful');
 [a,b]=pair();a.create();a.name('Keep');globalThis.testData.set(key,'{broken');a.save();await tick();check(globalThis.testData.get(key)==='{broken'&&a.state().readOnly&&a.state().draftOpen,'corrupt storage preserved');

 [a,b]=pair();globalThis.testData.set(key,JSON.stringify({version:2,sets:Array.from({length:99},(_,i)=>record('set_'+i,'Set '+i))}));a.event('storage',{key});b.event('storage',{key});
 for(const f of [a,b]){f.create();f.name('Capacity');f.save();}await tick();check(read().sets.length===100,'parallel additions enforce capacity inside lock');check(b.state().draftOpen,'capacity loser retains draft');
 for(const sample of [{version:3,sets:[record()]},{version:2,sets:[record(),record()]},{version:2,sets:[record(),{bad:true}]},{version:2,sets:Array.from({length:101},(_,i)=>record('set_'+i))}]){globalThis.testData.set(key,JSON.stringify(sample));const f=fixture();check(f.state().readOnly&&f.writes.length===0,'malformed/future/duplicate/overlimit data protected');}
 [a,b]=pair();a.create();a.name('Read failure');a.setReadError(true);a.save();await tick();check(a.state().readOnly&&a.state().draftOpen&&read().sets.length===1,'read failure never assumes empty storage');
 [a,b]=pair();globalThis.testLocks=undefined;const unsupported=fixture({language:'en'});check(unsupported.state().readOnly&&unsupported.state().sets.length===1,'unsupported locking retains read-only records');check(/safe cross-tab/.test(unsupported.byClass('r1120-set-storage')[0].textContent),'unsupported locking explained');unsupported.button('Load').click();await tick();check(unsupported.calls.length===1&&unsupported.calls[0].options.play===false,'read-only saved record still loads without playback');
 check(a.calls.length===0&&b.calls.length===0,'mutations never invoke audio');
 console.log(JSON.stringify({passed:checks,method:'Shipped source with shared-store, asynchronous exclusive-lock and independent DOM fixtures; native browser test is separate.'},null,2));
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>{delete globalThis.testLocks;delete globalThis.testData;});
