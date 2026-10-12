'use strict';
const path=require('node:path'),assert=require('node:assert/strict');
const {fixture,record,bank,file,wav,plain,flush}=require('./generic-bank-fixture.cjs');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..')),results=[];
async function test(name,fn){try{await fn();results.push({name,passed:true})}catch(error){results.push({name,passed:false,error:error.stack})}}
async function loaded(options={}){const f=fixture(root,options);await f.api.ready();await f.import(bank());return f}
async function unchanged(f,before){assert.equal(f.state().bankId,before.bankId);assert.equal(f.state().count,before.count);assert.equal(f.history.commits,before.commits);assert.equal(f.api.epoch(),before.epoch);assert.deepEqual([...f.keys],['esma:0:nida']);assert.equal(await f.personal.get('esma:0:nida').text(),'PRIVATE_PERSONAL_VOICE');assert.equal(f.history.personalAccess.length,0)}
const baseline=f=>({...f.state(),commits:f.history.commits,epoch:f.api.epoch()});
(async()=>{
 await test('cold empty bank defaults off and reads only independent storage',async()=>{
  const f=fixture(root);await f.api.ready();assert.equal(f.state().enabled,false);assert.equal(f.state().ready,false);assert.equal(f.state().count,0);assert.equal(await f.api.find(['esma:0:nida']),null);assert.equal(f.api.signature(['esma:0:nida']),'archive:off');assert.equal(f.history.commits,0);assert(f.history.opens.every(x=>x.name==='sukunGenericRec'));assert.equal(f.history.personalAccess.length,0);assert.deepEqual(f.history.lsReads,['sukun.generic.recordings.enabled.v1']);
 });
 await test('validated import atomically creates separate bank while personal data and settings are preserved',async()=>{
  const f=fixture(root);f.storage.set('sukun.total','PRIVATE_COUNTER');f.storage.set('sukun.voice.settings','PRIVATE_SETTINGS');await f.api.ready();const out=await f.import(bank([record('esma:0:nida'),record('berhet:1',wav(2))]));assert.equal(out.ok,true);assert.equal(f.state().count,2);assert.equal(f.state().enabled,false);assert.equal(f.history.commits,1);assert(f.history.transactions.filter(t=>t.mode==='readwrite').every(t=>t.name==='sukunGenericRec'&&t.names.includes('clips')&&t.names.includes('meta')));assert.equal(f.history.personalAccess.length,0);assert.equal(await f.personal.get('esma:0:nida').text(),'PRIVATE_PERSONAL_VOICE');assert.deepEqual([...f.keys],['esma:0:nida']);assert.equal(f.storage.get('sukun.total'),'PRIVATE_COUNTER');assert.equal(f.storage.get('sukun.voice.settings'),'PRIVATE_SETTINGS');assert(f.history.lsWrites.every(([key])=>key==='sukun.generic.recordings.bank.v1'));assert.deepEqual(f.history.maintenance,['generic-archive-import']);
 });
 await test('enabled lookup has namespaced ownership without adding an archive key to personal RECKEYS',async()=>{
  const f=await loaded();await f.api.setEnabled(true);const found=await f.api.find(['esma:99:nida','esma:0:nida']);assert.equal(found.canonicalKey,'esma:0:nida');assert.equal(found.key,'archive:'+f.state().bankId+':esma:0:nida');assert.equal(found.generic,true);assert.equal(found.genericEpoch,f.api.epoch());assert.equal(found.blob.size,wav().length);assert.equal(f.api.hasKnown(['esma:0:nida']),true);assert.equal(f.api.hasKnown(['esma:1:nida']),false);assert.deepEqual([...f.keys],['esma:0:nida']);
 });
 await test('disabling bank invalidates signature and prevents all further payload reads',async()=>{
  const f=await loaded();await f.api.setEnabled(true);const sig=f.api.signature(['esma:0:nida']),epoch=f.api.epoch();await f.api.setEnabled(false);const transactions=f.history.transactions.length;assert(f.api.epoch()>epoch);assert.notEqual(f.api.signature(['esma:0:nida']),sig);assert.equal(await f.api.find(['esma:0:nida']),null);assert.equal(f.api.hasKnown(['esma:0:nida']),false);assert.equal(f.history.transactions.length,transactions);
 });
 await test('same-key replacement changes content identity and epoch used by prepared lookups',async()=>{
  const f=await loaded();await f.api.setEnabled(true);const first=await f.api.find(['esma:0:nida']),signature=f.api.signature(['esma:0:nida']);await f.import(bank([record('esma:0:nida',wav(3))]));const next=await f.api.find(['esma:0:nida']);assert.notEqual(next.key,first.key);assert(next.genericEpoch>first.genericEpoch);assert.notEqual(f.api.signature(['esma:0:nida']),signature);assert.notDeepEqual(await first.blob.arrayBuffer().then(Buffer.from),await next.blob.arrayBuffer().then(Buffer.from));
 });
 for(const [name,mutate]of[
  ['reserved archive key',r=>{r.key='archive:injected'}],['prototype key',r=>{r.key='__proto__'}],['path or URL key',r=>{r.key='https://private.invalid/clip'}],['non-audio MIME',r=>{r.type='text/html';r.data='data:text/html;base64,PHNjcmlwdD4='}],['MIME declaration mismatch',r=>{r.data='data:audio/webm;base64,'+wav().toString('base64')}],['byte count mismatch',r=>{r.bytes++}],['audio payload tamper',r=>{r.data='data:audio/wav;base64,'+wav(7).toString('base64')}],['noncanonical base64',r=>{r.data='data:audio/wav;base64,AB=='}],['clip hash mismatch',r=>{r.sha256='0'.repeat(64)}]
 ])await test(`${name} rejects the complete import while old bank remains committed`,async()=>{
  const f=await loaded(),before=baseline(f),replacement=record('esma:1:nida');mutate(replacement);await assert.rejects(f.import(bank([record('esma:2:nida',wav(2)),replacement])));await unchanged(f,before);assert.equal(f.state().busy,false);
 });
 await test('bank digest tamper and conflicting duplicate keys never commit a partial replacement',async()=>{
  const f=await loaded(),before=baseline(f),bad=bank([record('esma:1:nida')]);bad.bankSha256='f'.repeat(64);await assert.rejects(f.import(bad));await unchanged(f,before);await assert.rejects(f.import(bank([record('esma:1:nida'),record('esma:1:nida',wav(2))])));await unchanged(f,before);
 });
 await test('transaction abort rolls back clips and metadata together, retaining old live bank',async()=>{
  const f=await loaded();await f.api.setEnabled(true);const before=baseline(f),original=await f.api.find(['esma:0:nida']);f.faults.abortWrite=true;await assert.rejects(f.import(bank([record('esma:1:nida',wav(4))])));await unchanged(f,before);assert.equal(f.history.aborts,1);assert.equal((await f.api.find(['esma:0:nida'])).key,original.key);assert.equal(await f.api.find(['esma:1:nida']),null);
 });
 await test('cancelled or stale validation cannot open a replacement transaction',async()=>{
  const f=await loaded(),before=baseline(f),controller=new AbortController();controller.abort();await assert.rejects(f.api.importFiles([file(bank([record('esma:1:nida')]))],{signal:controller.signal}));await unchanged(f,before);await assert.rejects(f.api.importFiles([file(bank([record('esma:1:nida')]))],{isCurrent:()=>false}));await unchanged(f,before);
 });
 await test('oversized input rejects before parsing any JSON and preserves prior bank',async()=>{
  const f=await loaded(),before=baseline(f);let parses=0;await assert.rejects(f.api.importFiles([{size:f.api.limits.files+1,text(){parses++;return Promise.resolve('{}')}}]),error=>error.code==='archive-limit');assert.equal(parses,0);await unchanged(f,before);
 });
 await test('cancel retires a pending file read and its eventual result cannot replace bank',async()=>{
  const f=await loaded(),before=baseline(f);let release;const source=file(bank([record('esma:1:nida')])),pending={size:source.size,text:()=>new Promise(resolve=>{release=resolve})};const task=f.api.importFiles([pending]);await flush();assert.equal(f.state().busy,true);f.api.cancel();release(await source.text());await assert.rejects(task);await unchanged(f,before);assert.equal(f.state().busy,false);
 });
 await test('pending enabled lookup cannot return audio after its preference changes',async()=>{
  const f=await loaded();await f.api.setEnabled(true);f.faults.holdReads=true;const task=f.api.find(['esma:0:nida']),rejection=assert.rejects(task,error=>error.name==='AbortError');await flush();assert(f.held.length);await f.api.setEnabled(false);await f.release();await rejection;assert.equal(f.api.signature(['esma:0:nida']),'archive:off');
 });
 await test('pending lookup rejects its old payload when same-key content is atomically replaced',async()=>{
  const f=await loaded();await f.api.setEnabled(true);f.faults.holdReads=true;const task=f.api.find(['esma:0:nida']),rejection=assert.rejects(task,error=>error.name==='AbortError');await flush();assert(f.held.length);await f.import(bank([record('esma:0:nida',wav(5))]));await f.release();await rejection;const current=await f.api.find(['esma:0:nida']);assert.deepEqual(Buffer.from(await current.blob.arrayBuffer()),wav(5));
 });
 await test('lookup is cancelled for aborted signal or changed caller ownership without personal writes',async()=>{
  const f=await loaded();await f.api.setEnabled(true);let current=true;f.faults.holdReads=true;const task=f.api.find(['esma:0:nida'],{isCurrent:()=>current}),rejection=assert.rejects(task,error=>error.name==='AbortError');await flush();current=false;await f.release();await rejection;const signal=new AbortController();signal.abort();await assert.rejects(f.api.find(['esma:0:nida'],{signal:signal.signal}),error=>error.name==='AbortError');assert.equal(f.history.personalAccess.length,0);
 });
 await test('pending lookup has a bounded timeout and cannot revive after its late storage result',async()=>{
  const f=await loaded();await f.api.setEnabled(true);f.faults.holdReads=true;await assert.rejects(f.api.find(['esma:0:nida'],{timeoutMs:4}),error=>error.code==='archive-timeout');await f.release();assert.equal(f.history.personalAccess.length,0);assert.equal(f.history.commits,1);
 });
 await test('stored payload corruption fails integrity instead of supplying unverified audio',async()=>{
  const f=await loaded();await f.api.setEnabled(true);const clips=f.disk.get('sukunGenericRec').get('clips'),old=clips.get('esma:0:nida');clips.set('esma:0:nida',{...old,blob:new Blob([wav(8)],{type:'audio/wav'})});await assert.rejects(f.api.find(['esma:0:nida']),error=>error.code==='archive-integrity');assert.equal(f.state().errorCode,'archive-integrity');assert.equal(f.history.personalAccess.length,0);
 });
 await test('export includes only bank recordings and round-trips sorted keys and hashes',async()=>{
  const f=await loaded();await f.import(bank([record('esma:1:nida',wav(2)),record('berhet:1',wav(3))]));f.storage.set('sukun.total','PRIVATE_COUNTER');f.storage.set('sukun.voice.settings','PRIVATE_SETTINGS');const ls=f.history.lsReads.length,writes=f.history.lsWrites.length,out=await f.api.exportBank(),text=await out.blob.text(),value=JSON.parse(text);assert.deepEqual(Object.keys(value).sort(),['app','schema','bankSha256','records'].sort());assert.deepEqual(value.records.map(r=>r.key),['berhet:1','esma:1:nida']);assert(!/PRIVATE_|sukun\.total|settings|__blob/.test(text));assert.equal(f.history.lsReads.length,ls);assert.equal(f.history.lsWrites.length,writes);assert.equal(f.history.personalAccess.length,0);assert.equal(f.history.downloads.length,0);const other=fixture(root);await other.api.ready();const result=await other.api.importFiles([out.blob]);assert.equal(result.bankId,value.bankSha256);assert.equal(other.state().count,2);
 });
 await test('legacy full personal backup contributes only its audio to the independent bank',async()=>{
  const f=await loaded(),bytes=wav(9),data={app:'SUKUN',fmt:2,ls:{'sukun.total':'PRIVATE_COUNTER','sukun.voice.settings':'PRIVATE_SETTINGS'},idb:{sukunRec:{'esma:1:nida':{__blob:'data:audio/wav;base64,'+bytes.toString('base64'),type:'audio/wav'}},sukunCustomAmb:{private:'PRIVATE_AMBIENCE'}}};const out=await f.import(data);assert.equal(out.ok,true);assert.equal(out.legacyFiles,1);assert.equal(f.state().count,1);assert.equal(f.storage.has('sukun.total'),false);assert.equal(f.storage.has('sukun.voice.settings'),false);assert.equal(f.history.personalAccess.length,0);assert.equal(await f.personal.get('esma:0:nida').text(),'PRIVATE_PERSONAL_VOICE');
 });
 await test('native full backup integrity failure cannot bypass its existing validator or replace old bank',async()=>{
  const f=await loaded(),before=baseline(f);let calls=0;f.c.SukunRecordingSalvage={validateNativeJSON:async()=>{calls++;throw Error('native digest mismatch')}};const data={app:'SUKUN',fmt:2,recovery:{schema:1},ls:{'sukun.total':'PRIVATE_COUNTER'},idb:{sukunRec:{'esma:1:nida':{__blob:record().data,type:'audio/wav'}}}};await assert.rejects(f.import(data),error=>error.code==='archive-integrity');assert.equal(calls,1);await unchanged(f,before);
 });
 await test('preference persistence failure keeps generic use disabled and invalidates cached ownership',async()=>{
  const f=await loaded(),epoch=f.api.epoch();f.faults.preferenceWrite=true;await assert.rejects(f.api.setEnabled(true),error=>error.code==='archive-preference');assert.equal(f.state().enabled,false);assert(f.api.epoch()>epoch);assert.equal(await f.api.find(['esma:0:nida']),null);
 });
 await test('storage failures return archive error without writing or reading personal recordings',async()=>{
  const f=await loaded();await f.api.setEnabled(true);f.faults.readError=true;await assert.rejects(f.api.find(['esma:0:nida']),error=>error.code==='archive-storage');assert.equal(f.history.personalAccess.length,0);assert.equal(await f.personal.get('esma:0:nida').text(),'PRIVATE_PERSONAL_VOICE');
 });
 await test('startup rehydrates committed bank without enabling it or rewriting data',async()=>{
  const f=await loaded(),next=fixture(root,{disk:f.disk,storage:f.storage});await next.api.ready();assert.equal(next.state().bankId,f.state().bankId);assert.equal(next.state().count,1);assert.equal(next.state().enabled,false);assert.equal(next.history.commits,0);assert.equal(next.history.lsWrites.length,0);assert(next.history.opens.every(x=>x.name==='sukunGenericRec'));
 });
 await test('empty bundled manifest and unsafe bundled paths cannot erase an existing imported bank',async()=>{
  const f=await loaded(),before=baseline(f),calls=[];let manifest={app:'SUKUN_GENERIC_RECORDINGS',schema:1,records:[]};f.c.fetch=async(url,opt)=>{calls.push(String(url));assert.equal(opt.credentials,'same-origin');return{ok:true,headers:{get:()=>null},blob:async()=>file(manifest)}};await assert.rejects(f.api.loadBundled(),error=>error.code==='archive-empty');await unchanged(f,before);manifest=bank([record('esma:1:nida')]);manifest.records[0].file='../outside.wav';await assert.rejects(f.api.loadBundled(),error=>error.code==='archive-invalid');await unchanged(f,before);assert.equal(calls.length,2);assert(calls.every(url=>url==='https://example.invalid/sukun/assets/generic-recordings/manifest.json'));
 });
 const report={method:'Production generic-bank module with cryptographic hashes and transaction-faithful controlled IDB; synthetic PCM/JSON bytes. No real profile, physical device or audible playback claim.',passed:results.filter(r=>r.passed).length,total:results.length,results};console.log(JSON.stringify(report,null,2));if(report.passed!==report.total)process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1});
