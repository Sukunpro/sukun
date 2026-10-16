const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.resolve(__dirname, '../../assets/berhetiyye-gate/access-r1080.js'), 'utf8');
function fixture(options = {}) {
  let configured = options.configured !== false, open = !!options.open, pin = 'fixture-pin';
  const calls = {verify:0, unlock:0, lock:0, selected:[], storage:0};
  const forbidden = () => { calls.storage++; throw new Error('Persistent storage must not be touched'); };
  const window = {
    I18N:{lang:'tr'}, localStorage:{getItem:forbidden,setItem:forbidden},sessionStorage:{getItem:forbidden,setItem:forbidden},
    KLT_KURULU:() => configured, KLT_ACIK:() => open,
    kltDogrula:code => { calls.verify++; return configured && code === pin; },
    KLT_AC:code => { calls.unlock++; if (!configured) throw new Error('Unexpected enrollment'); if (code !== pin) return false; open = true; return true; },
    KLT_KILITLE:() => { calls.lock++; open = false; },
    SukunSessionState:{snapshot:() => ({activeMode:'esma',playing:true}),command:async (action, options) => { calls.selected.push({action,options}); return {accepted:true}; }},
    SukunBerhetGatePrivacy:{lock:() => { calls.lock++; open = false; return true; }, unlock:() => { open = true; return true; }}
  };
  const document = {documentElement:{lang:'tr'}};
  vm.runInNewContext(source, {window,document,AbortController,Promise,Date:options.Date||Date});
  return {adapter:window.SukunBerhetGateAccess,window,document,calls,setPin:value => {pin=value;},setConfigured:value => {configured=value;},setOpen:value => {open=value;}};
}
function providerFixture() {
  let active = false, commits = 0, revoked = 0;
  const receipt = {};
  const provider = {verify:async () => ({ok:true,receipt}),commit:value => {commits++; if (value !== receipt) return {ok:false}; active=true; return {ok:true};},isActive:() => active,revoke:async () => {revoked++;active=false;return {ok:true};}};
  return {provider,receipt,commits:() => commits,revoked:() => revoked,setActive:value => {active=value;}};
}
test('unconfigured device never accepts, enrolls, persists or opens the first supplied password', async () => {
  const f=fixture({configured:false});
  assert.equal(f.adapter.needsSetup(),true);
  const result=await f.adapter.verify('first-password');
  assert.equal(result.ok,false); assert.equal(result.error,'unavailable');
  assert.equal(f.calls.unlock,0); assert.equal(f.calls.storage,0); assert.equal(f.calls.verify,0);
  await assert.rejects(f.adapter.sessionOpened());
});
test('configured PIN verification is read-only and commit alone opens existing access', async () => {
  const f=fixture();
  assert.equal((await f.adapter.verify(' fixture-pin ')).ok,true);
  assert.equal(f.adapter.isUnlocked(),false); assert.equal(f.calls.unlock,0);
  assert.equal(f.adapter.snapshot().pending,true);
  assert.equal((await f.adapter.sessionOpened()).ok,true);
  assert.equal(f.adapter.isUnlocked(),true); assert.equal(f.calls.unlock,1);
  assert.equal(f.calls.verify,2); assert.equal(f.calls.storage,0); assert.equal(f.calls.selected.length,0);
  assert.equal(f.adapter.snapshot().pending,false);
  assert.equal(JSON.stringify(f.adapter.snapshot()).includes('fixture-pin'),false);
  await assert.rejects(f.adapter.sessionOpened());
});
test('wrong PIN and empty input never unlock or select any dhikr', async () => {
  const f=fixture();
  for (const code of ['', ' ', 'wrong-pin']) assert.equal((await f.adapter.verify(code)).ok,false);
  assert.equal(f.calls.unlock,0); assert.equal(f.calls.selected.length,0); assert.equal(f.adapter.isUnlocked(),false);
});
test('aborting after successful verification clears the transient credential and blocks commit', async () => {
  const f=fixture(),controller=new AbortController();
  assert.equal((await f.adapter.verify('fixture-pin',{signal:controller.signal})).ok,true);
  controller.abort();
  assert.equal(f.adapter.snapshot().pending,false);
  await assert.rejects(f.adapter.sessionOpened({signal:controller.signal}),{name:'AbortError'});
  assert.equal(f.calls.unlock,0);
});
test('PIN changed or removed between verification and commit fails closed', async () => {
  for (const change of [f => f.setPin('replacement'),f => f.setConfigured(false)]) {
    const f=fixture(); await f.adapter.verify('fixture-pin'); change(f);
    await assert.rejects(f.adapter.sessionOpened(),{code:'unavailable'}); assert.equal(f.calls.unlock,0);
  }
});
test('a newer failed verification invalidates an older successful one', async () => {
  const f=fixture(); await f.adapter.verify('fixture-pin'); await f.adapter.verify('wrong');
  await assert.rejects(f.adapter.sessionOpened()); assert.equal(f.calls.unlock,0);
});
test('existing local unlocked state is compatible, but verification does not select playback', async () => {
  const f=fixture({open:true});
  assert.equal(f.adapter.isUnlocked(),true);
  assert.equal(f.calls.selected.length,0);
  f.window.SukunSessionState.snapshot=() => ({activeMode:'berhet',playing:true,activeIndex:12,count:27});
  await f.adapter.enter(); assert.equal(f.calls.selected.length,0);
});
test('explicit enter uses canonical selection with no autoplay, restart or index reset', async () => {
  const f=fixture({open:true}); await f.adapter.enter();
  assert.equal(f.calls.selected.length,1); assert.equal(f.calls.selected[0].action,'select');
  assert.equal(f.calls.selected[0].options.mode,'berhet'); assert.equal(f.calls.selected[0].options.journeyKind,'single');
  assert.equal(f.calls.selected[0].options.index,undefined);
  f.setOpen(false); await assert.rejects(f.adapter.enter()); assert.equal(f.calls.selected.length,1);
});
test('entry checks aborted intents and canonical selection rejection', async () => {
  const f=fixture({open:true}),controller=new AbortController(); controller.abort();
  await assert.rejects(f.adapter.enter({signal:controller.signal}),{name:'AbortError'});
  assert.equal(f.calls.selected.length,0);
  f.window.SukunSessionState.command=async () => ({accepted:false});
  await assert.rejects(f.adapter.enter(),{code:'unavailable'});
});
test('explicit session lock uses queue-preserving bridge and never resets PIN or storage', async () => {
  const f=fixture({open:true}); f.window.GlobalQueue={};
  assert.equal((await f.adapter.endSession()).ok,true);
  assert.equal(f.adapter.isUnlocked(),false); assert.equal(f.adapter.needsSetup(),false); assert.equal(f.calls.lock,1); assert.equal(f.calls.storage,0);
  assert.equal((await f.adapter.verify('fixture-pin')).ok,true);
});
test('without preservation bridge, an installed queue cannot be destructively locked', async () => {
  const f=fixture({open:true}); delete f.window.SukunBerhetGatePrivacy; f.window.GlobalQueue={};
  await assert.rejects(f.adapter.endSession(),{code:'unavailable'});
  assert.equal(f.calls.lock,0); assert.equal(f.adapter.isUnlocked(),true);
});
test('configured server provider is authoritative and local open/PIN cannot bypass it', async () => {
  const f=fixture({open:true}),p=providerFixture(); f.window.SUKUN_BERHET_ACCESS_PROVIDER=p.provider;
  p.provider.verify=async () => ({ok:false,error:'network'});
  assert.equal(f.adapter.isUnlocked(),false);
  assert.equal((await f.adapter.verify('fixture-pin')).error,'network'); assert.equal(f.calls.verify,0); assert.equal(f.calls.unlock,0);
  f.window.SUKUN_BERHET_ACCESS_PROVIDER={};
  assert.equal((await f.adapter.verify('fixture-pin')).error,'unavailable'); assert.equal(f.adapter.isUnlocked(),false);
});
test('provider receipt commits once, then legacy compatibility bridge exposes access without device enrollment', async () => {
  const f=fixture({configured:false}),p=providerFixture(); f.window.SUKUN_BERHET_ACCESS_PROVIDER=p.provider;
  assert.equal((await f.adapter.verify('service-code')).ok,true); assert.equal(p.commits(),0); assert.equal(f.adapter.isUnlocked(),false);
  assert.equal((await f.adapter.sessionOpened()).ok,true); assert.equal(p.commits(),1); assert.equal(f.adapter.isUnlocked(),true);
  assert.equal(f.calls.unlock,0); assert.equal(f.calls.verify,0); assert.equal(f.calls.storage,0);
  await f.adapter.endSession(); assert.equal(f.adapter.isUnlocked(),false); assert.equal(p.revoked(),1);
});
test('late provider verification after abort or replacement cannot commit', async () => {
  const f=fixture(),p=providerFixture(); f.window.SUKUN_BERHET_ACCESS_PROVIDER=p.provider;
  let release; p.provider.verify=() => new Promise(resolve => {release=resolve;});
  const controller=new AbortController(),job=f.adapter.verify('service-code',{signal:controller.signal});
  controller.abort(); release({ok:true,receipt:p.receipt});
  assert.equal((await job).ok,false); await assert.rejects(f.adapter.sessionOpened()); assert.equal(p.commits(),0);
  let releaseAgain; p.provider.verify=() => new Promise(resolve => {releaseAgain=resolve;});
  const next=f.adapter.verify('service-code'); f.window.SUKUN_BERHET_ACCESS_PROVIDER=providerFixture().provider;
  releaseAgain({ok:true,receipt:p.receipt}); assert.equal((await next).ok,false); await assert.rejects(f.adapter.sessionOpened());
});
test('provider commit cannot expose access if the legacy bridge is unavailable', async () => {
  const f=fixture(),p=providerFixture(); f.window.SUKUN_BERHET_ACCESS_PROVIDER=p.provider; delete f.window.SukunBerhetGatePrivacy;
  await f.adapter.verify('service-code'); await assert.rejects(f.adapter.sessionOpened(),{code:'unavailable'});
  assert.equal(p.commits(),0); assert.equal(f.adapter.isUnlocked(),false);
});
test('provider network failure during revoke leaves local presentation locked', async () => {
  const f=fixture({open:true}),p=providerFixture(); p.setActive(true); f.window.SUKUN_BERHET_ACCESS_PROVIDER=p.provider;
  p.provider.revoke=async () => {throw new Error('offline');};
  await f.adapter.endSession(); assert.equal(f.adapter.isUnlocked(),false); assert.equal(f.calls.lock,1);
});
test('context and public state never expose names, passwords or tokens; labels explain device privacy', () => {
  const f=fixture();
  f.window.SukunSessionState.snapshot=() => ({activeMode:'berhet',playing:true,title:'private content',token:'private-token'});
  assert.equal(f.adapter.getContextText().includes('private'),false);
  assert.match(f.adapter.getHelpText(),/gizlilik/); f.window.I18N.lang='en';
  assert.match(f.adapter.getHelpText(),/not paid membership/); assert.equal(f.adapter.getLanguage(),'en');
  let opened=0; f.window.SukunBerhetGateEntry={openSetup:() => {opened++;return true;}};
  assert.equal(f.adapter.openSetup(),true); assert.equal(opened,1);
});
test('provider expiration immediately gates every legacy secret-policy reader and locks via safe bridge', async () => {
  const f=fixture({open:true}),p=providerFixture(); p.setActive(true); f.window.SUKUN_BERHET_ACCESS_PROVIDER=p.provider;
  assert.equal(f.window.KLT_ACIK(),true); p.setActive(false);
  assert.equal(f.window.KLT_ACIK(),false); assert.equal(f.adapter.isUnlocked(),false);
  await f.adapter.refresh(); assert.equal(f.calls.lock,1);
  delete f.window.SUKUN_BERHET_ACCESS_PROVIDER;
  assert.equal(f.window.KLT_ACIK(),false,'Raw legacy flag was also cleared, not only masked');
});
test('provider status failure fails closed without local PIN fallback and can reauthenticate', async () => {
  const f=fixture({open:true}),p=providerFixture(); p.setActive(true); f.window.SUKUN_BERHET_ACCESS_PROVIDER=p.provider;
  p.provider.status=async () => ({ok:false,error:'network',active:false});
  await f.adapter.refresh(); assert.equal(f.calls.lock,1); assert.equal(f.window.KLT_ACIK(),false);
  assert.equal(f.calls.verify,0); assert.equal(f.adapter.isUnlocked(),false);
  assert.equal((await f.adapter.verify('service-code')).ok,true); await f.adapter.sessionOpened();
  assert.equal(f.adapter.isUnlocked(),true);
});
test('remote provider status is bounded to once per minute while visible', async () => {
  let time=100000,statusCalls=0;
  const f=fixture({open:true,Date:{now:() => time}}),p=providerFixture(); p.setActive(true); f.window.SUKUN_BERHET_ACCESS_PROVIDER=p.provider;
  p.provider.status=async () => {statusCalls++;return {ok:true,active:true};};
  await f.adapter.refresh(); await f.adapter.refresh(); assert.equal(statusCalls,1);
  time+=60000; f.document.hidden=true; await f.adapter.refresh(); assert.equal(statusCalls,1);
  f.document.hidden=false; await f.adapter.refresh(); assert.equal(statusCalls,2);
});
test('late failed status from an old provider cannot revoke a replacement provider session', async () => {
  const f=fixture({open:true}),old=providerFixture(),replacement=providerFixture(); old.setActive(true); replacement.setActive(true);
  let release;old.provider.status=() => new Promise(resolve => {release=resolve;});
  replacement.provider.status=async () => ({ok:true,active:true});
  f.window.SUKUN_BERHET_ACCESS_PROVIDER=old.provider; const pending=f.adapter.refresh(); await Promise.resolve();
  f.window.SUKUN_BERHET_ACCESS_PROVIDER=replacement.provider; await f.adapter.refresh();
  release({ok:false,error:'network'}); await pending;
  assert.equal(f.calls.lock,0); assert.equal(f.adapter.isUnlocked(),true);
});
test('commit exceptions erase transient credentials and safe async lock is awaited', async () => {
  const f=fixture(); await f.adapter.verify('fixture-pin'); f.window.KLT_AC=() => {throw new Error('fixture failure');};
  await assert.rejects(f.adapter.sessionOpened()); assert.equal(f.adapter.snapshot().pending,false);
  f.setOpen(true); f.window.SukunBerhetGatePrivacy.lock=async () => {await Promise.resolve();f.setOpen(false);return true;};
  await f.adapter.endSession(); assert.equal(f.adapter.isUnlocked(),false);
});
test('failed status for an old session cannot lock a newly authenticated session on the same provider', async () => {
  const f=fixture({open:true}),p=providerFixture();p.setActive(true);f.window.SUKUN_BERHET_ACCESS_PROVIDER=p.provider;
  let release;p.provider.status=() => new Promise(resolve => {release=resolve;});
  const oldStatus=f.adapter.refresh();await Promise.resolve();
  await f.adapter.verify('service-code');await f.adapter.sessionOpened();
  release({ok:false,error:'network'});await oldStatus;
  assert.equal(f.calls.lock,0);assert.equal(f.adapter.isUnlocked(),true);
});
