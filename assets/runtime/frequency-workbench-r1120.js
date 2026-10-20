/* r1120: reachable controls for the single frequency engine. No AudioContext. */
(()=>{'use strict';
 if(window.SukunFrequencyR1120)return;
 const $=id=>document.getElementById(id),T=(tr,en)=>window.I18N?.lang==='en'?en:tr;
 const fields=['c','b','mode','vol','pink','harmonik','harmSeri','uzam','uzamHiz','wave','balL','balR','noise','noiseVol','filterOn','lpf','hpf','levelProfile'];
 const held=()=>!!(window.SukunAudioSessionRegistry?.aggregateSnapshot?.()?.paused||MINI?.paused||(window.AudioLife?.userPaused&&!window.AudioLife?._terminalIntent));
 function capture(){const value={};fields.forEach(k=>value[k]=FR[k]);value.secondary={on:!!FR2.on,c:FR2.c,b:FR2.b};return value;}
 function validate(x){
  if(!x||typeof x!=='object')throw Error('Invalid frequency settings');const v=capture();
  const ranges={c:[20,18000],b:[.5,40],vol:[0,1],harmonik:[0,4],uzamHiz:[6,60],balL:[0,1],balR:[0,1],noiseVol:[0,1],lpf:[200,8000],hpf:[20,2000]};
  for(const [k,[min,max]]of Object.entries(ranges))if(k in x){const n=x[k];if(typeof n!=='number'||!Number.isFinite(n)||n<min||n>max||k==='harmonik'&&!Number.isInteger(n))throw Error('Invalid '+k);v[k]=n;}
  for(const [k,allowed]of Object.entries({mode:['bin','mono','iso','mix'],harmSeri:['dogal','tek','oktav'],wave:['sine','square','sawtooth','triangle'],noise:['off','white','pink','brown'],levelProfile:['legacy','balanced']}))if(k in x){if(!allowed.includes(x[k]))throw Error('Invalid '+k);v[k]=x[k];}
  for(const k of ['pink','uzam','filterOn'])if(k in x){if(typeof x[k]!=='boolean')throw Error('Invalid '+k);v[k]=x[k];}
  if(x.secondary){const n=x.secondary;if(typeof n.on!=='boolean'||!Number.isFinite(n.c)||n.c<20||n.c>18000||!Number.isFinite(n.b)||n.b<.5||n.b>40)throw Error('Invalid secondary');v.secondary={on:n.on,c:n.c,b:n.b};}
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
 function label(tr,en){return T(tr,en);}
 const selectFields={wave:[['sine','Sinüs','Sine'],['triangle','Üçgen','Triangle'],['square','Kare','Square'],['sawtooth','Testere','Sawtooth']],noise:[['off','Kapalı','Off'],['white','Beyaz','White'],['pink','Pembe','Pink'],['brown','Kahverengi','Brown']],levelProfile:[['legacy','Mevcut seviye','Existing level'],['balanced','Daha belirgin (isteğe bağlı)','More present (optional)']]};
 const labels={wave:['Dalga tipi','Waveform'],balL:['Sol kanal','Left channel'],balR:['Sağ kanal','Right channel'],noise:['Ek gürültü','Additional noise'],noiseVol:['Gürültü seviyesi','Noise level'],filterOn:['Frekans filtreleri','Frequency filters'],lpf:['Alçak geçiren','Low-pass'],hpf:['Yüksek geçiren','High-pass'],levelProfile:['Seviye profili','Level profile']};
 function sync(){
  for(const k of Object.keys(labels)){const el=$('fr1120-'+k);if(!el)continue;if(el.type==='checkbox')el.checked=!!FR[k];else if(document.activeElement!==el)el.value=String(FR[k]);const out=$('fr1120-'+k+'-value');if(out)out.textContent=['balL','balR','noiseVol'].includes(k)?Math.round(FR[k]*100)+'%':FR[k]+' Hz';}
  const summary=$('fr1120-level-note');if(summary)summary.textContent=T('Frekans şiddeti ve ana ses birlikte etkilidir. Ana ses: %','Frequency and master volume work together. Master: ')+Math.round(Number($('masterVol')?.value||0)*100)+(window.I18N?.lang==='en'?'%':'')+'. '+T('Yeni profil yalnız seçersen açılır; cihaz sesini düşükten ayarla.','The new profile is opt-in; start with low device volume.');
  document.querySelectorAll('#harmSayi [data-harm]').forEach(b=>b.classList.toggle('on',+b.dataset.harm===FR.harmonik));document.querySelectorAll('#harmSeri [data-seri]').forEach(b=>b.classList.toggle('on',b.dataset.seri===FR.harmSeri));
  $('uzamTgl')?.classList.toggle('on',FR.uzam);if($('uzamHizSld'))$('uzamHizSld').value=FR.uzamHiz;if($('uzamHizVal'))$('uzamHizVal').textContent=FR.uzamHiz+T(' sn',' s');
  if($('frVol'))$('frVol').value=FR.vol;$('pinkTgl')?.classList.toggle('on',FR.pink);document.querySelectorAll('#modeSeg [data-m]').forEach(b=>b.classList.toggle('act',b.dataset.m===FR.mode));
  $('fr2Tgl')?.classList.toggle('on',FR2.on);if($('fr2Car'))$('fr2Car').value=FR2.c;if($('fr2Beat'))$('fr2Beat').value=FR2.b;if($('fr2CarV'))$('fr2CarV').textContent=FR2.c.toFixed(1)+' Hz';if($('fr2BeatV'))$('fr2BeatV').textContent=FR2.b.toFixed(2)+' Hz';
  window.SukunFrequencySetsR1120?.refreshSelection?.();
 }
 function localize(){if($('frequencyLightLabelR1120'))$('frequencyLightLabelR1120').textContent=T('◉ Sabit ışık geri bildirimi — yanıp sönmez','◉ Steady light feedback — no flashing');if($('frequencyLightWarningR1120'))$('frequencyLightWarningR1120').textContent=T('ışık hassasiyeti uyarısı','photosensitivity notice');$('aveTgl')?.setAttribute('aria-label',T('Sabit ışık geri bildirimi','Steady light feedback'));const host=$('frequencyWorkbenchR1120');if(!host)return;host.querySelectorAll('[data-fr-tr]').forEach(e=>e.textContent=T(e.dataset.frTr,e.dataset.frEn));for(const [k,list]of Object.entries(selectFields)){const el=$('fr1120-'+k);if(el)list.forEach((v,i)=>el.options[i].textContent=T(v[1],v[2]));}const summary=$('frequencyAdvancedR1120')?.querySelector('summary');if(summary)summary.textContent=T('Harmonikler ve 3B ses','Harmonics and 3D sound');sync();}
 function mount(){
  const host=$('frequencyWorkbenchR1120');if(!host||host.firstElementChild)return;
  const details=document.createElement('details');details.className='jEd fr1120-workbench';details.open=true;details.setAttribute('data-hep-acik','');const summary=document.createElement('summary');summary.dataset.frTr='Ses araçları';summary.dataset.frEn='Sound tools';details.append(summary);
  for(const [key,names]of Object.entries(labels)){
   const row=document.createElement('div');row.className='fr1120-row';const lab=document.createElement('label');lab.htmlFor='fr1120-'+key;lab.dataset.frTr=names[0];lab.dataset.frEn=names[1];row.append(lab);
   let input;if(selectFields[key]){input=document.createElement('select');for(const option of selectFields[key]){const o=document.createElement('option');o.value=option[0];o.textContent=label(option[1],option[2]);input.append(o);}}
   else {input=document.createElement('input');input.type=key==='filterOn'?'checkbox':'range';const range=key==='lpf'?[200,8000,10]:key==='hpf'?[20,2000,10]:[0,1,.01];if(input.type==='range'){input.min=range[0];input.max=range[1];input.step=range[2];}}
   input.id='fr1120-'+key;row.append(input);if(input.type==='range'){const value=document.createElement('output');value.id=input.id+'-value';value.htmlFor=input.id;row.append(value);}
   input.addEventListener(input.type==='range'?'input':'change',()=>{FR[key]=input.type==='checkbox'?input.checked:input.type==='range'?+input.value:input.value;if(FR.playing){if(key==='levelProfile')frApplyGains(.7);else frRebuild();}changed();});details.append(row);
  }
  const octaves=document.createElement('div');octaves.className='fr1120-octaves';for(const [factor,tr,en]of [[.5,'½× oktav','½× octave'],[2,'2× oktav','2× octave']]){const b=document.createElement('button');b.type='button';b.className='btn';b.id=factor===.5?'fr1120-octDown':'fr1120-octUp';b.dataset.frTr=tr;b.dataset.frEn=en;b.onclick=()=>{stopJourney();window.SukunFrequencyHubR1101?.controller?.stopSweep?.();FR.c=frSafeCarrier(FR.c*factor,FR.b);frRetune();syncFreqUI();changed();};octaves.append(b);}details.append(octaves);
  const note=document.createElement('p');note.id='fr1120-level-note';note.className='fr1120-note';details.append(note);host.append(details);localize();
  $('tab-frq')?.addEventListener('input',()=>{setTimeout(sync,0)},{passive:true});$('masterVol')?.addEventListener('input',sync,{passive:true});
 }
 window.SukunFrequencyR1120=Object.freeze({version:'r1120',capture,validate,apply,held,sync,mount});
 window.addEventListener('sukun:languagechange',localize);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
