/* r981: one preparation queue, pre-decode bounds and a disposable CPU worker.
   Native decodeAudioData stays on the browser API; no playback owner is created. */
(function(w){
 'use strict';if(w.SukunAudioPreparation)return;
 const MiB=1024*1024,BUDGET=32*MiB,SOURCE=8*MiB,MAX_SECONDS=60,MAX_QUEUE=4;
 const runtimeUrl=new URL(document.currentScript?.src||'./assets/runtime/audio-preparation-r981.js',document.baseURI),workerScript=new URL('./audio-cpu-r981.js',runtimeUrl);
 workerScript.searchParams.set('v',runtimeUrl.searchParams.get('v')||w.SUKUN_BUILD||'r981');const workerUrl=workerScript.href;
 let tail=Promise.resolve(),pending=0,active=0,seq=0,worker=null,workerDisabled=false,last=null;
 const urls=new Map(),trimmers=new Set(),residents=new Map(),metadata=new WeakMap();
 const metrics={decodeStarts:0,workerJobs:0,fallbackJobs:0,rejected:0,timedOut:0,cancelled:0,peakEstimate:0,maxConcurrent:0};
 const error=(code,message)=>Object.assign(Error(message||code),{code});
 function resident(){let bytes=0;for(const [url,x]of urls)if(!activeCreated?.has(url))bytes+=x;for(const get of residents.values())try{bytes+=Math.max(0,+get()||0)}catch(_){}return bytes;}
 let activeCreated=null,activeEstimate=0,activeTask=null;
 function reserve(bytes){
  if(!Number.isFinite(bytes)||bytes<0||bytes>BUDGET)throw error('PREP_MEMORY_LIMIT');
  if(bytes+resident()>BUDGET)for(const trim of trimmers){try{trim(Math.max(0,BUDGET-bytes))}catch(_){}if(bytes+resident()<=BUDGET)break;}
  if(bytes+resident()>BUDGET)throw error('PREP_MEMORY_LIMIT');
  activeEstimate=Math.max(activeEstimate,bytes);metrics.peakEstimate=Math.max(metrics.peakEstimate,bytes+resident());
 }
 function notify(code,key='',purpose=''){
  metrics.rejected++;const en=w.I18N?.lang==='en';
  const text=purpose==='studio'?(code==='PREP_CANCELLED'?(en?'Outdated recording analysis or editing was cancelled. Your original recording was kept.':'Eski kayıt analizi veya düzenlemesi iptal edildi. Asıl kayıt korundu.'):(en?'The recording could not be processed within the verified format, memory or time limits. Your original recording was kept.':'Kayıt doğrulanmış biçim, bellek veya süre sınırlarında işlenemedi. Asıl kayıt korundu.')):code==='PREP_UNKNOWN_DURATION'?(en?'The recording duration could not be verified. Your original recording remains available; echo and 8D preparation were skipped.':'Kaydın süresi doğrulanamadı. Asıl kayıt kullanılabilir; eko ve 8D hazırlığı yapılamadı.'):
   code==='PREP_CANCELLED'?(en?'Outdated sound preparation was cancelled.':'Eski ses hazırlığı iptal edildi.'):
   (en?'This recording could not be prepared within the device memory or time limit. Your original recording remains available; prepared echo and 8D are unavailable for this attempt.':'Bu kayıt cihazın bellek veya süre sınırında hazırlanamadı. Asıl kayıt kullanılabilir; bu denemede hazırlanmış eko ve 8D kullanılamıyor.');
  last={code,key:String(key||''),purpose:String(purpose||''),text,at:Date.now()};
  try{w.dispatchEvent(new CustomEvent('sukun:audio-preparation',{detail:{...last}}))}catch(_){}
  if(code==='PREP_CANCELLED'||purpose==='studio')return;
  try{const target=(purpose==='studio'?document.getElementById('r170StudioStat'):null)||document.getElementById('spkMsg')||document.getElementById('itemRecStatus')||document.getElementById('mbQuality');if(target){target.textContent=text;target.setAttribute('role','status');target.dataset.sukPreparation=code;}}catch(_){}
 }
 function riff(bytes){
  const v=new DataView(bytes),b=new Uint8Array(bytes),word=o=>String.fromCharCode(...b.subarray(o,o+4));
  if(bytes.byteLength<12||word(0)!=='RIFF'||word(8)!=='WAVE')return null;
  if(v.getUint32(4,true)+8!==bytes.byteLength)throw error('PREP_INVALID_HEADER');
  let channels=0,rate=0,align=0,data=0,pos=12,count=0;
  while(pos+8<=b.length&&count++<4096){const id=word(pos),size=v.getUint32(pos+4,true);if(pos+8+size>b.length)throw error('PREP_INVALID_HEADER');
   if(id==='fmt '&&size>=16){if(channels)throw error('PREP_INVALID_HEADER');let format=v.getUint16(pos+8,true);if(format===65534&&size>=40)format=v.getUint16(pos+32,true);if(![1,3].includes(format))throw error('PREP_INVALID_HEADER');channels=v.getUint16(pos+10,true);rate=v.getUint32(pos+12,true);align=v.getUint16(pos+20,true);const bits=v.getUint16(pos+22,true);if(![8,16,24,32,64].includes(bits)||align!==channels*bits/8)throw error('PREP_INVALID_HEADER');}
   if(id==='data')data+=size;pos+=8+size+(size%2);
  }
  if(pos!==b.length||!channels||!rate||!align||!data||channels>2||rate>192000||data%align)throw error('PREP_INVALID_HEADER');
  return{duration:data/align/rate,channels,sampleRate:rate,verified:'wav'};
 }
 function webm(bytes){
  const b=new Uint8Array(bytes),v=new DataView(bytes);if(b.length<4||v.getUint32(0)!==0x1a45dfa3)return null;
  function vint(pos,id=false){let first=b[pos],len=1,mask=128;while(len<=8&&!(first&mask)){mask>>=1;len++;}if(len>8||pos+len>b.length)throw error('PREP_INVALID_HEADER');let value=id?first:first&(mask-1);for(let i=1;i<len;i++)value=value*256+b[pos+i];return{len,value,unknown:!id&&value===Math.pow(2,7*len)-1};}
  const uint=(p,n)=>{if(n<1||n>8)throw error('PREP_INVALID_HEADER');let x=0;for(let i=0;i<n;i++)x=x*256+b[p+i];if(!Number.isSafeInteger(x))throw error('PREP_INVALID_HEADER');return x};
  const masters=new Set([0x1a45dfa3,0x18538067,0x1549a966,0x1654ae6b,0xae,0xe1,0x1f43b675,0xa0]);
  let scale=1000000,duration=0,channels=1,sampleRate=48000,codec='',audioTrack=0,last=-Infinity,nodes=0,packetSamples=0;
  // RFC 6716 sections 3.1/3.2: count decoded samples as well as timestamps.
  function opusSamples(pos,end){
   if(pos>=end)throw error('PREP_INVALID_HEADER');const toc=b[pos],config=toc>>3,code=toc&3;
   const frame=config>=16?120*(2**(config&3)):config>=12?480*(2**(config&1)):(config&3)===3?2880:480*(2**(config&3));
   if(code===3&&pos+1>=end)throw error('PREP_INVALID_HEADER');const count=code===0?1:code===3?b[pos+1]&63:2,total=frame*count;
   if(!count||total>5760)throw error('PREP_INVALID_HEADER');return total;
  }
  function scan(start,end,state={},depth=0){if(depth>12)throw error('PREP_INVALID_HEADER');let pos=start;
   while(pos<end&&pos<b.length){if(++nodes>20000)throw error('PREP_INVALID_HEADER');const id=vint(pos,true);pos+=id.len;const size=vint(pos);pos+=size.len;const stop=size.unknown?end:pos+size.value;if(stop>end||stop>b.length||stop<pos)throw error('PREP_INVALID_HEADER');
    if(id.value===0x2ad7b1)scale=uint(pos,size.value);
    if(id.value===0x4489&&(size.value===4||size.value===8))duration=(size.value===4?v.getFloat32(pos):v.getFloat64(pos));
    if(id.value===0xae){const track={};scan(pos,stop,track,depth+1);if(track.type===2){if(audioTrack)throw error('PREP_INVALID_HEADER');audioTrack=track.number;codec=track.codec||'';channels=track.channels||1;sampleRate=track.rate||48000;if(codec==='A_OPUS'&&(!track.opus||track.opus.channels!==channels))throw error('PREP_UNKNOWN_LAYOUT');}}
    else if(id.value===0x1f43b675){const cluster={cluster:0};scan(pos,stop,cluster,depth+1);}
    else if(masters.has(id.value))scan(pos,stop,state,depth+1);
    else if(id.value===0xd7)state.number=uint(pos,size.value);
    else if(id.value===0x83)state.type=uint(pos,size.value);
    else if(id.value===0x86){if(size.value>64)throw error('PREP_INVALID_HEADER');state.codec=String.fromCharCode(...b.subarray(pos,stop));}
    else if(id.value===0x63a2){if(size.value!==19||String.fromCharCode(...b.subarray(pos,pos+8))!=='OpusHead'||b[pos+8]!==1||b[pos+9]<1||b[pos+9]>2||b[pos+18]!==0)throw error('PREP_UNKNOWN_LAYOUT');state.opus={channels:b[pos+9]};}
    else if(id.value===0x9f)state.channels=uint(pos,size.value);
    else if(id.value===0xb5&&(size.value===4||size.value===8))state.rate=size.value===4?v.getFloat32(pos):v.getFloat64(pos);
    else if(id.value===0xe7){state.cluster=uint(pos,size.value);if(state.cluster*scale/1e9>MAX_SECONDS)throw error('PREP_MEMORY_LIMIT');}
    else if(id.value===0xa3||id.value===0xa1){if(!audioTrack)throw error('PREP_UNKNOWN_LAYOUT');const track=vint(pos);if(track.value===audioTrack){const off=pos+track.len;if(off+3>stop)throw error('PREP_INVALID_HEADER');if(b[off+2]&6)throw error('PREP_UNKNOWN_DURATION');packetSamples+=opusSamples(off+3,stop);last=Math.max(last,(state.cluster||0)+v.getInt16(off));if(last*scale/1e9>MAX_SECONDS||packetSamples/48000>MAX_SECONDS)throw error('PREP_MEMORY_LIMIT');}}
    pos=stop;
   }
  }
  scan(0,b.length);if(codec!=='A_OPUS'||!audioTrack||channels>2||!Number.isFinite(last)||!scale||sampleRate>192000)throw error('PREP_UNKNOWN_DURATION');
  // Opus packets are at most 120 ms. One second conservatively includes codec delay.
  return{duration:Math.max(duration*scale/1e9,(last*scale/1e9)+1,packetSamples/48000+1),channels,sampleRate,packetSeconds:packetSamples/48000,verified:'webm-opus'};
 }
 async function probe(blob){
  if(!document.createElement||!URL.createObjectURL)throw error('PREP_UNKNOWN_DURATION');
  return new Promise((resolve,reject)=>{let a=document.createElement('audio'),url='',done=false;
   const finish=(value,err)=>{if(done)return;done=true;clearTimeout(timer);a.onloadedmetadata=a.onerror=null;try{a.removeAttribute('src');a.load();if(url)URL.revokeObjectURL(url)}catch(_){}a=null;err?reject(err):resolve(value);};
   const timer=setTimeout(()=>finish(null,error('PREP_UNKNOWN_DURATION')),2200);
   a.preload='metadata';a.autoplay=false;a.onloadedmetadata=()=>Number.isFinite(a.duration)&&a.duration>0?finish({duration:a.duration,channels:0,sampleRate:48000,verified:'metadata'}):finish(null,error('PREP_UNKNOWN_DURATION'));a.onerror=()=>finish(null,error('PREP_UNKNOWN_DURATION'));
   try{url=URL.createObjectURL(blob);a.src=url;a.load()}catch(_){finish(null,error('PREP_UNKNOWN_DURATION'))}
  });
 }
 async function inspect(blob){
  if(!blob||!blob.size||blob.size>SOURCE)throw error('PREP_SOURCE_LIMIT');
  if(metadata.has(blob))return metadata.get(blob);
  const bytes=await blob.arrayBuffer(),value=riff(bytes)||webm(bytes)||await probe(blob);
  if(!Number.isFinite(value.duration)||value.duration<=0||value.duration>MAX_SECONDS||value.channels>2)throw error('PREP_MEMORY_LIMIT');
  if(!value.channels)throw error('PREP_UNKNOWN_LAYOUT');
  const result={...value,compressedBytes:blob.size};metadata.set(blob,result);return result;
 }
 function estimate(meta,opt={},decoded){
  const declared=opt.decodeRate==null?48000:+opt.decodeRate;if(!Number.isFinite(declared)||declared<=0)throw error('PREP_MEMORY_LIMIT');
  const sr=Math.max(44100,declared,+decoded?.sampleRate||0),duration=Math.max(meta.duration,+decoded?.duration||0);
  const inputFrames=Math.ceil(duration*sr),inputChannels=decoded?.numberOfChannels||meta.channels,outChannels=opt.spatial?2:Math.min(2,inputChannels),extra=Math.max(0,+opt.extraSeconds||0);
  const frames=Math.ceil((duration+extra)*sr);
  // Original browser PCM, transfer copy, stereo effects output, packed WAV and source copies.
  return meta.compressedBytes*3+inputFrames*inputChannels*8+(opt.purpose==='decode'?0:frames*outChannels*6)+65536;
 }
 function current(task){return !task.expired&&!task.signal?.aborted&&(!task.isCurrent||task.isCurrent());}
 function check(task){if(!current(task))throw error('PREP_CANCELLED');}
 function stage(task,value){task.stage=value;task.stageAt=Date.now();try{task.onStage?.(value)}catch(_){};}
 function createUrl(blob){const url=URL.createObjectURL(blob);urls.set(url,blob.size);activeCreated?.add(url);return url;}
 function stopWorker(){try{worker?.terminate()}catch(_){}worker=null;}
 async function cpu(decoded,options={},task){
  check(task);stage(task,'cpu');reserve(estimate(task.meta,{...task,purpose:options.kind==='quality'?'quality':'fx',spatial:options.spatial,extraSeconds:Math.max(0,(+options.frames||decoded.length)/decoded.sampleRate-decoded.duration)},decoded));
  const make=()=>({kind:options.kind||'render',input:Array.from({length:Math.min(2,decoded.numberOfChannels)},(_,c)=>new Float32Array(decoded.getChannelData(c))),sampleRate:decoded.sampleRate,length:options.kind==='pack'?Math.max(decoded.length,Math.ceil(options.frames||0)):decoded.length,options});
  if(!workerDisabled&&typeof w.Worker==='function'){
   try{
    if(!worker)worker=new w.Worker(workerUrl);const payload=make(),id=++seq;metrics.workerJobs++;
    return await new Promise((resolve,reject)=>{
     let done=false;const timer=setTimeout(()=>finish(null,error('PREP_WORKER_TIMEOUT')),12000);
     const onAbort=()=>finish(null,error('PREP_CANCELLED'));
     const finish=(value,err)=>{if(done)return;done=true;clearTimeout(timer);if(task.cancelCpu===onAbort)task.cancelCpu=null;task.signal?.removeEventListener?.('abort',onAbort);worker&&(worker.onmessage=worker.onerror=worker.onmessageerror=null);if(err)stopWorker();err?reject(err):resolve(value);};
     task.cancelCpu=onAbort;
     worker.onmessage=e=>{if(e.data?.id!==id)return;if(!current(task))finish(null,error('PREP_CANCELLED'));else if(e.data.error)finish(null,error('PREP_WORKER_FAILED'));else finish(e.data.result);};
     worker.onerror=worker.onmessageerror=()=>finish(null,error('PREP_WORKER_FAILED'));task.signal?.addEventListener?.('abort',onAbort,{once:true});
     try{worker.postMessage({id,payload},payload.input.map(x=>x.buffer))}catch(_){finish(null,error('PREP_WORKER_FAILED'))}
    });
   }catch(e){if(e.code==='PREP_CANCELLED'||e.code==='PREP_WORKER_TIMEOUT')throw e;workerDisabled=true;stopWorker();}
  }
  check(task);metrics.fallbackJobs++;const gen=w.SukunAudioCpuR981.job(make());let step;
  do{check(task);step=gen.next();if(!step.done)await new Promise(r=>setTimeout(r,0));}while(!step.done);return step.value;
 }
 function run(blob,decode,opt={}){
  // A cancelled native decode can remain unresolved in Chrome. It still owns
  // its memory lease; reject new preparation immediately instead of queueing
  // another 20-second wait behind it or opening another unbounded decoder.
  if(activeTask?.stage==='decode'&&!current(activeTask)){const e=error('PREP_DECODE_BUSY');notify(e.code,opt.key,opt.purpose);return Promise.reject(e);}
  if(pending>=MAX_QUEUE){const e=error('PREP_QUEUE_FULL');notify(e.code,opt.key,opt.purpose);return Promise.reject(e);}
  if(!blob||blob.size>SOURCE){const e=error('PREP_SOURCE_LIMIT');notify(e.code,opt.key,opt.purpose);return Promise.reject(e)}
  pending++;const task={...opt,expired:false,meta:null,stage:'queued',stageAt:Date.now()},before=tail;let release;tail=new Promise(r=>release=r);
  stage(task,'queued');let timer=0,abort=null;
  const work=(async()=>{await before;try{
   check(task);active++;activeTask=task;metrics.maxConcurrent=Math.max(metrics.maxConcurrent,active);activeCreated=new Set();activeEstimate=0;
   stage(task,'inspect');reserve(blob.size*3+65536);task.meta=await inspect(blob);check(task);reserve(estimate(task.meta,task));metrics.decodeStarts++;
   const bytes=await blob.arrayBuffer();check(task);stage(task,'decode');const decoded=await decode(bytes,{check:()=>check(task)});check(task);
   if(!decoded||!Number.isFinite(decoded.duration)||decoded.duration>MAX_SECONDS||decoded.numberOfChannels>2)throw error('PREP_MEMORY_LIMIT');
   reserve(estimate(task.meta,task,decoded));
   const result=task.use?await task.use(decoded,{cpu:(options)=>cpu(decoded,options,task),meta:task.meta,check:()=>check(task),createUrl:blob=>{check(task);return createUrl(blob)}}):decoded;
   check(task);return result;
  }catch(e){if(e.code==='PREP_CANCELLED'){if(!task.cancelCounted){metrics.cancelled++;task.cancelCounted=true;}}if(!task.abortNotified)notify(e.code||'PREP_FAILED',task.key,task.purpose);throw e;}finally{
   clearTimeout(timer);if(activeTask===task){active=Math.max(0,active-1);activeTask=null;activeCreated=null;activeEstimate=0;}pending--;release();
  }})();
  // Cancellation settles the caller promptly, while the underlying browser
  // decode retains the queue and budget until it actually settles.
  const cancelled=new Promise((_,reject)=>{
   abort=()=>{if(task.expired)return;task.expired=true;if(!task.cancelCounted){metrics.cancelled++;task.cancelCounted=true;}task.cancelCpu?.();const e=error('PREP_CANCELLED');task.abortNotified=true;notify(e.code,task.key,task.purpose);reject(e);};
   if(task.signal?.aborted)abort();else task.signal?.addEventListener?.('abort',abort,{once:true});
  });
  const deadline=new Promise((_,reject)=>{timer=setTimeout(()=>{task.expired=true;metrics.timedOut++;task.cancelCpu?.();try{task.onExpire?.()}catch(_){}const e=error('PREP_TIMEOUT');notify(e.code,task.key,task.purpose);reject(e)},20000)});
  work.catch(()=>{});return Promise.race([work,deadline,cancelled]).finally(()=>{clearTimeout(timer);task.signal?.removeEventListener?.('abort',abort);});
 }
 const api=Object.freeze({version:'r981',inspect,run,
  createUrl,
  forgetUrl(url){urls.delete(url)},addTrimmer(fn){trimmers.add(fn)},addResident(name,get){residents.set(String(name),get)},
  notify,snapshot:()=>({version:'r981',budgetBytes:BUDGET,sourceBudgetBytes:SOURCE,pending,active,stage:activeTask?(activeTask.expired?'cancelled-':'')+activeTask.stage:'idle',stageAgeMs:activeTask?Math.max(0,Date.now()-activeTask.stageAt):0,decodeBlocked:!!(activeTask?.stage==='decode'&&!current(activeTask)),residentBytes:resident(),activeEstimate,worker:workerDisabled?'fallback':worker?'ready':'idle',...metrics,last}),
  // Pure parsers are exposed for the offline health/audit layer; they do not decode or play.
  inspectBytes:bytes=>riff(bytes)||webm(bytes)
 });w.SukunAudioPreparation=api;
})(window);
