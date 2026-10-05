'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=process.argv[2]||path.resolve(__dirname,'../..');
const runtime=fs.readFileSync(path.join(root,'assets/runtime/recording-inspection-r1017.js'),'utf8');
const KEY='sukun.recording.inspection.v1',OLD_KEY='sukun.recording.continuity.v1';
const results=[],plain=value=>JSON.parse(JSON.stringify(value));
const ticks=async()=>{for(let i=0;i<24;i++)await Promise.resolve()};
const nativeErrors=['SecurityError','VersionError','UnknownError','InvalidStateError','QuotaExceededError','AbortError'];
const error=(name='Error')=>Object.assign(Error('PRIVATE_RECORDING https://private.invalid/?key=PRIVATE_KEY'),{name});
function environment(config={},shared=new Map()){
  let clock=1800000000000,timerId=0;
  const timers=new Map(),pending=[],requests=[],connections=[];
  const stats={opens:0,enumerations:0,dbCloses:0,upgradeAborts:0,upgradeCommits:0,txAborts:0,transactions:0,cursorReads:0,valueReads:0,keyReads:0,payloadReads:0,writes:0,storageReads:0,storageWrites:0};
  const schedule=fn=>config.hold?pending.push(fn):queueMicrotask(fn);
  const privateError=()=>error(config.errorName);
  class RestrictedBlob extends Blob{
    arrayBuffer(){stats.payloadReads++;throw error()}
    text(){stats.payloadReads++;throw error()}
    stream(){stats.payloadReads++;throw error()}
    slice(){stats.payloadReads++;throw error()}
  }
  const defaultValues=[new RestrictedBlob(['1234']),new RestrictedBlob(['123456'])];
  const write=()=>{stats.writes++;throw Error('Unexpected data/schema write')};
  const indexedDB={
    ...(config.noDatabases?{}:{databases(){
      stats.enumerations++;
      if(config.databasesThrow)throw privateError();
      if(config.databasesReject)return Promise.reject(privateError());
      if(config.databasesHang)return new Promise(resolve=>{config.resolveEnumeration=resolve});
      if(config.invalidDatabases)return Promise.resolve({name:'sukunRec'});
      return Promise.resolve(config.missingDB?[]:[{name:'sukunRec',version:1}]);
    }}),
    deleteDatabase:write,
    open(name,...args){
      stats.opens++;assert.equal(name,'sukunRec');assert.equal(args.length,0);
      if(config.openThrow)throw privateError();
      const settings={...config},values=config.values??defaultValues;
      const req={};requests.push(req);
      function success(){
        const db={closed:false,objectStoreNames:{contains(name){assert.equal(name,'clips');if(settings.storeNamesThrow)throw error(settings.errorName);return !settings.missingStore}},
          close(){stats.dbCloses++;this.closed=true},createObjectStore:write,deleteObjectStore:write,
          transaction(name,mode){
            stats.transactions++;assert.equal(name,'clips');assert.equal(mode,'readonly');
            if(settings.txThrow)throw error(settings.errorName);
            let index=0,aborted=false;
            const tx={error:settings.txErrorName?error(settings.txErrorName):null,
              abort(){if(aborted)return;aborted=true;stats.txAborts++;schedule(()=>tx.onabort?.())},
              objectStore(name){
                assert.equal(name,'clips');if(settings.storeThrow)throw error(settings.errorName);
                return {put:write,add:write,delete:write,clear:write,createIndex:write,deleteIndex:write,
                  openCursor(){
                    stats.cursorReads++;if(settings.cursorThrow)throw error(settings.errorName);
                    const c={error:settings.cursorErrorName?error(settings.cursorErrorName):null};
                    tx.cursorRequest=c;
                    function step(){
                      if(aborted)return;
                      if(settings.readError){c.onerror?.();return}
                      if(settings.txAbort){tx.onabort?.();return}
                      if(settings.txError){tx.onerror?.();return}
                      if(settings.earlyComplete){tx.oncomplete?.();return}
                      if(settings.versionChange){db.onversionchange?.();return}
                      if(index<values.length){
                        const value=values[index++];
                        c.result={get value(){stats.valueReads++;if(settings.valueThrow)throw error(settings.errorName);return value},get key(){stats.keyReads++;throw Error('Key read')},get primaryKey(){stats.keyReads++;throw Error('Key read')},continue(){if(settings.continueThrow)throw error(settings.errorName);schedule(step)},update:write,delete:write};
                        c.onsuccess?.();
                      }else{
                        c.result=null;c.onsuccess?.();settings.beforeComplete?.();
                        if(!settings.noComplete)schedule(()=>{if(!aborted)tx.oncomplete?.()});
                      }
                    }
                    schedule(step);return c;
                  }
                };
              }
            };
            db.tx=tx;return tx;
          }
        };
        connections.push(db);req.result=db;
        if(settings.upgrade){
          let aborted=false;
          req.transaction={abort(){if(aborted)return;aborted=true;stats.upgradeAborts++}};
          req.onupgradeneeded?.({target:req});
          if(!aborted){stats.upgradeCommits++;stats.writes++;req.onsuccess?.({target:req})}
          else schedule(()=>req.onerror?.({target:req}));
        }else req.onsuccess?.({target:req});
      }
      schedule(()=>{
        if(settings.blocked){req.onblocked?.();if(settings.lateSuccess)schedule(success);return}
        if(settings.openError){req.error=settings.openErrorValue??error(settings.errorName);req.onerror?.({target:req});return}
        success();
      });
      return req;
    }
  };
  const document={querySelector(selector){assert.equal(selector,'meta[name="sukun-build"]');if(config.buildThrow)throw error();return config.noBuild?null:{content:config.build??'r1017'}}};
  const localStorage={
    getItem(key){stats.storageReads++;assert.equal(key,KEY);if(config.storageReadThrow)throw error();return shared.get(key)??null},
    setItem(key,value){stats.storageWrites++;assert.equal(key,KEY);if(config.storageWriteThrow)throw error();if(!config.storageDropWrites)shared.set(key,value)},
    removeItem:write,clear:write
  };
  const window={document,localStorage,REC_DB:{open:write},fetch:write,navigator:{sendBeacon:write},SukunRecordingUpdateDiagnostics:Object.freeze({version:'r1016',snapshot:()=>({original:true})})};
  Object.defineProperty(window,'indexedDB',{get(){if(config.idbThrow)throw privateError();return config.noIDB?undefined:config.noOpen?{}:indexedDB}});
  const context=vm.createContext({window,Blob,console,Date:{now:()=>clock},setTimeout(fn,ms){const id=++timerId;timers.set(id,{fn,at:clock+ms});return id},clearTimeout:id=>timers.delete(id)});
  vm.runInContext(runtime,context,{filename:'recording-inspection-r1017.js'});
  const api=window.SukunRecordingInspection;
  return {api,window,context,config,shared,stats,requests,connections,pending,timers,RestrictedBlob,
    snapshot:()=>plain(api.snapshot()),
    async drain(){config.hold=false;while(pending.length){pending.shift()();await ticks()}await ticks()},
    async advance(ms){clock+=ms;for(const [id,timer]of [...timers])if(timer.at<=clock){timers.delete(id);timer.fn()}await ticks()},
    setClock(value){clock=value},
    assertNoWrites(){assert.equal(stats.writes,0);assert.equal(stats.upgradeCommits,0);assert.equal(stats.keyReads,0);assert.equal(stats.payloadReads,0)},
    assertClosed(){assert(connections.every(db=>db.closed),'Every acquired connection must close')}
  };
}
const validateObservation=value=>{
  assert.deepEqual(Object.keys(value).sort(),['at','build','status','count','blobBytes','errorCode'].sort());
  assert(Number.isSafeInteger(value.at));assert(/^r\d{1,8}$/.test(value.build)||value.build===null);
  if(value.status==='ok'){assert(Number.isSafeInteger(value.count));assert(Number.isSafeInteger(value.blobBytes));assert.equal(value.errorCode,null)}
  else{assert.equal(value.count,null);assert.equal(value.blobBytes,null);assert.equal(typeof value.errorCode,'string')}
};
async function test(name,fn){await fn();results.push({name,status:'PASS'})}
module.exports={environment,ticks,plain,runtime,root,KEY,OLD_KEY};
if(require.main===module)(async()=>{
  await test('Startup only loads own metadata and performs no scan or write',async()=>{
    const e=environment();await ticks();assert.deepEqual(e.snapshot(),{version:'r1017',phase:'idle',current:null,lastSuccessful:null,persistence:'available'});
    assert.equal(e.stats.opens,0);assert.equal(e.stats.enumerations,0);assert.equal(e.stats.storageWrites,0);assert.equal(e.timers.size,0);
  });
  await test('Successful read counts Blobs and size only; closes connection',async()=>{
    const e=environment(),out=await e.api.inspect();validateObservation(out);assert.equal(out.status,'ok');assert.equal(out.count,2);assert.equal(out.blobBytes,10);assert.equal(out.build,'r1017');assert.equal(e.snapshot().phase,'idle');e.assertClosed();e.assertNoWrites();assert.equal(e.stats.valueReads,2);assert.equal(e.timers.size,0);
  });
  await test('Successful empty store is an observed real zero',async()=>{const e=environment({values:[]}),out=await e.api.inspect();assert.equal(out.status,'ok');assert.equal(out.count,0);assert.equal(out.blobBytes,0);e.assertClosed()});
  await test('Zero-byte Blob is counted without reading its audio',async()=>{const e=environment({values:[new Blob([])]}),out=await e.api.inspect();assert.equal(out.count,1);assert.equal(out.blobBytes,0);e.assertNoWrites()});
  for(const [name,config,status,code]of[
    ['No IndexedDB',{noIDB:true},'unsupported','idb-unavailable'],
    ['No open method',{noOpen:true},'unsupported','idb-unavailable'],
    ['Missing enumerated database',{missingDB:true},'missing','db-missing'],
    ['Missing store',{missingStore:true},'missing','store-missing'],
    ['Database disappears after enumeration',{upgrade:true},'missing','db-missing'],
    ['No enumeration and missing database',{noDatabases:true,upgrade:true},'missing','db-missing'],
    ['Blocked open',{blocked:true},'blocked','db-blocked'],
    ['Synchronous open failure',{openThrow:true},'unavailable','db-open-failed'],
    ['Open request error',{openError:true},'unavailable','db-open-failed'],
    ['Enumeration throws',{databasesThrow:true},'unavailable','db-open-failed'],
    ['Enumeration rejects',{databasesReject:true},'unavailable','db-open-failed'],
    ['Malformed enumeration',{invalidDatabases:true},'unavailable','db-open-failed'],
    ['Object store names unavailable',{storeNamesThrow:true},'unavailable','read-failed'],
    ['Transaction throws',{txThrow:true},'unavailable','read-failed'],
    ['Object store throws',{storeThrow:true},'unavailable','read-failed'],
    ['Cursor creation throws',{cursorThrow:true},'unavailable','read-failed'],
    ['Cursor error',{readError:true},'unavailable','read-failed'],
    ['Transaction abort',{txAbort:true},'unavailable','read-aborted'],
    ['Transaction error',{txError:true},'unavailable','read-failed'],
    ['Transaction completes before exhaustion',{earlyComplete:true},'unavailable','read-failed'],
    ['Version change during read',{versionChange:true},'unavailable','read-aborted'],
    ['Cursor value inaccessible',{valueThrow:true},'unavailable','read-failed'],
    ['Cursor continuation fails',{continueThrow:true},'unavailable','read-failed'],
    ['Record is not a Blob',{values:[{privateName:'PRIVATE_RECORDING'}]},'unavailable','invalid-record']
  ])await test(name+' has unknown totals, closes, and never writes',async()=>{
    const e=environment(config),out=await e.api.inspect();validateObservation(out);assert.equal(out.status,status);assert.equal(out.errorCode,code);e.assertClosed();e.assertNoWrites();assert.equal(e.snapshot().lastSuccessful,null);assert.equal(e.timers.size,0);
    if(config.missingDB)assert.equal(e.stats.opens,0);if(config.upgrade)assert.equal(e.stats.upgradeAborts,1);
  });
  await test('Existing database works without enumeration support',async()=>{const e=environment({noDatabases:true}),out=await e.api.inspect();assert.equal(out.status,'ok');assert.equal(e.stats.enumerations,0);e.assertNoWrites();e.assertClosed()});
  await test('Only fixed native error classes survive; messages/stacks never persist',async()=>{
    for(const name of nativeErrors){const e=environment({openError:true,errorName:name}),out=await e.api.inspect();assert.equal(out.errorCode,name);assert.equal(out.status,'unavailable');assert(!JSON.stringify(e.snapshot()).includes('PRIVATE'));assert(!e.shared.get(KEY).includes('private.invalid'))}
  });
  await test('Native errors preserved across factory, enumeration, transaction and cursor paths',async()=>{
    for(const config of [{idbThrow:true},{databasesThrow:true},{databasesReject:true},{openThrow:true},{txThrow:true},{readError:true,cursorErrorName:'SecurityError'},{txError:true,txErrorName:'SecurityError'}]){
      const e=environment({...config,errorName:'SecurityError'}),out=await e.api.inspect();assert.equal(out.errorCode,'SecurityError');assert.equal(out.status,'unavailable');e.assertClosed();e.assertNoWrites();
    }
  });
  await test('Arbitrary exception names never become errorCode',async()=>{const e=environment({openError:true,errorName:'PRIVATE_URL https://private.invalid'}),out=await e.api.inspect();assert.equal(out.errorCode,'db-open-failed');assert(!JSON.stringify(out).includes('PRIVATE'))});
  await test('Exception name accessor is captured once and cannot bypass allowlist',async()=>{
    let reads=0;const value={get name(){return ++reads===1?'SecurityError':'PRIVATE_SECOND_VALUE'}},e=environment({openError:true,openErrorValue:value}),out=await e.api.inspect();assert.equal(out.errorCode,'SecurityError');assert.equal(reads,1);assert(!JSON.stringify(e.snapshot()).includes('PRIVATE'));
  });
  await test('Throwing exception name accessor falls back without leaking',async()=>{
    const value={get name(){throw error()}},e=environment({openError:true,openErrorValue:value});assert.equal((await e.api.inspect()).errorCode,'db-open-failed');
  });
  await test('Unsafe Blob size yields no partial totals',async()=>{const value=new Blob(['x']);Object.defineProperty(value,'size',{value:Number.MAX_SAFE_INTEGER+1});const e=environment({values:[value]}),out=await e.api.inspect();assert.equal(out.errorCode,'unsafe-total');assert.equal(out.count,null);e.assertClosed();e.assertNoWrites()});
  await test('Sum overflow yields no partial totals',async()=>{const value=new Blob(['x']);Object.defineProperty(value,'size',{value:Number.MAX_SAFE_INTEGER});const e=environment({values:[value,new Blob(['x'])]}),out=await e.api.inspect();assert.equal(out.errorCode,'unsafe-total');assert.equal(out.blobBytes,null);e.assertClosed()});
  await test('Negative or fractional Blob size is rejected',async()=>{for(const size of [-1,0.5,Infinity,NaN]){const value=new Blob([]);Object.defineProperty(value,'size',{value:size});const e=environment({values:[value]});assert.equal((await e.api.inspect()).errorCode,'unsafe-total')}});
  await test('Cursor exhaustion waits for transaction completion',async()=>{
    const e=environment({noComplete:true}),task=e.api.inspect();await ticks();assert.equal(e.snapshot().phase,'reading');assert.equal(e.snapshot().current,null);await e.advance(7999);assert.equal(e.snapshot().phase,'reading');await e.advance(1);const out=await task;assert.equal(out.status,'timed-out');assert.equal(out.errorCode,'read-timeout');e.assertClosed();assert.equal(e.stats.txAborts,1);
  });
  await test('Enumeration timeout cannot start a late read',async()=>{
    const e=environment({databasesHang:true}),task=e.api.inspect();await e.advance(8000);assert.equal((await task).status,'timed-out');e.config.resolveEnumeration([{name:'sukunRec'}]);await ticks();assert.equal(e.stats.opens,0);assert.equal(e.stats.storageWrites,1);
  });
  await test('Late open after timeout closes without reading or overwriting',async()=>{
    const e=environment({hold:true}),task=e.api.inspect();await ticks();await e.advance(8000);assert.equal((await task).status,'timed-out');const saved=e.shared.get(KEY);await e.drain();assert.equal(e.stats.cursorReads,0);e.assertClosed();assert.equal(e.shared.get(KEY),saved);
  });
  await test('Blocked then late success closes without scanning',async()=>{
    const e=environment({blocked:true,lateSuccess:true}),out=await e.api.inspect();await ticks();assert.equal(out.status,'blocked');assert.equal(e.stats.cursorReads,0);e.assertClosed();assert.equal(e.stats.storageWrites,1);
  });
  await test('Blocked then late upgrade still aborts and closes',async()=>{
    const e=environment({blocked:true,lateSuccess:true,upgrade:true,noDatabases:true}),out=await e.api.inspect();await ticks();assert.equal(out.status,'blocked');assert.equal(e.stats.upgradeAborts,1);e.assertClosed();e.assertNoWrites();assert.equal(e.snapshot().current.status,'blocked');
  });
  await test('Timeout then late upgrade still aborts and closes',async()=>{
    const e=environment({hold:true,upgrade:true,noDatabases:true}),task=e.api.inspect();await e.advance(8000);await task;await e.drain();assert.equal(e.stats.upgradeAborts,1);assert.equal(e.snapshot().current.status,'timed-out');e.assertClosed();e.assertNoWrites();
  });
  await test('Pre-aborted signal observes cancellation without opening',async()=>{
    const ctrl=new AbortController();ctrl.abort('PRIVATE_REASON');const e=environment(),out=await e.api.inspect({signal:ctrl.signal});assert.equal(out.status,'cancelled');assert.equal(out.errorCode,'inspection-cancelled');assert.equal(e.stats.opens,0);assert.equal(e.stats.enumerations,0);assert(!JSON.stringify(out).includes('PRIVATE'));
  });
  await test('Abort while opening closes late connection and suppresses reads',async()=>{
    const ctrl=new AbortController(),e=environment({hold:true}),task=e.api.inspect({signal:ctrl.signal});await ticks();ctrl.abort();assert.equal((await task).status,'cancelled');await e.drain();e.assertClosed();assert.equal(e.stats.cursorReads,0);assert.equal(e.stats.storageWrites,1);
  });
  await test('Abort while reading aborts transaction and removes handlers',async()=>{
    const ctrl=new AbortController(),e=environment({noComplete:true}),task=e.api.inspect({signal:ctrl.signal});await ticks();ctrl.abort();const out=await task;assert.equal(out.status,'cancelled');assert.equal(e.stats.txAborts,1);assert.equal(e.connections[0].tx.cursorRequest.onsuccess,null);e.assertClosed();e.assertNoWrites();
  });
  await test('Cancellation between cursor end and transaction completion cannot claim success',async()=>{
    const ctrl=new AbortController(),e=environment({beforeComplete:()=>ctrl.abort()});const out=await e.api.inspect({signal:ctrl.signal});assert.equal(out.status,'cancelled');assert.equal(e.snapshot().lastSuccessful,null);e.assertClosed();
  });
  await test('Concurrent calls coalesce one Promise and one scan',async()=>{
    const e=environment({hold:true}),a=e.api.inspect(),b=e.api.inspect(),c=e.api.inspect();assert.strictEqual(a,b);assert.strictEqual(b,c);assert.equal(e.snapshot().phase,'reading');await ticks();assert.equal(e.stats.opens,1);await e.drain();const out=await a;assert.strictEqual(await b,out);assert.equal(e.stats.storageWrites,1);e.assertNoWrites();
  });
  await test('A coalesced signal can cancel the shared observation',async()=>{
    const e=environment({hold:true}),ctrl=new AbortController(),a=e.api.inspect(),b=e.api.inspect({signal:ctrl.signal});assert.strictEqual(a,b);ctrl.abort();assert.equal((await a).status,'cancelled');assert.equal((await b).status,'cancelled');await e.drain();e.assertClosed();
  });
  await test('An already aborted joining signal still returns the same cancelled Promise',async()=>{
    const e=environment({hold:true}),ctrl=new AbortController(),a=e.api.inspect();ctrl.abort();const b=e.api.inspect({signal:ctrl.signal});assert.strictEqual(a,b);assert.equal((await b).status,'cancelled');await e.drain();
  });
  await test('New generation succeeds before an old cancelled open resolves',async()=>{
    const e=environment({hold:true}),ctrl=new AbortController(),old=e.api.inspect({signal:ctrl.signal});await ticks();ctrl.abort();await old;e.config.hold=false;e.config.values=[];const fresh=await e.api.inspect();assert.equal(fresh.status,'ok');assert.equal(fresh.count,0);const saved=e.shared.get(KEY);await e.drain();assert.equal(e.shared.get(KEY),saved);assert.equal(e.snapshot().current.count,0);e.assertClosed();e.assertNoWrites();
  });
  await test('A newer observation cannot be overwritten by old late cursor/completion callbacks',async()=>{
    const ctrl=new AbortController(),e=environment({noComplete:true}),old=e.api.inspect({signal:ctrl.signal});await ticks();const tx=e.connections[0].tx,lateComplete=tx.oncomplete,lateCursor=tx.cursorRequest.onsuccess;ctrl.abort();await old;e.config.noComplete=false;e.config.values=[];await e.api.inspect();const saved=e.shared.get(KEY);lateCursor();lateComplete();assert.equal(e.shared.get(KEY),saved);assert.equal(e.snapshot().current.count,0);
  });
  await test('Abort listeners and timers are released on completion',async()=>{
    const signal={aborted:false,listeners:new Set(),addEventListener(type,fn){assert.equal(type,'abort');this.listeners.add(fn)},removeEventListener(type,fn){assert.equal(type,'abort');this.listeners.delete(fn)}};
    const e=environment({hold:true}),a=e.api.inspect({signal}),b=e.api.inspect({signal});assert.strictEqual(a,b);assert.equal(signal.listeners.size,1);await e.drain();await a;assert.equal(signal.listeners.size,0);assert.equal(e.timers.size,0);
  });
  await test('A previous successful observation remains historical through every failure category',async()=>{
    for(const config of [{missingDB:true},{missingStore:true},{noIDB:true},{openError:true},{blocked:true},{noComplete:true},{hold:true}]){
      const e=environment();const good=await e.api.inspect();await e.advance(1000);Object.assign(e.config,config);const ctrl=new AbortController(),task=e.api.inspect({signal:ctrl.signal});await ticks();if(config.noComplete)await e.advance(8000);if(config.hold)ctrl.abort();const bad=await task;assert.notEqual(bad.status,'ok');assert.deepEqual(e.snapshot().lastSuccessful,plain(good));assert.equal(e.snapshot().current.count,null);await e.drain();
    }
  });
  await test('Reading exposes old observation with explicit reading phase',async()=>{
    const e=environment(),good=await e.api.inspect();e.config.hold=true;const next=e.api.inspect();assert.equal(e.snapshot().phase,'reading');assert.deepEqual(e.snapshot().current,plain(good));await e.drain();await next;
  });
  await test('Repeated observations stay bounded to latest and last success',async()=>{
    const e=environment();for(let i=0;i<20;i++){e.config.values=Array.from({length:i%3},()=>new Blob(['x']));await e.api.inspect()}const raw=e.shared.get(KEY),stored=JSON.parse(raw);assert.equal(e.shared.size,1);assert.deepEqual(Object.keys(stored).sort(),['schema','current','lastSuccessful'].sort());assert(raw.length<=2048);assert(/^[\x00-\x7f]*$/.test(raw));assert.equal(stored.current.count,1);assert.equal(e.stats.storageWrites,20);e.assertNoWrites();e.assertClosed();
  });
  await test('Successful new read replaces historical success including a real zero',async()=>{const e=environment();await e.api.inspect();e.config.values=[];await e.api.inspect();assert.equal(e.snapshot().lastSuccessful.count,0);assert.equal(e.snapshot().current.blobBytes,0)});
  await test('Reload restores sanitized metadata without scanning or rewriting',async()=>{
    const e=environment();await e.api.inspect();const saved=e.shared.get(KEY),next=environment({},e.shared);assert.deepEqual(next.snapshot().current,e.snapshot().current);assert.equal(next.stats.opens,0);assert.equal(next.stats.storageWrites,0);assert.equal(next.shared.get(KEY),saved);
  });
  await test('Local storage read failure does not prevent explicit inspection',async()=>{
    const e=environment({storageReadThrow:true});assert.equal(e.snapshot().persistence,'unavailable');assert.equal((await e.api.inspect()).status,'ok');assert.equal(e.snapshot().persistence,'unavailable');assert.equal(e.snapshot().current.count,2);
  });
  await test('Local storage write failure preserves in-memory observation and success',async()=>{
    const e=environment({storageWriteThrow:true});assert.equal((await e.api.inspect()).status,'ok');assert.equal(e.snapshot().persistence,'unavailable');assert.equal(e.snapshot().lastSuccessful.count,2);assert.equal(e.shared.size,0);
  });
  await test('Silently dropped storage writes are reported unavailable',async()=>{const e=environment({storageDropWrites:true});await e.api.inspect();assert.equal(e.snapshot().persistence,'unavailable')});
  await test('Persistence can recover on a later explicit inspection',async()=>{
    const e=environment({storageWriteThrow:true});await e.api.inspect();e.config.storageWriteThrow=false;await e.api.inspect();assert.equal(e.snapshot().persistence,'available');assert(e.shared.get(KEY));
  });
  await test('Observation, snapshot and nested cached fields are deeply frozen',async()=>{
    const e=environment(),out=await e.api.inspect(),a=e.api.snapshot(),b=e.api.snapshot();assert(Object.isFrozen(out));assert(Object.isFrozen(a));assert(Object.isFrozen(a.current));assert(Object.isFrozen(a.lastSuccessful));assert.notStrictEqual(a,b);assert.notStrictEqual(a.current,b.current);assert.throws(()=>{out.count=123});assert.throws(()=>{a.current.count=123});assert.equal(e.snapshot().current.count,2);
  });
  await test('Untrusted fields and malformed builds cannot escape sanitized load',async()=>{
    const e=environment();await e.api.inspect();const raw=JSON.parse(e.shared.get(KEY));raw.privateName='PRIVATE_ROOT';raw.current.privateName='PRIVATE_CURRENT';raw.lastSuccessful.secret='PRIVATE_LAST';raw.current.build='https://private.invalid';e.shared.set(KEY,JSON.stringify(raw));const next=environment({},e.shared),s=next.snapshot();assert.equal(s.current.build,null);assert.equal(s.lastSuccessful.build,null);assert(!JSON.stringify(s).includes('PRIVATE'));validateObservation(s.current);validateObservation(s.lastSuccessful);
  });
  await test('Malformed, oversized, non-ASCII, or wrong-schema storage is ignored',async()=>{
    for(const raw of ['{bad JSON','x'.repeat(2049),'{"schema":1,"current":"ö"}','null','[]','{"schema":2}','{"private":"PRIVATE"}']){const e=environment({},new Map([[KEY,raw]]));assert.equal(e.snapshot().current,null);assert.equal(e.snapshot().lastSuccessful,null);assert.equal(e.stats.opens,0);assert.equal(e.stats.storageWrites,0);assert.equal(e.snapshot().persistence,'available')}
  });
  await test('Invalid cached statuses, codes, timestamps and totals are rejected',async()=>{
    const good={at:1800000000000,build:'r1017',status:'ok',count:1,blobBytes:5,errorCode:null};
    for(const patch of [{status:'PRIVATE'},{status:'unavailable',count:null,blobBytes:null,errorCode:'PRIVATE'},{at:-1},{at:0.5},{at:8640000000000001},{count:-1},{count:0},{count:0.5},{blobBytes:Number.MAX_SAFE_INTEGER+1},{errorCode:'read-failed'}]){
      const v={...good,...patch},e=environment({},new Map([[KEY,JSON.stringify({schema:1,current:v,lastSuccessful:v})]]));assert.equal(e.snapshot().current,null);assert.equal(e.snapshot().lastSuccessful,null);
    }
  });
  await test('Unknown outcomes cannot carry zero totals or mismatched fixed codes',async()=>{
    for(const [status,code]of [['missing','db-missing'],['blocked','db-blocked'],['timed-out','read-timeout'],['cancelled','inspection-cancelled'],['unsupported','idb-unavailable'],['unavailable','read-failed']]){
      const bad={at:1800000000000,build:'r1017',status,count:0,blobBytes:0,errorCode:code},e=environment({},new Map([[KEY,JSON.stringify({schema:1,current:bad,lastSuccessful:null})]]));assert.equal(e.snapshot().current,null);
      bad.count=bad.blobBytes=null;bad.errorCode=status==='missing'?'read-timeout':'db-missing';const next=environment({},new Map([[KEY,JSON.stringify({schema:1,current:bad,lastSuccessful:null})]]));assert.equal(next.snapshot().current,null);
    }
  });
  await test('A persisted failure restores its prior success as historical only',async()=>{
    const e=environment();await e.api.inspect();e.config.openError=true;await e.api.inspect();const next=environment({},e.shared);assert.equal(next.snapshot().current.status,'unavailable');assert.equal(next.snapshot().current.count,null);assert.equal(next.snapshot().lastSuccessful.status,'ok');
  });
  await test('Clock corrections do not replace failed current with a later-dated old success',async()=>{
    const e=environment();await e.api.inspect();e.setClock(1700000000000);e.config.openError=true;await e.api.inspect();const next=environment({},e.shared);assert.equal(next.snapshot().current.status,'unavailable');assert(next.snapshot().lastSuccessful.at>next.snapshot().current.at);
  });
  await test('Build is read from current meta for each explicit observation',async()=>{
    const e=environment();await e.api.inspect();e.config.build='r1018';assert.equal((await e.api.inspect()).build,'r1018');e.config.build='PRIVATE_BUILD';assert.equal((await e.api.inspect()).build,null);e.config.buildThrow=true;assert.equal((await e.api.inspect()).build,null);
  });
  await test('Existing update receipts and diagnostics remain byte-for-byte unchanged',async()=>{
    const shared=new Map([[OLD_KEY,'ORIGINAL_UPDATE_RECEIPT']]),e=environment({},shared),original=e.window.SukunRecordingUpdateDiagnostics;await e.api.inspect();assert.equal(shared.get(OLD_KEY),'ORIGINAL_UPDATE_RECEIPT');assert.strictEqual(e.window.SukunRecordingUpdateDiagnostics,original);assert.equal(shared.size,2);
  });
  await test('Double script load preserves unique API and in-flight state',async()=>{
    const e=environment({hold:true}),original=e.api,task=e.api.inspect();vm.runInContext(runtime,e.context);assert.strictEqual(e.window.SukunRecordingInspection,original);await e.drain();await task;assert.equal(e.stats.opens,1);
  });
  await test('Production source contains no data/schema writes, payload/network or recorder open calls',async()=>{
    assert(!/\.arrayBuffer\s*\(|\.text\s*\(|\.stream\s*\(|FileReader|\.key\b|primaryKey|fetch\s*\(|XMLHttpRequest|sendBeacon|\.put\s*\(|\.delete\s*\(|\.clear\s*\(|createObjectStore\s*\(|deleteObjectStore\s*\(|deleteDatabase\s*\(|REC_DB\.open/.test(runtime));
    assert.equal((runtime.match(/\.setItem\s*\(/g)||[]).length,1);assert(!runtime.includes('readwrite'));assert(runtime.includes("db.transaction('clips','readonly')"));
  });
  console.log(JSON.stringify({status:'PASS',total:results.length,passed:results.length,failed:0,scenarios:results,limits:['Actual shipped runtime evaluated in Node VM with controlled IndexedDB, storage, timer and AbortSignal events; not real-browser IndexedDB or physical-device testing.','No microphone, playback, storage eviction, quota or recovery claim is tested or made.']},null,2));
})().catch(err=>{console.error(err);process.exitCode=1});
