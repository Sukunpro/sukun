'use strict';
// Exact served production app, generated non-private PCM, real Chromium media.
// The only timing seam is labelled synchronous work in a transparent native
// play observer. Native play/currentTime/ended and its promise are unchanged.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {fixture,hash}=require('../r1064/browser-fixture.cjs');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const output=path.resolve(process.argv[3]||'/tmp/r1098-recording-onset-browser.json');
const report={suite:'r1098 ordinary personal-recording full-source onset with delayed native playing notifications',startedAt:new Date().toISOString(),sourceSha256:hash(fs.readFileSync(path.join(root,'nero.html'))),testSha256:hash(fs.readFileSync(__filename)),checks:[],limitations:[
 'Fresh disposable Linux Chromium profile at 390×844 with Classic/Feyz. Generated PCM contains quiet but nonzero edges; it is not a human or user recording.',
 'Native HTMLMediaElement playback, clocks, decoding, ended events and returned play promise are unchanged. One labelled 300ms synchronous workload delays main-thread callbacks on a pooled repeat. HTML media currentTime is stable within a JavaScript task, so the running AudioContext clock is sampled inside the stall and media currentTime after event-loop resumption.',
 'Raw foreground fallback is exercised by a labelled createMediaElementSource refusal for one separate recording key. Playback remains a real native media element; no synthetic media events, seeks, end events, time acceleration or replacement audio engine is used.',
 'These checks measure routing, media timing, levels and source preservation. They do not measure audible output, phonetic correctness, Samsung/Android hardware or screen-lock behavior.'
]};
let f,p;
function save(){report.total=report.checks.length;report.passed=report.checks.filter(x=>x.passed).length;report.allPassed=!!report.total&&report.total===report.passed&&!report.fatal;fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2));}
async function snapshot(){return p.evaluate(()=>__r1098Onset.snapshot());}
async function check(name,fn){try{report.checks.push({name,passed:true,evidence:await fn()});}catch(error){report.checks.push({name,passed:false,error:error.stack||String(error),state:await snapshot().catch(()=>null)});}save();console.log(JSON.stringify({name,passed:report.checks.at(-1).passed}));}
function phraseWav(){const sr=8000,seconds=1.6,count=Math.round(sr*seconds),b=Buffer.alloc(44+count*2);b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(sr,24);b.writeUInt32LE(sr*2,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(count*2,40);for(let i=0;i<count;i++){const t=i/sr,amplitude=t<.42||t>=1.22?.002:.12;b.writeInt16LE(Math.round(Math.sin(i*2*Math.PI*330/sr)*amplitude*32767),44+i*2);}return b;}
async function run(label,{key='temel:0',volume=.7,stall=false}={}){
 await p.evaluate(({label,key,volume,stall})=>{const audit=__r1098Onset;Object.assign(audit,{current:label,stallNext:stall,result:null});audit.runs[label]={key,volume,stall,requestedAt:performance.now()};void SukunTabOwner.run('listen',async()=>{const blob=await REC_DB.get(key);return await playRecording(blob,'onizle:'+key,{detail:true,resume:false,recordingKey:key,volume});},{releaseAfter:true}).then(result=>{audit.runs[label].result=result;audit.result={label,result};},error=>{audit.result={label,error:String(error)};});},{label,key,volume,stall});
 await p.waitForFunction(label=>__r1098Onset.result?.label===label,label,{timeout:12000});
 return p.evaluate(label=>({run:__r1098Onset.runs[label],events:__r1098Onset.events.filter(x=>x.run===label),result:__r1098Onset.result}),label);
}
function verifyRun(row,{graph=true,muted=false,stall=false}={}){
 const events=row.events,call=events.find(e=>e.type==='play'),playing=events.find(e=>e.type==='playing'),ended=events.find(e=>e.type==='ended');
 assert(call&&playing&&ended,'native play, playing and ended must all occur');assert.deepEqual(row.result.result,{ok:true,reason:'ended'});
 assert.equal(call.time,0,'ordinary playback starts at original media sample zero');assert.equal(call.muted,false);assert.equal(call.graph,graph);
 if(muted)assert.equal(call.volume,0,'an explicit zero user level remains exactly zero before play');else assert(call.volume>0,'ordinary element volume is armed before native play');
 if(graph){assert(call.dry>0,'ordinary dry gain must be armed before native play');assert(call.wet>0,'enabled wet gain must be armed before native play');assert.equal(call.context,'running');}
 assert.equal(ended.duration,1.6);assert.equal(ended.time,1.6,'quiet tail remains part of full native playback');
 assert(!events.some(e=>e.type==='seeking'&&e.time>.04),'automatic quality analysis must not seek over a quiet prefix');
 for(const e of events.filter(e=>['playing','after-playing','play-fulfilled'].includes(e.type))){if(muted)assert.equal(e.volume,0,'delayed callback must retain explicit zero');else assert(e.volume>0,'delayed callback must retain intended element level');if(graph)assert(e.dry>0,'delayed callback must not remute an already running source');}
 if(stall){const workload=events.find(e=>e.type==='labelled-main-thread-workload');assert(workload,'labelled workload must run exactly at native play');assert(workload.blockedMs>=295);assert(workload.after.audioTime-workload.before.audioTime>.2,'native AudioContext clock continues while main-thread notification handlers are blocked');assert(workload.after.dry>.05,'audio-clock onset ramp opens without a JS callback');const resumed=events.find(e=>['playing','play-fulfilled','timeupdate'].includes(e.type)&&e.time>.08);assert(resumed,'real media clock must advance after event-loop resumption');}
 return{...row,scope:'Ordinary playRecording options: no intention, session or bundled flag; generated original bytes and real native completion.'};
}
async function main(){
 f=await fixture(root,{width:390,height:844});p=f.page;report.browser=f.browser.version();const input=phraseWav();report.generatedInput={sha256:hash(input),bytes:input.length,sampleRate:8000,duration:1.6,quietPrefixSeconds:.42,quietTailSeconds:.38,quietAmplitude:.002,strongAmplitude:.12};
 await p.evaluate(async bytes=>{
  NIYET.on=false;NIYET.spk=false;NIYET.devir=false;ZA.kapali=true;BENDIR=false;Z.auto=false;Z.tick=false;Z.vib=false;KAYIT.yankiMik=.25;KAYIT.mekan=false;ZVOL=.8;OKUMA_HIZ=1;window.__SUKUN_STEP_VOL=1;
  await SukunVoiceSettings.setContent('legacy');await SukunVoiceSettings.setMode('personal');ac();await ctx.resume();
  const blob=new Blob([Uint8Array.from(atob(bytes),c=>c.charCodeAt(0))],{type:'audio/wav'});for(const key of ['temel:0','temel:1']){await REC_DB.set(key,blob);RECKEYS.add(key);}
  const audit=window.__r1098Onset={events:[],runs:{},current:'',result:null,stallNext:false,recordingWrites:[],quality:await SukunRecordingQuality.analyse(blob)};
  audit.digest=async key=>{const b=await REC_DB.get(key);return{sha256:Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await b.arrayBuffer())),x=>x.toString(16).padStart(2,'0')).join(''),bytes:b.size,type:b.type,revision:REC_DB.revision(key)};};
  audit.before={};for(const key of ['temel:0','temel:1'])audit.before[key]=await audit.digest(key);
  for(const method of ['set','del']){const original=REC_DB[method];REC_DB[method]=function(...args){audit.recordingWrites.push({method,key:String(args[0])});return original.apply(this,args);};}
  const sample=el=>({id:el.__r1098Id,key:el._sukunRecordingKey,time:el.currentTime,duration:Number.isFinite(el.duration)?el.duration:null,volume:el.volume,muted:el.muted,dry:el._kuru?.gain?.value??null,wet:el._wet?.gain?.value??null,graph:!!el._src,audioTime:ctx?.currentTime??null,context:ctx?.state||'none',master:master?.gain?.value??null});
  const note=(type,el,extra={})=>{const row={type,run:audit.current,at:performance.now(),...sample(el),...extra};audit.events.push(row);return row;};
  audit.media=[];let serial=0;const seen=new WeakSet(),nativePlay=HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play=function(...args){
   if(!['temel:0','temel:1'].includes(this._sukunRecordingKey))return nativePlay.apply(this,args);
   if(!seen.has(this)){seen.add(this);this.__r1098Id=++serial;audit.media.push(this);for(const type of ['loadedmetadata','playing','timeupdate','seeking','seeked','ended','pause','error'])this.addEventListener(type,()=>{note(type,this);if(type==='playing')queueMicrotask(()=>note('after-playing',this));},{capture:true});}
   note('play',this);const promise=nativePlay.apply(this,args);
   if(audit.stallNext){audit.stallNext=false;const before=sample(this),start=performance.now();while(performance.now()-start<300){}const after=sample(this);note('labelled-main-thread-workload',this,{before,after,blockedMs:performance.now()-start});}
   promise.then(()=>note('play-fulfilled',this),error=>note('play-rejected',this,{error:String(error)}));return promise;
  };
  const nativeSource=AudioContext.prototype.createMediaElementSource;AudioContext.prototype.createMediaElementSource=function(el){if(el._sukunRecordingKey==='temel:1'){audit.events.push({type:'labelled-graph-refusal',run:audit.current,at:performance.now(),key:el._sukunRecordingKey});throw new DOMException('Labelled test graph refusal','InvalidStateError');}return nativeSource.call(this,el);};
  audit.snapshot=()=>({quality:audit.quality,runs:audit.runs,events:audit.events,recordingWrites:audit.recordingWrites,speech:__r1064SpeechFixture.log.slice(),active:audit.media.filter(a=>!a.paused&&!a.ended).map(sample),context:ctx?.state||'none'});
 },input.toString('base64'));
 await check('Real quality analysis detects the deliberately quiet nonzero prefix and tail without editing the PCM',async()=>{const q=await p.evaluate(()=>__r1098Onset.quality);assert(q&&q.trimStart>.25&&q.tailTrim>.2,JSON.stringify(q));assert.equal(q.duration,1.6);assert(q.gain>0);return q;});
 await check('Ordinary foreground recording prearms the graph and plays every source sample through genuine ended',async()=>verifyRun(await run('ordinary-graph')));
 await check('Pooled ordinary repeat survives 300ms blocked playing handlers with native clocks and no late remute or trim',async()=>{const row=verifyRun(await run('pooled-repeat',{stall:true}),{stall:true});const first=await p.evaluate(()=>__r1098Onset.events.find(e=>e.run==='ordinary-graph'&&e.type==='play'));assert.equal(row.events.find(e=>e.type==='play').id,first.id,'pooled repeat retains original native element/graph');return row;});
 await check('Explicit zero user volume remains zero before play and after delayed native callbacks',async()=>{await p.evaluate(()=>{ZVOL=0;});try{return verifyRun(await run('muted-graph'),{muted:true});}finally{await p.evaluate(()=>{ZVOL=.8;});}});
 await check('Labelled WebAudio graph refusal falls back to an armed real native element without prefix or tail loss',async()=>{const row=verifyRun(await run('raw-native',{key:'temel:1'}),{graph:false});assert(row.events.some(e=>e.type==='labelled-graph-refusal'));return row;});
 await check('Analysis and all ordinary repetitions preserve exact REC_DB bytes, revisions and personal-source priority',async()=>{const row=await p.evaluate(async()=>{const a=__r1098Onset,after={};for(const key of Object.keys(a.before))after[key]=await a.digest(key);return{before:a.before,after,writes:a.recordingWrites,speech:__r1064SpeechFixture.log,qualityAfter:await SukunRecordingQuality.analyse(await REC_DB.get('temel:0')),active:a.snapshot().active};});assert.deepEqual(row.after,row.before);assert.deepEqual(row.writes,[]);assert.deepEqual(row.speech,[]);assert.deepEqual(row.active,[]);assert(row.qualityAfter.trimStart>.25&&row.qualityAfter.tailTrim>.2,'playback copies must not erase the cached measured analysis');assert.equal(row.after['temel:0'].sha256,hash(input));return row;});
 await check('Production files are served unchanged and the fresh native profile has no application errors',async()=>{const e=f.evidence();assert.equal(hash(fs.readFileSync(path.join(root,'nero.html'))),report.sourceSha256);for(const [name,row]of Object.entries(e.served))assert.equal(row.sha256,hash(fs.readFileSync(path.join(root,name))),'served app bytes changed: '+name);assert.deepEqual(e.pageErrors,[]);assert.deepEqual(e.failedRequests,[]);assert(!e.consoleErrors.some(x=>/integrity|syntaxerror|referenceerror|typeerror/i.test(x)),e.consoleErrors.join('\n'));return{servedFiles:Object.keys(e.served).length,sourceSha256:report.sourceSha256,pageErrors:e.pageErrors,failedRequests:e.failedRequests};});
}
main().catch(error=>{report.fatal=error.stack||String(error);console.error(error);}).finally(async()=>{if(f){report.snapshot=await snapshot().catch(()=>null);report.evidence=f.evidence();await f.close();}report.finishedAt=new Date().toISOString();save();console.log(JSON.stringify({output,total:report.total,passed:report.passed,allPassed:report.allPassed}));process.exitCode=report.allPassed?0:1;});
