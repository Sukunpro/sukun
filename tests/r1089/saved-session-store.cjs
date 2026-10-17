'use strict';
// New concurrency and async-intent seams around the actual production store.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const {guardOrigin}=require('./saved-session-idb-fixture.cjs');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..')),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const begin='const SavedSessions=window.SukunSavedSessionsR1088=(()=>{',end='/* r1088 saved session identity end. */',source=html.slice(html.indexOf(begin),html.indexOf(end));
const key='sukun.sessions.v2',favKey='sukun.session.favorites.v1',legacyKey='sukun.r170.sessions',plain=x=>JSON.parse(JSON.stringify(x));
const step=(reps=7)=>({type:'zikir',cat:'esma',idx:0,reps,gap:900}),rows=()=>[{id:10,name:'Existing',queue:[step()]}];
function profile({guard=guardOrigin(),storage=new Map([[key,JSON.stringify(rows())],[favKey,'[]']]),locked=false}={}){
 const writes=[],messages=[];let denied=false,privateLocked=locked,failAt=0;
 const window={indexedDB:guard.indexedDB,SukunTabOwner:{canPersist:()=>!denied},SukunSecretPolicy:{secretSession:x=>privateLocked&&x.queue.some(s=>s.cat==='berhet')},toast:m=>messages.push(m)};
 const localStorage={getItem:k=>storage.get(k)??null,setItem(k,v){writes.push([k,v]);if(writes.length===failAt)throw Error('Controlled quota failure');storage.set(k,String(v))},removeItem:k=>storage.delete(k)};
 const context=vm.createContext({window,localStorage,setTimeout,clearTimeout,console,Date});vm.runInContext(source,context);
 return{api:window.SukunSavedSessionsR1088,context,window,guard,storage,writes,messages,data:()=>JSON.parse(storage.get(key)||'[]'),favs:()=>JSON.parse(storage.get(favKey)||'[]'),deny:v=>denied=v,lock:v=>privateLocked=v,failNext:n=>failAt=writes.length+n};
}
const checks=[],pending=[];function check(name,run){pending.push({name,run})}
check('Concurrent distinct named saves in two tabs retain all sixty records',async()=>{
 const guard=guardOrigin(),storage=new Map([[key,'[]'],[favKey,'[]']]),a=profile({guard,storage}),b=profile({guard,storage});await Promise.all([a.api.ready,b.api.ready]);
 const saved=await Promise.all(Array.from({length:60},(_,i)=>(i%2?a:b).api.upsert('Plan '+i,[step(i+1)])));assert(saved.every(Boolean));assert.equal(a.data().length,60);assert.equal(new Set(a.data().map(x=>x.id)).size,60);assert.equal(guard.maxActive,1);
});
check('Same canonical Turkish name shares one stable ID across concurrent upserts',async()=>{
 const guard=guardOrigin(),storage=new Map([[key,'[]'],[favKey,'[]']]),a=profile({guard,storage}),b=profile({guard,storage});await Promise.all([a.api.ready,b.api.ready]);
 const saved=await Promise.all(Array.from({length:20},(_,i)=>(i%2?a:b).api.upsert(i%2?'İSTİĞFAR   AKIŞI':'istiğfar akışı',[step(i+1)])));assert.equal(a.data().length,1);assert.equal(new Set(saved.map(x=>x.id)).size,1);assert.equal(a.data()[0].queue[0].reps,20);assert(!('_r1089Updated'in a.data()[0]));
});
check('Save preserves a concurrent favorite replacement and favorite deltas retain independent stars',async()=>{
 const initial=Array.from({length:12},(_,i)=>({id:10+i,name:'Initial '+i,queue:[step()]})),guard=guardOrigin(),storage=new Map([[key,JSON.stringify(initial)],[favKey,'[]']]),a=profile({guard,storage}),b=profile({guard,storage});await Promise.all([a.api.ready,b.api.ready]);
 await Promise.all([a.api.upsert('New',[step(3)]),b.api.setFavoriteIds([10,11])]);assert.deepEqual(a.favs(),[10,11]);
 await Promise.all(Array.from({length:10},(_,i)=>(i%2?a:b).api.toggleFavorite(12+i)));assert.deepEqual(a.favs().slice().sort((x,y)=>x-y),Array.from({length:12},(_,i)=>10+i));assert.equal(a.data().length,13);
});
check('Concurrent migration reads one latest snapshot and remaps old favorite IDs under the same guard',async()=>{
 const duplicate=[{id:12,name:'Plan',queue:[step()]},{id:11,name:'PLAN',queue:[step()]},{id:10,name:'Plan',queue:[step(3)]}],guard=guardOrigin({blocked:true}),storage=new Map([[key,JSON.stringify(duplicate)],[favKey,'[11]']]),a=profile({guard,storage}),b=profile({guard,storage});
 const before=storage.get(key);assert.equal(a.api.read().length,2);assert.equal(b.api.read().length,2);assert.equal(storage.get(key),before);assert.equal(a.writes.length+b.writes.length,0);guard.release();assert.deepEqual(await Promise.all([a.api.ready,b.api.ready]),[true,true]);assert.equal(a.data().length,2);assert.deepEqual(a.favs(),[12]);assert.equal(a.writes.length+b.writes.length,2);
});
check('Legacy fallback and invalid-ID projection remain read-only and deterministic until guarded import',async()=>{
 const legacy=[{name:'Legacy',queue:[step()]}],guard=guardOrigin({blocked:true}),storage=new Map([[legacyKey,JSON.stringify(legacy)],[favKey,'[]']]),p=profile({guard,storage});
 const a=plain(p.api.read()),b=plain(p.api.read());assert.deepEqual(a,b);assert.equal(p.writes.length,0);assert.equal(storage.has(key),false);guard.release();await p.api.ready;assert.deepEqual(p.data(),a);assert.equal(storage.get(legacyKey),JSON.stringify(legacy));
});
check('Queued writes recheck permission and private access at entry instead of trusting earlier admission',async()=>{
 const guard=guardOrigin({blocked:true}),p=profile({guard}),task=p.api.upsert('New',[step(3)]),before=p.storage.get(key);p.deny(true);guard.release();assert.equal(await task,null);assert.equal(await p.api.ready,false);assert.equal(p.storage.get(key),before);assert.equal(p.writes.length,0);
 const guard2=guardOrigin({blocked:true}),hidden=[{id:10,name:'Private',queue:[{...step(),cat:'berhet'}]}],storage=new Map([[key,JSON.stringify(hidden)],[favKey,'[10]']]),q=profile({guard:guard2,storage}),other=q.api.upsert('Private',[step(3)]);q.lock(true);guard2.release();assert.equal(await other,null);assert.equal(q.data()[0].queue[0].cat,'berhet');assert.deepEqual(q.favs(),[10]);
});
check('Private favorites remain present when a locked public caller replaces its visible favorite list',async()=>{
 const hidden=[{id:10,name:'Private',queue:[{...step(),cat:'berhet'}]},{id:11,name:'Public',queue:[step()]}],p=profile({storage:new Map([[key,JSON.stringify(hidden)],[favKey,'[10,11]']]),locked:true});await p.api.ready;assert.equal(await p.api.setFavoriteIds([]),true);assert.deepEqual(p.favs(),[10]);assert.equal(await p.api.toggleFavorite(10),false);assert.deepEqual(p.favs(),[10]);
});
check('Unavailable guard fails closed and cannot mutate otherwise valid templates or favorites',async()=>{
 const p=profile({guard:guardOrigin({unavailable:true})}),before=p.storage.get(key);assert.equal(await p.api.ready,false);assert.equal(await p.api.upsert('New',[step()]),null);assert.equal(await p.api.toggleFavorite(10),false);assert.equal(await p.api.setFavoriteIds([10]),false);assert.equal(p.storage.get(key),before);assert.equal(p.writes.length,0);assert.equal(p.api.snapshot().lastError,'guard-unavailable');assert.equal(p.api.snapshot().pending,0);
});
check('An explicitly closed cached guard connection reconnects once without losing the requested save',async()=>{
 const p=profile();await p.api.ready;[...p.guard.databases][0].close();const saved=await p.api.upsert('After reconnect',[step(3)]);assert(saved);assert.equal(p.data().length,2);assert.equal(p.guard.databases.size,2);assert.equal(p.api.snapshot().pending,0);
});
check('A failed compatibility mirror rolls back its pair without discarding the canonical save',async()=>{
 const p=profile();await p.api.ready;const before=p.storage.get(key),favs=p.storage.get(favKey);p.failNext(2);assert(await p.api.upsert('Committed',[step(3)]));assert.equal(p.storage.get(key),before);assert.equal(p.storage.get(favKey),favs);assert.equal(p.api.read().length,2);assert.equal(p.api.snapshot().mirrorError,'storage-mirror-failed');const reopened=profile({guard:p.guard,storage:p.storage});assert.equal(await reopened.api.ready,true);assert(reopened.api.read().some(x=>x.name==='Committed'));assert.equal(reopened.data().length,2);
});
const handlerStart=html.indexOf("d.querySelector('#r170SaveSession').onclick=()=>{"),handlerEnd=html.indexOf(';savedRender();if(P.restore())',handlerStart),handler=html.slice(handlerStart,handlerEnd);
check('A busy Save snapshots its old plan once but cannot rename or save a newer current session',async()=>{
 for(const kind of ['new-queue','mutated-queue','new-input']){const p=profile();await p.api.ready;p.guard.hold();const input={value:'Captured plan'},button={},player={name:'Original',queue:[step()],i:1,_r982CompletedReps:4,paused:true,saves:0,save(){this.saves++}};Object.assign(p.context,{d:{querySelector:id=>id==='#r170SessionName'?input:button},P:player,savedRender(){},document:{documentElement:{lang:'tr'}}});vm.runInContext(handler,p.context);const task=button.onclick(),duplicate=button.onclick();assert.equal(task,duplicate);assert.equal(button.disabled,true);
  if(kind==='new-queue'){player.queue=[step(3)];player.name='New session';input.value='New session';}else if(kind==='mutated-queue')player.queue[0].reps=99;else input.value='Later input';
  p.guard.release();await task;assert.equal(p.data().find(x=>x.name==='Captured plan').queue[0].reps,7);assert.equal(player.name,kind==='new-queue'?'New session':'Original');assert.equal(player.saves,0);assert.equal(player.i,1);assert.equal(player._r982CompletedReps,4);assert.equal(player.paused,true);assert.equal(button.disabled,false);assert.equal(p.messages.length,1);
 }
});
check('Fresh activation lookup observes the current ID content and current private policy',async()=>{
 const p=profile();await p.api.ready;const before=await p.api.findVisibleById(10);await p.api.upsert('Existing',[step(3)]);assert.equal(before.queue[0].reps,7);assert.equal((await p.api.findVisibleById(10)).queue[0].reps,3);
 await p.api.upsert('Existing',[{...step(),cat:'berhet'}]);p.lock(true);assert.equal(await p.api.findVisibleById(10),null);p.lock(false);assert.equal((await p.api.findVisibleById(10)).queue[0].cat,'berhet');
});
check('Divergent per-tab mirrors cannot lose sixty canonical saves or independent favorites; a fresh profile reads every result',async()=>{
 const guard=guardOrigin(),a=profile({guard,storage:new Map([[key,'[]'],[favKey,'[]']])}),b=profile({guard,storage:new Map([[key,'[]'],[favKey,'[]']])});await Promise.all([a.api.ready,b.api.ready]);
 const calls=await Promise.all(Array.from({length:60},(_,i)=>(i%2?a:b).api.upsert('Isolated '+i,[step(i+1)])));assert(calls.every(Boolean));const ids=calls.map(x=>x.id);await Promise.all(ids.map((id,i)=>(i%2?a:b).api.toggleFavorite(id)));
 const c=profile({guard,storage:new Map([[key,'[]'],[favKey,'[]']])});await c.api.ready;assert.equal(c.api.read().length,60);assert.deepEqual(plain(c.api.favoriteIds()).sort((x,y)=>x-y),ids.slice().sort((x,y)=>x-y));assert.equal(c.api.snapshot().revision,121);assert.equal(c.data().length,60);
});
check('An aborted canonical put returns failure, keeps the prior cache and heals any ahead-of-commit mirror on refresh',async()=>{
 for(const kind of ['put','commit']){const p=profile();await p.api.ready;const revision=p.api.snapshot().revision;if(kind==='put')p.guard.failNextPut();else p.guard.abortNextCommit();assert.equal(await p.api.upsert('Aborted',[step(3)]),null);assert.equal(p.api.read().length,1);assert.equal(p.api.snapshot().revision,revision);assert.equal(p.guard.records.get('state').rows.length,1);await p.api.refresh();assert.equal(p.data().length,1);const fresh=profile({guard:p.guard,storage:p.storage});await fresh.api.ready;assert.equal(fresh.api.read().length,1);}
});
check('Mirror-only edits from older versions never replace an existing canonical store',async()=>{
 const p=profile();await p.api.ready;await p.api.setFavoriteIds([10]);p.storage.set(key,JSON.stringify([{id:20,name:'Stale old-version write',queue:[step(3)]}]));p.storage.set(favKey,'[20]');await p.api.refresh();assert.equal(p.api.read()[0].id,10);assert.deepEqual(plain(p.api.favoriteIds()),[10]);assert.equal(p.data()[0].id,10);assert.deepEqual(p.favs(),[10]);
});
check('Malformed canonical state fails closed even when compatibility mirrors contain valid data',async()=>{
 const p=profile();await p.api.ready;p.guard.records.set('state',{schema:1,epoch:'bad',revision:0,rows:rows(),favs:[]});const before=p.storage.get(key);assert.equal(await p.api.upsert('Unsafe',[step(3)]),null);assert.equal(await p.api.findVisibleById(10),null);assert.equal(p.storage.get(key),before);assert.equal(p.api.snapshot().lastError,'invalid-data');
});
check('An aborted first canonical write cannot leak into compatibility mirrors or resurrect on migration',async()=>{
 const guard=guardOrigin();guard.abortNextCommit();const storage=new Map([[key,'[]'],[favKey,'[]']]),p=profile({guard,storage});assert.equal(await p.api.ready,false);assert.equal(guard.records.has('state'),false);assert.equal(storage.get(key),'[]');assert.equal(p.api.read().length,0);assert.equal(p.writes.length,0);assert.equal(await p.api.migrate(),true);assert.equal(p.api.read().length,0);
 const fresh=guardOrigin({blocked:true}),q=profile({guard:fresh,storage:new Map([[key,'[]'],[favKey,'[]']])});q.deny(true);fresh.release();assert.equal(await q.api.ready,false);q.deny(false);fresh.abortNextCommit();assert.equal(await q.api.upsert('Rejected bootstrap',[step(3)]),null);assert.equal(q.api.read().length,0);assert.equal(q.writes.length,0);assert.equal(await q.api.migrate(),true);assert.equal(q.api.read().length,0);
});
const activationStart=html.indexOf(' const openSaved=async id=>{'),activationEnd=html.indexOf('\n f.querySelectorAll',activationStart),activation=html.slice(activationStart,activationEnd).trim().replace('const openSaved=','window.openSaved=');
check('Pending saved activation cannot overwrite a newer queue, typed name or private access intent',async()=>{
 for(const kind of ['new-queue','new-input','private-lock','latest-data']){const p=profile();await p.api.ready;if(kind==='private-lock')await p.api.upsert('Existing',[{...step(),cat:'berhet'}]);p.guard.hold();const input={value:'Current draft'},player={name:'Current',queue:[step(2)],token:10,opens:0,open(queue,name){this.queue=queue;this.name=name;this.opens++}};Object.assign(p.context,{P:player,clone:plain,favoritesRender(){},document:{getElementById:()=>input}});vm.runInContext(activation,p.context);const task=p.window.openSaved(10);if(kind==='new-queue'){player.queue=[step(3)];player.name='Later';player.token++;}else if(kind==='new-input')input.value='Typed after activation';else if(kind==='private-lock')p.lock(true);p.guard.release();await task;assert.equal(player.opens,kind==='latest-data'?1:0);if(kind==='new-input')assert.equal(input.value,'Typed after activation');if(kind==='latest-data')assert.equal(player.queue[0].reps,7);}
});
(async()=>{for(const {name,run}of pending){try{await run();checks.push({name,passed:true})}catch(error){checks.push({name,passed:false,error:error.stack})}}console.log(JSON.stringify({suite:'r1089 guarded saved templates and async UI intent',passed:checks.filter(x=>x.passed).length,total:checks.length,checks,limitations:['Controlled IndexedDB transaction scheduling, storage quota and access boundaries. Actual store, migration, queue identity and Save handler execute unchanged; native cross-tab coverage is separate.']},null,2));if(checks.some(x=>!x.passed))process.exitCode=1})().catch(error=>{console.error(error);process.exitCode=1});
