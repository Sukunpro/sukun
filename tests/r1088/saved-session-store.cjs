'use strict';
// Exercise the actual inline store with legacy user data and a storage boundary.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const begin='const SavedSessions=window.SukunSavedSessionsR1088=(()=>{',end='/* r1088 saved session identity end. */';
assert(html.includes(begin)&&html.includes(end),'Production saved-session store markers are present');
const source=html.slice(html.indexOf(begin),html.indexOf(end));
const key='sukun.sessions.v2',favKey='sukun.session.favorites.v1',plain=x=>JSON.parse(JSON.stringify(x));
const step=(reps=7)=>({type:'zikir',cat:'koruma',idx:1,reps,gap:900});
const {guardOrigin}=require('../r1089/saved-session-idb-fixture.cjs');
const checks=[],pending=[];
function profile(rows=[],favs=[],options={}){
 const storage=new Map([[key,typeof rows==='string'?rows:JSON.stringify(rows)],[favKey,JSON.stringify(favs)]]),writes=[],notices=[];
 let fail=options.fail||0;
 const guard=guardOrigin();const window={indexedDB:guard.indexedDB,SukunTabOwner:{canPersist:k=>k!==options.deny},SukunProgressJournal:{notify:k=>notices.push(k)},SukunSecretPolicy:{visibleSessions(){throw Error('Store must never filter private data')},secretSession:x=>!!options.locked&&x.queue.some(s=>s.cat==='berhet')}};
 const localStorage={getItem:k=>storage.get(k)??null,setItem(k,v){writes.push([k,v]);if(fail&&writes.length===fail)throw Error('Fixture quota boundary');storage.set(k,String(v))},removeItem:k=>storage.delete(k)};
 class FixedDate extends Date{static now(){return 1000;}}
 const context=vm.createContext({window,localStorage,Date:FixedDate,console,setTimeout,clearTimeout});vm.runInContext(source,context);
 return{api:window.SukunSavedSessionsR1088,context,window,storage,writes,notices,data:()=>JSON.parse(storage.get(key)),favs:()=>JSON.parse(storage.get(favKey))};
}
function check(name,run){pending.push({name,run})}
check('Repeated Save is one named template, with a stable ID and detached queue snapshot',async()=>{
 const p=profile(),queue=[step()],first=await p.api.upsert('  Korunma   Okumaları  ',queue);
 for(let i=0;i<12;i++)assert.equal((await p.api.upsert('KORUNMA OKUMALARI',queue)).id,first.id);
 queue[0].reps=99;assert.equal(p.data().length,1);assert.equal(p.data()[0].queue[0].reps,7);
 assert.equal(p.data()[0].name,'KORUNMA OKUMALARI');
});
check('An intentional same-name update replaces its content without losing its favorite or unrelated templates',async()=>{
 const p=profile([{id:10,name:'Korunma Okumaları',queue:[step()]},{id:20,name:'Other',queue:[step(33)]}],[10]);
 const saved=await p.api.upsert('korunma okumaları',[step(3)]);assert.equal(saved.id,10);assert.equal(p.data().length,2);assert.equal(p.data()[0].queue[0].reps,3);assert.deepEqual(p.favs(),[10]);assert.equal(p.data()[1].name,'Other');
});
check('A genuinely different name can hold its own template even when its sequence initially matches',async()=>{
 const p=profile(),a=await p.api.upsert('Sabah',[step()]),b=await p.api.upsert('Akşam',[step()]);assert.notEqual(a.id,b.id);assert.equal(p.data().length,2);assert.equal((await p.api.upsert('Akşam',[step(3)])).id,b.id);assert.equal(p.data().length,2);
});
check('Legacy identical name-and-sequence duplicates merge into the newest ID and union their favorites',async()=>{
 const p=profile([{id:30,name:'Korunma Okumaları',queue:[{...step(),_r1082Id:'new'}]},{id:20,name:'  KORUNMA  OKUMALARI ',queue:[{...step(),_r1082Id:'old',_r422Source:{kind:'recording'}}]}],[20,30]);
 await p.api.ready;const rows=plain(p.api.read());assert.equal(rows.length,1);assert.equal(rows[0].id,30);assert.deepEqual(p.favs(),[30]);assert.deepEqual(plain(p.api.favoriteIds()),[30]);
 const writes=p.writes.length;p.api.read();p.api.favoriteIds();assert.equal(p.writes.length,writes,'Migration is idempotent');
});
check('Legacy same-name different plans retain every queue and receive collision-safe distinct names',async()=>{
 const p=profile([{id:4,name:'Plan',queue:[step(7)]},{id:3,name:'Plan',queue:[step(3)]},{id:2,name:'Plan (2)',queue:[step(2)]},{id:1,name:'Plan',queue:[step(1)]}],[3,1]);
 await p.api.ready;const rows=plain(p.api.read());assert.deepEqual(rows.map(x=>x.name),['Plan','Plan (3)','Plan (2)','Plan (4)']);assert.deepEqual(rows.map(x=>x.queue[0].reps),[7,3,2,1]);assert.deepEqual(p.favs(),[3,1]);
});
check('Turkish name case, canonical Unicode composition, and whitespace identify one saved name',async()=>{
 const p=profile(),a=await p.api.upsert('  İSTİĞFAR  AKIŞI ',[step()]),b=await p.api.upsert('istiğfar akışı',[step(3)]);assert.equal(a.id,b.id);
 const c=await p.api.upsert('Nâs',[step()]),d=await p.api.upsert('Na\u0302s',[step(3)]);assert.equal(c.id,d.id);assert.equal(p.data().length,2);
 assert.notEqual(p.api.nameKey('I'),p.api.nameKey('İ'),'Turkish dotless and dotted I remain distinct');
});
check('Queue equivalence ignores runtime IDs, display labels and cached source probes',async()=>{
 const p=profile(),a=[step()],b=[{...step(),vol:1,advance:'auto',repeatMode:'fixed',repeatForMs:60000,_r472SourceMode:'auto',_r1082Id:'fresh',label:'display only',_r422Source:{at:123,kind:'tts'}}];assert(p.api.sameQueue(a,b));assert(p.api.sameQueue([],[]));assert(!p.api.sameQueue(null,[]));assert(!p.api.sameQueue([{type:'unknown'}],[{type:'unknown'}]));
});
check('Every effective count, gap, voice, mode, transition, volume and protected-plan change changes queue identity',async()=>{
 const p=profile(),a=[step()];for(const [field,value] of Object.entries({reps:8,gap:901,vol:.5,advance:'wait',_r472SourceMode:'tts-f',repeatMode:'manual',idx:2,cat:'esma',protectionPlan:'r1078'}))assert(!p.api.sameQueue(a,[{...step(),[field]:value}]),field);
 const duration={...step(),repeatMode:'duration',repeatForMs:10000};assert(!p.api.sameQueue([duration],[{...duration,repeatForMs:20000}]));assert(p.api.sameQueue([{...duration,reps:3}],[{...duration,reps:7}]));
 assert(p.api.sameQueue([step()],[{...step(),repeatForMs:99999}]),'Inactive duration budget does not change a fixed-count plan');
});
check('Silence and frequency behavior participates in sequence identity',async()=>{
 const p=profile(),silence={type:'silence',ms:10000},frequency={type:'frequency',c:180,b:2.5,mode:'bin',ms:60000};
 assert(p.api.sameQueue([silence],[{...silence,vol:1,advance:'auto'}]));assert(!p.api.sameQueue([silence],[{...silence,ms:20000}]));
 for(const [field,value] of Object.entries({c:200,b:4,mode:'iso',ms:30000,stop:false,vol:.5,advance:'wait'}))assert(!p.api.sameQueue([frequency],[{...frequency,[field]:value}]),field);
 assert(p.api.sameQueue([frequency],[{...frequency,stop:true}]));assert(!p.api.sameQueue([step(),silence],[silence,step()]));
});
check('Hidden Berhetiyye templates and their favorites remain stored during public migration, save and favorite toggles',async()=>{
 const hidden={id:10,name:'Berhetiyye 28 İsim',queue:[{...step(),cat:'berhet',idx:0}],privateMarker:'keep'},p=profile([hidden,{id:9,name:'Korunma Okumaları',queue:[step()]},{id:8,name:'KORUNMA OKUMALARI',queue:[step()]}],[10,8]);
 await p.api.ready;p.api.read();assert.equal(p.data().find(x=>x.id===10).privateMarker,'keep');assert.deepEqual(p.favs(),[10,9]);
 await p.api.upsert('New public',[step(3)]);await p.api.setFavoriteIds([...p.api.favoriteIds(),p.data()[0].id]);assert(p.favs().includes(10));assert(p.data().some(x=>x.queue[0].cat==='berhet'));
});
check('A public same-name save cannot overwrite a hidden private sequence while locked',async()=>{
 const hidden={id:10,name:'My sequence',queue:[{...step(),cat:'berhet'}]},p=profile([hidden],[10],{locked:true}),raw=p.storage.get(key),favRaw=p.storage.get(favKey);
 assert.equal(await p.api.upsert('MY SEQUENCE',[step(3)]),null);assert.equal(p.storage.get(key),raw);assert.equal(p.storage.get(favKey),favRaw);
 assert(await p.api.upsert('My public sequence',[step(3)]));assert(p.data().some(x=>x.id===10&&x.queue[0].cat==='berhet'));assert(p.favs().includes(10));
});
check('Either ownership denial blocks both migration writes and deliberate template/favorite writes',async()=>{
 for(const deny of [key,favKey]){const p=profile([{id:2,name:'Plan',queue:[step()]},{id:1,name:'PLAN',queue:[step()]}],[1],{deny});const raw=p.storage.get(key),favRaw=p.storage.get(favKey);assert.equal(p.api.read().length,1);assert.deepEqual(plain(p.api.favoriteIds()),[2]);assert.equal(await p.api.upsert('Plan',[step(3)]),null);assert.equal(await p.api.setFavoriteIds([]),false);assert.equal(p.storage.get(key),raw);assert.equal(p.storage.get(favKey),favRaw);assert.equal(p.writes.length,0);}
});
check('A compatibility favorite-mirror failure rolls back its pair while canonical migration still commits',async()=>{
 const rows=[{id:2,name:'Plan',queue:[step()]},{id:1,name:'PLAN',queue:[step()]}],p=profile(rows,[1],{fail:2}),raw=p.storage.get(key),favRaw=p.storage.get(favKey);assert.equal(await p.api.ready,true);assert.equal(p.storage.get(key),raw);assert.equal(p.storage.get(favKey),favRaw);assert.equal(p.api.read().length,1);assert.deepEqual(plain(p.api.favoriteIds()),[2]);assert.equal(p.api.snapshot().mirrorError,'storage-mirror-failed');assert.equal(await p.api.migrate(),true);assert.equal(p.data().length,1);assert.deepEqual(p.favs(),[2]);
});
check('Legacy duplicate numeric IDs get unique IDs without dropping either different plan or its favorite',async()=>{
 const p=profile([{id:10,name:'First',queue:[step()]},{id:10,name:'Second',queue:[step(3)]}],[10]),rows=plain(p.api.read());await p.api.ready;assert.equal(rows.length,2);assert.notEqual(rows[0].id,rows[1].id);assert.deepEqual(p.favs(),rows.map(x=>x.id));
});
check('No legacy template, including old private entries, is silently evicted by the former twenty-row cap',async()=>{
 const rows=Array.from({length:25},(_,i)=>({id:50+i,name:'Plan '+i,queue:[step(i+1)]})),p=profile(rows,[50]);await p.api.upsert('New',[step()]);assert.equal(p.data().length,26);assert(p.data().some(x=>x.id===50));assert.deepEqual(p.favs(),[50]);
});
check('Unreadable session data is preserved and cannot be silently overwritten by Save',async()=>{
 for(const raw of ['{broken','{}','[null]']){const p=profile(raw);assert.deepEqual(plain(p.api.read()),[]);assert.equal(await p.api.upsert('Plan',[step()]),null);assert.equal(p.storage.get(key),raw);assert.equal(p.writes.length,0);}
});
check('User names remain plain stored data and an unsuccessful empty save cannot alter existing templates',async()=>{
 const p=profile(),name='<img src=x onerror=alert(1)>',saved=await p.api.upsert(name,[step()]);assert.equal(saved.name,name);const raw=p.storage.get(key);assert.equal(await p.api.upsert('Empty',[]),null);assert.equal(p.storage.get(key),raw);assert.equal(p.data().length,1);
});
check('The production Save handler reports success and updates the displayed/current name without resetting progress',async()=>{
 const start=html.indexOf("d.querySelector('#r170SaveSession').onclick=()=>{"),finish=html.indexOf(';savedRender();if(P.restore())',start);assert(start>=0&&finish>start);const handler=html.slice(start,finish);
 for(const lang of ['tr','en']){const p=profile(),input={value:'  Saved  sequence  '},button={},messages=[],player={name:'Old',queue:[step()],i:1,_r982CompletedReps:3,playing:false,paused:true,saves:0,save(){this.saves++;}};
  Object.assign(p.context,{d:{querySelector:id=>id==='#r170SessionName'?input:button},P:player,savedRender(){},document:{documentElement:{lang}}});p.window.I18N={lang};p.window.toast=m=>messages.push(m);vm.runInContext(handler,p.context);await button.onclick();await button.onclick();
  assert.equal(input.value,'Saved sequence');assert.equal(player.name,'Saved sequence');assert.equal(player.i,1);assert.equal(player._r982CompletedReps,3);assert.equal(player.paused,true);assert.equal(player.saves,2);assert.equal(p.data().length,1);assert.deepEqual(messages,lang==='en'?['Session saved','Session updated']:['Seans kaydedildi','Seans güncellendi']);
 }
});
check('A rejected private-name save shows a localized failure and preserves the active session identity/progress',async()=>{
 const start=html.indexOf("d.querySelector('#r170SaveSession').onclick=()=>{"),finish=html.indexOf(';savedRender();if(P.restore())',start),handler=html.slice(start,finish);
 for(const lang of ['tr','en']){const p=profile([{id:10,name:'Private same name',queue:[{...step(),cat:'berhet'}]}],[10],{locked:true}),input={value:'Private same name'},button={},messages=[],player={name:'Active public',queue:[step()],i:2,_r982CompletedReps:4,paused:true,saves:0,save(){this.saves++;}};
  Object.assign(p.context,{d:{querySelector:id=>id==='#r170SessionName'?input:button},P:player,savedRender(){},document:{documentElement:{lang}}});p.window.I18N={lang};p.window.toast=m=>messages.push(m);vm.runInContext(handler,p.context);await button.onclick();assert.equal(player.name,'Active public');assert.equal(player.saves,0);assert.equal(player.i,2);assert.equal(player._r982CompletedReps,4);assert.equal(messages.length,1);assert(messages[0].includes(lang==='en'?'could not be saved':'kaydedilemedi'));assert.equal(p.data()[0].queue[0].cat,'berhet');
 }
});
(async()=>{for(const {name,run} of pending){try{await run();checks.push({name,passed:true})}catch(e){checks.push({name,passed:false,error:e.stack})}}console.log(JSON.stringify({suite:'r1088 saved session identity and migration retained through async guard',passed:checks.filter(x=>x.passed).length,total:checks.length,checks},null,2));if(checks.some(x=>!x.passed))process.exitCode=1})().catch(error=>{console.error(error);process.exitCode=1});
