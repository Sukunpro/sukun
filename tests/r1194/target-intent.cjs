const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const html=fs.readFileSync(process.env.SUKUN_TEST_HTML||'nero.html','utf8');
function part(a,b){return html.slice(html.indexOf(a),html.indexOf(b,html.indexOf(a)));}
for(const kind of ['28','99'])for(const owns of [true,false]){
 const prefix=kind==='28'?'bs':'es99',calls=[];let owner=owns,settings={mode:'1'};
 const nodes={[prefix+'Mode']:{value:'1',dispatchEvent(){settings.mode=this.value;calls.push('mode')}},[prefix+'Custom']:{value:'57'}};
 const c={document:{getElementById:id=>nodes[id]},Event:function(){},window:{SukunSessionState:{peek:()=>({journeyKind:kind}),refresh(){}},SukunSecretPolicy:{unlocked:()=>true},SukunTabOwner:{owns:()=>owner,defer:(type,fn)=>{owner=true;return fn()}}},zEbcedHedefUygula:()=>{calls.push('target');return true},zUI(){},saveSettings(){}};
 vm.createContext(c);vm.runInContext(part('function zSelectedJourneyKind(', 'function serbestHedefUygula('),c);
 assert.equal(c.zUserEbcedTarget(),true);assert.equal(settings.mode,'ebced');assert.deepEqual(calls,['mode','target']);
}

// Use production functions with the real journey selector controls and a saved
// progress counter, including stale session snapshots and deferred DOM mount.
for(const kind of ['28','99'])for(const oldMode of ['1','custom']){
 const prefix=kind==='28'?'bs':'es99',progress={count:42,devir:2,mode:oldMode,custom:'57'},events=[];
 const node=(value)=>({value,dispatchEvent(e){events.push(e.type);if(e.type==='change')progress.mode=this.value;if(e.type==='input')progress.custom=this.value}});
 let m=node(oldMode),c=node('57'),mounted=false;
 const badge=()=>({active:false,pressed:null,classList:{},setAttribute(k,v){this.pressed=v}});
 const eb=badge(),free=badge();eb.classList.toggle=(_k,v)=>eb.active=v;free.classList.toggle=(_k,v)=>free.active=v;
 const els={ebcedDisplay:{},freeTargetInput:{},ebBtn:eb,freeBtn:free,targetHintText:{}};
 const api={ensureControls(){mounted=true;els[prefix+'Mode']=m;els[prefix+'Custom']=c}};
 const ctx={document:{getElementById:id=>els[id]||null},Event:function(type){this.type=type},Z:{count:42,devir:2,target:1,targetMode:'manual'},zItem:()=>({}),zEbcedDegeri:()=>270,ensureTargetOpt(){},alert(){throw Error('unexpected alert')},zUI(){},saveSettings(){},zEbcedHedefUygula(reset){ctx.Z.target=270;ctx.Z.targetMode='ebced';if(reset){ctx.Z.count=0;ctx.Z.devir=0}return true},window:{SukunSessionState:{peek:()=>({journeyKind:'single'}),refresh(){}},SukunJourneyController:{target:()=>kind},SukunSecretPolicy:{unlocked:()=>true},SukunTabOwner:{owns:()=>true},SukunEsma99Seyir:api,SukunBerhetiyyeSeyir:api}};
 vm.createContext(ctx);vm.runInContext(part('function zSelectedJourneyKind(',"$('#ebBtn').onclick="),ctx);
 assert.equal(ctx.zUserEbcedTarget(),true);assert(mounted);assert.equal(progress.mode,'ebced');assert.equal(ctx.Z.target,270);assert.equal(ctx.Z.count,42);assert.equal(ctx.Z.devir,2);ctx.targetPremiumSync();assert.equal(eb.pressed,'true');assert.equal(free.pressed,'false');
 assert.equal(ctx.serbestHedefUygula(57),true);assert.equal(progress.mode,'custom');assert.equal(progress.custom,'57');assert.equal(ctx.Z.count,42);assert.equal(ctx.Z.devir,2);ctx.targetPremiumSync();assert.equal(eb.pressed,'false');assert.equal(free.pressed,'true');
}

// When the controller already selected single, a stale journey snapshot must
// not change the prior journey's controls.
{const c={window:{SukunSessionState:{peek:()=>({journeyKind:'99'})},SukunJourneyController:{target:()=> 'single'}}};vm.createContext(c);vm.runInContext(part('function zSelectedJourneyKind(', 'function targetPremiumSync('),c);assert.equal(c.zSelectedJourneyKind(),null);}
// Explicit edits must remain pending even when the tab currently owns playback;
// stop/restart may release that lease before journal hydration consumes the edit.
for(const state of ['BS','ES'])assert(html.includes(`(${state}._r1101Settings||(${state}._r1101Settings={}))[field]=value`));
const locked={document:{getElementById(){throw Error('locked controls touched')}},window:{SukunSessionState:{peek:()=>({journeyKind:'28'})},SukunSecretPolicy:{unlocked:()=>false}}};vm.createContext(locked);vm.runInContext(part('function zSelectedJourneyKind(', 'function zUserEbcedTarget('),locked);assert.equal(locked.zUserJourneyTarget('ebced'),false);
let scripts=0;for(const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){if(/\bsrc\s*=|type\s*=\s*["'](?:application\/json|importmap|text\/x-sukun-tpl)/i.test(m[1]))continue;new Function(m[2]);scripts++;}
console.log('PASS: explicit Ebced synchronizes both journeys before target/start, ownership handoff, lock guard; '+scripts+' inline scripts parse.');
