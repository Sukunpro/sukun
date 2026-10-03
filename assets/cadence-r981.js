/* r981 — cadence explanation and an explicit, bounded live observation.
 * Reads the current owners and media clock. Never starts, pauses, seeks, counts,
 * records, or changes a preference. Physical audible sound remains unmeasured. */
(() => {
  'use strict';
  if (window.SukunCadenceUI) return;
  const safe = (fn, fallback = null) => { try { return fn() ?? fallback; } catch (_) { return fallback; } };
  const number = x => typeof x === 'number' && Number.isFinite(x) ? x : null;
  const text = (tr, en) => window.I18N?.lang === 'en' ? en : tr;
  const seconds = ms => number(ms) !== null ? (ms / 1000).toLocaleString(window.I18N?.lang === 'en' ? 'en-GB' : 'tr-TR', {maximumFractionDigits:2}) + text(' sn', ' s') : '—';
  const panels = new Map(), mediaIds = new WeakMap();
  let nextMediaId = 0, nextNoteId = 0, updateTimer = 0, active = null, last = null, seq = 0;
  const DURATION = 12000, SAMPLE = 250;
  const mono = () => safe(() => performance.now(), Date.now());
  function session() { return safe(() => window.SukunSessionState?.peek?.(), {}) || {}; }
  function journey(s) { return s.journeyKind === '28' || s.journeyKind === '99'; }
  function expected(s) {
    if (journey(s)) return (s.journeyKind === '28' ? 'berhet:' : 'esma:') + s.activeIndex + (s.journeyKind === '99' ? ':nida' : '');
    return safe(() => typeof zikirKey === 'function' ? zikirKey() : '', '');
  }
  function selectedGap(s) {
    const id = s.journeyKind === '99' ? 'es99Gap' : 'bsGap';
    if (s.journeyKind === '28') {const ms = number(safe(() => window.SukunTempo?.gapMs?.()));if (ms !== null && ms >= 0) return ms;}
    const raw = document.getElementById(id)?.value, value = raw == null || raw === '' ? NaN : Number(raw);
    return Number.isFinite(value) && value >= 0 ? value : null;
  }
  function nativeMedia(s) {
    const key = expected(s); if (!key || s.phase !== 'PLAYING' || s.presentationOnly) return null;
    if (!['USER_RECORDING','LOCAL_RECORDING','READER_RECORDING','RECORDING','OWN_RECORDING'].includes(s.audioSource)) return null;
    if (journey(s)) {
      const j = safe(() => window.__sukJourneyNative);
      if (j?.recordingKey === key && j.a) return j.a;
    } else {
      const a = safe(() => typeof _r476LockAudio !== 'undefined' ? _r476LockAudio : null);
      if (a?.dataset?.sukLockKey === key && a.dataset.sukSilentCarrier !== '1' && !a.paused && !a.ended) return a;
      const items = safe(() => typeof SES !== 'undefined' ? [...SES.ler] : [], []);
      const matches = items.filter(a => a?._sukunRecordingKey === key && a.dataset?.sukSilentCarrier !== '1' && !a.paused && !a.ended);
      if (matches.length === 1) return matches[0];
    }
    return null;
  }
  function snapshot(context = null) {
    const current = session(), contextMatches = !context || current.journeyKind === context;
    const s = context ? {...current,journeyKind:context,presentationOnly:current.presentationOnly || !contextMatches} : current;
    const cadence = safe(() => window.SukunCadence?.snapshot?.(), {}) || {};
    const tempo = safe(() => window.SukunTempo?.snapshot?.().value);
    const requestedMs = number(cadence.requestedMs) ?? (number(tempo) !== null ? tempo * 1000 : null);
    const gapMs = journey(s) ? selectedGap(s) : null;
    const base = {version:'r981',requestedMs,gapMs,effectiveMs:null,recordingMs:null,measurement:'unknown',kind:'unprepared',running:s.phase === 'PLAYING' && contextMatches};
    if (!journey(s) && s.activeMode === 'terkip') return {...base,kind:'terkip'};
    if (s.audioSource === 'TTS' || s.audioSource === 'TTS_AR' || s.audioSource === 'TTS_TR') return {...base,kind:journey(s) ? 'journey-tts' : 'tts'};
    if (journey(s)) {
      const a = nativeMedia(s), rate = Number(a?.playbackRate), duration = Number(a?.duration);
      if (a && !a.paused && !a.ended && a.readyState >= 2 && rate > 0 && Number.isFinite(duration) && duration > 0) {
        const native = safe(() => window.__sukJourneyNative), sourceMatches = native?.playUrl && String(a.currentSrc || a.src || '') === native.playUrl;
        const unit = Number(a.dataset?.sukRepeatUnitSec) || duration;
        const includedGapMs = number(native?.gapIncludedMs);
        // A file without included silence has a separate post-recitation wait.
        // A baked file already includes it. Never double-add that gap.
        if (sourceMatches && includedGapMs !== null && gapMs !== null) return {...base,kind:'journey-recording',effectiveMs:a.loop ? unit / rate * 1000 : Math.max(0,unit / rate * 1000-includedGapMs+gapMs),measurement:a.loop ? 'native-applied' : 'recording-estimate'};
      }
      return {...base,kind:'journey-unmeasured'};
    }
    if (number(cadence.appliedCycleMs) > 0) return {...base,kind:'single-recording',recordingMs:cadence.recordingAvailable ? number(cadence.recordingMs) : null,effectiveMs:cadence.appliedCycleMs,measurement:'native-applied'};
    if (cadence.matchingPrepared && cadence.recordingAvailable && number(cadence.recordingMs) > 0) {
      return {...base,kind:'single-recording',recordingMs:cadence.recordingMs,effectiveMs:number(cadence.appliedCycleMs) > 0 ? cadence.appliedCycleMs : number(cadence.effectiveMs),measurement:number(cadence.appliedCycleMs) > 0 ? 'native-applied' : 'prepared-estimate'};
    }
    if (s.audioSource === 'SILENCE') return {...base,kind:'silent'};
    return base;
  }
  function view(v = snapshot()) {
    const selected = text('Seçili tempo: ', 'Selected tempo: ') + seconds(v.requestedMs);
    let values = selected, reason;
    if (v.kind.startsWith('journey')) {
      values = text('Okuyuş sonrası ara: ', 'Gap after recitation: ') + seconds(v.gapMs);
      values += ' · ' + text(v.measurement === 'native-applied' ? 'Uygulanan kayıt aralığı: ' : 'Kayıtla tekrar hedefi: ', v.measurement === 'native-applied' ? 'Applied recording interval: ' : 'Repeat target with recording: ') + (number(v.effectiveMs) > 0 ? seconds(v.effectiveMs) : text('ölçülmedi', 'not measured'));
      reason = text('Seyirde ara, okuyuş bittikten sonra başlar. Tam tekrar aralığı okuyuş süresi ile bu aranın toplamıdır; tek başına tempo değeri değildir. Cihaz seslendirmesinin süresi önceden bilinmez.', 'In a journey, the gap starts after recitation finishes. A full repeat includes the recitation and this gap; it is not the tempo alone. Device speech duration is not known in advance.');
    } else if (v.kind === 'single-recording' && number(v.effectiveMs) > 0) {
      values += ' · ' + text(v.measurement === 'native-applied' ? 'Uygulanan aralık: ' : 'Kayıtla hedef aralık: ', v.measurement === 'native-applied' ? 'Applied interval: ' : 'Target interval with recording: ') + seconds(v.effectiveMs);
      reason = v.effectiveMs > v.requestedMs + 1 ? text('Okuyuş kesilmesin diye kayıt tamamlanır ve kısa bir boşluk bırakılır. Seçtiğin tempo değiştirilmez; tarayıcı başlatmayı ayrıca geciktirebilir.', 'The recording finishes with a short gap so recitation is not cut off. Your selected tempo is unchanged; the browser may delay starts further.') : text('Kayıt bu tempoya sığıyor. Bu değer hedef tekrar aralığıdır; tarayıcının gecikmesi veya duyulan sesin akıcılığı ayrıca gözlenmelidir.', 'The recording fits this tempo. This is the target repeat interval; browser delay and audible smoothness need separate observation.');
    } else if (v.kind === 'tts') {
      values += ' · ' + text('Gerçek aralık: okuyuşa bağlı', 'Actual interval: depends on recitation');
      reason = text('Cihaz seslendirmesi bitmeden sonraki okuyuş başlatılmaz. Süresi önceden bilinmediğinden kesin saniye gösterilmez. Seçtiğin tempo korunur.', 'The next recitation waits for device speech to finish. Its duration is not known in advance, so no exact interval is shown. Your selected tempo is retained.');
    } else if (v.kind === 'terkip') {
      values += ' · ' + text('Tam tekrar: formüle bağlı', 'Full repeat: depends on formula');
      reason = text('Terkipte bir tekrar, formülün okuyuş adımları tamamlanınca sayılır. Tek bir kayıt süresinden bütün formülün aralığı hesaplanamaz.', 'A formula repeat is counted after its recitation steps finish. One recording duration cannot establish the interval of the whole formula.');
    } else {
      values += ' · ' + text('Kayıt aralığı: henüz ölçülmedi', 'Recording interval: not measured yet');
      reason = text('Seçili isim için hazırlanmış kayıt süresi yok. Saniye tahmini yapılmaz. Bu açıklama ses, sayaç veya ayar başlatmaz.', 'No prepared recording duration is available for the selected Name. No interval is guessed. This explanation does not start audio, counting, or settings.');
    }
    return {values,reason};
  }
  function fillNote(note, context = null) {
    const v = view(snapshot(context)), signature = JSON.stringify(v);
    if (note.dataset.cadenceSignature === signature) return;
    note.dataset.cadenceSignature = signature;
    if (!note.querySelector('[data-cadence-values]')) note.innerHTML = '<p data-cadence-values></p><details><summary data-cadence-help></summary><p data-cadence-reason></p></details>';
    note.querySelector('[data-cadence-values]').textContent = v.values;
    const help = note.querySelector('[data-cadence-help]'); help.textContent = text('Bu aralık ne anlama geliyor?', 'What does this interval mean?');
    help.title = v.reason; note.querySelector('[data-cadence-reason]').textContent = v.reason;
  }
  function mountNotes() {
    if (document.hidden) return;
    for (const control of document.querySelectorAll('#tempoSld,#csTempo,#r829Tempo,[data-r434-tempo],#bsGap,#es99Gap')) {
      const row = control.closest('.sldRow,.csRow,.r434CtlRow,#r829QuickSettings,label') || control.parentElement;
      if (!row || !row.parentElement) continue;
      const inside = row.id === 'r829QuickSettings';
      let note = inside ? row.querySelector(':scope > [data-cadence-note]') : row.nextElementSibling;
      if (!note?.hasAttribute('data-cadence-note')) {
        note = document.createElement('div'); note.className = 'r981-cadence-note'; note.setAttribute('data-cadence-note',''); note.setAttribute('data-i18n-owned','cadence-r981');
        if (inside) row.append(note); else row.insertAdjacentElement('afterend',note);
      }
      if (!note.id) note.id = 'r981-cadence-note-' + (++nextNoteId);
      const described = new Set(String(control.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean));
      if (!described.has(note.id)) {described.add(note.id);control.setAttribute('aria-describedby',[...described].join(' '));}
      fillNote(note,control.id === 'bsGap' ? '28' : control.id === 'es99Gap' ? '99' : null);
    }
  }
  function schedule() {
    if (updateTimer || document.hidden) return;
    updateTimer = setTimeout(() => {updateTimer = 0;mountNotes();renderHealth();}, 180);
  }
  function capture() {
    const s = session(), a = nativeMedia(s);
    let id = 0;
    if (a) {if (!mediaIds.has(a)) mediaIds.set(a,++nextMediaId);id = mediaIds.get(a);}
    const time = Number(a?.currentTime), duration = Number(a?.duration), rate = Number(a?.playbackRate);
    const src = a ? String(a.currentSrc || a.src || '') : '';
    const eligible = !!(a && src && !a.paused && !a.ended && !a.seeking && a.readyState >= 2 && !a.muted && Number(a.volume) > 0 && Number.isFinite(time) && Number.isFinite(duration) && duration > 0 && Number.isFinite(rate) && rate > 0);
    const generation = safe(() => window.SukunZikirTransportGate?.snapshot?.().generation);
    const tabOwner = safe(() => window.SukunTabOwner?.snapshot?.(), {}) || {};
    return {at:mono(),identity:[s.sessionId,s.epoch,s.requestId,s.owner,s.activeMode,s.activeIndex,s.journeyKind,expected(s),generation,tabOwner.owned,tabOwner.epoch].join('|'),count:number(s.countRaw) ?? number(s.count),phase:s.phase||'UNKNOWN',sourceKind:String(s.audioSource||''),mediaId:id,src,mediaEpoch:a?._sukunLockEpoch||0,time:Number.isFinite(time)?time:null,duration:Number.isFinite(duration)?duration:null,rate:rate > 0 ? rate : null,loop:!!a?.loop,eligible};
  }
  function summary(job, reason) {
    const measuredMs = Math.max(0,mono() - job.startedAt), enough = reason === 'complete' && measuredMs >= DURATION && job.samples >= 12;
    let status = 'NOT_MEASURED', message;
    if (reason === 'idle') message = text('Önce zikir ekranında sesli zikri başlat, sonra bu kısa gözlemi çalıştır. Buradan ses veya sayaç başlatılmaz.', 'Start spoken dhikr on the dhikr screen, then run this short observation. Audio and counting are not started here.');
    else if (reason === 'hidden') message = text('Ekran gizlendiği için gözlem durdu. Kilit ekranındaki sesi bu test değerlendirmedi.', 'Observation stopped because the page became hidden. This check did not assess lock-screen audio.');
    else if (reason === 'cancelled' || reason === 'closed') message = text('Gözlem durduruldu. Ses, sayaç ve ayarların değişmedi.', 'Observation was stopped. Audio, counting, and settings were unchanged.');
    else if (reason === 'owner-changed') message = text('Zikir veya ses kaynağı değişti; eski gözlem yeni akışa taşınmadı. Aynı isimde tekrar deneyebilirsin.', 'The dhikr or audio source changed; the previous observation was not applied to the new flow. You can retry on the same Name.');
    else if (reason === 'session-stopped') message = text('Oturum durakladı veya bitti; kısa gözlem tamamlanmadı.', 'The session paused or finished; the short observation was not completed.');
    else if (!enough || job.verifiedPairs === 0 || job.mediaAdvanceMs <= 0) message = text('Ses saatinde yeterli ilerleme ölçülemedi. Cihaz seslendirmesi, sessiz sayım veya bu tarayıcıdaki ses yolu bu gözlemle değerlendirilemez. Duyduğun sesi kendin kontrol et.', 'Not enough audio-clock progress was measured. Device speech, silent counting, or this browser’s audio path cannot be assessed by this observation. Check the sound you hear yourself.');
    else if (job.countAdvance <= 0) message = text('Ses saatinde ilerleme var; tamamlanmış bir sayaç artışı gözlenmedi. Uzun okuyuşta bu normal olabilir. Ses–sayım uyumu bu kısa aralıkta değerlendirilemedi.', 'The audio clock advanced, but no completed counter increase was observed. This can be normal for a long recitation. Audio–count alignment could not be assessed in this short interval.');
    else {
      status = 'OBSERVED';message = text('Ses saatinde ve sayaçta ilerleme gözlendi. Bu, sesin duyulduğunu veya hiç takılma olmadığını doğrulamaz.', 'Progress was observed in the audio clock and counter. This does not verify audible sound or playback without stutters.');
      if (job.maxDelayMs >= 500) {status = 'WARN';message += ' ' + text('Gözlem sırasında uygulamanın yanıtında gecikme de ölçüldü. Bu, sesin takıldığının tek başına kanıtı değildir.', 'An app-response delay was also measured during observation. This alone does not prove audio stuttering.');}
    }
    return {version:'r981',status,reason,at:Date.now(),durationMs:Math.round(measuredMs),samples:job.samples,verifiedMediaPairs:job.verifiedPairs,observedMediaAdvanceMs:Math.round(job.mediaAdvanceMs),observedCountAdvance:job.countAdvance,maxCallbackDelayMs:Math.round(job.maxDelayMs),audibleSound:'NOT_MEASURED',screenLock:'NOT_MEASURED',network:'NOT_USED',message};
  }
  function finish(reason) {
    const job = active; if (!job) return last;
    active = null;clearTimeout(job.timer);job.timer = 0;job.cleanup?.();last = summary(job,reason);renderHealth();
    safe(() => window.dispatchEvent(new CustomEvent('sukun:cadence-observation',{detail:{...last}})));
    return last;
  }
  function presented(result) {
    if (!result) return null;
    const job = {startedAt:mono()-result.durationMs,samples:result.samples,verifiedPairs:result.verifiedMediaPairs,mediaAdvanceMs:result.observedMediaAdvanceMs,countAdvance:result.observedCountAdvance,maxDelayMs:result.maxCallbackDelayMs};
    return {...result,message:summary(job,result.reason).message};
  }
  function sample() {
    const job = active;if (!job) return;
    if (document.hidden) return finish('hidden');
    if (job.panel && (!job.panel.isConnected || job.panel.open === false || job.panel.closest('dialog')?.open === false)) return finish('closed');
    const next = capture(), prev = job.previous;
    if (next.identity !== job.identity || next.sourceKind !== job.previous.sourceKind) return finish('owner-changed');
    if (next.phase !== 'PLAYING') return finish('session-stopped');
    if (prev.mediaId && (next.mediaId !== prev.mediaId || next.src !== prev.src || next.mediaEpoch !== prev.mediaEpoch)) return finish('owner-changed');
    job.samples++;job.maxDelayMs = Math.max(job.maxDelayMs,Math.max(0,next.at-job.dueAt));
    if (prev.eligible && next.eligible && !job.seekObserved && next.rate === prev.rate && next.mediaId === prev.mediaId && next.src === prev.src) {
      let delta = next.time - prev.time;
      // A sampled native wrap is observed only while the same source is playing.
      // Elapsed time bounds feasibility; it never creates an unseen whole loop.
      if (delta < 0 && next.loop && prev.duration > 0) delta += prev.duration;
      if (delta > 0 && delta * 1000 / next.rate <= (next.at - prev.at) + 160) {job.verifiedPairs++;job.mediaAdvanceMs += delta * 1000 / next.rate;}
    }
    if (next.count !== null && prev.count !== null) {
      const delta = next.count - prev.count;
      if (delta < 0) return finish('owner-changed');
      job.countAdvance += delta;
    }
    job.seekObserved = false;job.previous = next;
    if (next.at - job.startedAt >= DURATION) return finish('complete');
    job.dueAt = next.at + SAMPLE;job.timer = setTimeout(sample,SAMPLE);renderHealth();
  }
  function observe(panel = null) {
    if (active) return false;
    const first = capture(), startedAt = mono();
    const job = {id:++seq,panel,startedAt,identity:first.identity,previous:first,samples:0,verifiedPairs:0,mediaAdvanceMs:0,countAdvance:0,maxDelayMs:0,dueAt:startedAt + SAMPLE,timer:0};
    if (document.hidden) {last = summary(job,'hidden');renderHealth();return false;}
    if (first.phase !== 'PLAYING') {last = summary(job,'idle');renderHealth();return false;}
    const media = nativeMedia(session());
    if (media?.addEventListener) {
      const seeking = () => {job.seekObserved = true;};
      media.addEventListener('seeking',seeking,{passive:true});media.addEventListener('ratechange',seeking,{passive:true});
      job.cleanup = () => {media.removeEventListener('seeking',seeking);media.removeEventListener('ratechange',seeking);};
    }
    active = job;last = null;job.timer = setTimeout(sample,SAMPLE);renderHealth();return true;
  }
  function cancel(reason = 'cancelled') { return active ? finish(['cancelled','closed','hidden'].includes(reason) ? reason : 'cancelled') : last; }
  function renderCard(panel, state) {
    const slot = state.slot;if (!slot?.isConnected) return;
    slot.hidden = state.screen !== 'home' && state.screen !== 'tests';
    if (slot.hidden) {if (active?.panel === panel) finish('closed');return;}
    if (!slot.querySelector('[data-cadence-result]')) slot.innerHTML = '<h4 data-cadence-heading></h4><p data-cadence-intro></p><div class="r981-cadence-actions"><button type="button" data-cadence-start></button><button type="button" data-cadence-cancel hidden></button></div><p data-cadence-result role="status" aria-live="polite"></p><p class="hv-caption" data-cadence-limit></p>';
    slot.querySelector('[data-cadence-heading]').textContent = text('12 saniyelik akış gözlemi', '12-second flow observation');
    slot.querySelector('[data-cadence-intro]').textContent = text('Zikrin sürerken ses saati, sayaç ilerlemesi ve uygulamanın yanıtı gözlenir. İnternet gerekmez.', 'Observe the audio clock, counter progress, and app response while dhikr is running. No internet is needed.');
    const start = slot.querySelector('[data-cadence-start]'), stop = slot.querySelector('[data-cadence-cancel]');
    start.textContent = text('Kısa gözlemi başlat', 'Start short observation');start.disabled = !!active;
    start.title = text('Ses, sayaç veya tempo değiştirilmez. Önce zikir ekranından sesli zikri başlat.', 'Audio, counting, and tempo are unchanged. First start spoken dhikr from the dhikr screen.');
    stop.textContent = text('Gözlemi durdur', 'Stop observation');stop.hidden = !active || active.panel !== panel;
    const output = slot.querySelector('[data-cadence-result]');
    output.dataset.status = active ? 'RUNNING' : last?.status || 'NOT_MEASURED';
    const remaining = active ? Math.max(0,Math.ceil((DURATION-(mono()-active.startedAt))/1000)) : 0;
    const outputText = active ? text('Gözleniyor · ', 'Observing · ') + remaining + text(' saniye kaldı', ' seconds left') : presented(last)?.message || text('Henüz gözlem yapılmadı.', 'No observation has run yet.');
    if (output.textContent !== outputText) output.textContent = outputText;
    slot.querySelector('[data-cadence-limit]').textContent = text('Duyulan sesi veya ekran kilidini doğrulamaz. Sonuç, gözlenen bu kısa aralıkla sınırlıdır.', 'Does not verify audible sound or screen lock. Results cover only this short observed interval.');
  }
  function renderHealth() {for (const [panel,state] of panels) {if (!panel.isConnected) {if (active?.panel === panel) finish('closed');panels.delete(panel);continue;}renderCard(panel,state);}}
  function mountHealth(panel, screen = 'home') {
    if (!panel) return false;
    let state = panels.get(panel), slot = panel.querySelector('[data-cadence-health]');
    if (!slot) return false;
    if (!state || state.slot !== slot) {
      state = {slot,screen};panels.set(panel,state);slot.className = 'hv-box r981-cadence-health';slot.setAttribute('data-i18n-owned','cadence-r981');
      slot.addEventListener('click',event => {
        if (event.target.closest?.('[data-cadence-start]')) observe(panel);
        else if (event.target.closest?.('[data-cadence-cancel]')) cancel();
      });
      panel.addEventListener('toggle',()=>{if (!panel.open && active?.panel === panel) cancel('closed');});
      panel.closest('dialog')?.addEventListener('close',()=>{if (active?.panel === panel) cancel('closed');});
    }
    state.screen = screen;renderCard(panel,state);return true;
  }
  function observation() {return active ? {version:'r981',status:'RUNNING',durationMs:Math.round(mono()-active.startedAt),samples:active.samples} : presented(last) || {version:'r981',status:'NOT_MEASURED',reason:'not-run'};}
  window.SukunCadenceUI = Object.freeze({version:'r981',snapshot,view,mountNotes,mountHealth,observe,cancel,observation});
  for (const event of ['sukun:tempochange','sukun:voicesource','sukun:voicesettingschange','sukun:sessionchange','sukun:journey-native-playing','sukun:journey-native-source','sukun:r616viewchange','sukun:languagechange']) window.addEventListener(event,schedule,{passive:true});
  document.addEventListener('change',event=>{if (event.target?.matches?.('#bsGap,#es99Gap')) schedule();},{passive:true});
  document.addEventListener('visibilitychange',()=>{if (document.hidden) {clearTimeout(updateTimer);updateTimer = 0;cancel('hidden');} else schedule();},{passive:true});
  document.addEventListener('freeze',()=>cancel('hidden'),{passive:true});window.addEventListener('pagehide',()=>cancel('hidden'),{passive:true});
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
})();
