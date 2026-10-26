'use strict';
// Controlled provider/source checks. This does not establish Android lock-screen
// playback, audible recital completeness or text-to-audio alignment.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.resolve(process.argv[2]||'.'),output=process.argv[3]&&path.resolve(process.argv[3]);
const source=fs.readFileSync(path.join(root,'assets/runtime/delail-recorded-r1128.js'),'utf8');
const assetDir=path.join(root,'assets/audio/delail-giles-r1128');
const permission='https://aladaab.wordpress.com/2008/01/12/special-recitation-of-dalailul-khayraat/';
const tests=[];
function check(value,name){tests.push({name,passed:!!value});if(!value)throw Error(name);}
const bufferFor=file=>{const bytes=fs.readFileSync(path.join(assetDir,file));return bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength);};
const contextFor=window=>vm.createContext({window,Blob,URL,AbortController,setTimeout,clearTimeout,Uint8Array});
const baseWindow=()=>({location:{href:'https://example.org/sukun/nero.html',origin:'https://example.org'},crypto:crypto.webcrypto});
const oldResult=Object.freeze({old:true});
const old=Object.freeze({version:'r1065',has:entry=>(entry?.id||entry)==='reading:yasin',available:entry=>(entry?.id||entry)==='reading:yasin',descriptor:entry=>(entry?.id||entry)==='reading:yasin'?oldResult:null,list:()=>[{key:'old'}],find:async()=>oldResult});
const flush=async()=>{for(let index=0;index<6;index++)await Promise.resolve();};
function controlled(){
 const calls=[],listeners={};
 const window={...baseWindow(),SukunBundledArabicR1065:old,
  addEventListener(type,fn){(listeners[type]??=[]).push(fn)},
  fetch(url,opt){let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no});calls.push({url,opt,resolve,reject});return promise;}
 };
 vm.runInContext(source,contextFor(window));
 return{window,calls,bank:window.SukunBundledArabicR1065,emit(type){for(const fn of listeners[type]||[])fn();}};
}
async function run(){
 let fetches=0,corrupt=false;
 const window={...baseWindow(),SukunBundledArabicR1065:old,addEventListener(){},
  fetch:async url=>{fetches++;const basename=new URL(url).pathname.split('/').pop();const buffer=corrupt?new Uint8Array([1,2,3]).buffer:bufferFor(basename);return{ok:true,arrayBuffer:async()=>buffer};}
 };
 const context=contextFor(window);vm.runInContext(source,context);
 const api=window.SukunDelailRecordedR1128,bank=window.SukunBundledArabicR1065;
 check(api.metadata.length===9,'nine original sections');
 check(!api.descriptor('reading:delail:kapanis'),'no fabricated closing recording');
 check(bank.has('reading:yasin'),'old availability retained');
 check(bank.descriptor('reading:yasin')===oldResult,'old descriptor retained');
 check(await bank.find('reading:yasin',{})===oldResult,'old finder delegated');
 check(bank.list().length===10,'old and new source lists combined');
 for(let index=0;index<9;index++){
  const id='reading:delail:'+(index===0?'acilis':'h'+index),row=api.descriptor(id);
  const bytes=fs.readFileSync(path.join(assetDir,index===0?'opening.mp3':'h'+index+'.mp3'));
  check(row?.bytes===bytes.byteLength&&row?.sha256===crypto.createHash('sha256').update(bytes).digest('hex')&&row.requiresOriginalPlayback===true,'shipped original integrity and preservation flag '+id);
 }
 for(const opt of [{source:'auto',content:'meaning'},{source:'auto',content:'legacy'},{source:'personal',content:'arabic'},{content:'arabic'},{source:'auto',content:'arabic',onlyVerse:true}]){
  check(await bank.find('reading:delail:acilis',opt)===null,'explicit source/content gate '+JSON.stringify(opt));
 }
 check(fetches===0,'ineligible requests never fetched');
 const recording=await bank.find('reading:delail:acilis',{source:'auto',content:'arabic'});
 check(recording.blob.size===api.metadata[0].bytes&&recording.preserveOriginal===true&&recording.bundled&&recording.content==='arabic','validated original recording returned');
 // Execute the actual reader across the provider/playback API boundary. The
 // native path must receive preservation authority, not only a metadata flag.
 const readerFixtureSource=fs.readFileSync(path.join(root,'tests/r1065/audio-priority.cjs'),'utf8').split('(async()=>{')[0];
 const readerFixture=Function('require','__dirname',readerFixtureSource+'\nreturn fixture;')(require,path.join(root,'tests/r1065'));
 const reader=readerFixture();reader.c.SukunBundledArabicR1065={find:async()=>recording};
 const played=await reader.c.SukunReadingAudioR1064.play({id:'reading:delail:h1',content:'arabic',source:'auto'});
 const accepted=reader.recordCalls[0]?.opt;
 check(played.ok&&accepted?.preserveOriginal===true&&accepted?.bundled===true&&accepted?.backgroundNative===true,'production reader forwards original preservation to native playback');
 const before=fetches;await bank.find('reading:delail:acilis',{source:'auto',content:'arabic'});
 check(fetches===before,'validated source cache reused');
 corrupt=true;let rejected=false;try{await bank.find('reading:delail:h1',{source:'auto',content:'arabic'})}catch(_){rejected=true;}
 check(rejected,'invalid source rejects without fallback');
 const staleFetches=fetches;
 check(await bank.find('reading:delail:h2',{source:'auto',content:'arabic'},()=>false)===null&&fetches===staleFetches,'stale request never fetches');
 vm.runInContext(source,context);
 check(window.SukunDelailRecordedR1128===api&&window.SukunBundledArabicR1065===bank,'installation is idempotent');
 check(api.metadata.every(row=>row.sourcePage===permission&&row.licenseUrl===permission&&!/CC0|public.domain/i.test(row.license)),'conditional permission preserved rather than labelled public domain');
 check(api.metadata.every(row=>row.textSync==='none'&&row.preserveOriginal===true&&row.originalUrl.startsWith('https://al-adaab.org/audio/dalailul_')),'source attribution and lack of text synchronization remain explicit');

 const bodies={opening:bufferFor('opening.mp3'),h1:bufferFor('h1.mp3'),h2:bufferFor('h2.mp3')};
 const a=controlled();let firstCurrent=true;
 const first=a.bank.find('reading:delail:acilis',{source:'auto',content:'arabic'},()=>firstCurrent);await flush();
 check(a.calls.length===1,'first active download admitted');
 firstCurrent=false;const second=a.bank.find('reading:delail:h1',{source:'auto',content:'arabic'},()=>true);await flush();
 check(a.calls.length===2&&a.calls[0].opt.signal.aborted,'superseding distinct section aborts prior download');
 a.calls[0].resolve({ok:true,arrayBuffer:async()=>bodies.opening});a.calls[1].resolve({ok:true,arrayBuffer:async()=>bodies.h1});
 check(await first===null,'stale prior result is neutral');
 check((await second).blob.size===bodies.h1.byteLength,'new section survives stale prior result');
 const oldCount=a.calls.length,third=a.bank.find('reading:delail:acilis',{source:'auto',content:'arabic'},()=>true);await flush();
 check(a.calls.length===oldCount+1,'stale prior source was never cached');
 a.calls[2].resolve({ok:true,arrayBuffer:async()=>bodies.opening});await third;
 const b=controlled();let oneLive=true;
 const coalesced1=b.bank.find('reading:delail:h2',{source:'auto',content:'arabic'},()=>oneLive);
 const coalesced2=b.bank.find('reading:delail:h2',{source:'auto',content:'arabic'},()=>true);await flush();
 check(b.calls.length===1,'same-section downloads coalesce');
 oneLive=false;b.calls[0].resolve({ok:true,arrayBuffer:async()=>bodies.h2});
 check(await coalesced1===null,'stale coalesced caller is neutral');
 check((await coalesced2).blob.size===bodies.h2.byteLength,'live coalesced caller remains valid');
 const c=controlled();let stillCurrent=true;
 const stopped=c.bank.find('reading:delail:h1',{source:'auto',content:'arabic'},()=>stillCurrent);await flush();
 stillCurrent=false;c.emit('sukun:readingchange');
 check(c.calls[0].opt.signal.aborted,'stop event aborts inactive request');
 c.calls[0].resolve({ok:true,arrayBuffer:async()=>bodies.h1});
 check(await stopped===null,'stopped result cannot publish');
}
run().then(()=>{
 const result={build:'r1128',scope:'Exact shipped original sources, provider selection, production playback handoff and cancellation races; no physical Android, audible content or synchronized-text acceptance',passed:tests.filter(test=>test.passed).length,total:tests.length,expectedChecks:39,allPassed:tests.length===39&&tests.every(test=>test.passed),tests};
 if(output){fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');}
 console.log(JSON.stringify(result,null,2));if(!result.allPassed)process.exitCode=1;
},error=>{const result={build:'r1128',expectedChecks:39,passed:tests.filter(test=>test.passed).length,total:tests.length,allPassed:false,error:error.message,tests};if(output){fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');}console.error(JSON.stringify(result,null,2));process.exitCode=1;});
