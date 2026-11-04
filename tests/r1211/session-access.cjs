const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

// Execute the actual read model. The fixtures provide owner snapshots, not a
// second implementation of the access/presentation decision being tested.
function model() {
  let open = true, selected = '28', stopped = 0;
  const direct = {cat:'esma',idx:4,name:'Esma fixture',count:12,countRaw:12,target:99,length:99};
  const saved = {run:false,paused:true,systemHold:false,i:0,rep:246};
  const events = new Map(), microtasks = [];
  const on = (type, fn) => { if (!events.has(type)) events.set(type, []); events.get(type).push(fn); };
  const emit = (type) => { for (const fn of events.get(type) || []) fn({type}); };
  const window = {
    SUKUN_BUILD:'r1211', I18N:{lang:'tr'},
    addEventListener:on, dispatchEvent:event => { emit(event.type); return true; },
    currentZikirState:{snapshot:() => ({...direct})},
    SukunSecretPolicy:{unlocked:() => open},
    SukunJourneyController:{target:() => selected},
    SukunBerhetiyyeSeyir:{
      state:() => ({...saved}),
      display:() => open ? {index:saved.i,name:'Private fixture',count:saved.rep,target:622} : null,
      stop:() => { stopped++; saved.paused=false; saved.run=false; return true; },
    },
    SukunEsma99Seyir:{state:() => ({}),display:() => ({index:4,name:direct.name,count:12,target:99})},
  };
  const document = {hidden:false,visibilityState:'visible',readyState:'loading',
    body:{classList:{contains:() => false}},querySelector:() => null,addEventListener:() => {}};
  const context = {window,document,queueMicrotask:fn => microtasks.push(fn),
    CustomEvent:class {constructor(type,options={}) {this.type=type;this.detail=options.detail;}},
    ZIKIR:{esma:{items:[{}]},berhet:{items:[{}]}},console,Date,Promise};
  vm.runInNewContext(fs.readFileSync('assets/runtime/session-r919.js','utf8'),context);
  return {api:window.SukunSessionState,direct,saved,
    access(value,type='sukun:secretaccesschange') {open=value;emit(type);},
    select(value) {selected=value;},
    stops:() => stopped,
    flush() {while(microtasks.length) microtasks.shift()();},
  };
}

(async () => {
  const m=model();
  assert.equal(m.api.peek().activeMode,'berhet');
  assert.equal(m.api.peek().count,246);
  m.access(false);
  // Immediate peek must reflect revocation, before queued microtasks paint.
  assert.equal(m.api.peek().activeMode,'esma');
  assert.equal(m.api.peek().count,12);
  assert.equal(m.api.peek().target,99);
  assert.equal(m.api.peek().journeyKind,'single');
  assert.equal(m.saved.rep,246);
  assert.equal(m.saved.paused,true);
  assert.equal(m.stops(),0);
  m.access(true);
  assert.equal(m.api.peek().activeMode,'berhet');
  assert.equal(m.api.peek().count,246);
  m.access(false,'sukun:secretpolicyready');
  assert.equal(m.api.peek().activeMode,'esma');
  // The hidden retained owner is still addressable by the real Stop route.
  const stopped=await m.api.command('stop');
  assert.equal(stopped.accepted,true);
  assert.equal(m.stops(),1);
  assert.equal(m.saved.rep,246);
  assert.equal(m.saved.i,0);
  // A locked restored direct selection stays recoverable for the UI curtain;
  // a read-model refresh must never silently select another zikr or reset it.
  Object.assign(m.direct,{cat:'berhet',idx:0,count:246,countRaw:246,target:622});
  m.select('single');m.api.refresh('restore-fixture');
  assert.equal(m.api.peek().activeMode,'berhet');
  assert.equal(m.direct.count,246);
  assert.equal(m.direct.target,622);
  m.access(true);assert.equal(m.api.peek().count,246);
  console.log('PASS: access events clear private journey precedence synchronously; retained counts and native Stop ownership survive lock/reopen');
})().catch(error=>{console.error(error);process.exitCode=1;});
