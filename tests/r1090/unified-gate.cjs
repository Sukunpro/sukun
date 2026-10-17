'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const access=fs.readFileSync(path.join(root,'assets/berhetiyye-gate/access-r1080.js'),'utf8');
const portal=fs.readFileSync(path.join(root,'assets/berhetiyye-gate/portal-r1080.js'),'utf8');
const entry=fs.readFileSync(path.join(root,'assets/berhetiyye-gate/entry-r1080.js'),'utf8');
function fixture(initial={}) {
 let configured=initial.configured!==false,open=!!initial.open,pin='existing';const calls=[];
 const window={I18N:{lang:'tr'},KLT_KURULU:()=>configured,KLT_ACIK:()=>open,
  kltDogrula:value=>configured&&value===pin,
  KLT_AC:value=>{calls.push('commit');if(!configured||pin!==value)return false;open=true;return true;},
  KLT_AYARLA:value=>{calls.push('setup');if(configured||open)return false;configured=true;pin=value;return true;},
  KLT_SIFIRLA_KILITLI:()=>{calls.push('reset');if(open)return false;configured=false;pin='';return true;},
  KLT_KILITLE:()=>{calls.push('destructive-lock');open=false;},
  SukunBerhetGatePrivacy:{lock:()=>{calls.push('park-lock');open=false;return true;}}};
 const document={documentElement:{lang:'tr'}};
 vm.runInNewContext(access,{window,document,AbortController,Promise,Date});
 return {window,adapter:window.SukunBerhetGateAccess,calls,setOpen:value=>open=value,configured:()=>configured};
}
test('the retired Tools lock controls and second setup entry are absent',()=>{
 assert(!html.includes('id="kltBox"'));assert(!html.includes('id="kltPin"'));assert(!html.includes("'ydkBox','kltBox'"));
 assert(!entry.includes('data-entry-setup'));assert(!entry.includes("getElementById('kltBox')"));
 assert(entry.includes('gate.open({trigger:document.getElementById(id),setup:true})'));
});
test('first enrollment stores a credential but does not open the curtain',async()=>{
 const f=fixture({configured:false});assert.equal(f.adapter.setDevicePassword('  new-code  ').ok,true);
 assert.equal(f.configured(),true);assert.equal(f.adapter.isUnlocked(),false);assert.deepEqual(f.calls,['setup']);
 assert.equal((await f.adapter.verify('new-code')).ok,true);await f.adapter.sessionOpened();assert.equal(f.adapter.isUnlocked(),true);
 assert.deepEqual(f.calls,['setup','commit']);
});
test('existing credentials cannot be replaced by enrollment and blank/long values fail closed',()=>{
 const f=fixture();assert.throws(()=>f.adapter.setDevicePassword('replacement'),{code:'unavailable'});assert.deepEqual(f.calls,[]);
 const clean=fixture({configured:false});for(const value of ['', '   ', 'x'.repeat(257)])assert.throws(()=>clean.adapter.setDevicePassword(value),{code:'unavailable'});
 assert.deepEqual(clean.calls,[]);assert.equal(clean.adapter.needsSetup(),true);
});
test('provider mode denies local setup and reset before any device mutation',async()=>{
 const f=fixture({configured:false});f.window.SUKUN_BERHET_ACCESS_PROVIDER={isActive:()=>false};
 assert.equal(f.adapter.canManageDevicePassword(),false);assert.throws(()=>f.adapter.setDevicePassword('new'),{code:'unavailable'});
 await assert.rejects(f.adapter.resetDevicePassword(),{code:'unavailable'});assert.deepEqual(f.calls,[]);
});
test('reset awaits the queue parking bridge before clearing only the credential',async()=>{
 const f=fixture({open:true});let release;f.window.SukunBerhetGatePrivacy.lock=()=>new Promise(resolve=>{release=()=>{f.calls.push('park-lock');f.setOpen(false);resolve(true);};});
 const job=f.adapter.resetDevicePassword();assert.deepEqual(f.calls,[]);assert.equal(f.configured(),true);release();await job;
 assert.deepEqual(f.calls,['park-lock','reset']);assert.equal(f.adapter.needsSetup(),true);assert.equal(f.adapter.isUnlocked(),false);
});
test('aborted reset after the awaited lock preserves the credential',async()=>{
 const f=fixture({open:true}),controller=new AbortController();let release;
 f.window.SukunBerhetGatePrivacy.lock=()=>new Promise(resolve=>{release=()=>{f.setOpen(false);resolve(true);};});
 const job=f.adapter.resetDevicePassword({signal:controller.signal});controller.abort();release();await assert.rejects(job,{name:'AbortError'});
 assert.equal(f.configured(),true);assert(!f.calls.includes('reset'));
});
test('a provider installed while reset parks cannot be bypassed by late local reset',async()=>{
 const f=fixture({open:true});let release;f.window.SukunBerhetGatePrivacy.lock=()=>new Promise(resolve=>{release=()=>{f.setOpen(false);resolve(true);};});
 const job=f.adapter.resetDevicePassword();f.window.SUKUN_BERHET_ACCESS_PROVIDER={isActive:()=>false};release();await assert.rejects(job,{code:'unavailable'});
 assert.equal(f.configured(),true);assert(!f.calls.includes('reset'));
});
test('failed queue parking does not erase the password or fall back to destructive lock',async()=>{
 const f=fixture({open:true});f.window.GlobalQueue={};f.window.SukunBerhetGatePrivacy.lock=()=>false;
 await assert.rejects(f.adapter.resetDevicePassword(),{code:'unavailable'});assert.equal(f.configured(),true);assert.deepEqual(f.calls,[]);
 delete f.window.SukunBerhetGatePrivacy;await assert.rejects(f.adapter.resetDevicePassword(),{code:'unavailable'});assert.deepEqual(f.calls,[]);
});
test('TR and EN settings describe the local privacy curtain without a retired-panel route',()=>{
 const f=fixture();for(const lang of ['tr','en']){f.window.I18N.lang=lang;const help=f.adapter.getHelpText();assert(!/Kilitli Bölüm|Locked Section/.test(help));assert(lang==='tr'?help.includes('kayıtlarını ve sayaçlarını silmez'):help.includes('preserves recordings and counters'));}
});
test('calendar context is read only, hidden behind current access, and plain text',()=>{
 const f=fixture();let reads=0;f.window.SukunBerhetGateCalendar=()=>{reads++;return {mansion:'fixture-mansion',name:'fixture-name'};};
 assert.equal(f.adapter.getCalendarText(),'');assert.equal(reads,0);f.setOpen(true);assert.match(f.adapter.getCalendarText(),/fixture-mansion · fixture-name/);assert.deepEqual(f.calls,[]);
});
test('first-use setup has confirmation fields and bypasses countdown until canonical verification',()=>{
 const setup=portal.slice(portal.indexOf('  function setupMarkup()'),portal.indexOf('  function settingsMarkup()'));
 assert(setup.includes('sbgSetupPassword'));assert(setup.includes('sbgSetupConfirm'));assert(!setup.includes('sbgCountdown'));
 const enroll=portal.slice(portal.indexOf('  async function setupPassword()'),portal.indexOf('  async function resetPassword()'));
 assert(enroll.includes('password !== repeated'));assert(enroll.includes('challenge()'));assert(enroll.includes('void verify()'));assert(!enroll.includes('sessionOpened('));assert(!enroll.includes('state.authenticated = true'));
});
test('bounded legacy setup/reset helpers touch only the PIN and never playback state',()=>{
 const start=html.indexOf('window.KLT_AYARLA=function'),end=html.indexOf('\nfunction renderCats()',start);assert(start>0&&end>start);
 const helper=html.slice(start,end);let pin='';const changes=[];const context=vm.createContext({window:{},KLT:{acik:false,anahtar:'pin'},S:{set:(key,value)=>{changes.push(key);pin=value;}},kltOzet:x=>'hash-'+x,kltKurulu:()=>!!pin,kltDogrula:x=>pin==='hash-'+x});vm.runInContext(helper,context);
 assert.equal(context.window.KLT_AYARLA(' test '),true);assert.equal(context.KLT.acik,false);assert.equal(pin,'hash-test');
 assert.equal(context.window.KLT_AYARLA('replacement'),false);assert.equal(context.window.KLT_SIFIRLA_KILITLI(),true);assert.deepEqual(changes,['pin','pin']);
 context.KLT.acik=true;assert.equal(context.window.KLT_SIFIRLA_KILITLI(),false);context.KLT.acik=false;context.window.SUKUN_BERHET_ACCESS_PROVIDER={};assert.equal(context.window.KLT_AYARLA('other'),false);assert.equal(context.window.KLT_SIFIRLA_KILITLI(),false);
});

test('the actual open function reads persisted animation settings without local shadowing',()=>{
 const start=portal.indexOf('  function open(options)'),end=portal.indexOf('  function close(options)',start);assert(start>=0&&end>start);
 const rendered=[];const state={open:false,phase:'closed',dormant:false};
 const context=vm.createContext({state,settings:{seen:false},pendingHistoryBack:false,queuedOpenOptions:null,host:{},returnFocus:null,enrollmentTicket:0,document:{activeElement:null},q:()=>null,ensureHost(){},cancelPending(){},usableGrant:()=>false,needsSetup:()=>true,render:focus=>rendered.push(focus),showDialog(){},pushHistory(){},syncReadingMix(){},prepareAudio:()=>Promise.resolve(),cooldown(){},Date});
 vm.runInContext(portal.slice(start,end),context);context.open({});assert.equal(state.open,true);assert.equal(state.phase,'setup');assert.equal(state.fullAnimation,true);assert.equal(rendered.at(-1),'#sbgSetupPassword');
});
test('reopening existing settings focuses its summary and tolerates absent interim controls',()=>{
 const start=portal.indexOf('  function open(options)'),end=portal.indexOf('  function close(options)',start);let focused=0;const panel={open:false,querySelector:()=>({focus:()=>focused++})};
 const context=vm.createContext({state:{open:true},pendingHistoryBack:false,queuedOpenOptions:null,q:selector=>selector==='#sbgGateSettings'?panel:null,needsSetup:()=>false});
 vm.runInContext(portal.slice(start,end),context);context.open({setup:true});assert.equal(panel.open,true);assert.equal(focused,1);assert.doesNotThrow(()=>context.open({}));
});
