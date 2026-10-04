/* One presentation for the existing single/99/28 engines. No timer advances a count. */
(()=>{'use strict';
const $=id=>document.getElementById(id),safe=(f,d=null)=>{try{return f()}catch{return d}},text=(n,v)=>{if(window.I18N?.writeText)return window.I18N.writeText(n,v);if(n&&n.textContent!==String(v))n.textContent=String(v)},attr=(n,k,v)=>{if(window.I18N?.writeAttr&&['title','aria-label','placeholder'].includes(k))return window.I18N.writeAttr(n,k,v);if(n&&n.getAttribute(k)!==String(v))n.setAttribute(k,String(v))};
// r929: idle UI refreshes must not rewrite attributes under an active pointer.
const prop=(n,k,v)=>{if(n&&n[k]!==v)n[k]=v},value=(n,v)=>{if(n&&document.activeElement!==n)prop(n,'value',String(v))};
let root,dialog,raf=0,focusTimer=0,sourceMode='',atlasMode='',atlasIndex=0,lastSnapshot=null,completionKey='',renders=0,focusOrigin=null,focusGeneration=0;
let wheelNavEnabled=safe(()=>localStorage.getItem('sukun.wheel.navigation')!=='0',true);
let focusEnabled=safe(()=>localStorage.getItem('sukun.r920.focus')==='1',false);
const completed=safe(()=>JSON.parse(localStorage.getItem('sukun.r920.completed')||'{}'),{})||{};
const allowed=()=>!!window.SukunSecretPolicy?.unlocked?.();
const items=mode=>safe(()=>ZIKIR[mode]?.items||[],[]);
const scenes=()=>window.SukunR853Scene?.nameScenes||[];
const itemName=(mode,i)=>mode==='berhet'?scenes()[i]?.name||items(mode)[i]?.tr||items(mode)[i]?.t||'':items(mode)[i]?.t||items(mode)[i]?.tr||'';
const snap=()=>window.SukunSessionState?.snapshot?.();
// r978: presentation consumes the event-updated model. Commands still take a
// fresh snapshot; passive paints do not collect it repeatedly after DOM writes.
const view=()=>window.SukunSessionState?.peek?.()||snap();
function command(action,options){const result=window.SukunSessionState?.command?.(action,options);Promise.resolve(result).then(queue,queue);return result}
// r986: a section is reachable only when every enclosing disclosure is open.
// Reuse the three native buttons and the native total; neither has a new data owner.
const sectionIds=new Set(['zmgOkumalar','zmgSeyirler','zmgAraclar']);
function showExtras(open){
 document.body.classList.toggle('r920-details-open',open);
 if(open&&$('r616ZikirTools'))$('r616ZikirTools').open=true;
 attr($('r920More'),'aria-expanded',open);
 text($('r920More'),open?'Ek araçları kapat':'Zikir ayarları, kayıtlar ve diğer araçlar');
}
function openSection(id){
 const target=$(id),tab=$('tab-zkr');
 if(!sectionIds.has(id)||!target||!tab||!root||root.hidden||tab.hidden||document.body.classList.contains('sukun-tefekkur-mode'))return false;
 window.SukunSeyirYerlesim?.repair?.();
 // Honor intentionally hidden content; opening a disclosure is not an unlock.
 const chain=[];for(let node=target;node&&node!==tab;node=node.parentElement){if(node.hidden)return false;chain.push(node)}
 if(!chain.length||!tab.contains(target))return false;
 showExtras(true);wake();
 for(const node of chain.reverse())if(node.tagName==='DETAILS')node.open=true;
 const nav=$('r986Sections');if(nav)for(const button of nav.querySelectorAll('button')){const current=button.getAttribute('aria-controls')===id;button.classList.toggle('active',current);attr(button,'aria-expanded',$(button.getAttribute('aria-controls'))?.open===true)}
 requestAnimationFrame(()=>{
  if(!target.isConnected||tab.hidden||root.hidden||!document.body.classList.contains('r920-details-open')||document.body.classList.contains('sukun-tefekkur-mode'))return;
  target.scrollIntoView({behavior:'auto',block:'start'});
  target.querySelector(':scope > summary')?.focus?.({preventScroll:true});
 });
 return true;
}
function mountSectionAccess(){
 if(!root||root.hidden)return;
 window.SukunSeyirYerlesim?.repair?.();
 const nav=document.querySelector('.sukun-bottom-nav'),hero=$('r938Hero');
 if(nav){
  nav.id='r986Sections';attr(nav,'aria-label','Zikir alt bölümleri');
  for(const [i,button] of [...nav.querySelectorAll('button')].entries()){const id=[...sectionIds][i];if(id){attr(button,'aria-controls',id);attr(button,'aria-expanded',$(id)?.open===true)}}
  if(nav.parentElement!==root){if(hero)hero.after(nav);else root.append(nav)}
 }
 const total=$('totalCnt'),line=total?.closest('.statLine');
 if(line){
  line.id='r986Total';attr(line,'role','group');attr(line,'aria-label','Bu cihazda toplam zikir');
  if(!$('r986TotalLabel')){const caption=document.createElement('span');caption.id='r986TotalLabel';caption.textContent='Toplam zikir';line.replaceChildren(caption,total)}
  const parent=hero||root;if(line.parentElement!==parent)parent.append(line);
 }
}
function persist(){safe(()=>localStorage.setItem('sukun.r920.completed',JSON.stringify(completed)))}
function markComplete(mode,i){if(!['esma','berhet'].includes(mode)||i<0||i>=items(mode).length)return;const key=mode+':'+i;if(!completed[key]){completed[key]=Date.now();persist();if(dialog?.open)renderAtlas()}}
function make(){
 if(root?.isConnected)return true;const tab=$('tab-zkr');if(!tab||!window.SukunSessionState)return false;
 root=document.createElement('section');root.id='r920Practice';root.setAttribute('aria-label','Zikir ve seyir');
 root.innerHTML=`<div class="r920Modes" role="group" aria-label="Zikir ailesi"><button id="r920ModeEsma" type="button">99 Esmâ</button><button id="r920ModeBerhet" type="button" hidden>28 Berhetiyye</button></div>
 <div class="r920Path"><button id="r920AtlasOpen" type="button">Atlas</button><label id="r920JourneyLabel"><span>Okuyuş</span><select id="r920JourneyMode" aria-label="Tekil zikir veya seyir"><option value="single">Tekil zikir</option><option value="journey">Seyir</option></select></label><button id="r920TefEnter" type="button">Tefekküre geç</button></div>
 <div class="r920Identity"><p id="r920Eyebrow"></p><button id="r920NameInfo" type="button" aria-label="Aktif ismin açıklaması"><span id="r920Arabic" lang="ar" dir="rtl"></span><span id="r920ActiveName"></span></button><p id="r920SceneTitle"></p><p id="r920VoiceSource" role="status"></p></div>
 <div id="r924WheelFrame" data-wheel-state="loading"><div id="r925WheelRotor"><img id="r920Wheel" alt="" aria-hidden="true" decoding="async"><button id="r920Minus" class="r924Gem" type="button" aria-label="Bir azalt"><span class="r925GemLabel">−1</span></button><button id="r920Plus" class="r924Gem" type="button" aria-label="Bir artır"><span class="r925GemLabel">+1</span></button><button id="r920Stop" class="r924Gem" type="button"><span class="r925GemLabel r927GemAction"><span aria-hidden="true" class="r927GemIcon">■</span><span class="r927GemCaption">Bitir</span></span></button><button id="r920Play" class="r924Gem" type="button"><span id="r925PlayLabel" class="r925GemLabel r927GemAction"><span id="r927PlayIcon" class="r927GemIcon" aria-hidden="true">▶</span><span id="r927PlayCaption" class="r927GemCaption">Başlat</span></span></button></div><svg class="r920Progress" viewBox="0 0 300 300" aria-hidden="true"><defs><filter id="r921EsmaMatte" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  10 10 10 0 0"/></filter></defs><circle cx="150" cy="150" r="75" class="r920Track"></circle><circle cx="150" cy="150" r="75" class="r920Arc" pathLength="100"></circle><circle cx="150" cy="150" r="75" class="r959LightCore" pathLength="100"></circle></svg><button id="r920Counter" type="button" aria-label="Bir zikir say"><span class="r920CounterCore"><small>TEKRAR</small><strong id="r920Count">0</strong><span id="r920Percent">%0</span></span></button><button id="r959WheelPrevious" class="r959WheelNav" type="button" aria-label="Önceki zikre geç" title="Önceki zikre geç"><svg class="r925GemLabel r962NavGlyph" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 5v14M18 5L9 12l9 7Z"/></svg></button><button id="r959WheelNext" class="r959WheelNav" type="button" aria-label="Sonraki zikre geç" title="Sonraki zikre geç"><svg class="r925GemLabel r962NavGlyph" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M17 5v14M6 5l9 7-9 7Z"/></svg></button><div id="r920Phase" role="status" aria-live="polite" aria-atomic="true"></div></div>
 <div class="r920Stats"><span><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/></svg>Hedef <b id="r920Target"></b></span><span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12M6 21h12M7 3v4l5 5-5 5v4m10-18v4l-5 5 5 5v4"/></svg>Kalan <b id="r920Remaining"></b></span></div>

 <div class="r920Transport"><button id="r920Previous" type="button">Önceki</button><button id="r920Restart" type="button">Baştan başla</button><button id="r920Next" type="button">Sonraki</button></div>
 <div id="r920RecordingError" role="alert" hidden><p>Kendi kaydın açılamadı. Oturum duraklatıldı.</p><button id="r920RecordingRetry" type="button">Kaydı yeniden dene</button></div>
 <div id="r920SceneError" role="status" hidden><span>Sahne açılamadı.</span><button id="r920SceneRetry" type="button">Yeniden dene</button></div>
 <p id="r968ManualHint" role="status" aria-live="polite"></p><div id="r920Actions"></div>
 <details id="r920JourneySettings" hidden><summary>Seyir tekrarları ve ara</summary><label>Her isim<select id="r920RepeatMode"></select></label><label id="r920RepeatCustomLabel" hidden>Özel tekrar<input id="r920RepeatCustom" type="number" min="1" max="9999" inputmode="numeric"></label><label>Ara<select id="r920RepeatGap"></select></label></details>
 <details id="r920ViewOptions"><summary>İsim, çark ve görünüm</summary><label>İsim<select id="r920NameSelect"></select></label><div id="r924WheelOptions"><label><span id="r924WheelFamily">Esmâ çarkı</span><select id="r920WheelSelect" aria-describedby="r924WheelStatus"></select></label><p id="r924WheelStatus" role="status"></p><button id="r924WheelRetry" type="button" hidden>Çarkı yeniden yükle</button><details id="r924WheelGalleryDetails"><summary>Çarkları görerek seç</summary><div id="r924WheelGallery" role="group" aria-label="Çark seçenekleri"></div></details></div><div id="r920BerhetOptions"><label>Sahne<select id="r920SceneSelect"><option value="auto">İsme göre otomatik</option><option value="palace">Billur Saray</option><option value="seal">Mühr-ü Süleyman</option><option value="wind">Rüzgâr</option><option value="crystal">Billur Geçit</option><option value="night">Gece Sarayı</option><option value="hudhud">Hüdhüd Yolu</option></select></label></div><div id="r923EsmaOptions"><label>Esmâ sahnesi<select id="r923EsmaSceneSelect" aria-describedby="r923SceneStatus"></select></label><div id="r923ScenePreview"><img id="r923SceneThumb" alt="Seçilen sahnenin önizlemesi" loading="lazy" decoding="async"><div><strong id="r923SceneName"></strong><p id="r923SceneStatus" role="status"></p><button id="r923SceneRetry" type="button" hidden>Sahneyi yeniden yükle</button></div></div><details id="r923SceneNotes"><summary>Sahne hakkında ve kaynaklar</summary><p id="r923SceneNote"></p><div id="r923SceneSources"></div></details></div><label>Görsel kalite<select id="r920Performance"><option value="cinematic">Sinematik</option><option value="balanced">Dengeli</option><option value="saving">Tasarruf</option></select></label><label class="r920FocusLabel"><input id="r925WheelMotion" type="checkbox" checked>Çark dönüşü</label><label class="r920FocusLabel"><input id="r962WheelNavToggle" type="checkbox">Çark içi önceki–sonraki düğmeleri</label><button id="r962OfflineScenes" type="button">Çarkları ve arka planları çevrimdışı kaydet</button><p id="r962OfflineStatus" role="status" aria-live="polite"></p><label class="r920FocusLabel"><input id="r920Focus" type="checkbox">Otomatik odak görünümü</label></details>
 <button id="r920More" type="button" aria-expanded="false">Zikir ayarları, kayıtlar ve diğer araçlar</button>
 <button id="r920TefExit" type="button" aria-label="Tefekkürden çık" title="Tefekkürden çık" hidden><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M10 4H5v16h5M9 12h11M16 8l4 4-4 4"/></svg></button>`;
 tab.prepend(root);
 for(const id of ['r959WheelPrevious','r959WheelNext'])$('r925WheelRotor').append($(id));root.addEventListener('focusout',queue,{passive:true});
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
 $('r959WheelPrevious').onclick=()=>{const source=$('r920Previous');if(source&&!source.disabled)source.click()};$('r959WheelNext').onclick=()=>{const source=$('r920Next');if(source&&!source.disabled)source.click()};
 $('r920Previous').onclick=()=>command('previous');$('r920Next').onclick=()=>command('next');$('r920Restart').onclick=()=>{const s=snap();if(s?.activeMode==='berhet'&&s.journeyKind!=='single'&&Number(s.count)>0&&!window.confirm(window.I18N?.t?.('Bu zikrin sayacı sıfırlanacak. Baştan başlamak istiyor musun?')||'Bu zikrin sayacı sıfırlanacak. Baştan başlamak istiyor musun?'))return;command('restart')};$('r920Stop').onclick=()=>command('stop');
 $('r920TefEnter').onclick=()=>{wake();const summary=$('r470SessionSummary');if(summary)summary.hidden=true;window.SUKUN_TEFEKKUR?.enter?.();queue();setTimeout(()=>$('r938PanelToggle')?.focus({preventScroll:true}),100)};
 $('r920TefExit').onclick=()=>{window.SUKUN_TEFEKKUR?.exit?.();wake();queue()};
 $('r920NameInfo').onclick=()=>{safe(()=>$('r611CurrentZikirName')?.click());wake()};
 $('r920More').onclick=()=>showExtras(!document.body.classList.contains('r920-details-open'));
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
 $('r962WheelNavToggle').checked=wheelNavEnabled;
 $('r924WheelFrame').dataset.navigation=wheelNavEnabled?'on':'off';
 $('r962WheelNavToggle').onchange=e=>{wheelNavEnabled=e.target.checked;safe(()=>localStorage.setItem('sukun.wheel.navigation',wheelNavEnabled?'1':'0'));$('r924WheelFrame').dataset.navigation=wheelNavEnabled?'on':'off';for(const id of ['r959WheelPrevious','r959WheelNext'])prop($(id),'hidden',!wheelNavEnabled);queue()};
 $('r962OfflineScenes').onclick=()=>window.SukunOfflineScenes?.download?.();
 for(const id of ['r959WheelPrevious','r959WheelNext'])prop($(id),'hidden',!wheelNavEnabled);
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
 const s=snap(),isJourney=['esma','berhet'].includes(mode)&&(journey??(s?.journeyKind&&s.journeyKind!=='single'));
 const result=await command('select',{mode,index,journeyKind:isJourney?(mode==='berhet'?'28':'99'):'single'});queue();return result;
}
function manual(delta){command('adjust',{delta});wake();queue()}
function writeJourneySetting(suffix,value,event){const s=snap();if(!allowed()||s?.journeyKind==='single')return;const native=$((s.activeMode==='berhet'?'bs':'es99')+suffix);if(!native)return;native.value=value;native.dispatchEvent(new Event(event,{bubbles:true}));window.SukunSessionState.refresh('journey-settings');queue()}
function syncJourneySettings(s){
 const enabled=allowed()&&s.journeyKind!=='single',prefix=s.activeMode==='berhet'?'bs':'es99';prop($('r920JourneySettings'),'hidden',!enabled);if(!enabled)return;
 for(const [suffix,id] of [['Mode','r920RepeatMode'],['Gap','r920RepeatGap']]){const native=$(prefix+suffix),control=$(id);if(!native)continue;const key=prefix+':'+Array.from(native.options,o=>o.value+'='+o.textContent).join('|');if(control.dataset.options!==key){control.replaceChildren(...Array.from(native.options,o=>{const option=document.createElement('option');option.value=o.value;option.textContent=o.textContent;return option}));control.dataset.options=key}value(control,native.value)}
 const native=$(prefix+'Custom'),control=$('r920RepeatCustom');prop($('r920RepeatCustomLabel'),'hidden',$(prefix+'Mode')?.value!=='custom');if(native)value(control,native.value);
}
function wake(){clearTimeout(focusTimer);if(document.body.classList.contains('r920-focus-rest'))document.body.classList.remove('r920-focus-rest');if(focusEnabled&&view()?.phase==='PLAYING')focusTimer=setTimeout(()=>{if(view()?.phase==='PLAYING')document.body.classList.add('r920-focus-rest')},4500)}
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
function render(){raf=0;if(document.hidden)return;if(!make())return;const s=view();if(!s)return;renders++;
 const mode=s.activeMode,valid=items(mode).length>0&&(mode!=='berhet'||allowed()),tef=!!window.SUKUN_TEFEKKUR?.active?.();
 if(document.body.classList.contains('r920-practice-on')!==valid)document.body.classList.toggle('r920-practice-on',valid);if(root.hidden===valid)root.hidden=!valid;if(!valid){window.SukunBerhetLayout?.sync(root,tef);
 mountSectionAccess();if(dialog.open)dialog.close();return}
 attr(root,'data-mode',mode);attr(root,'data-phase',s.phase);const journey=s.journeyKind&&s.journeyKind!=='single';
 prop($('r920ModeBerhet'),'hidden',!allowed());prop($('r920JourneyLabel'),'hidden',!allowed()||!['esma','berhet'].includes(mode));attr($('r920ModeEsma'),'aria-pressed',mode==='esma');attr($('r920ModeBerhet'),'aria-pressed',mode==='berhet');
 value($('r920JourneyMode'),journey?'journey':'single');prop($('r920TefExit'),'hidden',!tef);prop($('r920TefEnter'),'hidden',tef);
 syncJourneySettings(s);
 const i=Number(s.activeIndex)||0,it=items(mode)[i]||{},name=s.activeName||itemName(mode,i),scene=mode==='berhet'?scenes()[i]:null;
 text($('r920Eyebrow'),mode==='berhet'?(journey?'BERHETİYYE SEYRİ':'BERHETİYYE ZİKRİ'):(mode==='esma'?(journey?'99 ESMÂ SEYRİ':'ESMÂÜ’L-HÜSNÂ'):safe(()=>ZIKIR[mode].n||ZIKIR[mode].t,mode==='terkip'?'ESMÂ TERKİBİ':'ZİKİR')));
 text($('r920ActiveName'),mode!=='esma'||/^y[aâ]/i.test(name)?name:'Yâ '+name);text($('r920Arabic'),it.a||it.ar||'');text($('r920SceneTitle'),scene?.title||it.m||'');prop($('r920SceneTitle'),'hidden',!safe(()=>Z.mean,true));
 const source=String(s.audioSource||'').toUpperCase();text($('r920VoiceSource'),({USER_RECORDING:'Kendi sesin',LOCAL_RECORDING:'Yerel kayıt',READER_RECORDING:'Kayıtlı okuyucu',TTS:'Cihaz sesi · TTS',SILENCE:'Ses kapalı',SILENT:'Ses kapalı',NONE:'Ses kapalı'})[source]||'Ses kaynağı hazır olduğunda gösterilir');
 const count=Math.max(0,Number(s.count)||0),target=Math.max(0,Number(s.target)||0),pct=target?Math.min(100,count/target*100):0;
 attr($('r924WheelFrame'),'data-count-digits',String(count).length);attr(root.querySelector('.r920Stats'),'data-digits',String(Math.max(count,target)).length>5?'large':'normal');text($('r920Count'),count);text($('r920Target'),target||'∞');text($('r920Remaining'),target?Math.max(0,target-count):'∞');text($('r920Percent'),target?'%'+Math.floor(pct):'Serbest');
 if($('r924WheelFrame').style.getPropertyValue('--r920-progress')!==String(pct))$('r924WheelFrame').style.setProperty('--r920-progress',pct);attr($('r924WheelFrame'),'data-near',pct>=90?'1':'0');attr($('r920Counter'),'aria-label',`${name}, ${count} / ${target||'serbest'}. ${journey?'Seyir sayacı':'Bir zikir say'}`);
 const visual=window.SukunR918Visual?.snapshot?.()||{};
 window.SukunWheels?.render?.(mode);
 window.SukunWheelMotion?.render?.(s);
 const busy=s.phase==='PLAYING'||s.phase==='PREPARING';text($('r927PlayIcon'),busy?'Ⅱ':'▶');text($('r927PlayCaption'),busy?'Duraklat':s.phase==='PAUSED'?'Devam':'Başlat');
 const actionNames={r920Play:busy?'Zikri duraklat':s.phase==='PAUSED'?'Zikre devam et':'Zikri başlat',r920Stop:'Zikri bitir',r920Minus:'Bir azalt',r920Plus:'Bir artır'};
 for(const [id,label]of Object.entries(actionNames)){attr($(id),'aria-label',label);attr($(id),'title',label)}
 for(const [button,source] of [['r959WheelPrevious','r920Previous'],['r959WheelNext','r920Next']])prop($(button),'disabled',!!$(source)?.disabled);
 const labels={PREPARING:'Ses hazırlanıyor',PAUSED:'Duraklatıldı',COMPLETING:'Tamamlanıyor',COMPLETED:'Seyir tamamlandı',INTERRUPTED:'Ses kesintisi',RECOVERING:'Ses yeniden hazırlanıyor',ERROR:'Ses açılamadı'};text($('r920Phase'),labels[s.phase]||(s.phase==='PLAYING'?'Zikir sürüyor':''));
 for(const [id,delta]of [['r920Plus',1],['r920Minus',-1],['r920Counter',1]]){const gate=window.SukunCountCorrection?.status?.(delta);prop($(id),'disabled',!gate?.allowed);attr($(id),'title',gate?.reason||actionNames[id]||'Bir zikir say');attr($(id),'aria-describedby','r968ManualHint')}
 text($('r968ManualHint'),window.SukunCountCorrection?.status?.(1)?.reason||'');
 window.SukunWheelQuickControls?.render?.();
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
 window.SukunBerhetLayout?.sync(root,tef);
 if(dialog.open)renderAtlas();
}
function queue(){if(!document.hidden&&!raf)raf=requestAnimationFrame(render)}
// Entry/exit is a presentation boundary. Save the ordinary reading position
// once, paint the focus layout immediately and settle only the current entry.
function beginFocus(){if(!focusOrigin)focusOrigin={x:window.scrollX||0,y:window.scrollY||0,tab:$('tab-zkr')?.scrollTop||0}}
function settleFocus(active){
 const generation=++focusGeneration;restorePresentation();
 const origin=focusOrigin;if(!active)focusOrigin=null;
 const settle=()=>{
  if(generation!==focusGeneration||document.hidden||!!window.SUKUN_TEFEKKUR?.active?.()!==active)return;
  const tab=$('tab-zkr');if(tab)tab.scrollTop=active?0:origin?.tab||0;
  window.scrollTo({left:active?0:origin?.x||0,top:active?0:origin?.y||0,behavior:'instant'});
 };
 settle();requestAnimationFrame(settle);
}
// r979: bounded foreground repair can paint synchronously if a suspended
// requestAnimationFrame handle survived restoration. No transport command.
function restorePresentation(){if(document.hidden)return false;if(raf)cancelAnimationFrame(raf);raf=0;render();return !!root?.isConnected&&!root.hidden}
document.addEventListener('visibilitychange',()=>{if(document.hidden){if(raf)cancelAnimationFrame(raf);raf=0;clearTimeout(focusTimer)}else queue()},{passive:true});
['DOMContentLoaded','pageshow','sukun:sessionchange','sukun:scenechange','sukun:performancechange','sukun:tefekkurchange','sukun:secretaccesschange','sukun:voicesource','sukun:recordingerror','sukun:recordingrecovered'].forEach(event=>addEventListener(event,queue,{passive:true}));
addEventListener('sukun:journey-advance',e=>{const mode=e.detail?.owner==='journey28'?'berhet':e.detail?.owner==='journey99'?'esma':null;if(mode)markComplete(mode,Number(e.detail.index)-1);queue()});
document.addEventListener('pointerdown',()=>{if(root&&!root.hidden)wake()},{passive:true});document.addEventListener('keydown',wake,{passive:true});
new MutationObserver(queue).observe(document.body,{attributes:true,attributeFilter:['class']});
// Re-render after the native setting handler; never duplicate the native toggle.
document.addEventListener('click',e=>{if(e.target.closest('#optMean'))queue()},{passive:true});
window.SukunPracticeUI=Object.freeze({version:'r988',refresh:queue,restorePresentation,beginFocus,settleFocus,openSection,select,atlas:()=>{if(root)$('r920AtlasOpen').click()},snapshot:()=>({mode:snap()?.activeMode,renders,focusEnabled,tef:!!window.SUKUN_TEFEKKUR?.active?.(),renderer:'one-session-presentation'})});
queue();
})();

/* r944: bounded, passive responsiveness evidence. No polling, layout reads,
 * synthetic input or playback commands. These slow samples are not an INP score. */
(()=>{'use strict';
 if(window.SukunInteractionDiagnostics)return;
 const limit={interactions:24,frames:16},interactions=[],frames=[],observers=[];
 const supported={eventTiming:false,loaf:false};
 let measuredInteractions=0,measuredFrames=0,ignoredDiagnostics=0;
 const round=value=>Math.max(0,Math.round((Number(value)||0)*10)/10);
 const controls=new Set(('r959WheelPrevious r959WheelNext r920Play r920Stop r920Plus r920Minus r920Counter r920Previous r920Next r920Restart r920TefEnter r920TefExit r920More r920AtlasOpen r920AtlasClose r920AtlasChoose r920NameInfo r920ModeEsma r920ModeBerhet r920JourneyMode r920RepeatMode r920RepeatCustom r920RepeatGap r920NameSelect r920WheelSelect r920SceneSelect r920Performance r920Focus r925WheelMotion r923EsmaSceneSelect r923SceneRetry r932EasyPlay r932EasyStop r932EasyPlus r932EasyMinus r932WheelControls r938PanelToggle r679ZikirAyarBox r920ViewOptions r920JourneySettings optTick optVib optMean optAdv optSpeak arTgl tempoSld r829Tempo csTempo r922VoiceMode r922RecordVoice itemRecBtn spkOnce spkLoop niyetBtn favBtn helpBtn r588Play r588Pause r588Stop r588Prev r588Next r588Reset r588Hide r588Details r633DockGrip').split(' '));
 const sourceFiles=new Set(['index.html','nero.html','interface-r920.js','session-r919.js','dock-r920.js','wheels-r924.js','berhet-layout-r938.js','berhet-theme-r933.js','health-r940.js','health-view-r943.js','esma-scenes-r923.js']);
 const diagnosticSelector='#r455Diag,#prDiagOverlay,#r940Health,#r940HealthDialog';
 const name=node=>{let p=node;for(let i=0;p&&i<6;i++,p=p.parentElement)if(controls.has(p.id))return '#'+p.id;const tag=String(node?.tagName||'').toLowerCase();return ['button','input','select','summary','a','textarea'].includes(tag)?tag:'other'};
 const diagnostic=(entry,target)=>!!(target?.closest?.(diagnosticSelector)||window.SukunDiagnosticWork?.owns?.(entry));
 function source(url){try{const u=new URL(url,location.href);if(u.origin!==location.origin)return '';const file=u.pathname.split('/').pop();return sourceFiles.has(file)?file:''}catch(_){return ''}}
 function scriptEvidence(script){
  const file=source(script.sourceURL);if(!file)return null;
  const fn=String(script.sourceFunctionName||'');
  return{source:file,charOffset:Number.isInteger(script.sourceCharPosition)&&script.sourceCharPosition>=0?script.sourceCharPosition:null,function:/^[A-Za-z_$][\w$]{0,79}$/.test(fn)?fn:'',durationMs:round(script.duration),forcedLayoutMs:round(script.forcedStyleAndLayoutDuration)};
 }
 function keep(list,item,max){list.push(item);if(list.length>max)list.splice(0,list.length-max)}
 function observe(type,options,handle,key){
  try{if(!PerformanceObserver.supportedEntryTypes?.includes(type))return;const observer=new PerformanceObserver(list=>{try{handle(list.getEntries())}catch(_){/* Diagnostics must never interrupt the app. */}});observer.observe({type,buffered:false,...options});observers.push(observer);supported[key]=true}catch(_){}
 }
 observe('event',{durationThreshold:40},entries=>{for(const e of entries){
  if(!e.interactionId||!['click','pointerdown','pointerup','keydown','keyup'].includes(e.name))continue;
  if(diagnostic(e,e.target)){ignoredDiagnostics++;continue;}
  measuredInteractions++;
  keep(interactions,{at:round(e.startTime),kind:e.name,target:name(e.target),durationMs:round(e.duration),inputDelayMs:round(e.processingStart-e.startTime),handlerMs:round(e.processingEnd-e.processingStart),presentationDelayMs:round(e.startTime+e.duration-e.processingEnd)},limit.interactions);
 }},'eventTiming');
 observe('long-animation-frame',{},entries=>{for(const e of entries){
  if(diagnostic(e)){ignoredDiagnostics++;continue;}
  measuredFrames++;
  const scripts=Array.from(e.scripts||[]).map(scriptEvidence).filter(Boolean).sort((a,b)=>b.durationMs-a.durationMs).slice(0,4);
  keep(frames,{at:round(e.startTime),durationMs:round(e.duration),blockingMs:round(e.blockingDuration),scripts},limit.frames);
 }},'loaf');
 window.SukunInteractionDiagnostics=Object.freeze({version:'r944',snapshot:()=>({version:'r944',supported:{...supported},interactions:interactions.map(e=>({...e})),frames:frames.map(e=>({...e,scripts:e.scripts.map(s=>({...s}))})),measuredInteractions,measuredFrames,ignoredDiagnostics,retention:{...limit},timeBase:'navigation-start-ms',eventThresholdMs:40,notINP:true,privacy:'known-control-ids-known-file-names-no-text-no-url-query',scope:'browser-observed-slow-samples'})});
})();
