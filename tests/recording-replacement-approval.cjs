'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const html=fs.readFileSync(require('path').join(__dirname,'../nero.html'),'utf8');
function fn(n){const a=html.indexOf('async function '+n+'('),b=html.indexOf('\n}',a);assert(a>=0);return html.slice(a,b+2)}
const noop=()=>{};let stored=new Blob(['original'],{type:'audio/webm'}),readFail=false,confirmAnswer=false,prompts=0,mics=0;
const c={Blob,console,REC_DB:{get:async()=>{if(readFail)throw Error('storage');return stored},revision:()=>0},toast:noop,REC_CAPTURE:null,navigator:{mediaDevices:{getUserMedia:async()=>{mics++;throw Error('denied')}}},MediaRecorder:class{},alert:noop,document:{getElementById:()=>null},recCaptureBegin:()=>({current:()=>true,stop:noop}),micKisit:()=>({audio:true}),duaRecSyncUI:noop,tvkRender:noop,dlRender:noop,dhKisimSync:noop,tvkKey:()=> 'tvk',dlKey:()=> 'dl',svkKey:()=> 'svk',DUAREC:{defs:{sey:{key:'sey'}},activeId:null},TVK:{saving:{}},DL:{},SVK:{}};
c.window=c;c.confirm=()=>{prompts++;return confirmAnswer};vm.createContext(c);vm.runInContext('let REC_REPLACE_PENDING=false;'+fn('recReplacementApproval')+['duaRecToggle','tvkRec','dlRec','svkRec'].map(fn).join('\n'),c);
(async()=>{
 for(const [name,arg] of [['duaRecToggle','sey'],['tvkRec',0],['dlRec',0],['svkRec',0]]){
  prompts=0;mics=0;confirmAnswer=false;stored=new Blob(['original'],{type:'audio/webm'});await c[name](arg);assert.equal(prompts,1,name);assert.equal(mics,0,'cancel before microphone '+name);assert.equal(await stored.text(),'original');
  prompts=0;readFail=true;await c[name](arg);readFail=false;assert.equal(prompts,0);assert.equal(mics,0,'fail closed '+name);
  confirmAnswer=true;await c[name](arg);assert.equal(mics,1,'approved microphone attempt '+name);assert.equal(await stored.text(),'original');
 }
 let stopped=0;c.REC_CAPTURE={owner:c.TVK,id:0,stop:()=>stopped++};prompts=0;await c.tvkRec(0);assert.equal(stopped,1);assert.equal(prompts,0,'stop does not prompt');c.REC_CAPTURE=null;
 stored=null;prompts=0;assert(await c.recReplacementApproval('fresh'));assert.equal(prompts,0,'fresh recording no warning');
 readFail=false;let release;c.REC_DB.get=()=>new Promise(r=>release=r);const first=c.recReplacementApproval('busy');assert.equal(await c.recReplacementApproval('busy'),null);release(null);assert(await first);
 for(const name of ['duaRecToggle','tvkRec','dlRec','svkRec']){assert(fn(name).includes('expectedRevision:replacement.revision'));assert(fn(name).includes('capture.failed'));}
 assert(html.includes('expectedRevision:attempt.initialRevision'));assert(html.includes('const replacement=await recReplacementApproval(key);'));
 // Execute the real Nasuh save callback with synthetic audio, including errors.
 let last,failWrite=false,writes=0;const oldBlob=new Blob(['keep original'],{type:'audio/webm'});stored=oldBlob;
 c.REC_DB.get=async()=>stored;c.REC_DB.set=async(k,b,opt)=>{writes++;assert.equal(opt.expectedRevision,0);if(failWrite)throw Error('quota');stored=b};
 Object.assign(c,{TOVBE_KISIM:[{ad:'Synthetic'}],duaRecKnown:noop,sfx:noop,vib:noop,recSure:String,micHazirla:async()=>{},recSessionBegin:()=>({}),MediaRecorder:class{constructor(){last=this;this.mimeType='audio/webm'}start(){}},recCaptureBegin:()=>{const cap={failed:false,current:()=>true,accept:()=>true,attach(m){cap.mr=m},finish:()=>1,stop:noop};c.cap=cap;return cap}});
 c.navigator.mediaDevices.getUserMedia=async()=>({});confirmAnswer=true;
 for(const mode of ['short','media-error','write-error','success']){
  stored=oldBlob;failWrite=mode==='write-error';writes=0;await c.tvkRec(0);
  last.ondataavailable({data:new Blob(['x'.repeat(mode==='short'?10:1000)],{type:'audio/webm'})});
  c.cap.failed=mode==='media-error';await last.onstop();
  assert.equal(!!c.TVK.saving[0],false,'saving settles '+mode);
  if(mode==='success')assert.notEqual(stored,oldBlob);else assert.equal(stored,oldBlob,'old blob preserved '+mode);
  if(mode==='short'||mode==='media-error')assert.equal(writes,0,'no write '+mode);
 }
 console.log('PASS: 4 prayer entrypoints cancel/read-failure/permission-failure; stop bypass; new recording; concurrent guard; revision/failure fences.');
})().catch(e=>{console.error(e);process.exitCode=1});
