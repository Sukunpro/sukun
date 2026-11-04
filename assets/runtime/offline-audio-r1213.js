/* Explicit, optional public audio packs. Personal recordings stay in their
   existing stores; neither this panel nor the worker removes them. */
(()=>{'use strict';if(window.SukunOfflineAudioR1213)return;
 const $=id=>document.getElementById(id),build=document.querySelector('meta[name="sukun-build"]')?.content||'',t=(tr,en)=>window.I18N?.lang==='en'?en:tr;
 let busy=false,report=null,error='',operation='',worker=null,selected='yasin';
 const packs={yasin:['Yâsîn','Yā Sīn'],short:['Kısa sûreler ve Âyetü’l-Kürsî','Short surahs and Ayat al-Kursi'],ambience:['Açılış ve kapı sesleri','Opening and door sounds']};
 const size=n=>(Math.max(0,Number(n)||0)/1048576).toLocaleString(window.I18N?.lang==='en'?'en-US':'tr-TR',{maximumFractionDigits:1})+' MB';
 function explain(code){const messages={
  'audio-update-required':['Ses paketleri için uygulama güncellemesini tamamlayıp yeniden aç.','Complete the app update and reopen it to use audio packs.'],
  'audio-quota':['İndirme için yeterli boş alan bulunamadı. İndirilen sesler korunuyor.','There is not enough free space. Downloaded audio is kept.'],
  'audio-integrity':['Ses dosyası doğrulanamadı. Yeniden dene.','The audio file could not be verified. Retry.'],
  'audio-cancelled':['İndirme durduruldu. Tamamlanan sesler korunuyor.','Download stopped. Completed audio is kept.'],
  'audio-network':['İndirme tamamlanamadı. Bağlantıyı kontrol edip eksikleri yeniden indir.','Download incomplete. Check your connection and retry missing files.'],
  'audio-timeout':['İşlem süresi doldu. Yeniden kontrol edip devam edebilirsin.','The operation timed out. Check again to continue.'],
  'audio-busy':['Başka bir ses paketi işlemi sürüyor.','Another audio package operation is running.']};return t(...(messages[code]||['Sesler kontrol edilemedi. Yeniden dene.','Audio could not be checked. Retry.']))}
 function render(){const panel=$('r1213AudioPack');if(!panel)return;
  const labels={Title:['Çevrimdışı ses paketleri','Offline audio packs'],Note:['İstediğin ses paketini ayrıca indir. Uygulama güncellemeleri bu indirmeleri beklemez.','Download the audio packs you want separately. App updates do not wait for these downloads.'],Check:['Saklanan sesleri kontrol et','Check saved audio'],Download:[report?.saved?'Eksikleri tamamla':'Paketi indir',report?.saved?'Download missing files':'Download package'],Cancel:['İndirmeyi durdur','Stop download']};
  for(const[key,value]of Object.entries(labels))$('r1213Audio'+key).textContent=t(...value);
  const select=$('r1213AudioSelect');for(const option of select.options)option.textContent=t(...packs[option.value]);select.disabled=busy;
  $('r1213AudioDownload').setAttribute('data-sukun-surface',report?.ready?'emerald':'sapphire');
  $('r1213AudioCheck').disabled=busy;$('r1213AudioDownload').disabled=busy||!report||report.ready;$('r1213AudioCancel').hidden=!busy||operation!=='download';panel.setAttribute('aria-busy',String(busy));
  $('r1213AudioAmounts').textContent=report?t('Saklanan: ','Saved: ')+report.saved+'/'+report.total+' · '+size(report.savedBytes)+' / '+size(report.totalBytes):t('İndirmeden önce paketi kontrol et; gereken boyut burada görünecek.','Check the package first to see the required download size.');
  $('r1213AudioStatus').textContent=busy?(operation==='download'?t('Sesler indiriliyor…','Downloading audio…'):t('Saklanan sesler doğrulanıyor…','Verifying saved audio…')):error?explain(error):report?.ready?t('Çevrimdışı hazır.','Ready offline.'):report?t('Eksik sesleri indirmek için Paketi indir düğmesine dokun.','Tap Download package to fetch missing audio.'):'';
 }
 function ask(type,onProgress){return new Promise((resolve,reject)=>{
  const target=worker||navigator.serviceWorker?.controller;if(!target){reject(Error('audio-update-required'));return}
  const channel=new MessageChannel();let finished=false,timer;
  const done=(value,fail)=>{if(finished)return;finished=true;clearTimeout(timer);channel.port1.close();fail?reject(Error(fail)):resolve(value)};
  timer=setTimeout(()=>done(null,'audio-timeout'),type==='AUDIO_PACK_DOWNLOAD'?310000:75000);
  channel.port1.onmessage=e=>{const value=e.data;if(value?.build!==build||value.protocol!==1){done(null,'audio-update-required');return}if(value.type==='progress'){onProgress?.(value);return}done(value,value.ok?null:value.errorCode||'audio-storage')};
  channel.port1.onmessageerror=()=>done(null,'audio-storage');
  try{target.postMessage({type,build,packageId:selected},[channel.port2])}catch(_){done(null,'audio-storage')}
 })}
 async function run(action){if(busy)return;busy=true;error='';operation=action;worker=navigator.serviceWorker?.controller;render();
  try{const value=await ask(action==='download'?'AUDIO_PACK_DOWNLOAD':'AUDIO_PACK_STATUS',progress=>{report=progress;render()});report=value}catch(e){error=e.message;report=null}finally{busy=false;operation='';worker=null;render()}}
 async function cancel(){if(!busy)return;try{await ask('AUDIO_PACK_CANCEL')}catch(e){error=e.message}render()}
 function mount(){if($('r1213AudioPack'))return;const images=$('r1095ImagePack');if(!images)return;
  const field=document.createElement('fieldset');field.id='r1213AudioPack';field.setAttribute('data-noi18n','');field.innerHTML='<legend id="r1213AudioTitle"></legend><p id="r1213AudioNote"></p><select id="r1213AudioSelect" aria-label="Ses paketi"><option value="yasin"></option><option value="short"></option><option value="ambience"></option></select><p id="r1213AudioAmounts"></p><div class="r1213-audio-actions"><button type="button" id="r1213AudioCheck" data-sukun-surface="sapphire"></button><button type="button" id="r1213AudioDownload" data-sukun-surface="sapphire" disabled></button><button type="button" id="r1213AudioCancel" hidden></button></div><p id="r1213AudioStatus" role="status" aria-live="polite"></p>';images.after(field);
  $('r1213AudioCheck').onclick=()=>run('check');$('r1213AudioDownload').onclick=()=>run('download');$('r1213AudioCancel').onclick=cancel;$('r1213AudioSelect').onchange=e=>{if(busy)return;selected=e.target.value;report=null;error='';render()};render();
 }
 for(const event of ['sukun:domhydrate','sukun:languagechange'])window.addEventListener(event,()=>{mount();render()},{passive:true});
 navigator.serviceWorker?.addEventListener('controllerchange',()=>{report=null;error='audio-update-required';render()});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{mount();requestAnimationFrame(mount)},{once:true});else{mount();requestAnimationFrame(mount)}
 window.SukunOfflineAudioR1213=Object.freeze({version:'r1213',mount,snapshot:()=>({busy,selected,report,error})});
})();
