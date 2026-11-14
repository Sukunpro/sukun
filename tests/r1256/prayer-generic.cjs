'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('nero.html','utf8');
function fn(n){const s=html.search(new RegExp('(?:async )?function '+n+'\\(')),e=html.indexOf('\n}',s);assert(s>=0&&e>s,n);return html.slice(s,e+2)}
const own=new Blob(['own'],{type:'audio/webm'}),ready=new Blob(['ready'],{type:'audio/webm'}),played=[],nodes={};let stopped=false,fail=false,personal=new Map();
const c={Blob,REC_DB:{revision:()=>0},DUAREC:{defs:{ak:{key:'dua:ak'}},has:{},blobCache:{},readError:{}},SVK:{has:{}},DH:{},SALAVAT_KISIM:[{ad:'a',p:[0]},{ad:'b',p:[1]}],svkKey:i=>'dua:salavat:'+i,
 duaRecReadState:async(_s,i,key)=>({ok:true,blob:personal.get(key)||null}),duaRecBegin:()=>({current:()=>!stopped}),duaRecCancel:()=>{stopped=true},
 duaRecSyncUI:()=>{},playRecording:async(blob,label,opt)=>{played.push({blob,label,opt});return true},skRecordingCatalogWarning:()=> 'storage error',duaRecFailure:()=> 'playback error',
 $:k=>nodes[k]||(nodes[k]={textContent:'',innerHTML:''}),LOG:{push:()=>{}},dhHi:()=>{}};
c.window=c;c.SukunGenericRecordings={hasKnown:()=>true,find:async keys=>{if(fail)throw Error('offline');return{blob:ready,key:'ready:'+keys[0],generic:true}}};
vm.createContext(c);vm.runInContext(['duaGenericKnown','duaReadSource','duaRecAvailable','duaRecPlay','dhKisimKaydiVarMi','dhKisimlariCal'].map(fn).join('\n'),c);
(async()=>{
 assert(c.duaRecAvailable('ak'));assert(await c.duaRecPlay('ak',{isCurrent:()=>!stopped}));assert.equal(played.pop().blob,ready);
 personal.set('dua:ak',own);assert(await c.duaRecPlay('ak',{isCurrent:()=>!stopped}));assert.equal(played.pop().blob,own);
 fail=true;personal.delete('dua:ak');assert.equal(await c.duaRecPlay('ak',{isCurrent:()=>!stopped}),false);assert(c.DUAREC.genericError.ak);
 fail=false;personal.set('dua:salavat:0',own);assert(c.dhKisimKaydiVarMi());assert(await c.dhKisimlariCal());assert.equal(played.length,2);assert.equal(played[0].blob,own);assert.equal(played[1].blob,ready);assert(played[1].opt.generic);
 played.length=0;stopped=false;fail=true;assert.equal(await c.dhKisimlariCal(),false);assert.equal(played.length,1);assert.match(nodes['#dhProg'].textContent,/Hazır kayıt alınamadı/);
 console.log('Whole prayer and Salavat flow: personal priority, generic source and failures passed');
})().catch(e=>{console.error(e);process.exitCode=1});
