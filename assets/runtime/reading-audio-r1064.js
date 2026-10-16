/* SÜKÛN r1065 — bundled Arabic first, safe legacy recording fallback. */
(()=>{
 'use strict';
 const w=window,ID='reading-r1064',listeners=new Set();
 let sequence=0,partAttempt=0,utterance=null,settleUtterance=null,resumeWaiter=null;
 let state={version:'r1065',id:'',title:'',kind:'',phase:'idle',content:'arabic',source:'auto',sourceKind:'none',part:0,total:0,verse:0,progress:null,verseSync:'none',currentTime:null,duration:null,reason:'',queue:[]};
 let currentEntry=null,currentOptions=null,dhikrIdentity=null,ownerPromise=null,activeCurrent=null,settingsEpoch=w.SukunVoiceSettings?.epoch?.()||0,lastAcceptedLeaseEpoch=-1;
 const active=()=>['preparing','playing','paused'].includes(state.phase);
 const snapshot=()=>Object.freeze({...state,queue:state.queue.map(x=>({verse:x.verse||0}))});
 function emit(reason){
  const s=snapshot();for(const fn of listeners)try{fn(s)}catch(_){}
  try{w.dispatchEvent(new CustomEvent('sukun:readingchange',{detail:s}));w.SukunAudioSessionRegistry?.sync?.();w.SukunNowPlayingStore?.refresh?.();w.currentFlowState?.refresh?.('reading:'+reason,true)}catch(_){}
 }
 function change(patch,reason){state={...state,...patch};emit(reason);}
 function sourceLabel(kind){const en=w.I18N?.lang==='en';return kind==='bundled'?(en?'Bundled Arabic recitation':'Gömülü Arapça kıraat'):kind==='personal'?(en?'Personal recording':'Kendi kayıt'):kind==='generic'?(en?'General recording':'Jenerik kayıt'):state.content==='arabic'?(en?'Arabic TTS':'Arapça TTS'):state.content==='meaning'?(en?'Turkish meaning · TTS':'Türkçe anlam · TTS'):(en?'Latin reading · TTS':'Latin okunuş · TTS');}
 function publishSource(kind){
  const recording=['personal','generic','bundled'].includes(kind),label=sourceLabel(kind);
  try{w.sukunSourceSet?.(recording?'recording':'tts',label,state.title);w.SukunVoiceSource?.set?.(recording?'recording':state.content==='arabic'?'tts-ar':'tts-tr',label,state.title,recording?{recordingOrigin:kind}:undefined)}catch(_){}
 }
 function failure(reason){
  const r=w.SukunReadingPolicy.unavailable(reason);change({phase:'error',reason,sourceKind:'none'},'error');return r;
 }
 function contentOptions(opt={}){
  return{content:opt.content||w.SukunVoiceSettings?.getContent?.()||'legacy',source:opt.source||w.SukunVoiceSettings?.getMode?.()||'auto'};
 }
 function hasSelection(){return w.SukunVoiceSettings?.getContent?.()!=='legacy'||w.SukunVoiceSettings?.getMode?.()!=='auto';}
 function handles(kind){return active()&&state.kind===kind;}
 function selectedDhikr(){try{return{cat:typeof zKat==='function'?zKat():Z.cat,idx:typeof zIdx==='function'?zIdx():Z.idx}}catch(_){return null}}
 function captureDhikr(entry){
  const identity=selectedDhikr(),selected=identity&&w.SukunReadingSourcesR1064?.forZikir?.(identity.cat,identity.idx);
  return selected&&(selected.id===entry.id||identity.cat==='koruma'&&identity.idx===4&&entry.id==='reading:ayetelkursi')?identity:null;
 }
 function ownsCurrentDhikr(){const selected=selectedDhikr();return !!(active()&&dhikrIdentity&&selected&&dhikrIdentity.cat===selected.cat&&dhikrIdentity.idx===selected.idx);}
 function entryFor(kind,section){return w.SukunReadingSourcesR1064?.forReading?.(kind,section)||null;}
 function makeQueue(entry,opt,plan){
  const yasin=entry.id==='reading:yasin'?w.SukunYasinDataR1064:entry;
  const verses=entry.verses||entry.yasin?.verses||yasin?.verses;
  if(Array.isArray(verses)&&verses.length){
   const start=Math.max(1,Math.min(83,Number(opt.startVerse)||1)),selected=opt.onlyVerse?verses.filter(v=>Number(v.number||v.no)===start):verses.filter(v=>Number(v.number||v.no)>=start),out=[];
   if(start===1&&!opt.onlyVerse){const bs=state.content==='arabic'?(yasin?.basmalaTts||yasin?.basmala||entry.basmala?.arabic):(yasin?.basmalaMeaning||entry.basmala?.meaning);if(bs)ttsBol(bs,190).forEach(text=>out.push({text,verse:0}));}
   for(const verse of selected){const text=String(state.content==='arabic'?(verse.arabicTts||verse.arabic||verse.text||verse.ar||''):(verse.meaning||verse.translation||verse.tr||'')).trim();if(!text)return null;for(const part of ttsBol(text,190))out.push({text:part,verse:Number(verse.number||verse.no)});}
   return out;
  }
  return ttsBol(plan.text,190).map(text=>({text,verse:0}));
 }
 function clearUtterance(result='cancelled'){
  partAttempt++;const finish=settleUtterance;settleUtterance=null;
  if(utterance){try{w.sukunTtsCancel?.('reading-'+result)}catch(_){try{w.speechSynthesis.cancel()}catch(_){}}utterance=null;}
  if(finish)finish(result);
 }
 function waitForResume(token){return new Promise(resolve=>{if(token!==sequence||state.phase!=='paused'){resolve(token===sequence);return;}resumeWaiter=resolve;});}
 function wakeResume(value){const fn=resumeWaiter;resumeWaiter=null;if(fn)fn(value);}
 function say(text,plan,token,current){
  return new Promise(resolve=>{
   let done=false,timer=0;const attempt=++partAttempt;
   const finish=result=>{if(done)return;done=true;clearTimeout(timer);if(settleUtterance===finish)settleUtterance=null;if(utterance===u)utterance=null;if(u)u.onend=u.onerror=u.onstart=null;resolve(result);};
   let u=null;settleUtterance=finish;
   try{
    if(!current())return finish('cancelled');
    u=new SpeechSynthesisUtterance(text);u.lang=plan.lang;u.voice=plan.voice;u.rate=plan.rate*(w.OKUMA_HIZ||1);u.pitch=plan.pitch;
    const voiceVolume=typeof ZVOL==='number'?ZVOL:1;u.volume=Math.min(1,Math.max(0,voiceVolume*(w.okumaSeviyesi?.()??1)));
    utterance=u;u.onstart=()=>{if(!current()||attempt!==partAttempt){finish('cancelled');return;}change({phase:'playing',verseSync:'tts'},'tts-start');};
    u.onend=()=>finish(current()&&attempt===partAttempt?'ended':'cancelled');u.onerror=()=>finish(state.phase==='paused'?'paused':'tts-failed');
    timer=setTimeout(()=>{if(attempt===partAttempt){clearUtterance('tts-failed');}finish('tts-failed');},Math.max(12000,Math.min(120000,text.length*220+8000)));
    w.speechSynthesis.speak(u);
   }catch(_){finish('tts-failed');}
  });
 }
 async function findRecording(entry,opt,current){
  const permissions=w.SukunReadingPolicy.permissions(entry,{entry,...opt}),keys=Array.from(entry.recordingKeys||[]);
  // Packaged recitations are immutable files, never copied over REC_DB keys.
  if(opt.source==='auto'&&opt.content!=='meaning'){
   const bundled=await w.SukunBundledArabicR1065?.find?.(entry,opt,current);
   if(!current())return null;if(bundled)return bundled;
  }
  // The user's automatic priority is Arabic > generic > personal. Explicit
  // source-only and original/meaning admission remain independent gates.
  if(permissions.generic&&keys.length){const recording=await w.SukunGenericRecordings?.find?.(keys,{isCurrent:current});if(!current())return null;if(recording)return recording;}
  if(permissions.personal){
   for(const key of keys){const blob=await REC_DB.get(key,{isCurrent:current});if(!current())return null;if(blob)return{blob,key,generic:false};}
  }
  return null;
 }
 async function execute(entry,opt,token){
  const pref=w.SukunVoiceSettings?.capture?.()||(()=>true),tab=w.SukunTabOwner?.snapshot?.();
  if(w.SukunTabOwner?.owns?.()===true)lastAcceptedLeaseEpoch=tab?.epoch??-1;
  let intent=w.AudioLife?._userIntentSeq;
  const current=()=>token===sequence&&pref()&&(!w.SukunTabOwner||(w.SukunTabOwner.owns()&&w.SukunTabOwner.snapshot().epoch===tab?.epoch))&&(intent==null||w.AudioLife?._userIntentSeq===intent)&&opt.isCurrent?.()!==false;
  current.rebindUserIntent=(from,to)=>{if(intent!==from||w.AudioLife?._userIntentSeq!==to||token!==sequence||!pref()||w.AudioLife?._terminalIntent)return false;intent=to;return true;};
  current.refreshIntent=()=>{if(token!==sequence||!pref()||w.AudioLife?._terminalIntent)return false;intent=w.AudioLife?._userIntentSeq;return true;};activeCurrent=current;
  let recording;
  try{recording=await findRecording(entry,opt,current)}catch(_){if(!current())return{ok:false,cancelled:true,reason:'stale-sequence'};return failure('recording-required');}
  if(!current())return{ok:false,cancelled:true,reason:'stale-sequence'};
  if(recording){
   if(state.phase==='paused'&&!await waitForResume(token))return{ok:false,cancelled:true,reason:'stale-sequence'};
   if(!current())return{ok:false,cancelled:true,reason:'stale-sequence'};
   change({phase:'playing',sourceKind:recording.bundled?'bundled':recording.generic?'generic':'personal',queue:[],part:1,total:1,verse:0,verseSync:'none'},'recording-start');publishSource(state.sourceKind);
   const onProgress=entry.id==='reading:yasin'&&recording.bundled?clock=>{
    if(!current()||!['playing','paused'].includes(state.phase)||clock.recordingKey!==recording.key)return;
    const cue=w.SukunYasinTimingR1067?.at?.(recording.metadata,clock.currentTime,clock.duration);
    const patch={currentTime:Number.isFinite(clock.currentTime)?clock.currentTime:null,duration:Number.isFinite(clock.duration)?clock.duration:null,
      verse:cue?.verse||0,verseSync:cue?'timestamp':'none',progress:Number.isFinite(clock.currentTime)&&Number.isFinite(clock.duration)&&clock.duration>0?Math.min(100,Math.max(0,clock.currentTime/clock.duration*100)):null};
    if(patch.verse!==state.verse||patch.verseSync!==state.verseSync)change(patch,'native-verse');else state={...state,...patch};
   }:undefined;
   for(;;){
    let r;try{r=await playRecording(recording.blob,'reading-r1064:'+entry.id,{detail:true,resume:false,recordingKey:recording.key,title:state.title,reason:sourceLabel(state.sourceKind),backgroundNative:true,generic:!!recording.generic,bundled:!!recording.bundled,isCurrent:current,onProgress});}catch(_){r={ok:false,reason:'recording-failed'};}
    if(!current())return{ok:false,cancelled:true,reason:'stale-sequence'};
    const completed=r===true||r?.ok;
    if(state.phase==='paused'){
     // Pause can retire a not-yet-accepted native decode. Keep that source
     // held and retry it only after an explicit Resume; it is not missing.
     if(!await waitForResume(token)||!current())return{ok:false,cancelled:true,reason:'stale-sequence'};
     if(!completed)continue;
    }
    if(completed){change({phase:'ended',progress:100},'recording-end');return{ok:true,source:'recording',origin:state.sourceKind,reason:'ended'};}
    return failure('recording-required');
   }
  }
  // Arabic device speech is an explicit option, never a dependency of Auto.
  // Full-chapter verse tracking uses only its exact source's timing map.
  if(opt.source==='auto'&&opt.content==='arabic')return failure(opt.onlyVerse||Number(opt.startVerse)>1?'bundled-seek-unavailable':'arabic-audio-unavailable');
  const plan=w.SukunReadingPolicy.plan(entry,{entry,...opt,...(opt.source==='auto'&&opt.content==='legacy'?{disableArabicAuto:true}:{})});
  if(!plan.ok)return failure(plan.reason);
  const queue=makeQueue(entry,opt,plan);if(!queue?.length)return failure(state.content==='arabic'?'arabic-text-unavailable':'meaning-text-unavailable');
  change({phase:state.phase==='paused'?'paused':'playing',sourceKind:'tts',queue,part:1,total:queue.length,verse:queue[0].verse||0,verseSync:'none'},'tts-prepared');publishSource('tts');
  for(let i=0;i<queue.length;){
   if(!current())return{ok:false,cancelled:true,reason:'stale-sequence'};
   if(state.phase==='paused'){if(!await waitForResume(token))return{ok:false,cancelled:true,reason:'stale-sequence'};continue;}
   const part=queue[i];change({part:i+1,verse:part.verse||0,sectionTitle:part.verse?state.title+' · '+(w.I18N?.lang==='en'?'Verse ':'Âyet ')+part.verse:state.title,progress:i/queue.length*100,verseSync:state.verse===(part.verse||0)&&state.verseSync==='tts'?'tts':'pending'},'part-start');
   // Text/verse order belongs to the immutable queue. Voice and rate edits
   // are read only when the next utterance is admitted (r976 contract).
   const nextVoice=w.SukunReadingPolicy.plan(entry,{entry,...opt,...(opt.source==='auto'&&opt.content==='legacy'?{disableArabicAuto:true}:{})});
   if(!nextVoice.ok)return failure(nextVoice.reason);
   const result=await say(part.text,{...plan,voice:nextVoice.voice,lang:nextVoice.lang,rate:nextVoice.rate,pitch:nextVoice.pitch},token,current);
   if(!current())return{ok:false,cancelled:true,reason:'stale-sequence'};
   if(result==='paused'||state.phase==='paused'){if(!await waitForResume(token))return{ok:false,cancelled:true,reason:'stale-sequence'};continue;}
   if(result!=='ended')return failure(result==='tts-failed'?'tts-failed':'text-unavailable');
   i++;
  }
  if(current()){change({phase:'ended',progress:100},'tts-end');return{ok:true,source:'tts',content:state.content,reason:'ended'};}
  return{ok:false,cancelled:true,reason:'stale-sequence'};
 }
 function waitOwnRelease(owner,token){
  const before=owner.snapshot?.();
  // Only a just-released lease previously accepted by this reader can be
  // awaited. Foreign tabs, maintenance and unknown ownership stay blocked.
  if(!before?.releasing)return Promise.resolve(true);
  // The current tab owner awaits its own physical lease closure with the
  // captured intent/selection guards. A first reader need not have held it.
  if(before.revision==='r1070')return Promise.resolve(true);
  if(lastAcceptedLeaseEpoch<0||before.epoch!==lastAcceptedLeaseEpoch+1||before.blocked||before.maintenance)return Promise.resolve(false);
  return new Promise(resolve=>{
   let done=false,timer=0;
   const finish=ok=>{if(done)return;done=true;clearTimeout(timer);w.removeEventListener?.('sukun:tabownerchange',check);w.removeEventListener?.('sukun:readingchange',check);resolve(ok);};
   const check=()=>{const s=owner.snapshot?.();if(token!==sequence||s?.blocked||s?.maintenance)return finish(false);if(!s?.releasing)finish(true);};
   w.addEventListener('sukun:tabownerchange',check);w.addEventListener('sukun:readingchange',check);
   timer=setTimeout(()=>finish(false),3000);check();
  });
 }
 function play(opt={}){
  const entry=w.SukunReadingSourcesR1064?.get?.(opt.id);if(!entry)return Promise.resolve(w.SukunReadingPolicy.unavailable('text-unavailable'));
  const choice=contentOptions(opt);if(choice.content==='original')choice.content='arabic';
  if(choice.content==='legacy'&&choice.source==='arabic')choice.content='arabic';
  // Persist precisely what the user asked this button to read, before capture.
  if(['arabic','meaning'].includes(opt.content))w.SukunVoiceSettings?.rememberContent?.(opt.content);
  if(active())stop('superseded');
  // A completed attempt's lease guard must not observe the next acquisition.
  // Acquire emits owned=false while checking; only the new accepted attempt
  // may react to a later loss of ownership.
  activeCurrent=null;
  const token=++sequence;currentEntry=entry;currentOptions={...opt,...choice};dhikrIdentity=captureDhikr(entry);
  change({id:entry.id,title:entry.title||entry.id,sectionTitle:entry.title||entry.id,kind:entry.kind||String(entry.id).split(':')[1],content:choice.content,source:choice.source,phase:'preparing',reason:'',part:0,total:0,verse:0,progress:null,verseSync:'none',currentTime:null,duration:null,queue:[],sourceKind:'none'},'prepare');
  // New explicit starts release only a prior aggregate pause gate. Existing
  // paused ambience/frequency sources are not resumed by this reader start.
  w.SukunAudioSessionRegistry?.releasePauseGate?.('reading-start');
  const runner=()=>{if(token!==sequence)return{ok:false,cancelled:true,reason:'stale-sequence'};w.AudioLife?.markUserPlay?.('reading-start');w.SukunAudioSessionRegistry?.activate?.(ID);return execute(entry,currentOptions,token);};
  const foreground=()=>w.SukunForegroundArbiter?.runOrQueue?.({type:'reader',identity:'reading:'+entry.id+':'+token,title:state.title,persistent:false,source:ID},runner)||runner();
  const owner=w.SukunTabOwner;
  // The tab lease must be acquired before the source/voice attempt captures
  // its epoch. A foreground arbiter claim alone is not cross-tab authority.
  const task=typeof owner?.run==='function'?(async()=>{
    if(!await waitOwnRelease(owner,token)||token!==sequence)return{ok:false,cancelled:true,source:'tab-held',reason:'cross-tab-held'};
    // Claim normally after the prior physical lease closes. No lock is
    // cleared, forced or reclaimed from another tab by this wait.
    return owner.run('listen',foreground,{isCurrent:()=>token===sequence,keepSelection:true,releaseAfter:true});
  })():foreground();
  ownerPromise=Promise.resolve(task).then(result=>{if(result===false)result={ok:false,cancelled:true,source:'tab-held',reason:'cross-tab-held'};if(token===sequence&&active()){change({phase:result?.ok?'ended':'error',reason:result?.reason||''},'settled');}return result;});
  return ownerPromise;
 }
 function pause(){
  if(!active()||state.phase==='paused')return false;
  activeCurrent?.refreshIntent?.();change({phase:'paused'},'pause');
  if(state.sourceKind==='tts')clearUtterance('paused');
  else if(['personal','generic','bundled'].includes(state.sourceKind))try{sesDuraklat()}catch(_){}
  return true;
 }
 function resume(opt={}){
  if(state.phase!=='paused')return false;
  // A local Resume cannot override an explicit global Pause/Stop.
  const aggregateHeld=!!w.SukunAudioSessionRegistry?.aggregateSnapshot?.()?.paused;
  if(w.AudioLife?._terminalIntent||aggregateHeld&&!(opt.registry&&!w.AudioLife?.userPaused))return false;
  activeCurrent?.refreshIntent?.();change({phase:'playing'},'resume');
  if(['personal','generic','bundled'].includes(state.sourceKind))try{const source='reading-r1064:'+state.id;if(SES.ad===source)for(const a of SES.ler)a._sukunIntentAuthority?.renewReaderPause?.(source);sesSurdur()}catch(_){}
  wakeResume(true);return true;
 }
 function stop(reason='stopped'){
  const wasActive=active();sequence++;clearUtterance('cancelled');wakeResume(false);activeCurrent=null;
  if(wasActive&&['personal','generic','bundled'].includes(state.sourceKind))try{const source='reading-r1064:'+state.id;if(SES.ad===source)sesDurdur('reading-'+reason,{retireNativeOwner:source})}catch(_){}
  change({phase:'idle',reason,sourceKind:'none',verse:0,verseSync:'none',currentTime:null,duration:null},'stop');return wasActive;
 }
 function navigate(delta,repeat=false){
  if(!currentEntry||!currentOptions)return false;
  if(state.sourceKind==='bundled'&&currentEntry.id==='reading:yasin')return w.SukunReadingPolicy.unavailable('bundled-seek-unavailable');
  const verse=state.verse||Number(currentOptions.startVerse)||1;
  if(Array.isArray(currentEntry.verses)||currentEntry.id==='reading:yasin'){const target=Math.max(1,Math.min(83,repeat?verse:verse+delta));const wasPaused=state.phase==='paused';const promise=play({...currentOptions,id:currentEntry.id,startVerse:target,onlyVerse:repeat?true:currentOptions.onlyVerse});if(wasPaused)pause();return promise;}
  // For non-verse texts Replay begins the same original, never another variant.
  return play({...currentOptions,id:currentEntry.id});
 }
 function route(kind,opt={}){
  const entry=entryFor(kind,opt.section);if(!entry)return Promise.resolve(w.SukunReadingPolicy.unavailable('text-unavailable'));
  if(handles(kind)&&!opt.content)return Promise.resolve(state.phase==='paused'?resume():pause());
  return play({...opt,id:entry.id});
 }
 const api=w.SukunReadingAudioR1064=Object.freeze({version:'r1065',play,pause,resume,stop,previous:()=>navigate(-1),next:()=>navigate(1),repeat:()=>navigate(0,true),route,hasSelection,handles,ownsCurrentDhikr,snapshot,subscribe(fn){if(typeof fn!=='function')return()=>{};listeners.add(fn);fn(snapshot());return()=>listeners.delete(fn)}});
 w.SukunAudioSessionRegistry?.register?.(ID,{priority:105,title:()=>state.title,getState:()=>state.phase==='paused'?'paused':['preparing','playing'].includes(state.phase)?'playing':state.phase==='ended'?'ended':'idle',play:()=>state.phase==='paused'?resume({registry:true}):currentOptions?play(currentOptions):false,resume:()=>resume({registry:true}),pause,stop,previous:api.previous,next:api.next});
 w.addEventListener('sukun:currentzikirchange',()=>{if(active()&&dhikrIdentity&&!ownsCurrentDhikr())stop('dhikr-selection-change');});
 w.addEventListener('sukun:voicesettingschange',()=>{const next=w.SukunVoiceSettings?.epoch?.()||0,changed=next!==settingsEpoch;settingsEpoch=next;if(changed&&active())stop('preference-change');});
 w.addEventListener('sukun:tabownerchange',()=>{if(active()&&activeCurrent&&w.SukunTabOwner&&!w.SukunTabOwner.owns())stop('tab-owner-change');});
})();
