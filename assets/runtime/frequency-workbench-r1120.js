/* r1120: reachable controls for the single frequency engine. No AudioContext. */
(()=>{'use strict';
 if(window.SukunFrequencyR1120)return;
 const $=id=>document.getElementById(id),T=(tr,en)=>window.I18N?.lang==='en'?en:tr;
 const fields=['c','b','mode','vol','pink','harmonik','harmSeri','uzam','uzamHiz','wave','balL','balR','noise','noiseVol','filterOn','lpf','hpf','levelProfile','fm','am','rm','pwm'];
 const held=()=>!!(window.SukunAudioSessionRegistry?.aggregateSnapshot?.()?.paused||MINI?.paused||(window.AudioLife?.userPaused&&!window.AudioLife?._terminalIntent));
 function capture(){const value={};fields.forEach(k=>value[k]=FR[k]);value.secondary={on:!!FR2.on,c:FR2.c,b:FR2.b};return value;}
 function validate(x){
  if(!x||typeof x!=='object')throw Error('Invalid frequency settings');const v=capture();for(const k of ['fm','am','rm','pwm'])v[k]=false;
  const ranges={c:[20,18000],b:[.5,40],vol:[0,1],harmonik:[0,4],uzamHiz:[6,60],balL:[0,1],balR:[0,1],noiseVol:[0,1],lpf:[200,8000],hpf:[20,2000]};
  for(const [k,[min,max]]of Object.entries(ranges))if(k in x){const n=x[k];if(typeof n!=='number'||!Number.isFinite(n)||n<min||n>max||k==='harmonik'&&!Number.isInteger(n))throw Error('Invalid '+k);v[k]=n;}
  for(const [k,allowed]of Object.entries({mode:['bin','mono','iso','mix'],harmSeri:['dogal','tek','oktav'],wave:['sine','square','sawtooth','triangle'],noise:['off','white','pink','brown'],levelProfile:['legacy','balanced']}))if(k in x){if(!allowed.includes(x[k]))throw Error('Invalid '+k);v[k]=x[k];}
  for(const k of ['pink','uzam','filterOn','fm','am','rm','pwm'])if(k in x){if(typeof x[k]!=='boolean')throw Error('Invalid '+k);v[k]=x[k];}
  if(x.secondary){const n=x.secondary;if(typeof n.on!=='boolean'||!Number.isFinite(n.c)||n.c<20||n.c>18000||!Number.isFinite(n.b)||n.b<.5||n.b>40)throw Error('Invalid secondary');v.secondary={on:n.on,c:n.c,b:n.b};}
  if(v.wave!=='square')v.pwm=false;
  return v;
 }
 function changed(){saveSettings();sync();window.SukunBackgroundMix?.changed?.('frequency-settings');window.dispatchEvent(new CustomEvent('sukun:frequencychange'));}
 function apply(values,{play=false}={}){
  try{
   const next=validate(values),on=FR.playing,paused=held();
   window.SukunFrequencyHubR1101?.controller?.stopSweep?.();stopJourney();
   // A named set retires delayed mode starts as well as future ramps.
   frCancelPendingStart();if(FR.playing)frHoldRamp();FR._ramp=null;
   for(const k of fields)FR[k]=next[k];Object.assign(FR2,next.secondary);
   if(on){frRebuild(false);fr2Stop();if(FR2.on)fr2Start();if(FR.pink)pinkOn();else pinkOff();frApplyGains(.5);}
   syncFreqUI();changed();
   if(play&&!paused&&!held()&&!FR.playing)window.SukunFrequencyHubR1101?.controller?.start?.();
   return {ok:true,playing:!!FR.playing&&!held(),paused:held()};
  }catch(e){return {ok:false,error:String(e.message||e)};}
 }
 let binauralStatusSettings=null;
 // Fixed Astral presets use the existing graph with explicit, inspectable settings.
 function applyBinauralPreset(p,{play=true}={}){
  if(!p||p.journey||!Number.isFinite(p.c)||!Number.isFinite(p.b))return {ok:false,error:'Invalid binaural preset'};
  const result=apply({c:p.c,b:p.b,mode:'bin',wave:'sine',balL:1,balR:1,
   uzam:false,harmonik:0,filterOn:false,fm:false,am:false,rm:false,pwm:false,
   pink:false,noise:'off',noiseVol:0,secondary:{on:false,c:FR2.c,b:FR2.b}},{play});
  if(result.ok)fr2Stop();
  binauralStatusSettings=result.ok?JSON.stringify(capture()):null;
  const note=$('binauralPresetStatus');
  if(note){note.dataset.binauralResult=result.ok?(result.paused?'paused':'applied'):'failed';paintBinauralStatus();}
  return result;
 }
 function paintBinauralStatus(){
  const note=$('binauralPresetStatus');if(!note?.dataset.binauralResult)return;
  const state=note.dataset.binauralResult;
  if(state!=='failed'&&binauralStatusSettings!==JSON.stringify(capture())){delete note.dataset.binauralResult;note.textContent='';binauralStatusSettings=null;return;}
  note.textContent=state==='failed'?T('Ayarlar uygulanamadı. Sesi başlatmadan önce kontrolleri inceleyin.','Settings could not be applied. Check the controls before starting audio.'):
   T('Uygulandı: binaural, sinüs, eşit sol/sağ kanal. Uzamsal ses, harmonikler, efektler, frekans filtreleri, gürültü ve ikinci katman kapalı. Frekans ses düzeyi korundu.','Applied: binaural, sine, equal left/right channels. Spatial audio, harmonics, effects, frequency filters, noise and the second layer are off. Frequency volume was preserved.');
 }
 function label(tr,en){return T(tr,en);}
 const selectFields={wave:[['sine','∿ Sinüs','∿ Sine'],['triangle','△ Üçgen','△ Triangle'],['square','⊓ Kare','⊓ Square'],['sawtooth','⩘ Testere','⩘ Sawtooth']],noise:[['off','Kapalı','Off'],['white','Beyaz','White'],['pink','Pembe','Pink'],['brown','Kahverengi','Brown']],levelProfile:[['legacy','Mevcut seviye','Existing level'],['balanced','Daha belirgin (isteğe bağlı)','More present (optional)']]};
 const labels={fm:['Vibrato (FM)','Vibrato (FM)'],am:['Tremolo (AM)','Tremolo (AM)'],rm:['Halka modülasyonu (RM)','Ring modulation (RM)'],pwm:['Darbe genişliği (PWM) · yalnız kare','Pulse width (PWM) · square only'],wave:['Dalga tipi','Waveform'],balL:['Sol kanal','Left channel'],balR:['Sağ kanal','Right channel'],noise:['Ek gürültü','Additional noise'],noiseVol:['Gürültü seviyesi','Noise level'],filterOn:['Frekans filtreleri','Frequency filters'],lpf:['Alçak geçiren','Low-pass'],hpf:['Yüksek geçiren','High-pass'],levelProfile:['Seviye profili','Level profile']};
 const effectKeys=['fm','am','rm','pwm'];
 const waveHelp=[
  ['∿ Sinüs','∿ Sine','Tek temel frekans; en sade ve yumuşak ton.','One fundamental frequency; the simplest, smoothest tone.'],
  ['△ Üçgen','△ Triangle','Zayıf tek harmonikler; sinüsten daha dolgun, kareden daha yumuşak.','Weak odd harmonics; fuller than sine, softer than square.'],
  ['⊓ Kare','⊓ Square','Güçlü tek harmonikler; parlak, içi boş bir tını. PWM yalnız bu dalgada çalışır.','Strong odd harmonics; a bright, hollow tone. PWM works only with this waveform.'],
  ['⩘ Testere','⩘ Sawtooth','Tek ve çift harmonikler; daha parlak, vızıltılı bir tını.','Odd and even harmonics; a brighter, buzzy tone.']
 ];
 function help(row,id,titleTr,titleEn,entries){
  const panel=document.createElement('details');panel.className='fr1120-help';panel.id=id;
  const summary=document.createElement('summary');summary.dataset.frTr='ⓘ '+titleTr;summary.dataset.frEn='ⓘ '+titleEn;panel.append(summary);
  for(const [tr,en]of entries){const p=document.createElement('p');p.dataset.frTr=tr;p.dataset.frEn=en;panel.append(p);}
  panel.addEventListener('keydown',event=>{if(event.key==='Escape'&&panel.open){event.preventDefault();panel.open=false;summary.focus();}});row.append(panel);
 }
 function sync(){
  paintBinauralStatus();
  const pwm=$('fr1120-pwm');if(pwm){pwm.disabled=FR.wave!=='square';pwm.setAttribute('aria-describedby','fr1120-effects-help');}

  for(const k of Object.keys(labels)){const el=$('fr1120-'+k);if(!el)continue;if(el.type==='checkbox')el.checked=!!FR[k];else if(document.activeElement!==el)el.value=String(FR[k]);const out=$('fr1120-'+k+'-value');if(out)out.textContent=['balL','balR','noiseVol'].includes(k)?Math.round(FR[k]*100)+'%':FR[k]+' Hz';}
  const summary=$('fr1120-level-note');if(summary)summary.textContent=T('Frekans şiddeti ve ana ses birlikte etkilidir. Ana ses: %','Frequency and master volume work together. Master: ')+Math.round(Number($('masterVol')?.value||0)*100)+(window.I18N?.lang==='en'?'%':'')+'. '+T('Yeni profil yalnız seçersen açılır; cihaz sesini düşükten ayarla.','The new profile is opt-in; start with low device volume.');
  document.querySelectorAll('#harmSayi [data-harm]').forEach(b=>b.classList.toggle('on',+b.dataset.harm===FR.harmonik));document.querySelectorAll('#harmSeri [data-seri]').forEach(b=>b.classList.toggle('on',b.dataset.seri===FR.harmSeri));
  $('uzamTgl')?.classList.toggle('on',FR.uzam);if($('uzamHizSld'))$('uzamHizSld').value=FR.uzamHiz;if($('uzamHizVal'))$('uzamHizVal').textContent=FR.uzamHiz+T(' sn',' s');
  if($('frVol'))$('frVol').value=FR.vol;$('pinkTgl')?.classList.toggle('on',FR.pink);document.querySelectorAll('#modeSeg [data-m]').forEach(b=>b.classList.toggle('act',b.dataset.m===FR.mode));
  $('fr2Tgl')?.classList.toggle('on',FR2.on);if($('fr2Car'))$('fr2Car').value=FR2.c;if($('fr2Beat'))$('fr2Beat').value=FR2.b;if($('fr2CarV'))$('fr2CarV').textContent=FR2.c.toFixed(1)+' Hz';if($('fr2BeatV'))$('fr2BeatV').textContent=FR2.b.toFixed(2)+' Hz';
  window.SukunFrequencySetsR1120?.refreshSelection?.();
 }
 function localize(){paintBinauralStatus();const description=$('binauralProductDescription');if(description)description.textContent=T('Binaural seslerle odaklanma ve meditatif deneyimi desteklemeyi amaçlar.','Aims to support focus and a meditative experience with binaural sounds.');const intro=$('binauralPresetIntro');if(intro)intro.textContent=T('Astral & Derin Zihin kategorisindeki sabit presetler binaural sinüs, eşit sol/sağ kanal uygular; uzamsal ses, harmonikler, efektler, frekans filtreleri, gürültü ve ikinci katmanı kapatır. Ses düzeyi korunur. Yolculuk presetleri farklıdır.','Fixed Astral & Deep Mind presets apply binaural sine tones and equal left/right channels; spatial audio, harmonics, effects, frequency filters, noise and the second layer are turned off. Volume is preserved. Journey presets are different.');if($('frequencyLightLabelR1120'))$('frequencyLightLabelR1120').textContent=T('◉ Sabit ışık geri bildirimi — yanıp sönmez','◉ Steady light feedback — no flashing');if($('frequencyLightWarningR1120'))$('frequencyLightWarningR1120').textContent=T('ışık hassasiyeti uyarısı','photosensitivity notice');$('aveTgl')?.setAttribute('aria-label',T('Sabit ışık geri bildirimi','Steady light feedback'));const host=$('frequencyWorkbenchR1120');if(!host)return;host.querySelectorAll('[data-fr-tr]').forEach(e=>e.textContent=T(e.dataset.frTr,e.dataset.frEn));for(const [k,list]of Object.entries(selectFields)){const el=$('fr1120-'+k);if(el)list.forEach((v,i)=>el.options[i].textContent=T(v[1],v[2]));}const summary=$('frequencyAdvancedR1120')?.querySelector('summary');if(summary)summary.textContent=T('Harmonikler ve 3B ses','Harmonics and 3D sound');sync();}
 function mount(){
  const host=$('frequencyWorkbenchR1120');if(!host||host.firstElementChild)return;
  const details=document.createElement('details');details.className='jEd fr1120-workbench';details.open=true;details.setAttribute('data-hep-acik','');const summary=document.createElement('summary');summary.dataset.frTr='Ses araçları';summary.dataset.frEn='Sound tools';details.append(summary);
  help(details,'fr1120-binaural-help','? Taşıyıcı ve binaural ne yapar?','? What do carrier and binaural do?',[
   ['Taşıyıcı duyduğun perdeyi ayarlar. Binauralde örneğin 100 Hz taşıyıcı ve 4 Hz vuruş, sola 98 Hz ve sağa 102 Hz gönderir. 4 Hz doğrudan çalınan bir bas tonu değildir.','The carrier sets audible pitch. In binaural mode, a 100 Hz carrier with a 4 Hz beat sends 98 Hz left and 102 Hz right. 4 Hz is not a directly played bass tone.'],
   ['Stereo kulaklık ve ayrı sol/sağ çıkış gerekir. Cihazın mono ses veya uzamsal ses ayarları kanalları değiştirebilir. Binaural bir dalgalanma hissi oluşturabilir; herkeste aynı algı oluşmaz.','Stereo headphones and separate left/right output are needed. Device mono or spatial-audio settings may change the channels. Binaural tones may create a perceived fluctuation; perception varies.'],
   ['İzokronik tek tonu ritmik olarak kapılar; monaural iki tonu birlikte verir; karma binaural ve izokroniği birleştirir. Hoparlör binaural kulak ayrımını sağlamaz.','Isochronic rhythmically gates one tone; monaural combines two tones; mixed combines binaural and isochronic. Speakers do not provide binaural ear separation.'],
   ['Amaç sakin dinleme ve içe bakış için bir ses zemini sunmaktır. Gevşeme, odaklanma, astral deneyim veya beyin yarımkürelerinin eşlenmesi garanti edilmez. Bu sesler uygulamada üretilir.','The aim is a sound bed for calm listening and reflection. Relaxation, focus, astral experiences or hemispheric synchronization are not guaranteed. These sounds are generated in the app.']]);
  const safety=document.createElement('p');safety.className='fr1120-note';safety.id='fr1120-binaural-safety';
  safety.dataset.frTr='Düşük sesle başla; rahatsızlıkta durdur. Nörolojik bir rahatsızlığın varsa kullanmadan önce bir sağlık uzmanına danış. Araç kullanırken veya dikkat gerektiren işlerde kullanma. Tıbbî tedavi yerine geçmez.';
  safety.dataset.frEn='Start at low volume; stop if uncomfortable. If you have a neurological condition, consult a health professional before use. Do not use while driving or doing tasks requiring attention. Not a substitute for medical treatment.';details.append(safety);
  for(const [key,names]of Object.entries(labels)){
   const row=document.createElement('div');row.className='fr1120-row';const lab=document.createElement('label');lab.htmlFor='fr1120-'+key;lab.dataset.frTr=names[0];lab.dataset.frEn=names[1];row.append(lab);
   let input;if(selectFields[key]){input=document.createElement('select');for(const option of selectFields[key]){const o=document.createElement('option');o.value=option[0];o.textContent=label(option[1],option[2]);input.append(o);}}
   else {input=document.createElement('input');input.type=key==='filterOn'||effectKeys.includes(key)?'checkbox':'range';const range=key==='lpf'?[200,8000,10]:key==='hpf'?[20,2000,10]:[0,1,.01];if(input.type==='range'){input.min=range[0];input.max=range[1];input.step=range[2];}}
   input.id='fr1120-'+key;row.append(input);if(input.type==='range'){const value=document.createElement('output');value.id=input.id+'-value';value.htmlFor=input.id;row.append(value);}
   input.addEventListener(input.type==='range'?'input':'change',()=>{FR[key]=input.type==='checkbox'?input.checked:input.type==='range'?+input.value:input.value;if(key==='wave'&&FR.wave!=='square')FR.pwm=false;if(FR.playing){if(key==='levelProfile')frApplyGains(.7);else frRebuild();}changed();});details.append(row);
   if(key==='wave')help(details,'fr1120-wave-help','Dalga tipleri arasındaki fark','Waveform differences',waveHelp.map(v=>[v[0]+': '+v[2],v[1]+': '+v[3]]));
   if(key==='pwm')help(details,'fr1120-effects-help','Efektler ne yapar?','What do the effects do?',[
    ['Vibrato (FM): perdenin hafifçe yükselip alçalması.','Vibrato (FM): a gentle rise and fall in pitch.'],
    ['Tremolo (AM): ses seviyesinin yumuşakça dalgalanması; izokronik moddan bağımsızdır.','Tremolo (AM): a gentle change in loudness, independent of isochronic mode.'],
    ['Halka modülasyonu (RM): tınıya metalik yan frekanslar ekler.','Ring modulation (RM): adds metallic side frequencies to the tone.'],
    ['PWM: kare dalganın darbe genişliğini değiştirir. Başka dalgaya geçince kapanır.','PWM: varies the square wave pulse width. Switching waveform turns it off.'],
    ['Efektler başlangıçta kapalıdır. Önce düşük cihaz sesiyle dene; rahatsızlıkta durdur.','Effects start off. Try low device volume first; stop if uncomfortable.']]);
  }
  const octaves=document.createElement('div');octaves.className='fr1120-octaves';for(const [factor,tr,en]of [[.5,'½× oktav','½× octave'],[2,'2× oktav','2× octave']]){const b=document.createElement('button');b.type='button';b.className='btn';b.id=factor===.5?'fr1120-octDown':'fr1120-octUp';b.dataset.frTr=tr;b.dataset.frEn=en;b.onclick=()=>{stopJourney();window.SukunFrequencyHubR1101?.controller?.stopSweep?.();FR.c=frSafeCarrier(FR.c*factor,FR.b);frRetune();syncFreqUI();changed();};octaves.append(b);}details.append(octaves);
  const note=document.createElement('p');note.id='fr1120-level-note';note.className='fr1120-note';details.append(note);host.append(details);localize();
  $('tab-frq')?.addEventListener('click',()=>{setTimeout(sync,0)},{passive:true});
  $('tab-frq')?.addEventListener('input',()=>{setTimeout(sync,0)},{passive:true});$('masterVol')?.addEventListener('input',sync,{passive:true});
 }
 window.SukunFrequencyR1120=Object.freeze({version:'r1120',capture,validate,apply,applyBinauralPreset,held,sync,mount});
 window.addEventListener('sukun:languagechange',localize);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
