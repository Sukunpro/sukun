'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {IDBFactory,IDBObjectStore}=require('fake-indexeddb');
// Independent DOM/audio fixture from the original suite; real IDB request,
// serialization and abort behavior supplied by pinned fake-indexeddb 6.2.4.
const oldPath=path.resolve(__dirname,'../r1120');
let fixtureSource=fs.readFileSync(path.join(oldPath,'manual-sets-contract.cjs'),'utf8').split('const tick=')[0];
fixtureSource=fixtureSource.replace('const context={console,document,','const context={indexedDB:globalThis.testIDB,console,document,');
fixtureSource=fixtureSource.replace('return data.get(key)??null;','return (globalThis.testData||data).get(key)??null;');
fixtureSource=fixtureSource.replace(' focus(){',' querySelectorAll(){return descendants(this).filter(n=>["INPUT","SELECT","TEXTAREA","BUTTON"].includes(n.tagName));}\n focus(){');
const {fixture,record,initial}=new Function('require','__dirname',fixtureSource+'\nreturn {fixture,record,initial};')(require,oldPath);
let checks=0;
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const settle=async f=>{await f.api.ready;for(let i=0;i<200&&f.state().busy;i++)await tick();assert(!f.state().busy,'operation completed');};
const check=(v,msg)=>{assert(v,msg);checks++;};
const key='sukun.frequencySets.v2';
const setup=async(stored={version:2,sets:[record()]})=>{globalThis.testIDB=new IDBFactory();globalThis.testData=new Map(stored===null?[]:[[key,typeof stored==='string'?stored:JSON.stringify(stored)]]);const a=fixture({language:'en'}),b=fixture({language:'en'});await Promise.all([a.api.ready,b.api.ready]);return[a,b];};
const read=async f=>(await f.api.exportPayload());
const edit=(f,name)=>{f.button('Edit').click();f.name(name);};
const rows=async f=>(await read(f)).sets;
(async()=>{
 let [a,b]=await setup();const legacy=globalThis.testData.get(key);
 check(a.state().sets.length===1&&!a.state().readOnly,'legacy v2 migration becomes writable');check(a.state().revision===1&&a.state().epoch===b.state().epoch,'simultaneous bootstrap uses one epoch');check(a.writes.length===0&&b.writes.length===0,'migration does not overwrite localStorage');
 for(const [f,name]of [[a,'A'],[b,'B']]){f.create();f.name(name);f.save();}await Promise.all([settle(a),settle(b)]);
 check((await rows(a)).length===3,'parallel adds merge atomically');check(!a.state().draftOpen&&!b.state().draftOpen,'successful saves close drafts');check(globalThis.testData.get(key)===legacy,'legacy rollback copy remains unchanged');
 const reload=fixture({language:'en'});await reload.api.ready;check(reload.state().sets.length===3,'reload reads IDB not stale legacy copy');
 [a,b]=await setup();edit(a,'A');edit(b,'B');a.save();b.save();await Promise.all([settle(a),settle(b)]);check((await rows(a))[0].name==='A','first same-record edit wins');check(b.state().draftOpen&&b.id('r1120Setname').value==='B','losing draft preserved');check(/another tab/.test(b.id('r1120SetStatus').textContent),'stale edit explained');b.save();await settle(b);check((await rows(a))[0].name==='A','stale retry cannot overwrite');
 [a,b]=await setup();edit(a,'Fresh');a.save();b.button('Delete').click();await Promise.all([settle(a),settle(b)]);check((await rows(a))[0].name==='Fresh','stale queued delete does not erase edit');check(/another tab/.test(b.id('r1120SetStatus').textContent),'delete conflict explained');
 [a,b]=await setup();edit(b,'Stale');a.button('Delete').click();b.save();await Promise.all([settle(a),settle(b)]);check((await rows(a)).length===0,'stale edit cannot resurrect deleted record');check(b.state().draftOpen,'deleted-record draft preserved');
 [a,b]=await setup();a.create();a.name('Double');a.save();a.save();await settle(a);check((await rows(a)).length===2,'repeated submit creates one record');
 // Failure after put success but before transaction commit must never claim save.
 [a,b]=await setup();edit(a,'Aborted');const put=IDBObjectStore.prototype.put;
 IDBObjectStore.prototype.put=function(...args){const request=put.apply(this,args);request.addEventListener('success',()=>this.transaction.abort(),{once:true});return request;};
 a.save();await settle(a);IDBObjectStore.prototype.put=put;
 check((await rows(a))[0].name==='Evening','aborted transaction rolls back record');check(a.state().draftOpen&&/Could not save/.test(a.id('r1120SetStatus').textContent),'abort keeps draft and never reports saved');a.save();await settle(a);check((await rows(a))[0].name==='Aborted','aborted save is explicitly retryable');
 [a,b]=await setup();edit(a,'Quota');IDBObjectStore.prototype.put=function(){throw new DOMException('Quota','QuotaExceededError');};a.save();await settle(a);IDBObjectStore.prototype.put=put;check((await rows(a))[0].name==='Evening'&&a.state().draftOpen,'quota failure preserves canonical and draft');
 [a,b]=await setup();a.create();a.name('Keep');globalThis.testData.set(key,'{broken');a.save();await settle(a);check(globalThis.testData.get(key)==='{broken'&&a.state().readOnly&&a.state().draftOpen,'changed legacy copy never overwrites IDB');check(a.state().sets[0].name==='Evening','canonical record still readable during divergence');await assert.rejects(a.api.exportPayload(),/legacy-conflict/);checks++;const conflict=await a.api.exportConflictPayload();check(conflict.canonical.sets[0].name==='Evening'&&conflict.legacyRaw==='{broken','conflict export preserves canonical and exact legacy raw');check(!a.button('Download conflicting copies').hidden,'conflict download action is visible');check(/does not resolve/.test(a.byClass('r1120-set-storage')[0].textContent),'reload is not falsely described as reconciliation');
 [a,b]=await setup();globalThis.testData.delete(key);await a.api.refresh();check(a.state().readOnly&&a.state().sets.length===1,'legacy-only clear neither deletes nor silently reimports canonical sets');
 [a,b]=await setup({version:2,sets:Array.from({length:99},(_,i)=>record('set_'+i,'Set '+i))});
 for(const f of [a,b]){f.create();f.name('Capacity');f.save();}await Promise.all([settle(a),settle(b)]);check((await rows(a)).length===100,'parallel additions enforce capacity inside transaction');check(b.state().draftOpen,'capacity loser retains draft');
 for(const sample of ['{broken',{version:3,sets:[record()]},{version:2,sets:[record(),record()]},{version:2,sets:[record(),{bad:true}]},{version:2,sets:Array.from({length:101},(_,i)=>record('set_'+i))}]){[a,b]=await setup(sample);check(a.state().readOnly&&a.writes.length===0,'malformed/future/duplicate/overlimit data protected');await assert.rejects(a.api.exportPayload());checks++;}
 [a,b]=await setup();a.create();a.name('Read failure');a.setReadError(true);a.save();await settle(a);check(a.state().readOnly&&a.state().draftOpen&&(await rows(b)).length===1,'legacy read failure never assumes empty storage');
 [a,b]=await setup();globalThis.testIDB=undefined;const unsupported=fixture({language:'en'});await unsupported.api.ready;check(unsupported.state().readOnly&&unsupported.state().sets.length===1,'unavailable IDB retains readable legacy records');check(/database could not/.test(unsupported.byClass('r1120-set-storage')[0].textContent),'IDB failure explained');unsupported.button('Load').click();await settle(unsupported);check(unsupported.calls.length===1&&unsupported.calls[0].options.play===false,'read-only record loads without playback');
 check(a.calls.length===0&&b.calls.length===0,'mutations never invoke audio');
 [a,b]=await setup(null);check((await rows(a)).length===0&&!a.state().readOnly,'new empty installation safely initializes');
 // Language changes while committing retain values and cannot replace pending draft.
 a.create();a.name('Pending');a.save();a.language('tr');a.button('İptal').click();await settle(a);check((await rows(a))[0].name==='Pending'&&!a.state().draftOpen,'queued save survives language and cancel attempt');
 console.log(JSON.stringify({passed:checks,method:'Shipped source with independent DOM/audio fixtures and fake-indexeddb 6.2.4 transaction engine; native Chromium test separate.'},null,2));
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>{delete globalThis.testIDB;delete globalThis.testData;});
