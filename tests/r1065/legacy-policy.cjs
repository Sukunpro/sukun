/* Execute production policy/old button dispatch with controlled storage/media.
 * Regression: Arabic explorer preference previously disabled every unknown
 * personal/generic dhikr recording and forced missing device Arabic voices.
 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const html=fs.readFileSync(path.join(root,'nero.html'),'utf8');
const cut=(a,b)=>{const i=html.indexOf(a),j=html.indexOf(b,i+a.length);assert(i>=0&&j>i,a);return html.slice(i,j)};
const policy=cut('window.SukunReadingPolicy=(()=>{','/* r922: persisted reading preference;');
const nameTts=cut('function sukunNameTtsText(','\nfunction r476CanonicalItem()');
const intent=cut('async function niyetPlayAudio(opt={}){',"[['niyetTgl'");
const wrappers=[cut('function akPlay(){','function akPause(){'),cut('function fsPlay(){','function fsPause(){'),cut('function seyPlay(mode){','function seyInit(){')].join('\n');
const checks=[];async function test(name,fn){try{await fn();checks.push({name,ok:true})}catch(e){checks.push({name,ok:false,error:e.stack})}}
function fixture({mode='auto',content='arabic',arabicVoice=false,bundle=false,generic=false,own=false}={}){
 const calls=[],entries=new Map(),personal=new Blob(['personal original bytes'],{type:'audio/wav'}),general=new Blob(['generic original bytes'],{type:'audio/wav'}),bundled=new Blob(['bundled original bytes'],{type:'audio/mpeg'});
 const e={id:'zikir:esma:0',status:'verified',arabic:'اللَّهُ',verifiedArabic:'اللَّهُ',latin:'Yâ Allah',meaning:'Allah',meaningStatus:'provided',recordingContent:'unknown',recordingKeys:['esma:0:nida']};
 for(const kind of ['niyet','ayetelkursi','fatiha','seyyid'])entries.set(kind,{...e,id:'reading:'+kind,title:kind});
 const c={console,Promise,Blob,Map,Set,Object,Array,String,Number,Math,RegExp,JSON,Date,setTimeout,clearTimeout};c.window=c;c.document={hidden:false};c.I18N={lang:'tr'};c.spkPitch=x=>x;c.SPK={arOn:true,arVoice:arabicVoice?{name:'Arabic',lang:'ar-SA'}:null,voice:{name:'Turkish',lang:'tr-TR'},arRate:.7,rate:.85,arPitch:.76};c.SukunVoiceCatalog={resolve:lang=>lang==='ar'?c.SPK.arVoice:c.SPK.voice};
 c.SukunVoiceSettings={getMode:()=>mode,getContent:()=>content,notify:msg=>calls.push({op:'notice',msg}),rememberContent(){throw Error('Old playback must not rewrite reading preference')}};
 c.SukunReadingSourcesR1064={forZikir:()=>e,forReading:k=>entries.get(k)};
 c.SukunReadingAudioR1064={route:(kind,opt)=>{calls.push({op:'route',kind,opt});return{ok:true}}};
 c.SukunBundledArabicR1065={has:()=>bundle,available:()=>bundle,find:async()=>{calls.push({op:'bundle-find'});return bundle?{blob:bundled,key:'bundled:niyet',bundled:true}:null}};
 c.SukunGenericRecordings={find:async()=>{calls.push({op:'generic-find'});return generic?{blob:general,key:'niyet:core',generic:true}:null}};
 c.REC_DB={get:async()=>{calls.push({op:'personal-read'});return own?personal:null}};
 c.NIYET_BLOB=null;c.NIYET_HAS_REC=false;c.NIYET_REC_KEY='niyet:core';c._r998NiyetEpoch=1;c._r998NiyetAbort=null;c.niyetAudioClear=async()=>true;c.niyetSpeakOnce=async(current,ar)=>{calls.push({op:'speech',arabic:ar});return current()};
 c.playRecording=async(blob,id,opt)=>{calls.push({op:'recording',blob,id,opt});return{ok:true}};c.zikirTtsAwait=async(text,_interrupt,lang)=>{calls.push({op:'speech-plan',text,lang});return true};
 c.okuyucuAcKapa=kind=>{calls.push({op:'legacy-button',kind});return true};
 vm.createContext(c);vm.runInContext(nameTts,c);vm.runInContext(policy,c);vm.runInContext(wrappers,c);vm.runInContext(intent,c);
 return{c,calls,e,personal,general,bundled,setMode:v=>mode=v,setContent:v=>content=v};
}
const sha=async blob=>crypto.createHash('sha256').update(Buffer.from(await blob.arrayBuffer())).digest('hex');
(async()=>{
 await test('Persisted Arabic reader choice retains main dhikr personal and generic admission',()=>{const f=fixture();const p=f.c.SukunReadingPolicy.permissions(f.e,{cat:'esma',index:0});assert(p.personal&&p.generic);assert.equal(p.content,'legacy');assert.equal(f.c.SukunReadingPolicy.plan(f.e,{cat:'esma',index:0}).lang,'tr-TR')});
 await test('Persisted meaning reader choice retains Berhetiyye unknown recording admission',()=>{const f=fixture({content:'meaning'});const p=f.c.SukunReadingPolicy.permissions(f.e,{cat:'berhet',index:0});assert(p.personal&&p.generic);assert.equal(p.content,'legacy')});
 await test('Explicit Arabic content still rejects an unclassified record',()=>{const f=fixture();const p=f.c.SukunReadingPolicy.permissions(f.e,{cat:'esma',content:'arabic'});assert.equal(p.personal,false);assert.equal(p.generic,false);assert.equal(f.c.SukunReadingPolicy.plan(f.e,{cat:'esma',content:'arabic'}).reason,'arabic-voice-unavailable')});
 await test('Automatic legacy TTS uses transliteration even with a present Arabic device voice',()=>{const f=fixture({arabicVoice:true});const p=f.c.SukunReadingPolicy.plan(f.e,{cat:'esma'});assert.equal(p.lang,'tr-TR');assert.equal(p.text,'Yâ Allah')});
 await test('Explicit Arabic device selection reports its actual missing voice',()=>{const f=fixture({mode:'arabic'});const p=f.c.SukunReadingPolicy.plan(f.e,{cat:'esma'});assert.equal(p.reason,'arabic-voice-unavailable')});
 await test('Saved personal/generic-only sources retain their exact source constraints',()=>{const f=fixture({mode:'personal'});let p=f.c.SukunReadingPolicy.permissions(f.e,{cat:'esma'});assert(p.personal&&!p.generic);f.setMode('generic');p=f.c.SukunReadingPolicy.permissions(f.e,{cat:'esma'});assert(!p.personal&&p.generic)});
 await test('Explicit meaning with Arabic device source remains blocked and silent',()=>{const f=fixture({mode:'arabic',arabicVoice:true});assert.equal(f.c.SukunReadingPolicy.plan(f.e,{content:'meaning'}).reason,'source-language-mismatch');assert.equal(f.calls.length,0)});
 await test('Old AK/Fatiha buttons retain old path without bundled audio despite persisted Arabic',()=>{const f=fixture();f.c.akPlay();f.c.fsPlay();assert.deepEqual(f.calls.map(x=>x.op),['legacy-button','legacy-button'])});
 await test('Old AK/Fatiha buttons use bundled-ready route without device voices',()=>{const f=fixture({bundle:true});f.c.akPlay();f.c.fsPlay();assert.deepEqual(f.calls.map(x=>x.kind),['ayetelkursi','fatiha']);assert(f.calls.every(x=>x.opt.content==='legacy'&&x.opt.source==='auto'))});
 await test('Old generic-only button dispatch preserves source and ignores explorer content',()=>{const f=fixture({mode:'generic'});f.c.akPlay();assert.equal(f.calls[0].opt.content,'legacy');assert.equal(f.calls[0].opt.source,'generic')});
 await test('Seyyid old Arabic auto button permits fallback but meaning button stays explicit',()=>{const f=fixture();f.c.seyPlay('ar');f.c.seyPlay('mean');assert.equal(f.calls[0].opt.content,'legacy');assert.equal(f.calls[1].opt.content,'meaning')});
 for(const stage of ['bundled','generic','personal','speech'])await test('Intention automatic selection reaches '+stage+' without device Arabic and preserves blobs',async()=>{const f=fixture({bundle:stage==='bundled',generic:stage==='generic',own:['bundled','generic','personal'].includes(stage)}),before=await sha(f.personal);assert.equal(await f.c.niyetPlayAudio(),true);const read=f.calls.find(x=>x.op==='recording');if(stage==='speech'){assert(!read);assert.equal(f.calls.at(-1).arabic,false)}else{assert.equal(read.blob,stage==='bundled'?f.bundled:stage==='generic'?f.general:f.personal);assert.equal(!!read.opt.bundled,stage==='bundled');assert.equal(!!read.opt.generic,stage==='generic');}if(['bundled','generic'].includes(stage))assert(!f.calls.some(x=>x.op==='personal-read'));assert.equal(await sha(f.personal),before);assert.equal(f.c.SukunVoiceSettings.getContent(),'arabic')});
 await test('Stop during pending intention bundle lookup prevents fallback and playback',async()=>{const f=fixture({own:true});let resolve;f.c.SukunBundledArabicR1065.find=()=>new Promise(r=>resolve=r);const p=f.c.niyetPlayAudio();while(!resolve)await new Promise(setImmediate);f.c._r998NiyetEpoch++;resolve(null);assert.equal(await p,false);assert(!f.calls.some(x=>['personal-read','generic-find','recording','speech'].includes(x.op)))});
 await test('Bundled provenance is distinct from own/general recordings in TR and EN',()=>{const f=fixture();vm.runInContext(fs.readFileSync(path.join(root,'assets/runtime/session-r919.js'),'utf8').split('  const read =')[0].replace(/\n\s*const read[\s\S]*$/,'' )+'\n})();',f.c);const value={kind:'recording',recordingOrigin:'bundled'};assert.equal(f.c.SukunAudioSourceText.origin(value),'bundled');assert.equal(f.c.SukunAudioSourceText.label(value,'tr'),'Gömülü Arapça kayıt');assert.equal(f.c.SukunAudioSourceText.label(value,'en'),'Bundled Arabic recording')});
 const report={version:'r1065',scope:'Production policy/legacy buttons and intention source admission; no physical Android claim',passed:checks.filter(x=>x.ok).length,total:checks.length,allPassed:checks.every(x=>x.ok),tests:checks};console.log(JSON.stringify(report,null,2));if(!report.allPassed)process.exitCode=1;
})();
