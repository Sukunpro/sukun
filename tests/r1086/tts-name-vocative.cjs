'use strict';
// Run the shipping formatter, final speech policy and real smart/late-proxy
// wrappers. Only native audio/voice callbacks are controlled in this suite.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..')),source=fs.readFileSync(path.join(root,'index.html'),'utf8');
function part(start,end,from=0,include=true){const a=source.indexOf(start,from),b=source.indexOf(end,a);assert(a>=0&&b>a,start);return source.slice(a,b+(include?end.length:0));}
const helper=part('function sukunNameTtsText(','\nfunction r476CanonicalItem',0,false);
const policy=part('window.SukunReadingPolicy=(()=>{','\n})();');
const catalog=part('const ZIKIR={','\n};');
const smart=part('const A=window.AudioResolver;','\n/* Kartlarda',source.indexOf('<script id="r472-smart-session-source-runtime">'),false);
const late=part("(()=>{\n'use strict';\nif(window.__SUKUN_R678_BERHET_NIDA__)",'\n})();');
let passed=0;const check=fn=>{fn();passed++};
function fixture(){
 let globalSource='auto',globalContent='legacy';
 const ctx={window:{SukunVoiceSettings:{getMode:()=>globalSource,getContent:()=>globalContent},SukunVoiceCatalog:{resolve:lang=>({name:lang,lang:lang==='ar'?'ar-SA':'tr-TR'})}},Z:{cat:'berhet',form:'nida'},SPK:{rate:.85,arRate:.7,arPitch:.76},spkPitch:x=>x};
 vm.createContext(ctx);vm.runInContext(helper+'\n'+policy+'\n'+catalog+'\nglobalThis.catalog=ZIKIR;',ctx);
 return {ctx,format:(text,opt)=>ctx.sukunNameTtsText(text,opt),plan:(item,opt)=>ctx.window.SukunReadingPolicy.plan(item,opt),preferences(source,content){globalSource=source;globalContent=content;}};
}
function wrapperFixture(){
 const f=fixture(),spoken=[],records=[],fallback=[];let recording=null;
 const ctx=f.ctx;
 Object.assign(ctx,{P:{queue:[{type:'zikir',cat:'berhet',idx:0}],i:0},sourceMode:()=> 'auto',sourceGender:()=> 'm',textFor:item=>String(item?.oku||item?.translit||item?.tr||item?.t||'').trim(),canonicalKey:(cat,idx)=>cat+':'+idx,
  recordingFor:async()=>recording,playRecording:async(blob,key,opt)=>{records.push({blob,key,opt});return {ok:true}},
  tts:async(text,opt)=>{spoken.push({text,opt});return {ok:true,source:'tts',text}}});
 ctx.window.AudioResolver={async play(...args){fallback.push(args);return {ok:true}}};
 vm.runInContext('(()=>{'+smart+'\n})();\n'+late,ctx);
 return {...f,spoken,records,fallback,setRecording:r=>{recording=r},play:async(cat,item,opt={})=>{ctx.P.queue[0]={type:'zikir',cat,idx:0};return ctx.window.AudioResolver.play(cat,0,item,{session:true,isCurrent:()=>true,...opt});}};
}
(async()=>{
 const f=fixture(),before=JSON.stringify(f.ctx.catalog);
 for(const cat of ['esma','berhet'])for(const item of f.ctx.catalog[cat].items){
  const name=item.t||item.tr,arabic=item.a||item.ar,latin=f.format(name,{cat}),ar=f.format(arabic,{cat,lang:'ar-SA'});
  check(()=>assert.equal(latin,'Yâ '+name));check(()=>assert.equal(ar,'يَا '+arabic));
  check(()=>assert.equal(f.format(latin,{cat}),latin));check(()=>assert.equal(f.format(ar,{cat,lang:'ar-SA'}),ar));
 }
 const variants=['Yâ Rahmân','YA Rahmân','Yā Rahmân','Ya\u0302 Rahmân','YÂ Rahmân','Yâ-Rahmân','Yâ’Rahmân','Yâ','«Yâ Rahmân»','\u200fYâ Rahmân','Yâ\u200b Rahmân'];
 for(const value of variants)for(const cat of ['esma','berhet'])check(()=>assert.equal(f.format(value,{cat}),value));
 const arabicVariants=['يا رحمن','يَا رَحْمٰنُ','يَـا رَحْمٰنُ','يَا، رَحْمٰنُ','يا','«يَا رَحْمٰنُ»','\u200fيَا رَحْمٰنُ','يَا\u200f رَحْمٰنُ'];
 for(const value of arabicVariants)check(()=>assert.equal(f.format(value,{cat:'esma',lang:'ar-SA'}),value));
 for(const value of ['Yâsîn','Yakîn','Yaman'])check(()=>assert.equal(f.format(value,{cat:'esma'}),'Yâ '+value));
 for(const [cat,data] of Object.entries(f.ctx.catalog))if(!['esma','berhet'].includes(cat))for(const item of data.items||[]){
  const latin=item.oku||item.translit||item.tr||item.t||'',ar=item.ar||item.a||'';
  check(()=>assert.equal(f.format(latin,{cat}),latin));check(()=>assert.equal(f.format(ar,{cat,lang:'ar-SA'}),ar));
 }
 for(const cat of ['temel','koruma','arinma','salavat','tevhid','terkip','reading','dua','niyet','berhetiyye','ESMA','']){
  check(()=>assert.equal(f.format('Allah',{cat}),'Allah'));check(()=>assert.equal(f.format('اللّٰهُ',{cat,lang:'ar-SA'}),'اللّٰهُ'));
 }
 for(const text of ['',null,'   '])check(()=>assert.equal(f.format(text,{cat:'esma'}),text==null?'':text));
 check(()=>assert.equal(f.format('Rahmân',{cat:'esma',content:'meaning'}),'Rahmân'));
 check(()=>assert.equal(f.format('Rahmân',{cat:'esma',form:'tev'}),'Rahmân'));
 check(()=>assert.equal(f.format('Berhetîhin',{cat:'berhet',form:'tev'}),'Yâ Berhetîhin'));
 for(const text of ['Lâ Rahmâne illâllah','La Rahmane illallah','Lā Rahmāne illāllah'])check(()=>assert.equal(f.format(text,{cat:'esma'}),text));
 for(const text of ['لَا رَحْمٰنَ إِلَّا اللّٰهُ','لا رحمن إلا الله'])check(()=>assert.equal(f.format(text,{cat:'esma',lang:'ar-SA'}),text));
 check(()=>assert.equal(f.format('Rahmân',{cat:'fav',item:{_src:'esma'}}),'Yâ Rahmân'));
 check(()=>assert.equal(f.format('Allah',{cat:'fav',item:{_src:'temel'}}),'Allah'));
 check(()=>assert.equal(f.format('Rahmân',{entry:{id:'zikir:esma:0:nida'}}),'Yâ Rahmân'));
 check(()=>assert.equal(f.format('Berhetîhin',{entry:{id:'zikir:berhet:0'}}),'Yâ Berhetîhin'));
 check(()=>assert.equal(f.format('Rahmân',{entry:{id:'zikir:esma:0:tev'}}),'Rahmân'));
 check(()=>assert.equal(f.format('Allah',{cat:'temel',entry:{id:'zikir:esma:0'}}),'Allah'));
 for(const id of ['reading:niyet','reading:ayetelkursi','reading:yasin','reading:fatiha','reading:esma:0','esma:0','zikir:esma:0:other'])check(()=>assert.equal(f.format('Allah',{entry:{id}}),'Allah'));
 const nameEntry={id:'zikir:berhet:0',arabic:'بَرْهَتِيهِ',verifiedArabic:'بَرْهَتِيهِ',latin:'Berhetîhin',meaning:'Açıklama',meaningStatus:'provided',status:'verified'};
 const entryBefore=JSON.stringify(nameEntry);
 check(()=>assert.equal(f.plan(nameEntry,{entry:nameEntry,content:'arabic',source:'arabic'}).text,'يَا بَرْهَتِيهِ'));
 check(()=>assert.equal(f.plan(nameEntry,{entry:nameEntry,content:'legacy',source:'turkish'}).text,'Yâ Berhetîhin'));
 check(()=>assert.equal(f.plan(nameEntry,{entry:nameEntry,content:'meaning',source:'turkish'}).text,'Açıklama'));
 const yaEntry={...nameEntry,arabic:'يا بَرْهَتِيهِ',verifiedArabic:'يا بَرْهَتِيهِ',latin:'Yā Berhetîhin'};
 check(()=>assert.equal(f.plan(yaEntry,{entry:yaEntry,content:'arabic',source:'arabic'}).text,yaEntry.arabic));
 check(()=>assert.equal(f.plan(yaEntry,{entry:yaEntry,content:'legacy',source:'turkish'}).text,yaEntry.latin));
 const prayer={...nameEntry,id:'reading:niyet',latin:'İlâhî ente maksûdî',arabic:'إِلٰهِي أَنْتَ مَقْصُودِي',verifiedArabic:'إِلٰهِي أَنْتَ مَقْصُودِي'};
 check(()=>assert.equal(f.plan(prayer,{entry:prayer,content:'legacy',source:'turkish'}).text,prayer.latin));
 check(()=>assert.equal(f.plan(prayer,{entry:prayer,content:'arabic',source:'arabic'}).text,prayer.arabic));
 check(()=>assert.equal(f.ctx.Z.cat,'berhet'));check(()=>assert.equal(JSON.stringify(nameEntry),entryBefore));check(()=>assert.equal(JSON.stringify(f.ctx.catalog),before));
 // A missing required voice still fails before speech, with no catalog edits.
 f.ctx.window.SukunVoiceCatalog.resolve=()=>null;
 check(()=>assert.equal(f.plan(nameEntry,{entry:nameEntry,content:'arabic',source:'arabic'}).ok,false));
 const w=wrapperFixture();
 for(const cat of ['esma','berhet'])for(const value of ['Rahmân','Yâ Rahmân','Yā Rahmân','Ya\u0302 Rahmân']){
  const item={tr:value,t:value,oku:value,ar:'رَحْمٰنُ'},snapshot=JSON.stringify(item);
  await w.play(cat,item);check(()=>assert.equal(w.spoken.at(-1).text,value==='Rahmân'?'Yâ Rahmân':value));check(()=>assert.equal(JSON.stringify(item),snapshot));
 }
 await w.play('berhet',{tr:'Berhetîhin',ar:'بَرْهَتِيهِ'},{lang:'ar-SA'});check(()=>assert.equal(w.spoken.at(-1).text,'يَا بَرْهَتِيهِ'));
 await w.play('esma',{t:'Rahmân',a:'رَحْمٰنُ'},{lang:'ar-SA'});check(()=>assert.equal(w.spoken.at(-1).text,'يَا رَحْمٰنُ'));
 await w.play('berhet',{tr:'Türkçe açıklama'},{content:'meaning'});check(()=>assert.equal(w.spoken.at(-1).text,'Türkçe açıklama'));
 for(const cat of ['temel','koruma','arinma','salavat','terkip']){await w.play(cat,{tr:'Allah',ar:'اللّٰهُ'});check(()=>assert.equal(w.spoken.at(-1).text,'Allah'));}
 const record={key:'esma:0:tev',blob:{immutable:'personal bytes'}},spoken=w.spoken.length;
 w.setRecording(record);const played=await w.play('esma',{t:'Rahmân'});
 check(()=>assert.equal(played.source,'recording'));check(()=>assert.equal(w.spoken.length,spoken));check(()=>assert.equal(w.records[0].blob,record.blob));check(()=>assert.equal(w.records[0].opt.recordingKey,'esma:0:tev'));
 process.stdout.write(JSON.stringify({suite:'r1086 TTS Name vocative identity and actual speech text paths',passed,scope:'shipping formatter, policy, smart resolver and late Berhet proxy; native speech callbacks controlled; personal recording bytes unchanged'})+'\n');
})().catch(error=>{console.error(error);process.exitCode=1});
