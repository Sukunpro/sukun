/* One presentation for the existing single/99/28 engines. No timer advances a count. */
(()=>{'use strict';
const $=id=>document.getElementById(id),safe=(f,d=null)=>{try{return f()}catch{return d}},text=(n,v)=>{if(n&&n.textContent!==String(v))n.textContent=String(v)},attr=(n,k,v)=>{if(n&&n.getAttribute(k)!==String(v))n.setAttribute(k,String(v))};
// r929: idle UI refreshes must not rewrite attributes under an active pointer.
const prop=(n,k,v)=>{if(n&&n[k]!==v)n[k]=v},value=(n,v)=>{if(n&&document.activeElement!==n)prop(n,'value',String(v))};
let root,dialog,raf=0,focusTimer=0,sourceMode='',atlasMode='',atlasIndex=0,lastSnapshot=null,completionKey='',renders=0;
let focusEnabled=safe(()=>localStorage.getItem('sukun.r920.focus')==='1',false);
const completed=safe(()=>JSON.parse(localStorage.getItem('sukun.r920.completed')||'{}'),{})||{};
const allowed=()=>!!window.SukunSecretPolicy?.unlocked?.();
const items=mode=>safe(()=>ZIKIR[mode]?.items||[],[]);
const scenes=()=>window.SukunR853Scene?.nameScenes||[];
const itemName=(mode,i)=>mode==='berhet'?scenes()[i]?.name||items(mode)[i]?.tr||items(mode)[i]?.t||'':items(mode)[i]?.t||'';
const snap=()=>window.SukunSessionState?.snapshot?.();
function command(action,options){const result=window.SukunSessionState?.command?.(action,options);Promise.resolve(result).then(queue,queue);return result}
function persist(){safe(()=>localStorage.setItem('sukun.r920.completed',JSON.stringify(completed)))}
function markComplete(mode,i){if(!['esma','berhet'].includes(mode)||i<0||i>=items(mode).length)return;const key=mode+':'+i;if(!completed[key]){completed[key]=Date.now();persist();if(dialog?.open)renderAtlas()}}
function make(){
 if(root?.isConnected)return true;const tab=$('tab-zkr');if(!tab||!window.SukunSessionState)return false;
 root=document.createElement('section');root.id='r920Practice';root.setAttribute('aria-label','Zikir ve seyir');
 root.innerHTML=`<div class="r920Modes" role="group" aria-label="Zikir ailesi"><button id="r920ModeEsma" type="button">99 Esmâ</button><button id="r920ModeBerhet" type="button" hidden>28 Berhetiyye</button></div>
 <div class="r920Path"><button id="r920AtlasOpen" type="button">Atlas</button><label id="r920JourneyLabel"><span>Okuyuş</span><select id="r920JourneyMode" aria-label="Tekil zikir veya seyir"><option value="single">Tekil zikir</option><option value="journey">Seyir</option></select></label><button id="r920TefEnter" type="button">Tefekkür</button></div>
 <button id="r920TefExit" type="button" hidden>Tefekkürden Çık</button>
 <div class="r920Identity"><p id="r920Eyebrow"></p><button id="r920NameInfo" type="button" aria-label="Aktif ismin açıklaması"><span id="r920Arabic" lang="ar" dir="rtl"></span><span id="r920ActiveName"></span></button><p id="r920SceneTitle"></p><p id="r920VoiceSource" role="status"></p></div>
 <div id="r924WheelFrame" data-wheel-state="loading"><div id="r925WheelRotor"><img id="r920Wheel" alt="" aria-hidden="true" decoding="async"><button id="r920Minus" class="r924Gem" type="button" aria-label="Bir azalt"><span class="r925GemLabel">−1</span></button><button id="r920Plus" class="r924Gem" type="button" aria-label="Bir artır"><span class="r925GemLabel">+1</span></button><button id="r920Stop" class="r924Gem" type="button"><span class="r925GemLabel r927GemAction"><span aria-hidden="true" class="r927GemIcon">■</span><span class="r927GemCaption">Bitir</span></span></button><button id="r920Play" class="r924Gem" type="button"><span id="r925PlayLabel" class="r925GemLabel r927GemAction"><span id="r927PlayIcon" class="r927GemIcon" aria-hidden="true">▶</span><span id="r927PlayCaption" class="r927GemCaption">Başlat</span></span></button></div><svg class="r920Progress" viewBox="0 0 300 300" aria-hidden="true"><defs><filter id="r921EsmaMatte" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  10 10 10 0 0"/></filter></defs><circle cx="150" cy="150" r="81" class="r920Track"></circle><circle cx="150" cy="150" r="81" class="r920Arc" pathLength="100"></circle></svg><button id="r920Counter" type="button" aria-label="Bir zikir say"><span class="r920CounterCore"><small>TEKRAR</small><strong id="r920Count">0</strong><span id="r920Percent">%0</span></span></button></div>
 <div class="r920Stats"><span><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/></svg>Hedef <b id="r920Target"></b></span><span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12M6 21h12M7 3v4l5 5-5 5v4m10-18v4l-5 5 5 5v4"/></svg>Kalan <b id="r920Remaining"></b></span></div>
 <div id="r920Phase" role="status"></div>
 <div class="r920Transport"><button id="r920Previous" type="button">Önceki</button><button id="r920Restart" type="button">Baştan</button><button id="r920Next" type="button">Sonraki</button></div>
 <div id="r920RecordingError" role="alert" hidden><p>Kendi kaydın açılamadı. Oturum duraklatıldı.</p><button id="r920RecordingRetry" type="button">Kaydı yeniden dene</button></div>
 <div id="r920SceneError" role="status" hidden><span>Sahne açılamadı.</span><button id="r920SceneRetry" type="button">Yeniden dene</button></div>
 <div id="r920Actions"></div>
 <details id="r920JourneySettings" hidden><summary>Seyir tekrarları ve ara</summary><label>Her isim<select id="r920RepeatMode"></select></label><label id="r920RepeatCustomLabel" hidden>Özel tekrar<input id="r920RepeatCustom" type="number" min="1" max="9999" inputmode="numeric"></label><label>Ara<select id="r920RepeatGap"></select></label></details>
 <details id="r920ViewOptions"><summary>İsim, çark ve görünüm</summary><label>İsim<select id="r920NameSelect"></select></label><div id="r924WheelOptions"><label><span id="r924WheelFamily">Esmâ çarkı</span><select id="r920WheelSelect" aria-describedby="r924WheelStatus"></select></label><p id="r924WheelStatus" role="status"></p><button id="r924WheelRetry" type="button" hidden>Çarkı yeniden yükle</button><details id="r924WheelGalleryDetails"><summary>Çarkları görerek seç</summary><div id="r924WheelGallery" role="group" aria-label="Çark seçenekleri"></div></details></div><div id="r920BerhetOptions"><label>Sahne<select id="r920SceneSelect"><option value="auto">İsme göre otomatik</option><option value="palace">Billur Saray</option><option value="seal">Mühr-ü Süleyman</option><option value="wind">Rüzgâr</option><option value="crystal">Billur Geçit</option><option value="night">Gece Sarayı</option><option value="hudhud">Hüdhüd Yolu</option></select></label></div><div id="r923EsmaOptions"><label>Esmâ sahnesi<select id="r923EsmaSceneSelect" aria-describedby="r923SceneStatus"></select></label><div id="r923ScenePreview"><img id="r923SceneThumb" alt="Seçilen sahnenin önizlemesi" loading="lazy" decoding="async"><div><strong id="r923SceneName"></strong><p id="r923SceneStatus" role="status"></p><button id="r923SceneRetry" type="button" hidden>Sahneyi yeniden yükle</button></div></div><details id="r923SceneNotes"><summary>Sahne hakkında ve kaynaklar</summary><p id="r923SceneNote"></p><div id="r923SceneSources"></div></details></div><label>Görsel kalite<select id="r920Performance"><option value="cinematic">Sinematik</option><option value="balanced">Dengeli</option><option value="saving">Tasarruf</option></select></label><label class="r920FocusLabel"><input id="r925WheelMotion" type="checkbox" checked>Çark dönüşü</label><label class="r920FocusLabel"><input id="r920Focus" type="checkbox">Otomatik odak görünümü</label></details>
 <button id="r920More" type="button" aria-expanded="false">Zikir ayarları, kayıtlar ve diğer araçlar</button>`;
 tab.prepend(root);root.addEventListener('focusout',queue,{passive:true});
 dialog=document.createElement('dialog');dialog.id='r920Atlas';dialog.setAttribute('aria-labelledby','r920AtlasTitle');
 dialog.innerHTML='<div class="r920AtlasHead"><h2 id="r920AtlasTitle">Atlas</h2><button id="r920AtlasClose" type="button">Kapat</button></div><p id="r920AtlasCaption"></p><div id="r920AtlasNodes" role="group" aria-label="Duraklar"></div><p class="r920AtlasLegend">✓ Tamamlandı · ● Aktif · Diğer duraklara dokunarak incele</p><article id="r920AtlasDetail"><h3 id="r920AtlasName"></h3><p id="r920AtlasMeaning"></p><dl><div><dt>Ebced</dt><dd id="r920AtlasEbced"></dd></div><div><dt>Seyir durumu</dt><dd id="r920AtlasProgress"></dd></div></dl><p id="r920AtlasScene"></p><small id="r920AtlasNote"></small><button id="r920AtlasChoose" type="button">Bu isme geç</button></article>';
 document.body.append(dialog);
 $('r920ModeEsma').onclick=()=>select('esma');$('r920ModeBerhet').onclick=()=>select('berhet');
 $('r920JourneyMode').onchange=e=>select(snap()?.activeMode||'esma',undefined,e.target.value==='journey');
 $('r920RepeatMode').onchange=e=>writeJourneySetting('Mode',e.target.value,'change');
 $('r920RepeatCustom').oninput=e=>writeJourneySetting('Custom',e.target.value,'input');
 $('r920RepeatGap').onchange=e=>writeJourneySetting('Gap',e.target.value,'change');
 $('r920NameSelect').onchange=e=>select(snap()?.activeMode||'esma',Number(e.target.value));
 $('r920Counter').onclick=()=>manual(1);$('r920Plus').onclick=()=>manual(1);$('r920Minus').onclick=()=>manual(-1);
 $('r920Play').onclick=()=>{wake();const s=snap();command(s?.phase==='PLAYING'||s?.phase==='PREPARING'?'pause':s?.phase==='PAUSED'?'resume':'start')};
 $('r920Previous').onclick=()=>command('previous');$('r920Next').onclick=()=>command('next');$('r920Restart').onclick=()=>command('restart');$('r920Stop').onclick=()=>command('stop');
 $('r920TefEnter').onclick=()=>{wake();const summary=$('r470SessionSummary');if(summary)summary.hidden=true;window.SUKUN_TEFEKKUR?.enter?.();queue();setTimeout(()=>$('r920TefExit')?.focus({preventScroll:true}),100)};
 $('r920TefExit').onclick=()=>{window.SUKUN_TEFEKKUR?.exit?.();wake();queue()};
 $('r920NameInfo').onclick=()=>{safe(()=>$('r611CurrentZikirName')?.click());wake()};
 $('r920More').onclick=()=>{const open=document.body.classList.toggle('r920-details-open');attr($('r920More'),'aria-expanded',open);text($('r920More'),open?'Ek araçları kapat':'Zikir ayarları, kayıtlar ve diğer araçlar')};
 window.SukunWheels?.connect?.(root);
 window.SukunWheelMotion?.connect?.(root);
 $('r920WheelSelect').onchange=e=>{window.SukunWheels?.choose?.(snap()?.activeMode||'esma',e.target.value);queue()};
 $('r920SceneSelect').onchange=e=>{window.SukunR918Visual?.setScene(e.target.value);queue()};
 const esmaSelect=$('r923EsmaSceneSelect');let group;
 const autoOption=document.createElement('option');autoOption.value='auto';autoOption.textContent=window.SukunEsmaScenePolicy.autoOption.title;esmaSelect.append(autoOption);
 for(const scene of window.SukunSceneEngine.esmaScenes){if(group?.label!==scene.group){group=document.createElement('optgroup');group.label=scene.group;esmaSelect.append(group)}const option=document.createElement('option');option.value=scene.id;option.textContent=scene.title;group.append(option)}
 esmaSelect.onchange=e=>{window.SukunSceneEngine.setEsmaScene(e.target.value);queue()};
 $('r923SceneRetry').onclick=()=>{window.SukunSceneEngine.retry();queue()};
 $('r923SceneThumb').onerror=e=>{e.currentTarget.style.visibility='hidden'};
 $('r923SceneThumb').onload=e=>{e.currentTarget.style.visibility='visible'};
 $('r920SceneRetry').onclick=()=>{window.SukunSceneEngine?.retry?.();queue()};
 $('r920Performance').onchange=e=>{window.SukunSceneEngine?.setProfile?.(e.target.value);queue()};
 $('r920Focus').checked=focusEnabled;$('r920Focus').onchange=e=>{focusEnabled=e.target.checked;safe(()=>localStorage.setItem('sukun.r920.focus',focusEnabled?'1':'0'));wake()};
 $('r920RecordingRetry').onclick=()=>{window.SukunRecordingFailure?.retry?.();queue()};
 $('r920AtlasOpen').onclick=()=>{const s=snap();atlasMode=s?.activeMode||'esma';atlasIndex=Number(s?.activeIndex)||0;renderAtlas();dialog.showModal();wake()};
 $('r920AtlasClose').onclick=()=>dialog.close();dialog.addEventListener('close',()=>{$('r920AtlasOpen')?.focus({preventScroll:true})});
 $('r920AtlasNodes').onclick=e=>{const b=e.target.closest('[data-index]');if(b){atlasIndex=Number(b.dataset.index);renderAtlas()}};
 $('r920AtlasChoose').onclick=()=>{select(atlasMode,atlasIndex);dialog.close()};
 // Move existing action controls with their listeners intact; do not duplicate their handlers.
 const bar=$('zBar');if(bar)$('r920Actions').append(bar);
 const settings=$('r679ZikirAyarBox');if(settings)$('r920More').before(settings);
 window.SukunSessionState.subscribe(queue);
 return true;
}
async function select(mode,index,journey){
 if(mode==='berhet'&&!allowed())return false;wake();
 const s=snap(),isJourney=journey??(s?.journeyKind&&s.journeyKind!=='single');
 const result=await command('select',{mode,index,journeyKind:isJourney?(mode==='berhet'?'28':'99'):'single'});queue();return result;
}
function manual(delta){const s=snap();if(!s||s.journeyKind!=='single'||s.phase==='PLAYING'||s.phase==='PREPARING')return;safe(()=>$(delta<0?'undoBtn':'plusBtn')?.click());window.SukunSessionState.refresh('manual');wake();queue()}
function writeJourneySetting(suffix,value,event){const s=snap();if(!allowed()||s?.journeyKind==='single')return;const native=$((s.activeMode==='berhet'?'bs':'es99')+suffix);if(!native)return;native.value=value;native.dispatchEvent(new Event(event,{bubbles:true}));window.SukunSessionState.refresh('journey-settings');queue()}
function syncJourneySettings(s){
 const enabled=allowed()&&s.journeyKind!=='single',prefix=s.activeMode==='berhet'?'bs':'es99';prop($('r920JourneySettings'),'hidden',!enabled);if(!enabled)return;
 for(const [suffix,id] of [['Mode','r920RepeatMode'],['Gap','r920RepeatGap']]){const native=$(prefix+suffix),control=$(id);if(!native)continue;const key=prefix+':'+Array.from(native.options,o=>o.value+'='+o.textContent).join('|');if(control.dataset.options!==key){control.replaceChildren(...Array.from(native.options,o=>{const option=document.createElement('option');option.value=o.value;option.textContent=o.textContent;return option}));control.dataset.options=key}value(control,native.value)}
 const native=$(prefix+'Custom'),control=$('r920RepeatCustom');prop($('r920RepeatCustomLabel'),'hidden',$(prefix+'Mode')?.value!=='custom');if(native)value(control,native.value);
}
function wake(){clearTimeout(focusTimer);if(document.body.classList.contains('r920-focus-rest'))document.body.classList.remove('r920-focus-rest');const s=snap();if(focusEnabled&&s?.phase==='PLAYING')focusTimer=setTimeout(()=>{if(snap()?.phase==='PLAYING')document.body.classList.add('r920-focus-rest')},4500)}
function renderAtlas(){
 if(!dialog)return;if(atlasMode==='berhet'&&!allowed()){if(dialog.open)dialog.close();return}
 const list=items(atlasMode),s=snap();text($('r920AtlasTitle'),atlasMode==='berhet'?'Berhetiyye Atlası':'Esmâ Atlası');text($('r920AtlasCaption'),`${list.length} durak · Bu cihazda gözlenen tamamlanmalar`);
 const nodes=$('r920AtlasNodes');if(nodes.dataset.mode!==atlasMode){nodes.replaceChildren();list.forEach((it,i)=>{const b=document.createElement('button');b.type='button';b.dataset.index=i;b.textContent=i+1;nodes.append(b)});nodes.dataset.mode=atlasMode}
 for(const b of nodes.children){const i=Number(b.dataset.index),done=!!completed[atlasMode+':'+i],active=s?.activeMode===atlasMode&&s?.activeIndex===i;attr(b,'aria-pressed',i===atlasIndex);attr(b,'data-complete',done?'1':'0');attr(b,'data-active',active?'1':'0');attr(b,'aria-label',`${i+1}. ${itemName(atlasMode,i)}${done?', tamamlandı':''}${active?', aktif':''}`)}
 const item=list[atlasIndex]||{},scene=atlasMode==='berhet'?scenes()[atlasIndex]:null;
 text($('r920AtlasName'),`${atlasIndex+1}. ${itemName(atlasMode,atlasIndex)}`);text($('r920AtlasMeaning'),item.m||item.mean||item.serh||item.meaning||item.anlam||'Ayrıntılar isim kartında.');
 const eb=safe(()=>typeof zEbcedDegeri==='function'?zEbcedDegeri(item):null);
 text($('r920AtlasEbced'),item.ebced||item.eb||eb||'İsim kartında');
 const active=s?.activeMode===atlasMode&&s?.activeIndex===atlasIndex,rate=active&&s.target?Math.min(100,Math.floor(100*s.count/s.target)):null;
 text($('r920AtlasProgress'),active?`Aktif · ${s.count} / ${s.target||'∞'}${rate!==null?' · %'+rate:''}`:completed[atlasMode+':'+atlasIndex]?'Tamamlandı':'Henüz tamamlanmadı');
 const esma=window.SukunSceneEngine?.esmaSceneFor?.(atlasIndex);text($('r920AtlasScene'),scene?`Sahne: ${scene.title}`:'Sahne: '+(esma?.title||'Klasik Mevlevî'));text($('r920AtlasNote'),scene?[scene.layer,scene.note].filter(Boolean).join(' · '):esma?.note||'');
}
function render(){raf=0;if(!make())return;const s=snap();if(!s)return;renders++;
 const mode=s.activeMode,valid=mode==='esma'||mode==='berhet'&&allowed(),tef=!!window.SUKUN_TEFEKKUR?.active?.();
 if(document.body.classList.contains('r920-practice-on')!==valid)document.body.classList.toggle('r920-practice-on',valid);if(root.hidden===valid)root.hidden=!valid;if(!valid){if(dialog.open)dialog.close();return}
 attr(root,'data-mode',mode);attr(root,'data-phase',s.phase);const journey=s.journeyKind&&s.journeyKind!=='single';
 prop($('r920ModeBerhet'),'hidden',!allowed());prop($('r920JourneyLabel'),'hidden',!allowed());attr($('r920ModeEsma'),'aria-pressed',mode==='esma');attr($('r920ModeBerhet'),'aria-pressed',mode==='berhet');
 value($('r920JourneyMode'),journey?'journey':'single');prop($('r920TefExit'),'hidden',!tef);prop($('r920TefEnter'),'hidden',tef);
 syncJourneySettings(s);
 const i=Number(s.activeIndex)||0,it=items(mode)[i]||{},name=s.activeName||itemName(mode,i),scene=mode==='berhet'?scenes()[i]:null;
 text($('r920Eyebrow'),mode==='berhet'?(journey?'BERHETİYYE SEYRİ':'BERHETİYYE ZİKRİ'):(journey?'99 ESMÂ SEYRİ':'ESMÂÜ’L-HÜSNÂ'));
 text($('r920ActiveName'),/^y[aâ]/i.test(name)?name:'Yâ '+name);text($('r920Arabic'),it.a||it.ar||'');text($('r920SceneTitle'),scene?.title||it.m||'');prop($('r920SceneTitle'),'hidden',!safe(()=>Z.mean,true));
 const source=String(s.audioSource||'').toUpperCase();text($('r920VoiceSource'),({USER_RECORDING:'Kendi sesin',LOCAL_RECORDING:'Yerel kayıt',READER_RECORDING:'Kayıtlı okuyucu',TTS:'Cihaz sesi · TTS',SILENCE:'Ses kapalı',SILENT:'Ses kapalı',NONE:'Ses kapalı'})[source]||'Ses kaynağı hazır olduğunda gösterilir');
 const count=Math.max(0,Number(s.count)||0),target=Math.max(0,Number(s.target)||0),pct=target?Math.min(100,count/target*100):0;
 text($('r920Count'),count);text($('r920Target'),target||'∞');text($('r920Remaining'),target?Math.max(0,target-count):'∞');text($('r920Percent'),target?'%'+Math.floor(pct):'Serbest');
 if($('r924WheelFrame').style.getPropertyValue('--r920-progress')!==String(pct))$('r924WheelFrame').style.setProperty('--r920-progress',pct);attr($('r924WheelFrame'),'data-near',pct>=90?'1':'0');attr($('r920Counter'),'aria-label',`${name}, ${count} / ${target||'serbest'}. ${journey?'Seyir sayacı':'Bir zikir say'}`);
 const visual=window.SukunR918Visual?.snapshot?.()||{};
 window.SukunWheels?.render?.(mode);
 window.SukunWheelMotion?.render?.(s);
 const busy=s.phase==='PLAYING'||s.phase==='PREPARING';text($('r927PlayIcon'),busy?'Ⅱ':'▶');text($('r927PlayCaption'),busy?'Duraklat':s.phase==='PAUSED'?'Devam':'Başlat');
 const actionNames={r920Play:busy?'Zikri duraklat':s.phase==='PAUSED'?'Zikre devam et':'Zikri başlat',r920Stop:'Zikri bitir',r920Minus:'Bir azalt',r920Plus:'Bir artır'};
 for(const [id,label]of Object.entries(actionNames)){attr($(id),'aria-label',label);attr($(id),'title',label)}
 const labels={PREPARING:'Ses hazırlanıyor',PAUSED:'Duraklatıldı',COMPLETING:'Tamamlanıyor',COMPLETED:'Seyir tamamlandı',INTERRUPTED:'Ses kesintisi · devam edebilirsin',RECOVERING:'Ses yeniden hazırlanıyor',ERROR:'Ses açılamadı'};text($('r920Phase'),labels[s.phase]||'');
 for(const id of ['r920Plus','r920Minus','r920Counter'])prop($(id),'disabled',!!journey||busy);
 prop($('r923EsmaOptions'),'hidden',mode!=='esma');
 if(mode==='esma'&&visual.esmaScene){const scene=visual.esmaScene;
  value($('r923EsmaSceneSelect'),visual.esmaChoice);text($('r923SceneName'),scene.title);
  const canonicalEsma=s.canonical.mode==='esma';
  text($('r923SceneStatus'),!canonicalEsma?'Esmâ zikri seçildiğinde kullanılacak.':visual.sceneLoad==='loading'?'Sahne yükleniyor…':visual.sceneLoad==='error'?'Görsel açılamadı; sakin renk zemini kullanılıyor.':visual.resolvedSceneId==='mevlevi-fallback'?'Bu görsel açılamadı; Klasik Mevlevî gösteriliyor.':visual.fallbackLevel>0?'Hafif sürüm gösteriliyor.':visual.esmaChoice==='auto'?'İsme göre otomatik · '+scene.title:'Zikir ve Tefekkür için seçildi.');
  prop($('r923SceneRetry'),'hidden',!(canonicalEsma&&(visual.sceneLoad==='error'||visual.fallbackLevel>0)));
  const thumb=$('r923SceneThumb');if(thumb.getAttribute('src')!==scene.lite){thumb.style.visibility='visible';thumb.src=scene.lite}
  if($('r923SceneNotes').dataset.scene!==visual.esmaChoice+':'+scene.id){$('r923SceneNotes').dataset.scene=visual.esmaChoice+':'+scene.id;text($('r923SceneNote'),(visual.esmaChoice==='auto'?window.SukunEsmaScenePolicy.autoOption.note+' ':'')+scene.note);$('r923SceneSources').replaceChildren(...scene.sources.map(source=>{const a=document.createElement('a');a.href=source.url;a.textContent=source.title;a.target='_blank';a.rel='noopener noreferrer';return a}))}
 }
 prop($('r920BerhetOptions'),'hidden',mode!=='berhet');value($('r920SceneSelect'),visual.scene||'auto');
 const perf=window.SukunSceneEngine?.snapshot?.().profile||'balanced';value($('r920Performance'),perf);
 prop($('r920SceneError'),'hidden',visual.sceneLoad!=='error');const failure=window.SukunRecordingFailure?.get?.();prop($('r920RecordingError'),'hidden',!failure?.active);
 if(sourceMode!==mode){const sel=$('r920NameSelect');sel.replaceChildren();items(mode).forEach((it,j)=>{const option=document.createElement('option');option.value=j;option.textContent=`${j+1}. ${itemName(mode,j)}`;sel.append(option)});sourceMode=mode} value($('r920NameSelect'),i);
 if(target&&count>=target)markComplete(mode,i);
 if(lastSnapshot?.phase!==s.phase)wake();lastSnapshot=s;
 if(dialog.open)renderAtlas();
}
function queue(){if(!raf)raf=requestAnimationFrame(render)}
['DOMContentLoaded','pageshow','sukun:sessionchange','sukun:scenechange','sukun:performancechange','sukun:tefekkurchange','sukun:secretaccesschange','sukun:voicesource','sukun:recordingerror','sukun:recordingrecovered'].forEach(event=>addEventListener(event,queue,{passive:true}));
addEventListener('sukun:journey-advance',e=>{const mode=e.detail?.owner==='journey28'?'berhet':e.detail?.owner==='journey99'?'esma':null;if(mode)markComplete(mode,Number(e.detail.index)-1);queue()});
document.addEventListener('pointerdown',()=>{if(root&&!root.hidden)wake()},{passive:true});document.addEventListener('keydown',wake,{passive:true});
new MutationObserver(queue).observe(document.body,{attributes:true,attributeFilter:['class']});
// Re-render after the native setting handler; never duplicate the native toggle.
document.addEventListener('click',e=>{if(e.target.closest('#optMean'))queue()},{passive:true});
window.SukunPracticeUI=Object.freeze({version:'r929',refresh:queue,select,atlas:()=>{if(root)$('r920AtlasOpen').click()},snapshot:()=>({mode:snap()?.activeMode,renders,focusEnabled,tef:!!window.SUKUN_TEFEKKUR?.active?.(),renderer:'one-session-presentation'})});
queue();
})();
