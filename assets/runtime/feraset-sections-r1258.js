/* Personal Feraset recordings. The approved HTML text is the sole text source.
 * Frozen heading IDs are storage identities; never re-number existing keys. */
(function(w,d){
'use strict';
const HEADINGS=["🔴✨ Feraset, Basiret ve Hikmetle Bakmak İçin Dua ✨🔴", "✨🕯️ Nur, Feraset ve Basiret Kapısı", "📖✨ Furkan Ayetiyle Hak ile Bâtılı Ayırma Niyazı", "📖✨ Kalbin sapmaması", "🧭✨ Hikmet, Ledünnî İlim ve Derin Anlayış Kapısı", "📖✨ Hikmet ve salihlik", "📖🌿 Kehf Sûresi ve Ledünnî İlim Niyazı", "📖✨ Katından rahmet ve doğru yön", "⏳🌙 Zamanın Hakikati ve Bereketi", "🔑✨ Fettâh Kapısı: Açılış, Yol ve İdrak", "📖✨ Gönül açıklığı", "👁️👂 Basîr, Semî‘ ve Alîm Kapısı", "🕯️✨ Nûr ve Hakk Kapısı", "📖✨ Rahmetle Karanlıklardan Nura", "📖✨ Gaflet Perdesinin Kalkması Niyazı", "📖✨ Nur ve bağışlanma", "🌿✨ Latîf İdrak ve Marifet Kapısı", "🎨🌟 Musavvir Kapısı: Fıtratın Güzel Sureti", "💪🛡️ Kudret, İrade ve Muhafaza Kapısı", "⚖️✨ Adalet, Hakemiyet ve Hikmet Kapısı", "🍃💎 Rızık, Beslenme ve Bereket Kapısı", "📚✨ İlim, Gayb ve Marifet Kapısı", "🤲🌿 Kuddûs, Temizlik ve Arınma Kapısı", "🕊️🌧️ Tövbe, Af ve Rahmet Kapısı", "🌌📖 Kâinatı Kitap Gibi Okuma Kapısı", "💎✨ Fazl, Lütuf ve Acziyet Kapısı", "💛🌿 Şükür, Hamd ve Muhabbet Kapısı", "🤲🧭 Tevekkül, Tedbir ve Teslimiyet Kapısı", "🛡️🌙 Muhafaza, Murakabe ve Selâmet Kapısı", "🫀✨ Kendime Bırakılmama Niyazı", "🌑🫀 Habbeyi, Süveydâyı ve Hakikati Bilen Rabbime Niyaz", "🕯️🤲 Son Mahviyet ve Hakikate Layık Kalp Niyazı", "🌟 Esmâlarla Kapanış Niyazı", "🕋✨ Tevhid ve Tesbih Kapanışı", "🤲🌹 Salât, Selâm ve Âmin"];
const PREFIX='dua:feraset:v1:';
function split(text){
 const marks=HEADINGS.map((title,id)=>({title,id,at:text.indexOf(title)}));
 if(marks.some((m,i)=>m.at<0||(i&&m.at<=marks[i-1].at)))throw Error('Prayer headings changed');
 return marks.map((m,i)=>({id:'h'+String(m.id+1).padStart(2,'0'),title:m.title,text:text.slice(m.at,marks[i+1]?.at??text.length)}));
}
const state={has:{},readError:{},active:null,saving:false,playing:false,paused:false,index:0,request:0,attempt:null,message:''};
let parts=[],rows=[],status,playButton,pauseButton,stopButton,progress,source,refreshId=0;
const tr=(a,b)=>w.I18N?.lang==='en'?b:a;
const key=i=>PREFIX+parts[i].id;
function render(){
 w.__ferasetPlaying=state.playing;
 if(!status)return;
 status.textContent=state.message||tr('Hazır','Ready');
 progress.max=parts.length;progress.value=state.playing?state.index:0;
 playButton.disabled=state.active!==null||state.saving||state.playing;
 pauseButton.disabled=!state.playing;
 pauseButton.textContent=state.paused?tr('▶ Sürdür','▶ Resume'):tr('⏸ Duraklat','⏸ Pause');
 stopButton.disabled=!state.playing;
 rows.forEach((r,i)=>{
  const active=state.active===i,busy=state.active!==null||state.saving;
  r.el.classList.toggle('feraset-active',state.playing&&state.index===i);
  r.rec.textContent=active?tr('⏹ Durdur ve kaydet','⏹ Stop and save'):state.has[i]?tr('🎙 Yeniden kaydet','🎙 Record again'):tr('🎙 Kaydet','🎙 Record');
  r.rec.disabled=state.saving||(!active&&state.active!==null);
  r.play.disabled=busy;
  r.del.hidden=!state.has[i];r.del.disabled=busy;
  r.note.textContent=active?tr('Kayıt sürüyor…','Recording…'):state.readError[i]?tr('Kayıt deposu okunamadı.','Recording storage could not be read.'):state.has[i]?tr('Kendi kaydın hazır','Your recording is ready'):tr('Henüz kayıt yok','No recording yet');
  for(const [b,label] of [[r.rec,r.rec.textContent],[r.play,tr('Bu bölümden dinle','Listen from this section')],[r.del,tr('Bu bölümün kaydını sil','Delete this recording')]])b.setAttribute('aria-label',label+' — '+parts[i].title);
 });
}
async function refresh(){
 const id=++refreshId;
 for(let i=0;i<parts.length;i++){
  try{const b=await REC_DB.get(key(i));if(id!==refreshId)return;state.has[i]=!!b;state.readError[i]=false;}catch(_){state.readError[i]=true;}
 }
 render();
}
function stop(message){
 state.request++;state.playing=false;state.paused=false;
 if(state.attempt)state.attempt.cancelled=true;
 state.attempt=null;
 if(typeof SES!=='undefined'&&String(SES.ad||'').startsWith('feraset:'))sesDurdur('feraset-stop');
 state.message=message||tr('Durduruldu','Stopped');render();
}
async function start(i=0){
 if(state.active!==null||state.saving||!parts[i])return false;
 stop();const request=++state.request;
 const current=()=>request===state.request;
 const run=async()=>{
  if(!current())return false;
  try{w.SukunAudioSessionRegistry?.releasePauseGate?.('feraset-start');w.AudioLife?.markUserPlay?.('feraset-start');ac();}catch(_){}
  okuyucularDurdur('feraset');
  state.attempt=duaRecBegin('feraset',()=>stop());
  const attempt=state.attempt,valid=()=>current()&&state.attempt===attempt&&attempt.current();
  valid.rebindUserIntent=(from,to)=>current()&&state.attempt===attempt&&typeof attempt.current.rebindUserIntent==='function'&&attempt.current.rebindUserIntent(from,to);
  state.playing=true;state.index=i;state.message='';render();
  while(valid()&&state.index<parts.length){
   const n=state.index;
   let blob;
   try{blob=await REC_DB.get(key(n),{isCurrent:valid});}catch(_){if(valid())stop(tr('Kayıt deposu okunamadı; mevcut sesler korunuyor.','Storage could not be read; recordings are preserved.'));return false;}
   if(!valid())return false;
   state.has[n]=!!blob;state.readError[n]=false;
   if(!blob){stop(tr((n+1)+'. bölümün kaydı yok. Kaydedip bu bölümden sürdürebilirsin.', 'Section '+(n+1)+' has no recording. Record it, then resume from this section.'));return false;}
   state.message=tr('Bölüm ','Section ')+(n+1)+'/'+parts.length+' · '+parts[n].title;render();
   let ok=false;
   try{ok=await playRecording(blob,'feraset:'+parts[n].id,{recordingKey:key(n),generic:false,isCurrent:valid});}catch(_){}
   if(!valid())return false;
   if(ok!==true){stop(tr('Kayıt çalınamadı veya durduruldu. Aynı bölümden yeniden deneyebilirsin.','Playback stopped or failed. You can retry this section.'));return false;}
   state.index++;
  }
  if(valid()){stop(tr('Dua tamamlandı.','Prayer completed.'));progress.value=parts.length;return true;}
  return false;
 };
 return w.SukunTabOwner?.run?w.SukunTabOwner.run('feraset-reading',run,{isCurrent:current,keepSelection:true,releaseAfter:true}):run();
}
function syncPaused(value){if(state.playing){state.paused=!!value;render();}}
function pause(){
 if(!state.playing)return;
 if(state.paused){miniResume();state.paused=false;}else{miniPause();state.paused=true;}
 render();
}
async function record(i){
 if(state.saving||!parts[i])return false;
 if(state.active===i){state.rec?.stop();return;}
 stop();
 if(!navigator.mediaDevices?.getUserMedia||!w.MediaRecorder){state.message=tr('Bu tarayıcı ses kaydını desteklemiyor.','Recording is unavailable in this browser.');render();return false;}
 if(state.has[i]&&!w.confirm(tr('Bu bölümün mevcut kaydı yeni kayıt başarıyla saklandığında değiştirilsin mi?','Replace this section only after the new recording is saved successfully?')))return false;
 const capture=recCaptureBegin(state,i,'active',render);if(!capture)return;
 const revision=REC_DB.revision?.(key(i));let started=false;
 try{
  const stream=await navigator.mediaDevices.getUserMedia(micKisit());if(!capture.accept(stream))return false;
  const mr=new MediaRecorder(stream),chunks=[];capture.attach(mr);
  capture.cleanup=()=>{if(started)state.saving=true;};
  mr.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
  capture.session=recSessionBegin('Feraset · '+(i+1)+'. bölüm',900,()=>capture.stop(),capture);
  mr.onstop=async()=>{
   state.saving=true;capture.finish();render();
   const blob=new Blob(chunks,{type:mr.mimeType||chunks[0]?.type||'audio/webm'});
   try{
    if(blob.size<800)throw Error('too-short');
    await REC_DB.set(key(i),blob,{expectedRevision:revision});
    state.has[i]=true;state.readError[i]=false;state.message=tr((i+1)+'. bölüm kaydedildi.', 'Section '+(i+1)+' saved.');
   }catch(e){state.message=e.message==='too-short'?tr('Kayıt çok kısa; önceki kayıt korundu.','Recording too short; previous recording preserved.'):tr('Kayıt saklanamadı; önceki kayıt silinmedi.','Could not save; previous recording was not deleted.');}
   finally{state.saving=false;render();}
  };
  await micHazirla(stream);if(!capture.current())return false;mr.start(1000);started=true;render();return true;
 }catch(_){capture.stop();state.saving=false;state.message=tr('Mikrofon açılamadı. Tarayıcı iznini kontrol et.','Could not open the microphone. Check browser permission.');render();return false;}
}
async function remove(i){
 if(state.active!==null||state.saving||!parts[i])return false;
 if(!w.confirm(tr((i+1)+'. bölümün kişisel ses kaydı silinsin mi?','Delete your recording for section '+(i+1)+'?')))return false;
 stop();try{await REC_DB.del(key(i));state.has[i]=false;state.message=tr('Seçili kayıt silindi.','Selected recording deleted.');}catch(_){state.message=tr('Kayıt silinemedi.','Recording could not be deleted.');}render();
}
function button(text,fn){const b=d.createElement('button');b.type='button';b.className='btn';b.textContent=text;b.addEventListener('click',fn);return b;}
function mount(){
 source=d.getElementById('ferasetText');const box=d.getElementById('ferasetBox');if(!source||!box)return;
 try{parts=split(source.textContent);}catch(_){return;}
 const panel=d.createElement('div');panel.id='ferasetSections';
 const controls=d.createElement('div');controls.className='feraset-controls';
 playButton=button(tr('▶ Baştan dinle','▶ Play from start'),()=>start(0));pauseButton=button(tr('⏸ Duraklat','⏸ Pause'),pause);stopButton=button(tr('■ Durdur','■ Stop'),()=>stop());
 controls.append(playButton,pauseButton,stopButton);panel.append(controls);
 const hint=d.createElement('p');hint.className='zYonerge';hint.textContent=tr('Her başlığın altındaki metni kaydet. Bölümler kendi sesinle sırayla çalar; eksik kayıt varsa o bölümde durur. Mevcut diğer kayıtların değişmez.','Record the text under each heading. Sections play in order using your recordings and stop at a missing section. Other recordings are unchanged.');panel.append(hint);
 status=d.createElement('p');status.id='ferasetProgress';status.setAttribute('role','status');status.setAttribute('aria-live','polite');panel.append(status);
 progress=d.createElement('progress');progress.setAttribute('aria-label',tr('Dua ilerlemesi','Prayer progress'));panel.append(progress);
 rows=parts.map((p,i)=>{
  const el=d.createElement('section');el.className='feraset-section';el.dataset.section=p.id;
  const h=d.createElement('h3');h.textContent=(i+1)+'. '+p.title;el.append(h);
  const text=d.createElement('div');text.className='feraset-part-text';text.textContent=p.text.slice(p.title.length).replace(/^\n/,'');el.append(text);
  const actions=d.createElement('div');actions.className='feraset-controls';
  const rec=button(tr('🎙 Kaydet','🎙 Record'),()=>record(i)),play=button(tr('▶ Buradan dinle','▶ Play from here'),()=>start(i)),del=button(tr('Sil','Delete'),()=>remove(i));del.classList.add('danger');actions.append(rec,play,del);el.append(actions);
  const note=d.createElement('small');note.className='feraset-note';el.append(note);panel.append(el);return{el,rec,play,del,note};
 });
 const full=d.createElement('details');full.className='feraset-full-text';
 const summary=d.createElement('summary');summary.textContent=tr('Tam metni kesintisiz göster','Show continuous full text');full.append(summary);
 source.before(full);full.append(source);full.insertAdjacentElement('beforebegin',panel);refresh();
 w.SukunAudioSessionRegistry?.register?.('feraset',{priority:106,title:()=>tr('Feraset ve Basiret Duası','Discernment and Insight Prayer'),getState:()=>state.playing?(state.paused?'paused':'playing'):'idle',play:()=>state.paused?pause():start(state.index<parts.length?state.index:0),resume:()=>{if(state.paused)pause();},pause:()=>{if(!state.paused)pause();},stop:()=>stop(),previous:()=>start(Math.max(0,state.index-1)),next:()=>start(Math.min(parts.length-1,state.index+1))});
 w.addEventListener('sukun:recordingcatalog',refresh);
 w.addEventListener('pagehide',()=>{stop();if(state.active!==null)state.rec?.stop();});
}
w.SukunFerasetSections={split,key,syncPaused,index:()=>state.index,stop,start,pause,record,remove,refresh,snapshot:()=>({playing:state.playing,paused:state.paused,index:state.index,sections:parts.length,recording:state.active,saving:state.saving}),headings:HEADINGS.slice()};
if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})(window,document);
