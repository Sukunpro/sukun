'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('nero.html','utf8');
function fn(n){const s=html.search(new RegExp('(?:async )?function '+n+'\\(')),e=html.indexOf('\n}',s);assert(s>=0&&e>s,n);return html.slice(s,e+2)}
const own=new Blob(['own'],{type:'audio/webm'}),ready=new Blob(['ready'],{type:'audio/webm'}),played=[],nodes={};let stopped=false,fail=false;
const c={Blob,TVK:{has:{0:true}},TV:{},SVK:{},TOVBE_KISIM:[{ad:'a',p:[]},{ad:'b',p:[]}],tvkKey:i=>'dua:tovbe:'+i,
 duaRecReadState:async(_s,i)=>({ok:true,blob:i===0?own:null}),duaRecBegin:()=>({current:()=>!stopped}),duaRecCancel:()=>{stopped=true},
 playRecording:async(blob,label,opt)=>{played.push({blob,label,opt});return true},skRecordingCatalogWarning:()=> 'storage error',duaRecFailure:()=> 'playback error',
 $:k=>nodes[k]||(nodes[k]={textContent:'',innerHTML:''}),$$:()=>[],LOG:{push:()=>{}},tvkSeyirStop:()=>{},svkKisimDurdur:()=>{}};
c.window=c;c.SukunGenericRecordings={hasKnown:()=>true,find:async()=>{if(fail)throw Error('offline');return{blob:ready,key:'ready:1',generic:true}}};
vm.createContext(c);vm.runInContext(['tvkGenericKnown','duaReadSource','tvkReadSource','tvKisimKaydiVarMi','tvKisimlariCal'].map(fn).join('\n'),c);
(async()=>{assert(c.tvKisimKaydiVarMi());await c.tvKisimlariCal();assert.equal(played.length,2);assert.equal(played[0].blob,own);assert.equal(played[1].blob,ready);assert.equal(played[1].opt.generic,true);played.length=0;stopped=false;fail=true;await c.tvKisimlariCal();assert.equal(played.length,1);assert.match(nodes['#tvProg'].textContent,/Hazır kayıt alınamadı/);console.log('Nasuh full flow: personal, ready, failure all passed')})().catch(e=>{console.error(e);process.exitCode=1});
