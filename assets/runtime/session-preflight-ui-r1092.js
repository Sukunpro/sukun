/* Read-only, explicit preparation. Playback and its controls keep their owners. */
(()=>{'use strict';
if(window.SukunSessionPreflightUIR1092)return;
const w=window,$=id=>document.getElementById(id),safe=(fn,alt=null)=>{try{return fn()??alt}catch(_){return alt}},P=()=>w.R170?.Player;
const en=()=>w.I18N?.lang==='en',t=(tr,eng)=>en()?eng:tr;
let generation=0,result=null,pending=false,checked=false,dirty=false,lastFingerprint='',scheduled=0;
const sourceLabels={bundled:['Gömülü Arapça kayıt','Bundled Arabic recording'],personal:['Kendi ses kaydın','Your recording'],generic:['Genel ses arşivi','General voice archive'],device:['Cihaz sesi','Device speech'],silence:['Sükût','Silence'],frequency:['Frekans','Frequency'],unknown:['Kaynak doğrulanamadı','Source unverified'],missing:['Okuma bulunamadı','Reading not found'],locked:['Kilitli bölüm','Locked section'],unavailable:['Kaynak kullanılamıyor','Source unavailable']};
const availabilityLabels={local:['Bu cihazda mevcut','Available on this device'],cached:['Çevrimdışı önbellekte mevcut','Available in offline cache'],'network-needed':['Çevrimdışı hazır değil; ağ gerekebilir','Not ready offline; network may be needed'],'device-dependent':['Çevrimdışı kullanım cihaza bağlı; doğrulanamadı','Offline use depends on the device; unverified'],unknown:['Çevrimdışı durum doğrulanamadı','Offline status unverified'],unavailable:['Kullanılamıyor','Unavailable'],'not-needed':['Ses dosyası gerekmiyor','No audio file needed']};
const reasonLabels={
 'recording-required':['Seçili ses modunda eşleşen kayıt gerekli. Kayıt ekle veya ses seçimini değiştir.','The selected voice mode requires a matching recording. Add a recording or change the voice choice.'],
 'recording-content-unknown':['Bu ses seçimi için kaydın içeriği doğrulanamadı.','The recording content could not be verified for this voice choice.'],
 'recording-storage-unavailable':['Kayıt deposuna erişilemedi. Kaydın eksik olduğu doğrulanmadı; yeniden dene.','Recording storage could not be read. This does not establish that the recording is missing; try again.'],
 'archive-storage-unavailable':['Genel ses arşivi okunamadı. Yeniden dene.','The general voice archive could not be read. Try again.'],
 'recording-read-timeout':['Kayıt deposu yanıt vermedi. Yeniden dene.','Recording storage did not respond. Try again.'],
 'recording-invalid':['Kayıt boş veya ses dosyası olarak doğrulanamadı.','The recording is empty or could not be verified as an audio file.'],
 'recording-catalog-unconfirmed':['Kayıt listesi ile depo henüz doğrulanamadı. Yeniden dene.','The recording list and storage could not yet be reconciled. Try again.'],
 'recording-source-changed':['Kontrol sırasında kayıt değişti. Yeniden kontrol et.','The recording changed during the check. Check again.'],
 'missing-source':['Bu okuma listede bulunamadı. Adımı yeniden ekle.','This reading was not found in the catalog. Add the step again.'],
 'empty-source':['Bu okumada kullanılabilir metin bulunamadı.','No usable text was found for this reading.'],
 'device-voice-unavailable':['Uygun cihaz sesi bulunamadı. Cihazın ses ayarlarını kontrol et.','No suitable device voice was found. Check your device voice settings.'],
 'text-unavailable':['Cihaz sesi için okunabilir metin bulunamadı.','No readable text was found for device speech.'],
 'multipart-source-unverified':['Bu terkip birden fazla okuma içerir; kaynakları başlangıçta doğrulanır.','This sequence contains several readings; its sources are checked when playback starts.'],
 'cache-unverified':['Etkin sürümün çevrimdışı önbelleği doğrulanamadı.','The active version’s offline cache could not be verified.'],
 'bundled-not-cached':['Bu gömülü okuma etkin çevrimdışı önbellekte doğrulanmadı.','This bundled reading was not verified in the active offline cache.'],
 'explicit-device-policy-unverified':['Bu ses seçiminin kaynağı başlangıçta doğrulanır.','The source for this voice choice is checked when playback starts.'],
 'silence-announcement-unverified':['Sükût anonsunun ses kaynağı başlangıçta doğrulanır.','The silence announcement source is checked when playback starts.'],
 'unsupported-step':['Bu adımın kaynak kontrolü desteklenmiyor.','Source inspection is not supported for this step.']
};
const label=(map,key)=>{const pair=map[key]||map.unknown;return pair[en()?1:0]};
const privateStep=step=>{
 // Canonical alias metadata belongs to the shared inspector. Until it is
 // available, a locked favorite cannot safely be assumed to be public.
 if(typeof w.SukunSessionPreflightR1092?.isVisible==='function')return safe(()=>w.SukunSessionPreflightR1092.isVisible(step),false)!==true;
 if(step?.cat==='fav'&&safe(()=>w.SukunSecretPolicy?.unlocked?.(),false)!==true)return true;
 return safe(()=>w.SukunSecretPolicy?.secretStep?.(step),true)===true;
};
const visibleQueue=()=>safe(()=>P()?.queue||[],[]).filter(step=>!privateStep(step));
function fingerprint(){return safe(()=>{const voice=w.SukunVoiceSettings?.snapshot?.()||{},generic=w.SukunGenericRecordings?.snapshot?.()||{};return JSON.stringify({queue:P()?.queue||[],voice:{mode:voice.mode,content:voice.content,revision:voice.revision,voiceEnabled:voice.voiceEnabled,arabicAvailable:voice.arabicAvailable,turkishRate:voice.turkishRate},generic:{enabled:generic.enabled,ready:generic.ready,epoch:generic.epoch,bankId:generic.bankId},unlocked:w.SukunSecretPolicy?.unlocked?.()===true})},String(generation))}
function visibleRows(){return (result?.rows||[]).filter(row=>Number.isInteger(row.index)&&P()?.queue?.[row.index]&&!privateStep(P().queue[row.index])&&row.source!=='locked')}
function mount(){
 const start=$('r170StartSession'),anchor=start?.closest('.r170Row');if(!anchor)return false;
 if(!$('r1092Preflight')){
  const box=document.createElement('details');box.id='r1092Preflight';box.setAttribute('data-noi18n','');
  const summary=document.createElement('summary');summary.id='r1092PreflightSummary';box.append(summary);
  const note=document.createElement('p');note.id='r1092PreflightNote';box.append(note);
  const status=document.createElement('p');status.id='r1092PreflightStatus';status.setAttribute('role','status');status.setAttribute('aria-live','polite');status.setAttribute('aria-atomic','true');box.append(status);
  const check=document.createElement('button');check.id='r1092PreflightCheck';check.className='r170Btn';check.type='button';check.setAttribute('aria-describedby','r1092PreflightNote r1092PreflightStatus');check.onclick=()=>{void inspect()};box.append(check);
  const list=document.createElement('ol');list.id='r1092PreflightRows';box.append(list);anchor.before(box);
 }
 render();return true;
}
function render(){
 const box=$('r1092Preflight');if(!box)return;
 const queue=visibleQueue(),rows=visibleRows(),busy=!!P()?.playing;
 $('r1092PreflightSummary').textContent=t('Başlangıç kontrolü','Before you start')+(queue.length?' · '+queue.length+t(' adım',' steps'):'');
 $('r1092PreflightNote').textContent=t('Planlanan kaynak; ses Başlat’a dokununca yeniden doğrulanır.','Planned source; audio is checked again when you tap Start.');
 const status=$('r1092PreflightStatus');
 if(pending)status.textContent=t('Yerel kaynaklar kontrol ediliyor…','Checking local sources…');
 else if(checked){const audio=rows.filter(row=>row.availability!=='not-needed'),local=audio.filter(row=>['local','cached'].includes(row.availability)).length;status.textContent=(result?.reason==='queue-limit'?t('Kısmi kontrol: ilk '+rows.length+' görünür adım incelendi. ','Partial check: the first '+rows.length+' visible steps were inspected. '):t('Kontrol tamamlandı. ','Check complete. '))+local+'/'+audio.length+t(' ses kaynağı yerel veya önbellekte.',' audio sources are local or cached.');if(!rows.length&&result?.status==='attention')status.textContent=t('Kaynaklar doğrulanamadı. Yeniden kontrol et.','Sources could not be verified. Check again.')}
 else status.textContent=!queue.length?t('Kontrol için önce seansa adım ekle.','Add a session step to check sources.'):dirty?t('Seans veya ses ayarları değişti. Kaynakları yeniden kontrol et.','The session or audio settings changed. Check sources again.'):t('Başlamadan önce kaynakları ve çevrimdışı durumu kontrol edebilirsin.','You can check sources and offline readiness before starting.');
 const button=$('r1092PreflightCheck');button.textContent=pending?t('Kontrol ediliyor…','Checking…'):checked||dirty?t('Yeniden kontrol et','Check again'):t('Kaynakları kontrol et','Check sources');button.disabled=pending||busy||!queue.length||!w.SukunSessionPreflightR1092?.inspect;
 box.setAttribute('aria-busy',String(pending));const list=$('r1092PreflightRows');list.replaceChildren();
 for(const row of rows){
  const li=document.createElement('li');li.dataset.index=String(row.index);li.dataset.source=String(row.source||'unknown');li.dataset.availability=String(row.availability||'unknown');
  const title=document.createElement('b');title.textContent=String(row.title||(['silence','frequency'].includes(row.type)?label(sourceLabels,row.type):t('Adım','Step')+' '+(row.index+1)));
  const source=document.createElement('span');source.textContent=t('Planlanan kaynak: ','Planned source: ')+label(sourceLabels,row.source);
  const offline=document.createElement('small');offline.textContent=label(availabilityLabels,row.availability);
  li.append(title,source,offline);const explanation=reasonLabels[row.reason];if(explanation){const reason=document.createElement('small');reason.className='r1092-reason';reason.textContent=explanation[en()?1:0];li.append(reason)}list.append(li);
 }
 list.hidden=!rows.length;
}
function invalidate(reason='change',force=true){
 const next=fingerprint();if(!force&&next===lastFingerprint){render();return false}lastFingerprint=next;generation++;dirty=checked||dirty||pending;result=null;pending=false;checked=false;render();return true;
}
async function inspect(){
 if(pending||P()?.playing||!w.SukunSessionPreflightR1092?.inspect||!visibleQueue().length)return false;
 const run=++generation,stamp=fingerprint();lastFingerprint=stamp;pending=true;checked=false;result=null;render();
 // A detached copy prevents an inspector from becoming a second queue writer.
 const queue=safe(()=>JSON.parse(JSON.stringify(P()?.queue||[])),[]);
 const current=()=>run===generation&&stamp===fingerprint()&&!P()?.playing;
 try{
  const value=await w.SukunSessionPreflightR1092.inspect(queue,{isCurrent:current});
  if(!current())return false;
  pending=false;if(value?.status==='stale'){dirty=true;render();return false}
  result=value&&Array.isArray(value.rows)?value:{rows:[]};checked=true;dirty=false;render();return true;
 }catch(_){if(current()){pending=false;result=null;checked=false;dirty=true;render();$('r1092PreflightStatus').textContent=t('Kontrol tamamlanamadı. Yeniden deneyebilirsin.','The check could not finish. You can try again.')}return false}
 finally{if(run===generation&&pending){pending=false;dirty=true;render()}}
}
function schedule(){if(scheduled)return;scheduled=requestAnimationFrame(()=>{scheduled=0;mount()})}
for(const name of ['sukun:sessiondraftchange','sukun:smartphase','sukun:playbackchange'])w.addEventListener(name,()=>invalidate(name,false),{passive:true});
for(const name of ['sukun:voicesettingschange','sukun:genericrecordingschange','sukun:genericrecordingsstatus','sukun:recordingcatalog','sukun:itemrecordingchange','sukun:recordingrecovered','sukun:recordingstartup','sukun:secretaccesschange','sukun:secretpolicyready','online','offline','storage'])w.addEventListener(name,()=>invalidate(name),{passive:true});
w.speechSynthesis?.addEventListener?.('voiceschanged',()=>invalidate('voiceschanged'));
w.addEventListener('sukun:languagechange',schedule,{passive:true});
w.addEventListener('sukun:domhydrate',()=>{invalidate('hydrate',false);schedule()},{passive:true});
document.addEventListener('visibilitychange',()=>{if(!document.hidden){invalidate('visibility');schedule()}},{passive:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
w.SukunSessionPreflightUIR1092=Object.freeze({version:'r1092',mount,check:inspect,invalidate,snapshot:()=>({version:'r1092',mounted:!!$('r1092Preflight'),pending,checked,dirty,generation,rows:visibleRows().map(row=>({...row}))})});
})();
