/* Tekke journey tools. Audio stays owned by SukunTekkeSet / Tekke.
 * No auto-resume, no automatic profile application, no destructive trimming. */
(()=>{'use strict';
 if(window.SukunTekkeJourney)return;
 const safe=(f,d=null)=>{try{return f()}catch(_){return d}},en=()=>window.I18N?.lang==='en'||document.documentElement.lang==='en',copy=(tr,eng)=>en()?eng:tr,translate=t=>window.I18N?.t?.(t)||t;
 const PROFILE_KEY='tekke.journey.profiles',NOTE_KEY='tekke.journey.notes';
 let adapter=null,root=null,mounted=false,dialog=null,returnFocus=null,wizard=null,recToken=0,checkToken=0,readiness=null,preview=null,previewURL='',voiceTest=null,lastPhase='',pendingEnd=null;
 const flow=()=>window.SukunTekkeSet,view=()=>flow()?.snapshot?.()||{},factory=()=>window.Tekke?.hazirla?.(),$=id=>document.getElementById(id);
 const read=(k,d)=>safe(()=>JSON.parse(localStorage.getItem(k))??d,d);
 function write(k,v){if(window.SukunTabOwner?.canPersist?.(k)===false)return false;return safe(()=>{localStorage.setItem(k,JSON.stringify(v));return true;},false);}
 function owned(){return window.SukunTabOwner?.owns?.()!==false;}
 function node(tag,cls='',text=''){const n=document.createElement(tag);n.className=cls;n.textContent=text;return n;}
 const HELP={offline:['Seçili mekânın dosyalarını hazırlar; kayıtlarını silmez.','Prepare the selected space; keep your recordings.'],recover:['Son adımı başından okuyarak devam eder.','Continue by replaying the last step.'],restart:['İlerlemeyi sıfırlar; kayıtları korur.','Restart progress; keep recordings.'],wizard:['Açık seansı duraklatıp kayıt rehberini açar.','Pause an open session and open the recording guide.'],prev:['Önceki adıma geçer; duraklatılmışsa duraklatılmış kalır.','Go to the previous step; preserve pause state.'],next:['Bu adımı atlayıp sonraki adıma geçer.','Skip this step and move to the next.'],replay:['Bu adımı başından okur.','Replay this step from the beginning.'],trim:['Yalnız önizleme hazırlar; onaylamadan kayıt değişmez.','Prepare a preview; keep recordings until approval.'],accept:['Önizlemeyi kullanır; özgün kaydı yedekler.','Use the preview and back up the original.']};
 function btn(tr,eng,action){const n=node('button','',copy(tr,eng));n.type='button';n.dataset.journeyAction=action;n.dataset.journeyCopy=tr+'|'+eng;return n;}
 function text(tr,eng,cls=''){const n=node('p',cls,copy(tr,eng));n.dataset.journeyCopy=tr+'|'+eng;return n;}
 function section(id,tr,eng,group){const n=node('section','pSec r993Area');n.id=id;n.dataset.tkGroup=group;const h=node('h3','',copy(tr,eng));h.dataset.journeyCopy=tr+'|'+eng;n.append(h);return n;}
 function label(tr,eng,control){const n=node('label');const span=node('span','',copy(tr,eng));span.dataset.journeyCopy=tr+'|'+eng;n.append(span,control);return n;}
 function status(id,message){const n=$(id);if(n)n.textContent=message;}
 function stopPreview(){if(voiceTest){voiceTest=null;safe(()=>window.speechSynthesis?.cancel());}const a=preview;preview=null;if(a){a.onended=a.onerror=null;safe(()=>a.pause());safe(()=>a.removeAttribute('src'));safe(()=>a.load());}if(previewURL)URL.revokeObjectURL(previewURL);previewURL='';}
 function busy(){return !!(wizard&&(wizard.requesting||wizard.recording||wizard.saving||wizard.processing));}
 function notify(tr,eng){status('r993Notice',copy(tr,eng));}
 function voiceInfo(){const synth=window.speechSynthesis,language=en()?'en':'tr';if(!synth||!window.SpeechSynthesisUtterance)return {kind:'unavailable',voice:null};
  const voices=safe(()=>synth.getVoices(),[])||[],preferred=safe(()=>adapter?.voice?.(''))?.voice;
  const voice=preferred||voices.find(v=>(v.lang||'').toLowerCase().startsWith(language));
  return {kind:!voice?'unknown':voice.localService===true?'local':voice.localService===false?'remote':'unknown',voice};
 }
 function visualPaths(){const paths=new Set();if(typeof getComputedStyle!=='function')return [];
  for(const el of [root,document.body,root?.querySelector('#stage'),root?.querySelector('#gate')].filter(Boolean))for(const pseudo of [null,'::before','::after']){
   const css=safe(()=>getComputedStyle(el,pseudo).backgroundImage,'');for(const match of css.matchAll(/url\(["']?([^"')]+)["']?\)/g)){
    const url=safe(()=>new URL(match[1],location.href));if(url?.origin===location.origin&&url.pathname.includes('/assets/'))paths.add(url.href);
   }
  }return [...paths];
 }
 async function cacheStatus(paths){const worker=navigator.serviceWorker?.controller;if(!worker||!window.MessageChannel)return {shell:false,saved:0,total:paths.length,verified:false};
  return new Promise(resolve=>{const channel=new MessageChannel(),timer=setTimeout(()=>{channel.port1.close();resolve({shell:false,saved:0,total:paths.length,verified:false});},8000);
   channel.port1.onmessage=e=>{clearTimeout(timer);channel.port1.close();resolve({...e.data,verified:true});};worker.postMessage({type:'TEKKE_READY_STATUS',paths},[channel.port2]);
  });
 }
 async function checkReady(download=false){if(!adapter||!view().selected)return null;const token=++checkToken,key=view().selected,steps=adapter.catalog[key].adimlar;status('r993OfflineStatus',copy('Kayıtlar ve çevrimdışı dosyalar kontrol ediliyor…','Checking recordings and offline files…'));
  let recordings=0,errors=0;for(let i=0;i<steps.length;i++){try{if(await adapter.load(key,i))recordings++;}catch(_){errors++;}if(token!==checkToken||key!==view().selected)return null;}
  const paths=visualPaths();
  if(download&&navigator.onLine!==false){for(const path of paths){try{const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);try{const r=await fetch(path,{signal:controller.signal});if(!r.ok||!/^image\//i.test(r.headers.get('content-type')||''))throw Error('image');await r.arrayBuffer();}finally{clearTimeout(timer);}}catch(_){}if(token!==checkToken||key!==view().selected)return null;}}
  const cache=await cacheStatus(paths);if(token!==checkToken||key!==view().selected)return null;
  const voice=voiceInfo();readiness={key,total:steps.length,recordings,missing:steps.length-recordings,errors,voice:voice.kind,images:cache.saved,imageTotal:paths.length,shell:cache.shell,cacheVerified:cache.verified,ready:errors===0&&recordings===steps.length&&cache.shell&&cache.saved===paths.length};renderReadiness();return {...readiness};
 }
 function renderReadiness(){if(!readiness||readiness.key!==view().selected)return;
  const r=readiness,parts=[`${r.recordings}/${r.total} ${copy('kayıt cihazda','recordings on device')}`];
  parts.push(r.cacheVerified?`${r.images}/${r.imageTotal} ${copy('görsel hazır','images ready')}`:copy('Çevrimdışı dosyalar doğrulanamadı','Offline files unverified'));
  if(!r.shell)parts.push(copy('Uygulama güncellemesini tamamla','Complete the app update'));
  if(r.missing)parts.push(`${r.missing} ${copy('adım cihaz sesi gerektiriyor','steps need device speech')} · `+copy({local:'Cihaz yerel ses bildiriyor; internetsiz dene.',remote:'Seçili cihaz sesi internet gerektiriyor.',unknown:'Bu dilde cihaz sesi henüz doğrulanmadı.',unavailable:'Cihaz sesi kullanılamıyor.'}[r.voice],{local:'Device reports a local voice; test offline.',remote:'Selected device voice requires the internet.',unknown:'Device voice for this language is unverified.',unavailable:'Device speech is unavailable.'}[r.voice]));
  if(r.errors)parts.push(copy('Bazı kayıtlar okunamadı; yeniden dene.','Some recordings could not be read; retry.'));
  status('r993OfflineStatus',(r.ready?copy('Çevrimdışı hazır · ','Ready offline · '):'')+parts.join(' · '));
 }
 function profiles(){const v=read(PROFILE_KEY,[]);return Array.isArray(v)?v.filter(p=>p?.schema===1&&typeof p.name==='string'&&typeof p.id==='string'&&['set','dhikr','quiet'].includes(p.purpose)&&p.settings).slice(0,20):[];}
 function saveProfile(name){name=String(name||'').trim().slice(0,60);if(!name||!adapter)return false;
  const list=profiles();if(list.length>=20){notify('En fazla 20 düzen saklanabilir.','You can save up to 20 arrangements.');return false;}
  list.push({schema:1,id:Date.now().toString(36)+Math.random().toString(36).slice(2,7),name,purpose:root?.dataset.tkPurpose||'dhikr',set:view().selected,settings:adapter.profile()});
  if(!write(PROFILE_KEY,list)){notify('Düzen kaydedilemedi; depolama veya sekme sahipliğini kontrol et.','Could not save the arrangement; check storage or tab ownership.');return false;}
  notify('Düzen kaydedildi.','Arrangement saved.');renderProfiles();return true;
 }
 function applyProfile(id){const p=profiles().find(v=>v.id===id);if(!p||!owned())return false;
  if(window.Tekke?.sessionState?.().active||view().active||busy()){notify('Düzeni uygulamadan önce seansı bitir.','Finish the session before applying an arrangement.');return false;}
  const v=p.settings;if(!['gul','sema','firuze','erguvan','nar','seher'].includes(v.theme)||![v.volume,v.echo].every(x=>Number.isFinite(x)&&x>=0&&x<=1)||!['spatial','effects','sakin','noise'].every(k=>typeof v[k]==='boolean'))return false;
  if(v.ambience&&(!v.ambience||typeof v.ambience!=='object'||Object.entries(v.ambience).some(([k,x])=>!['vNey','vSu','vToprak','vHava','vAtes'].includes(k)||!Number.isFinite(x)||x<0||x>1)))return false;
  if(p.purpose==='set'&&!adapter.catalog[p.set])return false;
  adapter.applyProfile(v);if(adapter.catalog[p.set])flow().select(p.set);window.SukunTekkeUX?.selectPurpose(p.purpose);notify('Düzen uygulandı. Başlatmak için kendi seçimini yap.','Arrangement applied. Start when you choose.');return true;
 }
 function renderProfiles(){const select=$('r993ProfileSelect');if(!select)return;const list=profiles(),key=JSON.stringify(list.map(p=>[p.id,p.name]));if(select.dataset.signature===key)return;
  const old=select.value;select.replaceChildren(...[node('option','',copy('Düzen seç','Choose an arrangement')),...list.map(p=>{const n=node('option','',p.name);n.value=p.id;return n;})]);select.firstElementChild.value='';select.value=list.some(p=>p.id===old)?old:'';select.dataset.signature=key;
 }
 function dialogOpen(tr,eng,kind){if(busy())return null;closeDialog();returnFocus=document.activeElement;const n=node('section','r993Dialog');n.id='r993Dialog';n.dataset.kind=kind;n.setAttribute('role','dialog');n.setAttribute('aria-modal','true');n.setAttribute('aria-labelledby','r993DialogTitle');
  const box=node('div','r993DialogBox'),head=node('div','r993DialogHead'),title=node('h2','',copy(tr,eng));title.id='r993DialogTitle';title.dataset.journeyCopy=tr+'|'+eng;const close=btn('×','×','close');close.setAttribute('aria-label',copy('Kapat','Close'));head.append(title,close);box.append(head);n.append(box);document.body.append(n);dialog=n;
  n.addEventListener('click',e=>{const b=e.target.closest('[data-journey-action]');if(b&&!b.disabled)action(b.dataset.journeyAction).catch(()=>{status('r993WizardStatus',copy('İşlem tamamlanamadı; yeniden dene.','The operation could not finish; retry.'));notify('İşlem tamamlanamadı; yeniden dene.','The operation could not finish; retry.');});});
  n.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();closeDialog();}else if(e.key==='Tab'){const ns=[...n.querySelectorAll('button,input,select,textarea,a[href]')].filter(x=>!x.disabled&&!x.hidden);if(!ns.length)return;const a=ns[0],b=ns.at(-1);if(e.shiftKey&&document.activeElement===a){e.preventDefault();b.focus();}else if(!e.shiftKey&&document.activeElement===b){e.preventDefault();a.focus();}}});close.focus();return box;
 }
 function closeDialog(){if(busy()){status('r993WizardStatus',copy('Önce kaydı veya işlemi bitir.','Finish recording or processing first.'));return false;}stopPreview();recToken++;dialog?.remove();dialog=null;wizard=null;safe(()=>returnFocus?.focus({preventScroll:true}));returnFocus=null;if(pendingEnd&&!document.hidden)setTimeout(()=>{if(pendingEnd&&!dialog&&!busy())endSummary(pendingEnd);},0);return true;}
 async function openWizard(key=view().selected,index=null){if(!adapter?.catalog[key]||adapter.recordBusy?.()||busy())return false;
  if(window.Tekke?.sessionState?.().phase==='playing')factory()?.pause?.();
  const box=dialogOpen('Kendi sesinle · Kayıt rehberi','Your voice · Recording guide','record');if(!box)return false;
  wizard={key,index:index??0,blob:null,candidate:null,requesting:false,recording:false,saving:false,processing:false,recorder:null,stream:null,timer:null};
  const count=node('p','r993WizardCount');count.id='r993WizardCount';const script=node('p','r993Script');script.id='r993WizardScript';const st=node('p','r993Status');st.id='r993WizardStatus';st.setAttribute('role','status');
  const controls=node('div','r993Buttons');for(const [tr,eng,a]of[['Önceki','Previous','rec-prev'],['Kaydet','Record','record'],['Sonraki','Next','rec-next'],['Dinle','Listen','listen'],['Sessizlikleri kes · Önizle','Trim silence · Preview','trim'],['Özgün kaydı getir','Load original','original'],['Bu kaydı kullan','Use this recording','accept'],['Eksik adıma git','Next missing step','missing']])controls.append(btn(tr,eng,a));
  box.append(count,script,st,controls,text('Yeni kayıt dinlenip onaylanınca kullanılır. Mevcut kayıt ve özgün ses korunur. Açık seans duraklatılır; kendiliğinden devam etmez.','A new recording is used only after you approve it. Existing and original recordings are kept. An open session is paused and does not resume automatically.'));
  const token=++recToken,session=wizard;if(index==null){try{for(let i=0;i<adapter.catalog[key].adimlar.length;i++){const blob=await adapter.load(key,i);if(token!==recToken||wizard!==session)return false;if(!blob){session.index=i;break;}}}catch(_){if(wizard===session&&token===recToken){renderWizard();status('r993WizardStatus',copy('Kayıtlar okunamadı; yeniden dene.','Could not read recordings; retry.'));}return false;}}
  await wizardLoad();return true;
 }
 async function wizardLoad(){const s=wizard;if(!s)return;stopPreview();const token=++recToken;s.candidate=null;s.rawCandidate=null;s.blob=null;status('r993WizardStatus',copy('Kayıt kontrol ediliyor…','Checking recording…'));
  try{const blob=await adapter.load(s.key,s.index);if(token!==recToken||wizard!==s)return;s.blob=blob;renderWizard();}catch(_){if(wizard===s&&token===recToken){renderWizard();status('r993WizardStatus',copy('Kayıt okunamadı.','Could not read the recording.'));}}
 }
 function renderWizard(){const s=wizard;if(!s||!dialog)return;const set=adapter.catalog[s.key];status('r993WizardCount',translate(set.ad)+` · ${s.index+1}/${set.adimlar.length}`);status('r993WizardScript',translate(set.adimlar[s.index].t));
  status('r993WizardStatus',s.recording?copy('● Kayıt alınıyor; bitince Durdur’a dokun.','● Recording; tap Stop when finished.'):s.requesting?copy('Mikrofon bekleniyor…','Waiting for microphone…'):s.processing?copy('Önizleme hazırlanıyor…','Preparing preview…'):s.candidate?copy('Önizleme hazır. Dinle ve Bu kaydı kullan’a dokun.','Preview ready. Listen, then choose Use this recording.'):s.blob?copy('Bu adım kayıtlı. Dinleyebilir veya yeniden kaydedebilirsin.','This step is recorded. Listen or record again.'):copy('Bu adım eksik. Metni okuyarak kaydet.','This step is missing. Record yourself reading the text.'));
  for(const b of dialog.querySelectorAll('[data-journey-action]')){const a=b.dataset.journeyAction;b.disabled=busy()&&!(s.recording&&a==='record');if(a==='record')b.textContent=s.recording?copy('■ Durdur','■ Stop'):copy(s.blob?'Yeniden kaydet':'Kaydet',s.blob?'Record again':'Record');if(a==='listen'||a==='trim')b.disabled=busy()||!(s.candidate||s.blob);if(a==='accept')b.disabled=busy()||!s.candidate;if(a==='rec-prev')b.disabled=busy()||s.index===0;if(a==='rec-next')b.disabled=busy()||s.index===set.adimlar.length-1;}
 }
 async function record(){const s=wizard;if(!s||!owned())return false;if(s.recording){safe(()=>s.recorder.stop());return true;}if(busy()||adapter.recordBusy?.())return false;stopPreview();
  if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){status('r993WizardStatus',copy('Bu cihaz ses kaydını desteklemiyor.','This device does not support recording.'));return false;}
  s.requesting=true;renderWizard();const token=++recToken;
  try{const stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true},video:false});if(token!==recToken||wizard!==s||!owned()){stream.getTracks().forEach(t=>t.stop());s.requesting=false;if(wizard===s)renderWizard();return false;}
   s.stream=stream;const recorder=s.recorder=new MediaRecorder(stream),chunks=[];let failed=false;s.requesting=false;s.recording=true;
   const release=()=>{clearTimeout(s.timer);s.stream?.getTracks().forEach(t=>t.stop());s.stream=null;s.recording=false;s.recorder=null;};
   recorder.ondataavailable=e=>{if(e.data?.size)chunks.push(e.data)};
   recorder.onerror=()=>{failed=true;release();if(wizard===s){renderWizard();status('r993WizardStatus',copy('Kayıt alınamadı; mevcut ses korundu.','Recording failed; existing audio was kept.'));}};
   recorder.onstop=()=>{release();if(failed||wizard!==s||token!==recToken)return;const blob=new Blob(chunks,{type:recorder.mimeType||'audio/webm'});if(blob.size>=800){s.candidate=blob;s.rawCandidate=blob;}renderWizard();if(blob.size<800)status('r993WizardStatus',copy('Kayıt çok kısa. Yeniden dene.','Recording too short. Try again.'));};
   recorder.start(1000);s.timer=setTimeout(()=>{if(s.recorder?.state==='recording')s.recorder.stop();},300000);renderWizard();return true;
  }catch(_){s.requesting=false;s.recording=false;s.stream?.getTracks().forEach(t=>t.stop());s.stream=null;if(wizard===s){renderWizard();status('r993WizardStatus',copy('Mikrofon açılamadı. İzni kontrol edip yeniden dene.','Could not open the microphone. Check permission and retry.'));}return false;}
 }
 async function listen(){if(!wizard||busy()||!owned())return false;stopPreview();const blob=wizard.candidate||wizard.blob;if(!blob)return false;
  previewURL=URL.createObjectURL(blob);const a=preview=document.createElement('audio');a.src=previewURL;a.volume=.75;a.onended=stopPreview;a.onerror=()=>{stopPreview();status('r993WizardStatus',copy('Ses çalınamadı.','Audio could not be played.'));};
  try{await a.play();return true;}catch(_){stopPreview();status('r993WizardStatus',copy('Dinlemek için yeniden dokun.','Tap again to listen.'));return false;}
 }
 function trimBounds(channels,rate){const length=channels[0]?.length||0,threshold=.006;let first=length,last=-1;for(const data of channels)for(let i=0;i<data.length;i++)if(Math.abs(data[i])>threshold){if(i<first)first=i;if(i>last)last=i;}
  if(last<0)return null;const pad=Math.round(rate*.15);return {start:Math.max(0,first-pad),end:Math.min(length,last+pad+1)};
 }
 function pcmWav(channels,rate,bounds){const frames=bounds.end-bounds.start,count=channels.length,buffer=new ArrayBuffer(44+frames*count*2),v=new DataView(buffer),word=(o,s)=>{for(let i=0;i<s.length;i++)v.setUint8(o+i,s.charCodeAt(i));};
  word(0,'RIFF');v.setUint32(4,buffer.byteLength-8,true);word(8,'WAVE');word(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,count,true);v.setUint32(24,rate,true);v.setUint32(28,rate*count*2,true);v.setUint16(32,count*2,true);v.setUint16(34,16,true);word(36,'data');v.setUint32(40,frames*count*2,true);
  let offset=44;for(let i=bounds.start;i<bounds.end;i++)for(const data of channels){const x=Math.max(-1,Math.min(1,data[i]));v.setInt16(offset,x<0?x*32768:x*32767,true);offset+=2;}return new Blob([buffer],{type:'audio/wav'});
 }
 async function trim(){const s=wizard;if(!s||busy()||!owned())return false;const blob=s.candidate||s.blob;if(!blob)return false;const OC=window.OfflineAudioContext||window.webkitOfflineAudioContext;if(!OC||!window.SukunAudioPreparation||blob.size>8*1024*1024){status('r993WizardStatus',copy('Bu kayıt için kesme kullanılamıyor; özgün sesi kullanabilirsin.','Trimming unavailable for this recording; you can use the original.'));return false;}stopPreview();const trimToken=recToken;s.processing=true;renderWizard();
  try{const candidate=await window.SukunAudioPreparation.run(blob,raw=>new OC(1,1,16000).decodeAudioData(raw),{key:'tekke:trim:'+s.key+':'+s.index,purpose:'fx',decodeRate:16000,isCurrent:()=>wizard===s&&s.processing&&trimToken===recToken,use:async(buffer,job)=>{if(buffer.duration>60||buffer.numberOfChannels>2)throw Error('budget');const channels=Array.from({length:buffer.numberOfChannels},(_,i)=>buffer.getChannelData(i)),bounds=trimBounds(channels,buffer.sampleRate);if(!bounds)throw Error('silent');job.check();return pcmWav(channels,buffer.sampleRate,bounds);}});
   // Copy only into a candidate. REC_DB is untouched until explicit acceptance.
   s.rawCandidate=s.rawCandidate||s.candidate||s.blob;s.candidate=candidate;s.processing=false;renderWizard();status('r993WizardStatus',copy('Kesilmiş önizleme hazır. Dinleyip onayla; özgün ses korunur.','Trimmed preview ready. Listen and approve; original audio is retained.'));return true;
  }catch(_){s.processing=false;renderWizard();status('r993WizardStatus',copy('Kesme yapılamadı; mevcut kayıt değiştirilmedi.','Could not trim; existing recording was not changed.'));return false;}
 }
 async function accept(){const s=wizard;if(!s?.candidate||busy()||!owned())return false;stopPreview();s.saving=true;renderWizard();
  try{if(s.blob&&!await adapter.archive(s.key,s.index))await adapter.saveArchive(s.key,s.index,s.blob);if(!owned()||wizard!==s)throw Error('ownership');await adapter.saveOriginal(s.key,s.index,s.rawCandidate||s.candidate);if(!owned()||wizard!==s)throw Error('ownership');await adapter.saveBlob(s.key,s.index,s.candidate);if(wizard!==s)return false;s.blob=s.candidate;s.candidate=null;s.rawCandidate=null;s.saving=false;adapter.changed(s.key);renderWizard();status('r993WizardStatus',copy('Kayıt kaydedildi. Sonraki veya Eksik adıma git’i seç.','Recording saved. Choose Next or Next missing step.'));return true;
  }catch(_){s.saving=false;renderWizard();status('r993WizardStatus',copy('Kayıt saklanamadı. Önizleme korunuyor; yeniden dene.','Could not save. Preview is retained; retry.'));return false;}
 }
 async function nextMissing(){const s=wizard;if(!s||busy())return false;stopPreview();const token=++recToken,total=adapter.catalog[s.key].adimlar.length;for(let n=1;n<=total;n++){const i=(s.index+n)%total;if(!await adapter.load(s.key,i)){if(token!==recToken)return false;s.index=i;await wizardLoad();return true;}if(token!==recToken)return false;}status('r993WizardStatus',copy('Bütün adımlar kendi sesinle kayıtlı.','All steps are recorded in your voice.'));return true;}
 const CONTEXT={
  kabe:['Kıbleye yöneliş ve Beytullah özlemi. Tasvirler uygulamanın tefekkür metnidir.','Turning toward the qiblah and longing for the Sacred House. The imagery is app-authored reflection.'],
  ravza:['Salât ve selâmı hatırlamak. Mekân tasvirleri bir ziyaret veya manevî sonuç garantisi değildir.','Remembering blessings and greetings. The imagery does not promise a visit or a spiritual outcome.'],
  murakabe:['İhsân bilincini hatırla: Allah’ın seni gördüğünü bilerek kulluk etmek.','Recall ihsan: worship with the awareness that Allah sees you.'],
  afak:['Yaratılıştaki ve kendindeki işaretlere dikkat et; tasvirler âyetin uygulama yorumudur.','Attend to signs in creation and within yourself; the imagery is the app’s interpretation.'],
  seher:['Sükûnet içinde istiğfarı hatırlamak; bu set bir ibadet vakti hükmü vermez.','Remember seeking forgiveness in stillness; this set does not define worship times.'],
  sukur:['Sahip olduklarını fark edip şükrü günlük davranışa taşı.','Notice what you have and carry gratitude into daily conduct.'],
  vakt:['Vaktin kıymetini düşün; bugün yapabileceğin iyi bir davranışı seç.','Reflect on the value of time and choose one good action for today.'],
  sabir:['Sabır, gerekli yardımı veya tedbiri terk etmek değildir.','Patience does not require abandoning needed help or practical action.'],
  riza:['Rızâyı sorumluluğunu ve gayretini bırakmadan düşün.','Consider contentment without giving up responsibility or effort.'],
  muhasebe:['Kendini suçlamaya takılmadan, düzeltilebilir bir davranışı fark et.','Notice a changeable action without getting stuck in self-blame.'],
  tovbe:['Nedâmet, vazgeçme ve düzeltme niyetini düşün; kul hakkı ayrıca gözetilir.','Reflect on remorse, leaving the wrong and making amends; others’ rights need attention.'],
  fena:['Damla ve umman bir temsildir; Allah ile yaratılmışları özdeşleştiren bir hüküm değildir.','The drop and ocean are a metaphor, not a claim identifying Allah with creation.']
 };
 const SOURCES={murakabe:['Sahih Muslim · Cibrîl hadisi · 8a','https://sunnah.com/muslim:8a'],afak:['Fussilet 41:53','https://kuran.diyanet.gov.tr/tefsir/sure/41-fussilet-suresi'],seher:['Zâriyât 51:18','https://kuran.diyanet.gov.tr/tefsir/sure/51-zariyat-suresi'],sukur:['İbrâhim 14:7','https://kuran.diyanet.gov.tr/tefsir/sure/14-ibrahim-suresi'],sabir:['Bakara 2:153','https://kuran.diyanet.gov.tr/tefsir/sure/2-bakara-suresi'],riza:['Beyyine 98:8','https://kuran.diyanet.gov.tr/tefsir/sure/98-beyyine-suresi'],tovbe:['Bakara 2:222','https://kuran.diyanet.gov.tr/tefsir/sure/2-bakara-suresi']};
 function explain(){const v=view(),key=v.active?v.key:v.selected,set=adapter?.catalog[key];if(!set)return;const box=dialogOpen('Adım · Açıklama ve kaynak','Step · Explanation and source','explain');if(!box)return;
  const i=v.active?v.index:0;box.append(node('h3','',translate(set.ad)+` · ${i+1}/${set.adimlar.length}`),node('p','r993Script',translate(set.adimlar[i].t)),node('p','',translate(set.izah)),text(...(CONTEXT[key]||['Bu adım uygulamanın tefekkür yönlendirmesidir.','This step is app-authored reflection guidance.'])),text('Yukarıdaki adım metni uygulama tarafından hazırlanmış bir tefekkür yönlendirmesidir; âyet veya hadis diye sunulmaz.','The step above is app-authored reflection guidance; it is not presented as a Quran verse or hadith.'));
  if(SOURCES[key]){box.append(text('Temanın dayandığı kaynak','Source underlying the theme'));const a=node('a','',SOURCES[key][0]);a.href=SOURCES[key][1];a.target='_blank';a.rel='noopener noreferrer';box.append(a,text('Açıklama çevrimdışı okunabilir; kaynak bağlantısı internet gerektirir.','The explanation is available offline; the source link requires internet.'));}
  else box.append(text(key==='muhasebe'?'Katalogdaki Hz. Ömer’e nispet edilen söz için bu sürümde doğrulanmış birincil kaynak verilmemiştir.':'Bu tasvir için katalogda doğrulanmış birincil metin kaynağı belirtilmemiştir.',key==='muhasebe'?'No verified primary source is supplied here for the saying attributed to Umar in the catalog.':'No verified primary text source is specified in the catalog for this imagery.'));
 }
 function endSummary(v){if(document.hidden||busy()||dialog){pendingEnd={...v};return;}pendingEnd=null;const box=dialogOpen('Set tamamlandı','Set completed','summary');if(!box)return;
  box.append(node('h3','',translate(v.title||'')),text(`${v.completed??v.total}/${v.total} adım · ${Math.max(1,Math.round((v.elapsed||0)/60))} dakika`,`${v.completed??v.total}/${v.total} steps · ${Math.max(1,Math.round((v.elapsed||0)/60))} minutes`));
  const note=node('textarea');note.id='r993EndNote';note.maxLength=1000;note.rows=3;box.append(label('İstersen bir tefekkür notu bırak','Optional reflection note',note),text('Not yalnız bu cihazda, Kaydet’e dokununca saklanır.','The note stays on this device and is saved only when you tap Save.'));const buttons=node('div','r993Buttons');buttons.append(btn('Notu kaydet','Save note','save-note'),btn('Sessizlikte kal','Stay in silence','stay-quiet'),btn('Seansı bitir','Finish session','finish'));box.append(buttons);dialog._summary={key:v.key,title:v.title,elapsed:v.elapsed,completed:v.completed,total:v.total};const statusNode=node('p','r993Status');statusNode.id='r993NoteStatus';statusNode.setAttribute('role','status');box.append(statusNode);
 }
 async function testVoice(){if(view().active||window.Tekke?.sessionState?.().active||busy()||!owned()){notify('Ses denemesi için önce seansı bitir.','Finish the session before testing speech.');return false;}const info=voiceInfo();if(!window.speechSynthesis||!window.SpeechSynthesisUtterance)return false;
  adapter.stopOthers?.();stopPreview();const u=adapter.voice(copy('Tekke ses denemesi.','Tekke voice test.'));voiceTest=u;u.voice=info.voice||u.voice;u.volume=.7;u.onend=()=>{if(voiceTest!==u)return;voiceTest=null;status('r993OfflineStatus',navigator.onLine===false?copy('Bu ses denemesi çevrimdışı tamamlandı. Uzun kullanım öncesi setini de dene.','This speech test completed offline. Test your set before extended use.'):copy('Ses denemesi tamamlandı. Çevrimdışı doğrulamak için internet kapalıyken yeniden dene.','Speech test completed. Repeat with the internet off to verify offline use.'));};u.onerror=()=>{if(voiceTest!==u)return;voiceTest=null;status('r993OfflineStatus',copy('Cihaz sesi denemesi başarısız. Eksik adımları kaydedebilirsin.','Speech test failed. You can record missing steps.'));};window.speechSynthesis.speak(u);return true;
 }
 function showNotes(){const box=dialogOpen('Tefekkür notlarım','My reflection notes','notes');if(!box)return;const notes=read(NOTE_KEY,[]),items=(Array.isArray(notes)?notes:[]).filter(n=>typeof n?.text==='string').slice(-100).reverse();if(!items.length)box.append(text('Henüz kaydedilmiş not yok.','No saved notes yet.'));for(const n of items){const entry=node('article','r993NoteEntry');entry.append(node('h3','',translate(n.title||'')),node('small','',safe(()=>new Date(n.date).toLocaleString(en()?'en-GB':'tr-TR'),'')),node('p','',n.text.slice(0,1000)));box.append(entry);}}
 async function action(a){if(a==='notes'){showNotes();return;}if(a==='close'){closeDialog();return;}if(a==='recover'){flow()?.recover();return;}if(a==='restart'){const key=view().checkpoint?.key||view().selected;flow()?.discardCheckpoint();factory()?.startSet?.(key);return;}
  if(a==='offline'){await checkReady(true);return;}if(a==='check'){await checkReady();return;}if(a==='voice-test'){await testVoice();return;}if(a==='wizard'){await openWizard();return;}if(a==='explain'){explain();return;}
  if(a==='prev'||a==='next'||a==='replay'){stopPreview();a==='replay'?flow()?.jump(view().index):flow()?.navigate(a==='prev'?-1:1);return;}
  if(a==='save-profile'){if(saveProfile($('r993ProfileName').value))$('r993ProfileName').value='';return;}if(a==='apply-profile'){applyProfile($('r993ProfileSelect').value);return;}
  if(a==='delete-profile'){const id=$('r993ProfileSelect').value;if(id&&write(PROFILE_KEY,profiles().filter(p=>p.id!==id)))renderProfiles();return;}
  if(a==='save-note'){const note=$('r993EndNote').value.trim();if(!note)return;const list=read(NOTE_KEY,[]);const next=(Array.isArray(list)?list:[]).slice(-99);next.push({...dialog._summary,text:note.slice(0,1000),date:new Date().toISOString()});if(write(NOTE_KEY,next)){status('r993NoteStatus',copy('Not kaydedildi.','Note saved.'));dialog.querySelector('[data-journey-action="save-note"]').disabled=true;}else status('r993NoteStatus',copy('Not kaydedilemedi.','Could not save the note.'));return;}
  if(a==='stay-quiet'){if(closeDialog())factory()?.startPurpose?.('quiet');return;}if(a==='finish'){if(closeDialog())factory()?.finish?.();return;}
  if(!wizard||busy()&&a!=='record')return;
  if(a==='record')await record();else if(a==='listen')await listen();else if(a==='trim')await trim();else if(a==='accept')await accept();else if(a==='missing')await nextMissing();
  else if(a==='rec-prev'||a==='rec-next'){wizard.index=Math.max(0,Math.min(adapter.catalog[wizard.key].adimlar.length-1,wizard.index+(a==='rec-prev'?-1:1)));await wizardLoad();}
  else if(a==='original'){const s=wizard,token=recToken;const original=await adapter.original(s.key,s.index);if(wizard!==s||token!==recToken)return;if(original){s.candidate=original;s.rawCandidate=original;renderWizard();}else status('r993WizardStatus',copy('Özgün yedek henüz yok; mevcut kayıt korunuyor.','No original backup yet; current recording is retained.'));}
 }
 function mount(){root=$('tk');if(!adapter||mounted||!$('r992Purpose'))return;mounted=true;root.dataset.tkJourney='r993';
  const recovery=node('section','r993Area r993Recovery');recovery.id='r993Recovery';recovery.hidden=true;const msg=node('p');msg.id='r993RecoveryText';const actions=node('div','r993Buttons');actions.append(btn('Devam et','Continue','recover'),btn('Baştan başlat','Start again','restart'));recovery.append(msg,actions);$('r992Purpose').before(recovery);
  const ready=node('section','r993Area');ready.id='r993Readiness';const readyHeading=node('h3','',copy('Seans hazırlığı','Session readiness'));readyHeading.dataset.journeyCopy='Seans hazırlığı|Session readiness';ready.append(readyHeading);const st=node('p','r993Status');st.id='r993OfflineStatus';st.setAttribute('role','status');const rb=node('div','r993Buttons');rb.append(btn('Çevrimdışı hazırla','Prepare offline','offline'),btn('Kontrol et','Check','check'),btn('Cihaz sesini dene','Test device speech','voice-test'));ready.append(st,rb);$('gSetSettings').append(ready);
  const recordings=section('r993RecordingGuide','Kayıt rehberi','Recording guide','recordings');recordings.append(text('Eksik adımları sırayla kaydet, dinle ve onayla.','Record, listen to and approve missing steps in order.'),btn('Kayıt rehberini aç','Open recording guide','wizard'));$('r992PanelBody').append(recordings);
  const ps=section('r993Profiles','Kişisel Tekke düzenleri','Personal Tekke arrangements','session'),name=node('input');name.id='r993ProfileName';name.maxLength=60;name.type='text';const select=node('select');select.id='r993ProfileSelect';select.setAttribute('aria-label',copy('Kayıtlı Tekke düzeni','Saved Tekke arrangement'));const pb=node('div','r993Buttons');pb.append(btn('Düzeni kaydet','Save arrangement','save-profile'),btn('Seçili düzeni uygula','Apply selected arrangement','apply-profile'),btn('Düzeni kaldır','Remove arrangement','delete-profile'),btn('Tefekkür notlarım','My reflection notes','notes'));const notice=node('p','r993Status');notice.id='r993Notice';notice.setAttribute('role','status');ps.append(label('Düzenin adı','Arrangement name',name),select,pb,text('Set, amaç, mekân, ses, yankı ve görünüm saklanır. Tempo değiştirilmez. Düzen yalnız Uygula’ya dokununca etkinleşir.','Saves set, purpose, space, volume, echo and appearance. Tempo is unchanged. An arrangement activates only when you tap Apply.'),notice);$('r992PanelBody').append(ps);
  const nav=node('div','r993StepNav r993Buttons');nav.id='r993StepNav';nav.append(btn('‹ Önceki','‹ Previous','prev'),btn('↺ Tekrar dinle','↺ Replay','replay'),btn('Sonraki ›','Next ›','next'),btn('Açıklama ve kaynak','Explanation and source','explain'));$('r992Transport').prepend(nav);
  root.addEventListener('click',e=>{const b=e.target.closest('[data-journey-action]');if(b&&!b.disabled&&root.contains(b))action(b.dataset.journeyAction).catch(()=>{status('r993WizardStatus',copy('İşlem tamamlanamadı; yeniden dene.','The operation could not finish; retry.'));notify('İşlem tamamlanamadı; yeniden dene.','The operation could not finish; retry.');});});render();window.SukunTekkeUX?.render?.();
 }
 function render(){if(!mounted)return;if(view().active)pendingEnd=null;for(const n of document.querySelectorAll('[data-journey-copy]'))n.textContent=copy(...n.dataset.journeyCopy.split('|'));if(wizard)renderWizard();const v=view(),cp=v.checkpoint;const recovery=$('r993Recovery');recovery.hidden=v.active||!cp;if(cp)status('r993RecoveryText',`${translate(cp.title)} · ${cp.index+1}/${cp.total} `+copy('adımda kaldın. Ses, Devam et’i seçince bu adımın başından okunur.','was your last step. Continue restarts this step.'));
  const nav=$('r993StepNav');nav.hidden=!v.active||root.dataset.tkPurpose!=='set';for(const b of nav.querySelectorAll('button')){const a=b.dataset.journeyAction;b.disabled=a==='explain'?false:!['playing','paused'].includes(v.phase)||a==='prev'&&v.index===0||a==='next'&&v.index>=v.total-1;}
  if(readiness?.key!==v.selected)status('r993OfflineStatus',copy('Kayıt ve çevrimdışı dosya durumunu Kontrol et ile görebilirsin.','Choose Check to see recording and offline file status.'));
  for(const b of document.querySelectorAll('[data-journey-action]'))if(HELP[b.dataset.journeyAction])b.title=copy(...HELP[b.dataset.journeyAction]);
  renderProfiles();if(v.phase==='ended'&&lastPhase!=='ended')endSummary(v);lastPhase=v.phase;
 }
 function bind(value){adapter=value;mount();}
 const api=Object.freeze({version:'r993',bind,mount,render,busy,stopPreview,checkReady,voiceInfo,visualPaths,openWizard,saveProfile,applyProfile,profiles,trimBounds,pcmWav,record,accept,trim,closeDialog,explain});window.SukunTekkeJourney=api;
 if(window.__sukunTekkeJourneyAdapter)bind(window.__sukunTekkeJourneyAdapter);
 flow()?.subscribe(()=>{mount();render();});
 safe(()=>window.SukunAudioSessionRegistry?.register?.('tekke-record-preview-r993',{priority:122,title:'Tekke · Kayıt önizlemesi',getState:()=>voiceTest||preview&&!preview.paused?'playing':'idle',stop:stopPreview,pause:stopPreview}));
 window.addEventListener('tekke:opened',()=>{mount();render();});window.addEventListener('tekke:started',()=>{pendingEnd=null;stopPreview();mount();render();});
 window.addEventListener('languagechange',()=>{readiness=null;render();});window.addEventListener('sukun:language',()=>{readiness=null;render();});
 window.addEventListener('visibilitychange',()=>{if(!document.hidden&&pendingEnd)endSummary(pendingEnd);});
 window.addEventListener('pagehide',()=>{recToken++;if(wizard)wizard.requesting=false;stopPreview();if(wizard?.recorder?.state==='recording')safe(()=>wizard.recorder.stop());wizard?.stream?.getTracks().forEach(t=>t.stop());});
})();
