/* r940 — bounded, local, passive evidence. No playback commands, recovery,
 * pointer interception, recurring DOM scans, or synthetic lifecycle events.
 * read() is pure. Expensive/network checks run only after explicit run(). */
(() => {
  'use strict';
  if (window.SukunHealthR940) return;
  const VERSION = 'r940', SCHEMA = 'sukun-health-r940', KEY = 'sukun.health.r940';
  const MAX_EVENTS = 120, MAX_ISSUES = 40, MAX_BYTES = 32768;
  const born = Date.now(), boot = born.toString(36) + Math.random().toString(36).slice(2, 7);
  const build = String(document.querySelector('meta[name="sukun-build"]')?.content || window.SUKUN_BUILD || 'unknown');
  const events = [], incidents = [], checks = [];
  let seq = 0, droppedEvents = 0, droppedIncidents = 0, session = null, truth = null, sw = null, tempo = null, lock = null, background = null;
  let sessionChangedAt = born, progressAt = born, lastSaved = 0, activeTimer = 0, activeExpected = 0;
  let runPromise = null, lastRun = null, storageError = '', visibilityEpoch = 0, probe = null, fx = null, latency = null, deviceCheck = null;
  const DEVICE_FIELDS = ['foregroundSound','lockedSound','tempoStable','effectsPreserved','nameTransition'];
  const DEVICE_ANSWERS = new Set(['NOT_TRIED','AS_EXPECTED','ISSUE']);
  let previous = null, previousScope = 'none', lastSampleEpoch = 0, eventWindowAt = born, eventWindowCount = 0;
  let visibleLagMs = 0, lastIncidentAt = 0, mounted = null, dialog = null, priorFocus = null, tts = null, taps = null, checkpointTrimmed = 0;
  const safe = (fn, fallback = null) => { try { return fn() ?? fallback; } catch (_) { return fallback; } };
  const finite = x => Number.isFinite(Number(x)) ? Number(x) : null;
  const token = (x, max = 80) => String(x ?? '').replace(/[^A-Za-z0-9_.:+/-]/g, '').slice(0, max);
  const bool = x => x === true;
  const now = () => Date.now();
  const copy = x => JSON.parse(JSON.stringify(x));
  const path = raw => {
    try {
      const u = new URL(String(raw || ''), location.href);
      if (u.protocol !== 'http:' && u.protocol !== 'https:') return u.protocol === 'blob:' ? '[blob]' : '[inline]';
      return u.origin === location.origin ? u.pathname.slice(0, 200) : '[external]/' + u.pathname.split('/').pop().slice(0, 80);
    } catch (_) { return '[unknown]'; }
  };
  function frames(error) {
    const stack = safe(() => typeof error?.stack === 'string' ? error.stack.slice(0,4000) : '', '');
    const rows = []; const re = /(https?:\/\/[^\s)]+):(\d+):(\d+)/g; let hit;
    while (rows.length < 6 && (hit = re.exec(stack))) rows.push({ file:path(hit[1]),line:Number(hit[2]),column:Number(hit[3]) });
    return rows;
  }
  const historicKeys = new Set('at seq kind code severity title certainty firstAt lastAt occurrences eventSeq context evidence hidden session tempo truth sw lock phase mode index count target epoch requestId journey owner source reason tefekkur dualJourney audioIssues state tangible pending life hub issues app controller waiting hasController complete error value previous cancelledGestures pendingGesture active playing frozen cycleMs mediaProgressMs lastProgressAgeMs stalls overshootCycles applied name file line column frames asset tag lagMs thresholdMs elapsedMs checkpointAt scope build online previousCheckpoint bytes lastEvent measuredAt snapshot type phaseMs rep limit cycles remaining delay wraps remainMs provider model http durationMs background outcome errorName stage path sourceKind paused ended readyState networkState mediaErrorCode eligible generationCurrent scope transition disposition singleSnapshot singleMeasuredAt snapshotPath preparing browserLifecycle wasDiscarded navigationType previous previousExit crashConfirmed pagehide mediaPlaying mediaTime'.split(' '));
  function historic(value, depth = 0) {
    if (depth > 5 || value == null) return null;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    if (typeof value === 'string') return token(value,200);
    if (Array.isArray(value)) return value.slice(-18).map(x => historic(x,depth+1));
    if (typeof value !== 'object') return null;
    const out = {}; for (const key of Object.keys(value).slice(0,50)) if (historicKeys.has(key)) out[key] = historic(value[key],depth+1);
    return out;
  }
  function numeric(obj, fields) { const out = {}; for (const key of fields) out[key] = finite(obj?.[key]); return out; }
  function compactSession(s) {
    if (!s || typeof s !== 'object') return null;
    return { phase: token(s.phase), mode: token(s.activeMode), index: finite(s.activeIndex), count: finite(s.count),
      target: finite(s.target), epoch: finite(s.epoch), requestId: finite(s.requestId), journey: token(s.journeyKind),
      owner: token(s.owner), source: token(s.audioSource), reason: token(s.reason), tefekkur: bool(s.isTefekkur),
      dualJourney: bool(s.consistency?.dualJourney), audioIssues: (s.consistency?.audioIssues || []).slice(0, 8).map(x => token(x)) };
  }
  function compactTruth(s) {
    return { state: token(s?.state), tangible: bool(s?.tangible), pending: bool(s?.pendingPhysical), source: token(s?.source),
      issues: (s?.issues || []).slice(0, 8).map(x => token(x)), life: token(s?.life?.state), hub: token(s?.hub?.state) };
  }
  function compactSW(s) { return { app: token(s?.appVersion || build), controller: token(s?.controllerVersion || s?.v),
    waiting: token(s?.waitingVersion), phase: token(s?.phase), hasController: bool(s?.hasController),
    complete: s?.controllerComplete ?? s?.complete ?? null, error: !!s?.lastError || !!s?.error }; }
  function compactLock(s) { return { active: bool(s?.active), playing: bool(s?.playing), owner: token(s?.owner),
    frozen: bool(s?.frozen), reason: token(s?.lastReason), ...numeric(s, ['cycleMs','mediaProgressMs','lastProgressAgeMs','stalls','overshootCycles','applied','index']) }; }
  function sampleLock() {
    // The single-name native player and the multi-name journey are different
    // transports. An idle journey is not evidence that the single player stopped.
    const transport = safe(() => window.SukunLockJourneyTransportV2?.snapshot?.());
    if (transport) lock = {...(lock || {}), measuredAt:now(), snapshotPath:'journey', snapshot:compactLock(transport)};
    const single = safe(() => window.SukunLockAudio?.snapshot?.());
    if (single) lock = {...(lock || {}), singleMeasuredAt:now(), singleSnapshot:{
      path:'single-recording',active:bool(single.active),preparing:bool(single.preparing),playing:bool(single.playing),
      ...compactBackground({evidence:single}),cycleMs:finite(single.cycleMs)
    }};
  }
  // r970: read-only browser restart evidence, distinct from audio handoff errors.
  function compactLifecycle() {
    const bootState = safe(() => window.SukunBootCheckpoint?.snapshot?.());
    const p = bootState?.previous;
    const navigationType = safe(() => performance.getEntriesByType('navigation')[0]?.type, 'unknown');
    return { wasDiscarded: document.wasDiscarded === true, navigationType: token(navigationType),
      previousExit: token(bootState?.previousExit || 'unknown'), crashConfirmed: false,
      previous: p ? { at: finite(p.at), build: token(p.build), reason: token(p.reason),
        hidden: bool(p.hidden), playing: bool(p.playing), paused: bool(p.paused),
        owner: token(p.owner), index: finite(p.index), count: finite(p.count),
        pagehide: bool(p.pagehide), mediaPlaying: bool(p.mediaPlaying), mediaTime: finite(p.mediaTime) } : null };
  }
  function evidenceContext() { return { hidden: document.hidden, session, tempo, truth, sw, lock, background, browserLifecycle: compactLifecycle() }; }
  function record(kind, evidence = {}) {
    const row = { seq: ++seq, at: now(), kind: token(kind), evidence };
    events.push(row); if (events.length > MAX_EVENTS) { events.shift(); droppedEvents++; }
    return row.seq;
  }
  function issue(code, severity, title, evidence, remedy, certainty = 'observed') {
    const found = incidents.find(x => x.code === code);
    const at = now();
    if (found) { found.lastAt = at; found.occurrences++; found.evidence = evidence; found.context = copy(evidenceContext()); found.eventSeq = seq; return found; }
    const row = { code, severity, title, certainty, firstAt: at, lastAt: at, occurrences: 1,
      evidence, remedy, context: copy(evidenceContext()), eventSeq: seq };
    incidents.push(row); if (incidents.length > MAX_ISSUES) { incidents.shift(); droppedIncidents++; }
    record('incident', { code, severity });
    if (at - lastIncidentAt >= 15000) { lastIncidentAt = at; persist('incident'); }
    return row;
  }
  function checkpoint(reason) {
    return { schema: SCHEMA, at: now(), boot, build, reason, hidden: document.hidden,
      closed: reason === 'pagehide', session, tempo, sw, background, browserLifecycle: compactLifecycle(), deviceCheck, incidents: incidents.slice(-8), events: events.slice(-18) };
  }
  function persist(reason) {
    const saved = checkpoint(reason); let data = JSON.stringify(saved), trimmed = 0;
    while (new TextEncoder().encode(data).length > MAX_BYTES && (saved.events.length || saved.incidents.length)) {
      if (saved.events.length > 1) saved.events.shift(); else if (saved.incidents.length) saved.incidents.shift(); else saved.events.shift();
      trimmed++; data = JSON.stringify(saved);
    }
    checkpointTrimmed = trimmed;
    if (new TextEncoder().encode(data).length > MAX_BYTES) { storageError = 'CheckpointTooLarge'; return; }
    try { sessionStorage.setItem(KEY, data); localStorage.setItem(KEY, data); lastSaved = now(); storageError = ''; }
    catch (error) { storageError = token(error?.name || 'StorageError'); }
  }
  function loadPrevious() {
    let raw = safe(() => sessionStorage.getItem(KEY)); previousScope = raw ? 'same-tab' : 'last-device-tab-unknown';
    if (!raw) raw = safe(() => localStorage.getItem(KEY));
    if (!raw || raw.length > MAX_BYTES) return;
    const old = safe(() => JSON.parse(raw));
    if (old?.schema !== SCHEMA || !Number.isFinite(old.at) || now() - old.at > 172800000 || old.at > now() + 60000) return;
    previous = { at: old.at, build: token(old.build), reason: token(old.reason), closed: bool(old.closed), hidden: bool(old.hidden),
      session: old.session ? { phase: token(old.session.phase), count: finite(old.session.count), index: finite(old.session.index), mode: token(old.session.mode) } : null,
      incidentCodes: (Array.isArray(old.incidents) ? old.incidents : []).slice(-8).map(x => token(x.code)),
      incidents: historic((Array.isArray(old.incidents) ? old.incidents : []).slice(-8)),
      events: historic((Array.isArray(old.events) ? old.events : []).slice(-18)), background:historic(old.background), browserLifecycle:historic(old.browserLifecycle), deviceCheck: compactDeviceCheck(old.deviceCheck) };
    if (!old.closed && /PLAYING|PREPARING|INTERRUPTED/.test(previous.session?.phase || ''))
      issue('PREVIOUS_UNCLOSED_SESSION', 'WARN', 'Önceki etkin oturumun kapanışı gözlenmedi',
        { checkpointAt: old.at, scope: previousScope, phase: previous.session.phase, reason: previous.reason },
        'O saatte ekran kilidi, uygulamanın kapanması veya sekme değişimi olduysa bu raporu paylaşın. Bu kayıt tek başına çökme kanıtı değildir; başka sekmeye ait olabilir.', 'possible');
  }
  function sampleTempo() {
    const s = safe(() => window.SukunTempo?.snapshot?.());
    if (s) tempo = { value: finite(s.value), pendingGesture: bool(s.pendingGesture), cancelledGestures: finite(s.cancelledGestures) };
  }
  function arm() {
    if (activeTimer || document.hidden || !['PLAYING','PREPARING','INTERRUPTED'].includes(session?.phase)) return;
    const epoch = visibilityEpoch; activeExpected = performance.now() + 5000;
    activeTimer = setTimeout(() => {
      activeTimer = 0;
      if (document.hidden || epoch !== visibilityEpoch) return;
      visibleLagMs = Math.max(0, Math.round(performance.now() - activeExpected));
      if (visibleLagMs > 1500) issue('VISIBLE_EVENT_LOOP_LAG', 'WARN', 'Görünür ekranda görev gecikmesi',
        { lagMs: visibleLagMs, thresholdMs: 1500 }, 'Son tıklama/ses/tempo olaylarını bu zamanla karşılaştırın; ağır görsel veya tanı işlemini ayrı değerlendirin.', 'correlation');
      sampleTempo(); evaluateTemporal();
      if (now() - lastSaved >= 15000) persist('active-checkpoint');
      arm();
    }, 5000);
  }
  function evaluateTemporal() {
    if (!session || document.hidden || lastSampleEpoch !== visibilityEpoch) { lastSampleEpoch = visibilityEpoch; return; }
    if (session.phase === 'PREPARING' && now() - sessionChangedAt > 30000)
      issue('PREPARATION_OVER_30S', 'WARN', 'Ses hazırlığı 30 saniyeyi geçti', { elapsedMs: now() - sessionChangedAt },
        'Kaynak/ağ hatası ve FX hazırlık kayıtlarını kontrol edin; kullanıcı kaydı hazır olmadan başlatıldı mı inceleyin.', 'possible');
    if (session.phase === 'PLAYING' && now() - progressAt > 60000)
      issue('NO_COUNTER_PROGRESS_60S', 'WARN', 'Etkin sayımda 60 saniyedir ilerleme gözlenmedi', { elapsedMs: now() - progressAt, source: session.source },
        'Uzun tek kayıt okunuyorsa bu beklenen olabilir. Ses zamanı ve oturum olayları ile birlikte değerlendirin; tek başına donma kanıtı değildir.', 'possible');
  }
  function cancelTimer() { if (activeTimer) clearTimeout(activeTimer); activeTimer = 0; visibilityEpoch++; }
  function sessionEvent(e) {
    const next = compactSession(e.detail); if (!next) return;
    if (!session || ['phase','epoch','mode','index'].some(k => session[k] !== next[k])) {
      sessionChangedAt = now(); progressAt = now(); record('session', next);
    } else if (session.count !== next.count) { progressAt = now(); if (now() - (events[events.length - 1]?.at || 0) > 4000) record('progress', { count: next.count, epoch: next.epoch }); }
    session = next;
    if (next.dualJourney) issue('DUAL_JOURNEY', 'FAIL', 'İki seyir aynı anda etkin', { journey: next.journey, owner: next.owner }, 'Seyir sahipliği ve önceki oturumun Stop tamamlanma bariyerini inceleyin.');
    if (next.phase === 'ERROR') issue('SESSION_ERROR', 'FAIL', 'Oturum hata durumuna geçti', { source: next.source, epoch: next.epoch }, 'Önceki resource, promise ve ses olayı kayıtlarıyla hata anını eşleştirin.');
    if (['PLAYING','PREPARING','INTERRUPTED'].includes(next.phase)) arm(); else cancelTimer();
  }
  function errorEvent(e) {
    if (e.target && e.target !== window && e.target.tagName) {
      const asset = path(e.target.currentSrc || e.target.src || e.target.href);
      const tag = token(e.target.tagName);
      record('asset-error', { asset, tag });
      issue('RESOURCE_LOAD_ERROR', 'FAIL', 'Bir kaynak yüklenemedi', { asset, tag }, 'Belirtilen dosyanın pakette ve sunucuda aynı yol/büyük-küçük harfle bulunduğunu kontrol edin; bütünlük testini çalıştırın.');
    } else {
      const data = { name: token(e.error?.name || 'Error'), file: path(e.filename), line: finite(e.lineno), column: finite(e.colno), frames:frames(e.error) };
      record('javascript-error', data); issue('JAVASCRIPT_ERROR', 'FAIL', 'JavaScript hatası yakalandı', data, 'Dosya, satır ve sütunu bu sürümün kaynak kodunda açın; önceki olay sırasını aynı rapordan inceleyin.');
    }
  }
  function rejection(e) {
    const data = { name: token(e.reason?.name || 'UnhandledRejection'), code: token(e.reason?.code), frames:frames(e.reason) };
    record('unhandled-rejection', data); issue('UNHANDLED_PROMISE', 'FAIL', 'Yakalanmamış asenkron hata', data,
      'Son ses hazırlığı, kaynak yükleme ve komut olaylarıyla eşleştirin; reddedilen Promise için hata işleme ekleyin.');
  }
  function lifecycle(kind, persisted) {
    cancelTimer(); progressAt = now(); sessionChangedAt = now();
    sampleLock();
    record(kind, { hidden: document.hidden, persisted: !!persisted, phase: session?.phase || 'unknown', lock:lock ? copy(lock) : null });
    persist(kind);
    if (!document.hidden && kind !== 'pagehide' && kind !== 'freeze') arm();
  }
  const AUDIO_ERRORS = new Set(['AbortError','NotAllowedError','NotSupportedError','InvalidStateError','NetworkError','EncodingError','SecurityError','TimeoutError','TypeError','Error']);
  const AUDIO_STAGES = new Set(['native-play','started','restored','released','prepare','eligibility','source-attach','handoff','resume']);
  function compactBackground(detail) {
    const data = detail?.evidence || {}, result = {hidden:document.hidden};
    // Never retain arbitrary error messages, extra text, media URLs or keys.
    // Legacy emitters provide an exception class as `extra`; only exact known
    // class names are accepted so a message cannot become diagnostic content.
    const errorName = data.errorName ?? detail?.extra;
    if (errorName) result.errorName = AUDIO_ERRORS.has(errorName) ? errorName : 'OtherError';
    if (AUDIO_STAGES.has(data.stage)) result.stage = data.stage;
    if (['single-recording','journey-recording','tts'].includes(data.path)) result.path = data.path;
    if (['recording','baked','tts','none'].includes(data.sourceKind)) result.sourceKind = data.sourceKind;
    for (const key of ['paused','ended','eligible','generationCurrent']) if (typeof data[key] === 'boolean') result[key] = data[key];
    for (const [key,max] of [['readyState',4],['networkState',3],['mediaErrorCode',4]])
      if (Number.isInteger(data[key]) && data[key] >= 0 && data[key] <= max) result[key] = data[key];
    return result;
  }
  function passiveDiagnostic(e) {
    const kind = token(e.detail?.kind || 'runtime'), isBackground = ['background-play','background-handoff','background-tts'].includes(kind);
    const data = {kind,...(isBackground ? compactBackground(e.detail) : {})};
    // A rejected obsolete attempt after Stop/selection change is cancellation,
    // not evidence that the current session failed. Missing legacy flags remain unknown.
    const obsolete = isBackground && (data.eligible === false || data.generationCurrent === false);
    if (obsolete) data.disposition = 'obsolete-attempt';
    if (isBackground && !obsolete) {
      sampleLock();
      if (kind === 'background-play' || kind === 'background-tts')
        background = {at:now(),outcome:'failed',epoch:session?.epoch ?? null,...data};
      else if (['started','restored'].includes(data.stage))
        background = {at:now(),outcome:'started',epoch:session?.epoch ?? null,...data};
    }
    record('runtime-note', data);
    if (!obsolete && /event-storm|event-loop-lag|idb-blocked|recording|background-play|background-tts/.test(kind))
      issue('RUNTIME_' + kind.toUpperCase().replace(/[^A-Z0-9]/g, '_'), 'WARN', 'Çalışma zamanı uyarısı: ' + kind,
        data, 'Bu uyarının hemen öncesindeki ses, görünürlük ve tempo olaylarını raporda eşleştirin.', 'correlation');
  }
  function audioConsistency() {
    if (!truth) return status('AUDIO_CONSISTENCY','NOT_MEASURED','Ses sahipliği tutarlılığı',{});
    // The lifecycle can lag physical playback during an interruption/handoff.
    // This transition is not a proven defect, but cannot be a successful check.
    const transition = truth.state === 'playing' && ['interrupted','recovering','preparing','suspended'].includes(truth.life);
    return status('AUDIO_CONSISTENCY',truth.issues.length ? 'WARN' : transition ? 'OBSERVED' : 'PASS',
      'Ses sahipliği tutarlılığı',{...truth,transition},transition ? 'Ses çalıyor bilgisi ile ses motorunun geçiş durumu henüz eşleşmiyor. Bu tek örnek kalıcı arıza veya duyulan ses kanıtı değildir.' : '');
  }
  function status(code, result, title, evidence, remedy = '') { return { code, status: result, title, evidence, remedy }; }
  function compactDeviceCheck(input) {
    if (!input || input.source !== 'USER_REPORTED' || !Number.isFinite(input.at)) return null;
    const responses = {};
    for (const key of DEVICE_FIELDS) responses[key] = DEVICE_ANSWERS.has(input.responses?.[key]) ? input.responses[key] : 'NOT_TRIED';
    return {source:'USER_REPORTED',at:input.at,build:token(input.build),responses,sessionEpoch:Number.isFinite(input.sessionEpoch)?input.sessionEpoch:null,scope:'reported-at-submission-not-an-automated-session-test'};
  }
  function recordDeviceCheck(responses) {
    // A person's report is saved separately; it never promotes DEVICE_AUDIO
    // or any automatic test to PASS and never sends a playback command.
    deviceCheck = compactDeviceCheck({source:'USER_REPORTED',at:now(),build,responses,sessionEpoch:session?.epoch});
    record('user-device-check', {source:'USER_REPORTED',at:deviceCheck.at});
    persist('user-device-check'); return read();
  }
  function currentChecks() {
    const out = [status('BUILD', /^r\d+$/.test(build) ? 'PASS' : 'WARN', 'Uygulama sürümü', { build }),
      status('SW_IDENTITY', !sw?.hasController ? 'NOT_MEASURED' : !sw.controller ? 'NOT_MEASURED' : sw.controller === build ? 'PASS' : 'FAIL',
        'Sayfa / Service Worker eşleşmesi', sw || { controlled: !!navigator.serviceWorker?.controller }, 'Farklıysa aktif sesi durdurduktan sonra uygulamanın Güncelle düğmesini kullanın; kayıtları silmeyin.'),
      status('SW_CACHE_COMPLETE', sw?.complete === true ? 'PASS' : sw?.complete === false ? 'FAIL' : 'NOT_MEASURED', 'SW çekirdek dosyaları', { complete: sw?.complete ?? null }),
      status('SESSION_OBSERVATION', session ? 'PASS' : 'NOT_MEASURED', 'Pasif oturum durumu', session || { reason: 'Henüz oturum olayı alınmadı' }),
      status('TEMPO_RANGE', tempo?.value == null ? 'NOT_MEASURED' : tempo.value >= .8 && tempo.value <= 6 ? 'PASS' : 'FAIL', 'Tempo yetkisi', tempo || {}),
      audioConsistency(),
      status('DEVICE_AUDIO', 'NOT_MEASURED', 'Fiziksel hoparlör ve ekran kilidi doğrulaması', { reason: 'Tarayıcı olayları işitilebilir sesi veya işletim sistemi süreç sonlandırmasını ispatlamaz' }),
      status('PERSISTENCE', storageError ? 'WARN' : lastSaved ? 'PASS' : 'NOT_MEASURED', 'Son durum kaydı', { lastSaved, error: storageError, trimmedRecords:checkpointTrimmed })];
    const memory = safe(() => window.SukunSessionMemory?.diagnostics?.());
    if (memory) out.push(status('SESSION_MEMORY', memory.error ? 'WARN' : memory.bootPending ? 'OBSERVED' : memory.writes > 0 ? 'PASS' : 'NOT_MEASURED',
      'Zikir ilerleme kaydı', { version:token(memory.version),bootPending:bool(memory.bootPending),bootCancelled:bool(memory.bootCancelled),writePending:bool(memory.writePending),writes:finite(memory.writes),lastWriteAt:finite(memory.lastWriteAt),error:token(memory.error) },
      'Başarılı yazım işletim sistemi kapanmasını önlemez. Kayıt hatası varsa ilerlemenin kalıcılığı garanti edilmez; kişisel sesleri silmeden yedek alın.'));
    if (background) out.push(status('BACKGROUND_HANDOFF',background.outcome === 'failed' ? 'WARN' : 'OBSERVED',
      'Son arka plan ses aktarımı',{...background,scope:'last-attempt-not-current-audibility'},
      'Bu sonuç son arka plan aktarımı içindir. Ekrana dönünce sesin devam etmesi arka plan sorununun çözüldüğünü kanıtlamaz. Raporu kaydedin; kullanıcı kayıtlarını silmeyin.'));
    if (taps) out.push(status('INPUT_DELIVERY','OBSERVED','Tıklama / kaydırma kanıtı',taps,'scroll-or-gesture normal kaydırmadır. no-click-observed, target-detached, hit-target-changed ve unresolved-cancel kayıtlarını hedef/zaman ile inceleyin; her iptal hata değildir.'));
    if (tts) out.push(status('TTS_CAPABILITY', !tts.supported || tts.voices === 0 ? 'NOT_MEASURED' : 'OBSERVED', 'Cihaz konuşma motoru', tts, 'Sıfır ses, cihaz/tarayıcı özelliği veya henüz yüklenmemiş ses listesidir; tek başına uygulama hatası değildir. Kendi kayıtlarınız bu motordan bağımsızdır.'));
    if (probe) {
      out.push(status('EARLY_RUNTIME_ERRORS',probe.earlyErrors.length ? 'FAIL' : 'PASS','Hata kaydı başlamadan önceki JavaScript hataları',{errors:probe.earlyErrors},'Kaynak dosya ve satır başlangıç yüklemesi sırasında hata verdi; ham hata metni gizlilik için alınmaz.'));
      out.push(status('AUDIO_CONTEXTS', 'OBSERVED', 'Ses motorları', { contexts: probe.contexts }));
      out.push(status('HEAP', probe.heapRatio != null && probe.heapRatio > .85 ? 'WARN' : probe.heapRatio == null ? 'NOT_MEASURED' : 'OBSERVED',
        'Bellek göstergesi', { heapBytes: probe.heapBytes, heapLimit: probe.heapLimit, ratio: probe.heapRatio }, 'Bu tarayıcı ölçümüdür; tek örnek bellek sızıntısını kanıtlamaz.'));
      out.push(status('LONG_TASKS', !probe.longTaskSupported ? 'NOT_MEASURED' : probe.longTaskWindow.count ? 'WARN' : probe.longTaskWindow.windowComplete === true ? 'PASS' : 'NOT_MEASURED', 'Son iki dakika ana iş parçacığı', { supported:probe.longTaskSupported, ...probe.longTaskWindow, tasks: probe.recentLongTasks }, 'Tanılama işlemleri bu listeden çıkarılır. Liste son 12 örnektir; sayı ve en uzun süre eldeki pencerenin tamamından hesaplanır. Tampon dolmuşsa sayı alt sınırdır. Bu ölçüm dokunma gecikmesi veya INP değildir.'));
    }
    if (latency) out.push(status('LATENCY_ATTRIBUTION', latency.interactions.length || latency.frames.length ? 'OBSERVED' : 'NOT_MEASURED', 'Etkileşim gecikmesi ve kaynak gözlemi', latency,
      'Gecikme anını, kontrol hedefini ve kaynak dosyasını birlikte inceleyin. Aynı zamana denk gelmek tek başına nedensellik değildir. Örnekler INP veya fiziksel kilit testi değildir.'));
    if (fx) out.push(status('BACKGROUND_FX', fx.fallbackActive ? 'WARN' : 'OBSERVED', 'Kayıt yankı / 8D yolu', fx,
      'Fallback tap yolu ekran kilidinde kısıtlanabilir; hazırlanmış baked kayıt yolu ve kaynak bütçesi incelenmelidir.'));
    const resources=safe(()=>window.SukunLifecycleR949?.snapshot());
    if(resources){
      out.push(status('PAGE_LIFECYCLE',resources.wasDiscarded===true||resources.unexpectedReload==='POSSIBLE_UNCLOSED_ACTIVE_SESSION'?'WARN':'OBSERVED','Sekme yaşam döngüsü',{bootId:resources.bootId,wasDiscarded:resources.wasDiscarded,discardSupported:resources.discardSupported,unexpectedReload:resources.unexpectedReload,previousBoot:resources.previousBoot,navigationType:resources.navigationType,freezeEvents:resources.freezeEvents,resumeEvents:resources.resumeEvents},'Freeze tek başına çökme değildir. Discard kaydı bellek tükenmesinin neden olduğunu kanıtlamaz; açık oturum kaydı yalnız olası beklenmedik dönüş işaretidir.'));
      out.push(status('RESOURCE_RESIDENCY',resources.scene?.residentSceneCount>3?'FAIL':'OBSERVED','Görsel ve ses kaynakları',{scene:resources.scene,canvas:resources.canvas,audioNodes:resources.audioNodes},'Görsel/canvas baytları boyuttan hesaplanan tahmindir; GPU veya toplam telefon belleği ölçülmez. Ses düğümleri yalnız izlenebilen zayıf JS başvurularıdır.'));
      const bg=resources.backgroundOwner;
      out.push(status('BACKGROUND_OWNER',bg?.blocked||bg?.phase==='INTERRUPTED'?'WARN':bg?.active?'OBSERVED':'NOT_MEASURED','Yerel arka plan ses sahibi',{...(bg||{}),cadence:resources.cadence},'Engellenen kaynak görünür ekrana dönene veya kaynak değişene kadar yeniden denenmez. Hoparlörden ses geldiği ancak cihazda dinlenerek doğrulanır.'));
      out.push(status('VISUAL_SCHEDULER',document.hidden&&resources.scheduler?.pendingFrames?'WARN':'OBSERVED','Görsel çizim zamanlayıcısı',resources.scheduler||{},'Bu sayı CIZ tarafından yönetilen görsel işleri kapsar; tek seferlik yerleşim ve ses zamanlayıcıları ayrı işlerdir.'));
    }
    const ai = safe(() => window.SukunAIRouter?.snapshot?.());
    if (ai) out.push(status('AI_CONNECTIONS', ai.lastResult?.code === 'OK' ? 'OBSERVED' : ai.lastResult?.code && !['CANCELLED','MISSING_KEY','CONSENT_REQUIRED'].includes(ai.lastResult.code) ? 'WARN' : 'NOT_MEASURED', 'AI bağlantıları (anahtarsız tanı)', ai, 'AUTH: anahtarı düzeltin. QUOTA: kota süresini bekleyin. ACCESS/BILLING: sağlayıcı hesabını kontrol edin. NETWORK_OR_CORS: bağlantı veya tarayıcı erişimi. NVIDIA için kendi aracı servisiniz gerekir. Sağlık denetimi AI isteği göndermez.'));
    return out.concat(checks);
  }
  function read() {
    const result = currentChecks();
    return { schema: SCHEMA, version: VERSION, build, generatedAt: new Date().toISOString(), boot,
      coverage: { since: born, events: events.length, discardedEvents: droppedEvents, incidentLimit: MAX_ISSUES,
        discardedIncidents: droppedIncidents, hiddenSampling: 'event-only-no-poll', physicalLockScreenTest: deviceCheck && deviceCheck.responses.lockedSound !== 'NOT_TRIED' ? 'USER_REPORTED' : 'NOT_RUN',
        privacy: 'metadata-only-no-recording-no-text-no-url-query', previousScope },
      summary: { currentFailures: result.filter(x => x.status === 'FAIL').length, currentWarnings: result.filter(x => x.status === 'WARN').length,
        unmeasured: result.filter(x => x.status === 'NOT_MEASURED').length, recordedIncidents: incidents.length },
      current: copy(evidenceContext()), checks: copy(result), deviceCheck:copy(deviceCheck), incidents: copy(incidents), timeline: copy(events), previous: copy(previous), lastRun: copy(lastRun) };
  }
  async function bounded(promise, ms = 2000) {
    let timer; try { return await Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('timeout')), ms); })]); }
    finally { clearTimeout(timer); }
  }
  function askWorker(worker) {
    if (!worker) return Promise.resolve(null);
    return new Promise(resolve => {
      const channel = new MessageChannel(); let done = false;
      const finish = value => { if (done) return; done = true; clearTimeout(timer); channel.port1.close(); channel.port2.close(); resolve(value); };
      const timer = setTimeout(() => finish({ timeout: true }), 2500);
      channel.port1.onmessage = e => finish({ version: token(e.data?.v), complete: e.data?.complete ?? null, error: !!e.data?.error });
      try { worker.postMessage({ type: 'STATUS' }, [channel.port2]); } catch (_) { finish({ unavailable: true }); }
    });
  }
  async function fetchBytes(url, maxBytes, controller) {
    const response = await fetch(url, { cache: 'no-store', credentials: 'same-origin', signal: controller.signal });
    if (!response.ok) throw new Error('HTTP_' + response.status);
    const size = Number(response.headers.get('content-length'));
    if (size > maxBytes) throw new Error('SIZE_LIMIT');
    if (!response.body?.getReader) { const bytes = new Uint8Array(await response.arrayBuffer()); if (bytes.length > maxBytes) throw new Error('SIZE_LIMIT'); return bytes; }
    const reader = response.body.getReader(), chunks = []; let total = 0;
    try { while (true) { const part = await reader.read(); if (part.done) break; total += part.value.length; if (total > maxBytes) { await reader.cancel(); throw new Error('SIZE_LIMIT'); } chunks.push(part.value); } }
    finally { reader.releaseLock(); }
    const bytes = new Uint8Array(total); let offset = 0; for (const part of chunks) { bytes.set(part, offset); offset += part.length; } return bytes;
  }
  async function integrityCheck() {
    const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 10000);
    const result = []; let total = 0;
    try {
      const markerURL = new URL('./sukun-build-' + build + '.json', location.href);
      const bytes = await fetchBytes(markerURL.href, 32768, controller);
      const marker = JSON.parse(new TextDecoder().decode(bytes));
      if (marker.build !== build || !Array.isArray(marker.runtime) || marker.runtime.length > 32) throw new Error('MARKER_INVALID');
      if (!crypto?.subtle) return status('RUNTIME_INTEGRITY','NOT_MEASURED','Çekirdek dosya SHA-256 doğrulaması',{reason:'Crypto API yok'});
      const entries = marker.runtime.slice(); let cursor = 0;
      async function worker() {
        while (cursor < entries.length) {
          const entry = entries[cursor++], url = new URL(entry.url, location.href);
          const runtime = /\/assets\/runtime\/[A-Za-z0-9_.-]+$/.test(url.pathname);
          const navigationArt = /\/assets\/wheel-navigation-r964\/(?:gold|copper|silver|dark|crystal)\.png$/.test(url.pathname);
          if (url.origin !== location.origin || !(runtime || navigationArt) || !/^[a-f0-9]{64}$/.test(entry.sha256)) { result.push({ path: path(url.href), status: 'INVALID_ENTRY' }); continue; }
          try {
            const maxFileBytes = navigationArt ? 2097152 : 524288;
            if (total + maxFileBytes > 8388608) throw new Error('TOTAL_SIZE_LIMIT');
            const data = await fetchBytes(url.href, maxFileBytes, controller); total += data.length;
            const digest = await crypto.subtle.digest('SHA-256', data);
            const actual = [...new Uint8Array(digest)].map(x => x.toString(16).padStart(2,'0')).join('');
            result.push({ path: path(url.href), status: actual === entry.sha256 ? 'MATCH' : 'HASH_MISMATCH', expected: entry.sha256, actual });
          } catch (error) { result.push({ path: path(url.href), status: token(error?.message || error?.name || 'FETCH_ERROR') }); }
        }
      }
      await Promise.all([worker(),worker()]);
      return status('RUNTIME_INTEGRITY', result.every(x => x.status === 'MATCH') && result.length ? 'PASS' : 'FAIL',
        'Çekirdek dosya SHA-256 doğrulaması', { files: result, bytes: total, scope: 'served-through-current-service-worker' },
        'HASH_MISMATCH varsa tam sürüm paketini birlikte yükleyin; HTTP hatasında verilen yolu inceleyin. Ağ/timeout hatası dosyanın bozuk olduğunu tek başına kanıtlamaz.');
    } catch (error) { return status('RUNTIME_INTEGRITY','NOT_MEASURED','Çekirdek dosya SHA-256 doğrulaması',{reason:token(error?.message || error?.name)},'Bağlantı ve sürüm manifesti erişimini kontrol edin; daha sonra bütünlük testini çalıştırın.'); }
    finally { clearTimeout(timer); }
  }
  function sampleExplicit() {
    sampleTempo();
    tts = { supported: !!window.speechSynthesis, voices: safe(() => window.speechSynthesis.getVoices().length, 0) };
    const tap = safe(() => window.SukunR688TapAuthority?.snapshot?.());
    if (tap) taps = { version:token(tap.revision || tap.version), ...numeric(tap,['downs','ups','nativeClicks','activePointers','pending','scrollEvents','styleSamples','unmatchedUps']),
      cancelReasons:Object.fromEntries(Object.entries(tap.cancelReasons || {}).slice(0,16).map(([k,v])=>[token(k),finite(v)])),
      outcomes:(tap.outcomes || []).slice(-16).map(x=>({at:finite(x.at),seq:finite(x.seq),target:token(x.target,120),status:token(x.status),kind:token(x.kind),durationMs:finite(x.durationMs),maxDistancePx:finite(x.maxDistancePx),touchAction:token(x.touchAction),scrolled:bool(x.scrolled),detached:bool(x.detached),hitChanged:bool(x.hitChanged)})),
      history:(tap.history || []).slice(-16).map(x=>({at:finite(x.at),seq:finite(x.seq),type:token(x.type),target:token(x.target,120)})) };
    const p = safe(() => window.SukunRuntimeProbe?.snapshot?.());
    if (p) {
      const perfNow = performance.now(), retained = Array.isArray(p.longTasks) ? p.longTasks : [];
      const recent = retained.filter(x => !x.diagnostic && Number.isFinite(x.at) && Number.isFinite(x.duration) && x.duration >= 0 && perfNow - x.at >= 0 && perfNow - x.at < 120000);
      const total = p.totals?.longTaskCount;
      const truncated = Number.isFinite(total) ? total > retained.length && (!retained.length || perfNow - retained[0].at < 120000) : null;
      probe = { earlyErrors:(p.errors || []).filter(x => Number.isFinite(x.at) && x.at < born).slice(-12).map(x => ({at:x.at,type:token(x.type),file:x.source?path(x.source):null,line:finite(x.line)})), contexts: (p.audioContexts || []).slice(0, 12).map(c => ({ state: token(c.state), sampleRate: finite(c.sampleRate), currentTime: finite(c.currentTime) })),
      heapBytes: finite(p.heap?.used), heapLimit: finite(p.heap?.limit), heapRatio: p.heap?.limit ? Math.round(p.heap.used / p.heap.limit * 1000) / 1000 : null,
      longTaskSupported:safe(() => PerformanceObserver.supportedEntryTypes.includes('longtask'),false) || retained.length > 0,
      longTaskWindow:{count:recent.length,maxDurationMs:recent.reduce((max,x)=>Math.max(max,x.duration),0),windowMs:120000,observedForMs:Math.min(120000,Math.max(0,finite(p.uptime) || 0)),windowComplete:truncated === null ? null : !truncated,sampleLimit:12},
      recentLongTasks: recent.slice(-12).map(x => ({ durationMs: finite(x.duration), uptimeAt: finite(x.at) })) };
    }
    const timing = safe(() => window.SukunInteractionDiagnostics?.snapshot?.());
    if (timing) latency = {version:token(timing.version),timeBase:'navigation-start-ms',eventThresholdMs:40,supported:{eventTiming:bool(timing.supported?.eventTiming),loaf:bool(timing.supported?.loaf)},notINP:true,
      ...numeric(timing,['measuredInteractions','measuredFrames','ignoredDiagnostics']),
      interactions:(Array.isArray(timing.interactions)?timing.interactions:[]).slice(-24).map(x=>({at:finite(x.at),kind:token(x.kind),target:token(x.target,120),...numeric(x,['durationMs','inputDelayMs','handlerMs','presentationDelayMs'])})),
      frames:(Array.isArray(timing.frames)?timing.frames:[]).slice(-16).map(x=>({at:finite(x.at),...numeric(x,['durationMs','blockingMs']),scripts:(Array.isArray(x.scripts)?x.scripts:[]).slice(-5).map(s=>({source:s.source?path(s.source):null,charOffset:Number.isFinite(s.charOffset)?s.charOffset:null,function:token(s.function),...numeric(s,['durationMs','forcedLayoutMs'])}))}))};
    sampleLock();
    const bridge = safe(() => window.SukunNativeEchoBridge?.snapshot?.());
    if (bridge) fx = { version: token(bridge.effectsVersion), ...numeric(bridge,['cacheBytes','cache','rendering','pending','active','attached','renderBudgetBytes','sourceBudgetBytes']),
      fallbackActive: (bridge.items || []).some(x => x.active && x.mainPlaying && !x.baked), bakedActive: (bridge.items || []).filter(x => x.active && x.baked).length };
  }
  function run(options = {}) {
    if (runPromise) return runPromise;
    const started = now(), deep = options.deep === true;
    runPromise = Promise.resolve().then(async () => {
      const span = safe(() => window.SukunDiagnosticWork?.begin?.('health-r940'));
      record('health-run', { deep }); checks.length = 0;
      try {
        sampleExplicit();
        const controller = navigator.serviceWorker?.controller, answer = deep ? await askWorker(controller) : null;
        // STATUS may hash the SW cache; only explicit deep inspection requests it.
        // A reply belongs to the worker that answered, never to its successor.
        if (deep && navigator.serviceWorker?.controller === controller) {
          sw = { ...(sw || {}), app: build, hasController: !!controller, controller: answer?.version || '', complete: answer?.complete ?? null };
          if (answer?.timeout) checks.push(status('SW_RESPONSE','WARN','Service Worker yanıt süresi',{timeoutMs:2500},'SW denetimi yanıt vermedi; eski sürüm veya yoğun iş yükünü inceleyin.'));
        }
        if (navigator.storage?.estimate) {
          try { const x = await bounded(navigator.storage.estimate()); checks.push(status('STORAGE_QUOTA',x.quota && x.usage/x.quota > .85 ? 'WARN' : 'OBSERVED','Depolama kullanım tahmini', {usage:finite(x.usage),quota:finite(x.quota)},'Alan daralıyorsa önce kullanıcı kayıtlarını yedekleyin; tanılama verileri silmez.')); }
          catch (_) { checks.push(status('STORAGE_QUOTA','NOT_MEASURED','Depolama kullanım tahmini',{reason:'unavailable-or-timeout'})); }
        }
        if (deep) checks.push(await integrityCheck());
        else checks.push(status('RUNTIME_INTEGRITY','NOT_MEASURED','Çekirdek dosya SHA-256 doğrulaması',{reason:'Bütünlük testi ayrıca seçilir'}));
        lastRun = { at: started, durationMs: now() - started, deep }; persist('health-run');
        render(); return read();
      } catch (error) {
        checks.push(status('HEALTH_COLLECTION','WARN','Bir tanı ölçümü tamamlanamadı',{name:token(error?.name),frames:frames(error)},'Mevcut olay kaydını JSON olarak paylaşın; eksik ölçüm başarılı sayılmaz.'));
        lastRun = {at:started,durationMs:now()-started,deep,incomplete:true}; render(); return read();
      } finally { safe(() => window.SukunDiagnosticWork?.end?.(span,500)); runPromise = null; }
    });
    return runPromise;
  }
  async function exportReport() {
    // Export existing evidence immediately; never delay it on a new network test.
    const report = read();
    const blob = new Blob([JSON.stringify(report,null,2)], {type:'application/json'}), url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'sukun-health-' + build + '-' + now() + '.json';
    document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url),1000); return report;
  }
  function render() {
    if (!mounted?.isConnected) return;
    const data = read();
    if (safe(() => window.SukunHealthViewR943?.render?.(mounted,data),false)) return;
    const summary = mounted.querySelector('[data-health-summary]'), output = mounted.querySelector('[data-health-results]');
    if (!summary || !output) return;
    summary.textContent = data.summary.currentFailures + ' hata · ' + data.summary.currentWarnings + ' uyarı · ' + data.summary.recordedIncidents + ' olay kaydı · ' + data.summary.unmeasured + ' ölçülmedi';
    output.replaceChildren();
    const entries = [...data.incidents.slice(-8).reverse().map(x => ({...x,status:x.severity})), ...data.checks];
    for (const row of entries) {
      const item = document.createElement('div'); item.className = 'dTest';
      const title = document.createElement('b'); title.textContent = row.status + ' · ' + row.code + ' · ' + row.title;
      const detail = document.createElement('div'); detail.style.cssText = 'grid-column:1/-1;overflow-wrap:anywhere;white-space:normal';
      detail.textContent = JSON.stringify(row.evidence) + (row.remedy ? ' — ' + row.remedy : '');
      item.append(title,detail); output.append(item);
    }
  }
  function mount(host) {
    if (!host || dialog?.open && host !== dialog) return;
    const existing = document.getElementById('r940Health');
    if (existing) { if (!host.contains(existing)) host.append(existing); mounted=existing; render(); return; }
    const panel = document.createElement('details'); panel.id = 'r940Health'; panel.open = true;
    const visual = safe(() => window.SukunHealthViewR943?.mount?.(panel,{
      read,run,exportReport,recordDeviceCheck,
      mark: () => { record('user-problem-marker', { context: evidenceContext() }); persist('user-problem-marker'); render(); return read(); }
    }),false);
    if (!visual) {
    panel.innerHTML = '<summary>Sistem sağlığı <span data-health-summary></span></summary><div class="dBody"><p class="dNote">Hata anı ve önceki olaylar otomatik ve sınırlı kaydedilir. Ses dosyaları, niyet metni ve URL sorguları rapora alınmaz. Denetim oturumu değiştirmez.</p><div class="dHeadBtns"><button type="button" data-r940="deep">Sağlık denetimini çalıştır</button><button type="button" data-r940="export">JSON Rapor</button><button type="button" data-r940="mark">Sorun şimdi oldu</button></div><div data-health-results class="dTests"></div></div>';
    panel.addEventListener('click', async event => {
      const button = event.target.closest?.('[data-r940]'); if (!button) return;
      const action = button.dataset.r940;
      if (action === 'export') { await exportReport(); return; }
      if (action === 'mark') { record('user-problem-marker', { context: evidenceContext() }); persist('user-problem-marker'); render(); return; }
      const buttons = [...panel.querySelectorAll('[data-r940="run"],[data-r940="deep"]')]; buttons.forEach(x => x.disabled = true);
      try { await run({deep:action === 'deep'}); } finally { buttons.forEach(x => x.disabled = false); render(); }
    });
    }
    const anchor = host.querySelector('#r455MetricGrid'); if (anchor) anchor.after(panel); else host.append(panel);
    mounted = panel; render();
  }
  function close() { safe(() => window.SukunHealthViewR943?.cancel?.(mounted)); if (dialog?.open) dialog.close(); if (priorFocus?.isConnected && priorFocus.getClientRects().length) priorFocus.focus({preventScroll:true}); }
  function open() {
    priorFocus = document.activeElement;
    safe(() => window.SukunFriendlyUI?.closeTools?.());
    if (!dialog) {
      dialog = document.createElement('dialog'); dialog.id = 'r940HealthDialog';
      dialog.setAttribute('aria-labelledby','r940HealthTitle');
      dialog.addEventListener('close', () => safe(() => window.SukunHealthViewR943?.cancel?.(mounted)));
      const style = document.createElement('style'); style.textContent = '#r940HealthDialog{box-sizing:border-box;width:min(720px,calc(100vw - 20px));max-height:calc(100dvh - 24px);padding:18px;color:#f0e8d4;background:#0c1927;border:1px solid #a68b55;border-radius:18px;overflow:auto;overscroll-behavior:contain;touch-action:pan-y pinch-zoom;font:14px/1.5 system-ui;text-align:left}#r940HealthDialog::backdrop{background:#0009}#r940HealthDialog .dHeadBtns{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0}#r940HealthDialog button{min-height:44px;padding:10px 14px;border:1px solid #60798c;border-radius:12px;background:#183347;color:#fff;font:600 13px system-ui;touch-action:manipulation}#r940HealthDialog button:disabled{opacity:.6}#r940HealthDialog .dTest{display:block;padding:12px 0;border-bottom:1px solid #ffffff24;overflow-wrap:anywhere}#r940HealthDialog summary{padding:12px 0}#r940HealthDialog [data-health-summary]{display:block;font-size:12px}#r940HealthDialog .dNote{color:#c0cbd2}';
      document.head.append(style);
      const header = document.createElement('div'); header.style.cssText='display:flex;justify-content:space-between;align-items:center;gap:10px';
      const title = document.createElement('h2'); title.id='r940HealthTitle'; title.textContent='Sistem sağlığı'; title.style.margin='0';
      const exit = document.createElement('button'); exit.type='button'; exit.textContent='Kapat'; exit.addEventListener('click',close);
      header.append(title,exit); dialog.append(header); document.body.append(dialog); mount(dialog);
    } else { mount(dialog); }
    if (!dialog.open) dialog.showModal();
    return true;
  }
  function mountTools() {
    const grid = document.querySelector('#r616ToolsSheet .r616ToolGrid');
    if (!grid || document.getElementById('r940HealthOpen')) return !!grid;
    const button = document.createElement('button'); button.type='button'; button.className='r616Tool'; button.id='r940HealthOpen';
    button.textContent='Sistem sağlığı'; button.addEventListener('click',open); grid.append(button); return true;
  }
  function discoverTools() {
    if (mountTools()) return;
    // Existing UI builds asynchronously; bounded retries replace a permanent observer.
    [250,1000,3000].forEach(delay => setTimeout(mountTools,delay));
  }
  window.SukunHealthR940 = Object.freeze({ version: VERSION, read, run, exportReport, mount, render, open, close, mountTools,recordDeviceCheck,
    mark: () => { record('user-problem-marker', { context: evidenceContext() }); persist('user-problem-marker'); return read(); } });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', discoverTools, {once:true}); else discoverTools();
  loadPrevious(); record('boot', { build, online: navigator.onLine !== false, previousCheckpoint: !!previous });
  sampleTempo(); const initial = safe(() => window.SukunSessionState?.peek?.()); if(initial) sessionEvent({detail:initial}); persist('boot');
  window.addEventListener('sukun:sessionchange', sessionEvent, {passive:true});
  window.addEventListener('sukun:airesult', e => { const d=e.detail||{}; record('ai-request', {provider:token(d.provider),model:token(d.model),code:token(d.code),http:finite(d.http),durationMs:finite(d.durationMs)}); }, {passive:true});
  window.addEventListener('sukun:audiotruthchange', e => {
    const next = compactTruth(e.detail);
    const unusual = value => ['interrupted','recovering','suspended','error'].some(state => value?.life === state || value?.state === state);
    // Routine per-recording prepare/play changes already have session events;
    // retain exceptional lifecycle transitions without crowding out lock evidence.
    if ((!truth || unusual(truth) || unusual(next)) && (!truth || ['state','life','hub','pending'].some(key => truth[key] !== next[key]))) record('audio-truth',next);
    truth = next;
  }, {passive:true});
  window.addEventListener('sukun:swstate', e => { sw = compactSW(e.detail); record('sw', sw); }, {passive:true});
  window.addEventListener('sukun:lockjourneyv2', e => {
    const d=e.detail || {}, observed={at:finite(d.at),type:token(d.type),owner:token(d.owner),index:finite(d.index),reason:token(d.reason),...numeric(d,['cycleMs','phaseMs','rep','limit','cycles','remaining','delay','wraps','remainMs'])};
    lock = {...(lock || {}),lastEvent:observed}; record('lock-transport',observed);
    if (/native-error|revive-failed|target-switch-failed/.test(observed.type)) issue('LOCK_TRANSPORT_ERROR','WARN','Kilit ekranı ses aktarımı hata olayı',observed,'Olay türü ve son görünürlük/tempo kaydını inceleyin; cihaz kilit testiyle birlikte değerlendirin.');
  }, {passive:true});
  window.addEventListener('sukun:tempochange', e => {
    sampleTempo(); const data = { source: token(e.detail?.source), previous: finite(e.detail?.previous), value: finite(e.detail?.value), hidden: document.hidden };
    record('tempo-change', data);
    if (document.hidden) issue('TEMPO_CHANGED_HIDDEN','WARN','Ekran gizliyken tempo değişti',data,'Kaynak alanı değişimi yapan denetimi gösterir. Restore/name-change beklenen olabilir; touch/dock ise olay sırasını inceleyin.','correlation');
  }, {passive:true});
  window.addEventListener('sukun:qualityerror', e => {
    const data = {code:token(e.detail?.code || 'QUALITY_DECODE_FAILED'),bytes:finite(e.detail?.bytes)};
    record('quality-error',data);
    issue('QUALITY_DECODE_FAILED','WARN','Ses kalite analizi tamamlanamadı',data,'Kaydın dosya biçimini ve bozuk/eksik olup olmadığını kontrol edin. Analiz motoru kapanışı ve kaynak hata satırını bu raporla eşleştirin.');
  }, {passive:true});
  window.addEventListener('sukun:diagnostic', passiveDiagnostic, {passive:true});
  window.addEventListener('error', errorEvent, true);
  window.addEventListener('unhandledrejection', rejection, {passive:true});
  document.addEventListener('visibilitychange', () => lifecycle('visibilitychange'), {passive:true});
  document.addEventListener('freeze', () => lifecycle('freeze'), {passive:true});
  document.addEventListener('resume', () => lifecycle('resume'), {passive:true});
  window.addEventListener('pageshow', e => lifecycle('pageshow',e.persisted), {passive:true});
  window.addEventListener('pagehide', e => lifecycle('pagehide',e.persisted), {passive:true});
  navigator.serviceWorker?.addEventListener('controllerchange', () => { sw = null; record('controllerchange',{script:path(navigator.serviceWorker.controller?.scriptURL)}); }, {passive:true});
  // Count high-rate session events without processing their payload again.
  window.addEventListener('sukun:sessionchange', () => {
    if (now() - eventWindowAt >= 1000) { eventWindowAt = now(); eventWindowCount = 0; }
    eventWindowCount++;
    if (eventWindowCount === 200) issue('SESSION_EVENT_STORM','WARN','Bir saniyede 200 oturum güncellemesi',{count:eventWindowCount},'Aynı durumun tekrar yayınlandığı refresh/listener döngüsünü araştırın.','correlation');
  }, {passive:true});
})();
