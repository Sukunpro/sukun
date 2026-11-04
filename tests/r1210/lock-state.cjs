const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const code=fs.readFileSync('assets/runtime/mevlevi-lock-r1176.js','utf8');
async function scenario(open,mode){
 let unlocked=open,cur=mode,calls=[],listeners={},winListeners={};const spans={'[data-lock-title]':{},'[data-lock-action]':{}};
 const img={src:'./assets/branding/tekke-lock-r1177.webp',getAttribute(k){return this[k]},setAttribute(k,v){this[k]=v}};const button={dataset:{},disabled:false,setAttribute(k,v){this[k]=v},querySelector:s=>s==='.r1176LockArt'?img:spans[s],closest:()=>null,title:''};
 const doc={readyState:'complete',hidden:false,documentElement:{lang:'tr'},getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[button],addEventListener:(k,f)=>listeners[k]=f};
 const window={I18N:{lang:'tr'},SukunBerhetGateAccess:{isUnlocked:()=>unlocked,endSession:async()=>{calls.push('close');unlocked=false;cur='esma';return {ok:true}}},SukunSessionState:{snapshot:()=>({activeMode:cur,activeIndex:4}),command:async()=>{calls.push('select');cur='esma';return {accepted:true}}},SukunBerhetGate:{open:()=>calls.push('open')},Tekke:{sessionState:()=>({active:false}),isActive:()=>false},addEventListener:(k,f)=>winListeners[k]=f};
 const context={window,document:doc,localStorage:{getItem:()=>null},AbortController,setTimeout,clearTimeout,Promise};vm.runInNewContext(code,context);
 assert.equal(button['aria-pressed'],String(open));assert.equal(spans['[data-lock-action]'].textContent,open?'Sırla':'Aç');assert.equal(img.src,open?'./assets/branding/tekke-lock-open-r1210.png':'./assets/branding/tekke-lock-r1177.webp');
 listeners.click({target:{closest:()=>button}});await new Promise(r=>setTimeout(r,5));if(open){assert.equal(img.src,'./assets/branding/tekke-lock-r1177.webp');assert.equal(spans['[data-lock-action]'].textContent,'Aç')}
 return calls;
}
(async()=>{assert.deepEqual(await scenario(false,'esma'),['open']);assert.deepEqual(await scenario(true,'esma'),['close']);assert.deepEqual(await scenario(true,'berhet'),['close','select']);console.log('PASS: locked opens; unlocked Esma locks without reselection; unlocked Berhetiyye locks and selects Esma');})().catch(e=>{console.error(e);process.exit(1)});
