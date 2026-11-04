const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const html=fs.readFileSync('nero.html','utf8');
function part(a,b){return html.slice(html.indexOf(a),html.indexOf(b,html.indexOf(a)));}
for(const kind of ['28','99'])for(const owns of [true,false]){
 const prefix=kind==='28'?'bs':'es99',calls=[];let owner=owns,settings={mode:'1'};
 const nodes={[prefix+'Mode']:{value:'1',dispatchEvent(){settings.mode=this.value;calls.push('mode')}},[prefix+'Custom']:{value:'57'}};
 const c={document:{getElementById:id=>nodes[id]},Event:function(){},window:{SukunSessionState:{peek:()=>({journeyKind:kind}),refresh(){}},SukunSecretPolicy:{unlocked:()=>true},SukunTabOwner:{owns:()=>owner,defer:(type,fn)=>{owner=true;return fn()}}},zEbcedHedefUygula:()=>{calls.push('target');return true},zUI(){},saveSettings(){}};
 vm.createContext(c);vm.runInContext(part('function zUserJourneyTarget(', 'function serbestHedefUygula('),c);
 assert.equal(c.zUserEbcedTarget(),true);assert.equal(settings.mode,'ebced');assert.deepEqual(calls,['mode','target']);
}
// Explicit edits must remain pending even when the tab currently owns playback;
// stop/restart may release that lease before journal hydration consumes the edit.
for(const state of ['BS','ES'])assert(html.includes(`(${state}._r1101Settings||(${state}._r1101Settings={}))[field]=value`));
const locked={document:{getElementById(){throw Error('locked controls touched')}},window:{SukunSessionState:{peek:()=>({journeyKind:'28'})},SukunSecretPolicy:{unlocked:()=>false}}};vm.createContext(locked);vm.runInContext(part('function zUserJourneyTarget(', 'function zUserEbcedTarget('),locked);assert.equal(locked.zUserJourneyTarget('ebced'),false);
let scripts=0;for(const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){if(/\bsrc\s*=|type\s*=\s*["'](?:application\/json|importmap|text\/x-sukun-tpl)/i.test(m[1]))continue;new Function(m[2]);scripts++;}
console.log('PASS: explicit Ebced synchronizes both journeys before target/start, ownership handoff, lock guard; '+scripts+' inline scripts parse.');
