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
  let modelCheck = null, modelPromise = null, pendingMarker = null;
  let runPromise = null, lastRun = null, storageError = '', visibilityEpoch = 0, probe = null, fx = null, latency = null, deviceCheck = null;
  const DEVICE_FIELDS = ['foregroundSound','lockedSound','tempoStable','effectsPreserved','nameTransition','manualCount','manualFeedback','manualVoice','voiceRate','terkipOpen','virdOpen','navigationControls','privateGate'];
  const DEVICE_ANSWERS = new Set(['NOT_TRIED','AS_EXPECTED','ISSUE']);
  let previous = null, previousScope = 'none', lastSampleEpoch = 0, eventWindowAt = born, eventWindowCount = 0;
  let visibleLagMs = 0, lastIncidentAt = 0, lastPresentationSave = 0, mounted = null, dialog = null, priorFocus = null, tts = null, taps = null, checkpointTrimmed = 0;
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
  const historicKeys = new Set('at seq kind code severity title certainty firstAt lastAt occurrences eventSeq context evidence hidden session tempo truth sw lock phase mode index count target epoch requestId journey owner source reason tefekkur dualJourney audioIssues state tangible pending life hub issues app controller waiting hasController complete error value previous cancelledGestures pendingGesture active playing frozen cycleMs mediaProgressMs lastProgressAgeMs stalls overshootCycles applied name file line column frames asset tag lagMs thresholdMs elapsedMs checkpointAt scope build online previousCheckpoint bytes lastEvent measuredAt snapshot issueType markerSeq type phaseMs rep limit cycles remaining delay wraps remainMs provider model http durationMs background outcome errorName stage path sourceKind paused ended readyState networkState mediaErrorCode eligible generationCurrent scope transition disposition singleSnapshot singleMeasuredAt snapshotPath preparing browserLifecycle wasDiscarded navigationType previous previousExit crashConfirmed pagehide persisted mediaPlaying mediaTime errorCode errorHttp errorStage errorAsset lastChange presentation version checks recoveries lastReason lastAt lastProbe lastRepair actions tef selectedTab viewportWidth viewportHeight scrollX scrollY frameObserved frameDelayMs domSurfaceVisible openingActive openingPresent lifecycleHidden bodyFlags roots wrap tab practice nav connected display visibility opacity width height inViewport blocker'.split(' '));
  ['voiceExpectation','voiceEnabled','intendedAudible','togetherEnabled','readerActive','voiceIntent','enabled','latched','explicitOff','actualSessionSource','sessionPhase'].forEach(key=>historicKeys.add(key));
  ['recordingPreparation','recording','audio','ageMs','stageAgeMs','originalReady','foregroundBudgetMs','decodeBlocked','budgetBytes','sourceBudgetBytes','residentBytes','activeEstimate','worker','decodeStarts','timedOut','maxConcurrent','purpose'].forEach(key=>historicKeys.add(key));
  function historic(value, depth = 0) {
    // Marker context contains one nested pair of cached preparation owners.
    // The field allowlist and checkpoint byte cap still bound retained data.
    if (depth > 6 || value == null) return null;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    if (typeof value === 'string') return token(value,200);
    if (Array.isArray(value)) return value.slice(-18).map(x => historic(x,depth+1));
    if (typeof value !== 'object') return null;
    const out = {}; for (const key of Object.keys(value).slice(0,50)) if (historicKeys.has(key)) out[key] = historic(value[key],depth+1);
    return out;
  }
  function numeric(obj, fields) { const out = {}; for (const key of fields) out[key] = finite(obj?.[key]); return out; }
  function nullableNumeric(obj, fields) { const out = {}; for (const key of fields) { const value=obj?.[key]; out[key]=typeof value==='number'&&Number.isFinite(value)?value:null; } return out; }
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
  function compactSW(s) {
    // Browser SW errors may contain full URLs. Retain actual bounded error
    // metadata, never raw messages, URL queries or recording/user text.
    const raw=s?.lastError || s?.error || '', text=typeof raw==='string'?raw.slice(0,4000):String(raw?.name || ''), failed=!!raw || s?.phase==='error';
    const names=['AbortError','NotAllowedError','NotSupportedError','InvalidStateError','NetworkError','SecurityError','TypeError','TimeoutError','Error'];
    const errorName=failed ? names.find(name=>new RegExp('\\b'+name+'\\b').test(text)) || 'UnknownError' : '';
    const http=text.match(/\b(?:HTTP[_ :]*|status(?: code)?[: =]*)([45]\d\d)\b/i), errorHttp=http?Number(http[1]):null;
    const errorCode=!failed?'':errorHttp?'HTTP_'+errorHttp:/timeout|timed out|süre.*dol|zaman.*aş/i.test(text)?'TIMEOUT':/dosyaları.*tamamlanamadı|incomplete|cache.*refresh/i.test(text)?'UPDATE_INCOMPLETE':/activation|aktivasyon/i.test(text)?'ACTIVATION_FAILED':/network|fetch|connection|bağlantı/i.test(text)?'NETWORK_OR_FETCH':'UNCLASSIFIED';
    const errorStage=!failed?'':/activation|aktivasyon/i.test(text)?'activation':/update|güncelle/i.test(text)?'update':/register|registration|kurul/i.test(text)?'registration':'unknown';
    const url=text.match(/https?:\/\/[^\s'"<>]+/i);
    return { app: token(s?.appVersion || build), controller: token(s?.controllerVersion || s?.v),
      waiting: token(s?.waitingVersion), phase: token(s?.phase), hasController: bool(s?.hasController),
      complete: s?.controllerComplete ?? s?.complete ?? null, error:failed,
      errorName,errorCode,errorHttp,errorStage,errorAsset:url?path(url[0]):null,lastChange:finite(s?.lastChange) };
  }
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
        owner: token(p.owner), mode:token(p.mode), phase:token(p.phase), index: finite(p.index), count: finite(p.count),
        pagehide: bool(p.pagehide), persisted:typeof p.persisted==='boolean'?p.persisted:null, mediaPlaying: bool(p.mediaPlaying), mediaTime: finite(p.mediaTime) } : null };
  }
  function compactPresentation(input) {
    // snapshot() is a cached observation supplied by the presentation owner.
    // Health neither probes the DOM nor repairs/repaints the page.
    if(!input || typeof input!=='object')return null;
    const number=x=>typeof x==='number'&&Number.isFinite(x)&&Math.abs(x)<=1e15?x:null;
    const string=x=>typeof x==='string'?token(x,80):'';
    const flags=x=>Array.isArray(x)?x.slice(0,16).map(string).filter(Boolean):[];
    const p=input.lastProbe, roots={};
    if(p?.roots)for(const key of ['wrap','tab','practice','nav']) {
      const r=p.roots[key];if(!r||typeof r!=='object')continue;
      roots[key]={connected:bool(r.connected),display:string(r.display),visibility:string(r.visibility),opacity:number(r.opacity),width:number(r.width),height:number(r.height),inViewport:bool(r.inViewport),blocker:r.blocker==null?null:string(r.blocker)};
    }
    return {version:string(input.version),state:['ready','hidden','checking','recovered','attention'].includes(input.state)?input.state:'unknown',checks:number(input.checks),recoveries:number(input.recoveries),lastReason:string(input.lastReason),lastAt:number(input.lastAt),
      lastProbe:p&&typeof p==='object'?{at:number(p.at),reason:string(p.reason),hidden:bool(p.hidden),tef:bool(p.tef),selectedTab:string(p.selectedTab),readyState:string(p.readyState),viewportWidth:number(p.viewportWidth),viewportHeight:number(p.viewportHeight),scrollX:number(p.scrollX),scrollY:number(p.scrollY),frameObserved:bool(p.frameObserved),frameDelayMs:number(p.frameDelayMs),domSurfaceVisible:bool(p.domSurfaceVisible),openingActive:bool(p.openingActive),openingPresent:bool(p.openingPresent),lifecycleHidden:bool(p.lifecycleHidden),bodyFlags:flags(p.bodyFlags),roots}:null,
      lastRepair:input.lastRepair&&typeof input.lastRepair==='object'?{at:number(input.lastRepair.at),actions:flags(input.lastRepair.actions)}:null,
      scope:'DOM visibility and observed animation frame; not raster or physical display test'};
  }
  function presentationSnapshot() {return compactPresentation(safe(()=>window.SukunPresentationRecovery?.snapshot?.()));}
  function voiceExpectationSnapshot() {
    // This owner exposes policy only. Do not call VoiceHealth.snapshot(), whose
    // derive path updates metrics and arms a timer, from a passive report read.
    const policy=safe(()=>window.SukunZikirVoicePolicy?.snapshot?.());
    if(!policy || typeof policy!=='object')return null;
    const choice=policy.voiceIntent, knownBool=x=>typeof x==='boolean'?x:null;
    return {version:token(policy.version),voiceEnabled:knownBool(policy.voiceEnabled),intendedAudible:knownBool(policy.intendedAudible),
      togetherEnabled:knownBool(policy.togetherEnabled),readerActive:knownBool(policy.readerActive),
      reason:['voice-off','reader-running','voice-on'].includes(policy.reason)?policy.reason:'unknown',
      voiceIntent:choice&&typeof choice==='object'?{enabled:knownBool(choice.enabled),latched:knownBool(choice.latched),explicitOff:knownBool(choice.explicitOff)}:null,
      actualSessionSource:session?.source||'',sessionPhase:session?.phase||'',scope:'configured-policy-not-physical-sound'};
  }
  function recordingPreparationSnapshot() {
    const recording=safe(()=>window.SukunRecordingPreparation?.snapshot?.()),audio=safe(()=>window.SukunAudioPreparation?.snapshot?.());
    if(!recording&&!audio)return null;
    // Only cached control metadata. No recording key, source URL, text, decode,
    // playback, DOM probe, timer, or analysis is requested by report reads.
    return {recording:recording?{version:token(recording.version),pending:bool(recording.pending),stage:token(recording.stage),originalReady:bool(recording.originalReady),...numeric(recording,['ageMs','stageAgeMs','foregroundBudgetMs'])}:null,
      audio:audio?{version:token(audio.version),stage:token(audio.stage),decodeBlocked:bool(audio.decodeBlocked),worker:token(audio.worker),...numeric(audio,['pending','active','stageAgeMs','budgetBytes','sourceBudgetBytes','residentBytes','activeEstimate','decodeStarts','timedOut','cancelled','maxConcurrent'])}:null};
  }
  function cachedTapSnapshot() {
    const tap=safe(()=>window.SukunR688TapAuthority?.snapshot?.());
    if(!tap || typeof tap!=='object')return null;
    return {version:token(tap.revision || tap.version), ...numeric(tap,['downs','ups','nativeClicks','activePointers','pending','scrollEvents','styleSamples','unmatchedUps']),
      cancelReasons:Object.fromEntries(Object.entries(tap.cancelReasons || {}).slice(0,16).map(([k,v])=>[token(k),finite(v)])),
      outcomes:(Array.isArray(tap.outcomes)?tap.outcomes:[]).slice(-16).map(x=>({at:finite(x.at),seq:finite(x.seq),target:token(x.target,120),status:token(x.status),kind:token(x.kind),durationMs:finite(x.durationMs),maxDistancePx:finite(x.maxDistancePx),touchAction:token(x.touchAction),scrolled:bool(x.scrolled),detached:bool(x.detached),hitChanged:bool(x.hitChanged)})),
      history:(Array.isArray(tap.history)?tap.history:[]).slice(-16).map(x=>({at:finite(x.at),seq:finite(x.seq),type:token(x.type),target:token(x.target,120)}))};
  }
  function cachedLatencySnapshot() {
    const timing=safe(()=>window.SukunInteractionDiagnostics?.snapshot?.());
    if(!timing || typeof timing!=='object')return null;
    return {version:token(timing.version),timeBase:'navigation-start-ms',eventThresholdMs:40,supported:{eventTiming:bool(timing.supported?.eventTiming),loaf:bool(timing.supported?.loaf)},notINP:true,
      ...numeric(timing,['measuredInteractions','measuredFrames','ignoredDiagnostics']),
      interactions:(Array.isArray(timing.interactions)?timing.interactions:[]).slice(-24).map(x=>({at:finite(x.at),kind:token(x.kind),target:token(x.target,120),...numeric(x,['durationMs','inputDelayMs','handlerMs','presentationDelayMs'])})),
      frames:(Array.isArray(timing.frames)?timing.frames:[]).slice(-16).map(x=>({at:finite(x.at),...numeric(x,['durationMs','blockingMs']),...nullableNumeric(x,['renderStartMs','styleAndLayoutStartMs','renderDurationMs','scriptCount','retainedScriptCount']),scripts:(Array.isArray(x.scripts)?x.scripts:[]).slice(-5).map(s=>({source:s.source?path(s.source):null,charOffset:Number.isFinite(s.charOffset)?s.charOffset:null,function:token(s.function),...numeric(s,['durationMs','forcedLayoutMs'])}))}))};
  }
  function evidenceContext(voiceExpectation=voiceExpectationSnapshot(),recordingPreparation=recordingPreparationSnapshot()) { return { hidden: document.hidden, session, tempo, truth, sw, lock, background, voiceExpectation, recordingPreparation, browserLifecycle: compactLifecycle(), presentation:presentationSnapshot() }; }
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
      closed: reason === 'pagehide', session, tempo, sw, background, browserLifecycle: compactLifecycle(), presentation:presentationSnapshot(), deviceCheck, modelCheck, incidents: incidents.slice(-8), events: events.slice(-18) };
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
      events: historic((Array.isArray(old.events) ? old.events : []).slice(-18)), background:historic(old.background), browserLifecycle:historic(old.browserLifecycle), presentation:compactPresentation(old.presentation), deviceCheck: compactDeviceCheck(old.deviceCheck) };
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
    record(kind, { hidden: document.hidden, persisted: !!persisted, phase: session?.phase || 'unknown', lock:lock ? copy(lock) : null, presentation:presentationSnapshot() });
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
  function audioConsistency(voiceExpectation) {
    if (!truth) return status('AUDIO_CONSISTENCY','NOT_MEASURED','Ses sahipliği tutarlılığı',{});
    // The lifecycle can lag physical playback during an interruption/handoff.
    // This transition is not a proven defect, but cannot be a successful check.
    const transition = truth.state === 'playing' && ['interrupted','recovering','preparing','suspended'].includes(truth.life);
    return status('AUDIO_CONSISTENCY',truth.issues.length ? 'WARN' : transition ? 'OBSERVED' : 'PASS',
      'Ses sahipliği tutarlılığı',{...truth,transition,actualSessionSource:session?.source||'',voiceExpectation,scope:'transport-state-not-audibility',audibility:'NOT_MEASURED'},transition ? 'Ses çalıyor bilgisi ile ses motorunun geçiş durumu henüz eşleşmiyor. Bu tek örnek kalıcı arıza veya duyulan ses kanıtı değildir.' : 'Bu kontrol ses sahiplerinin durumunu karşılaştırır; sessiz tempo da etkin olabilir. Duyulan zikir sesi cihazda ayrıca doğrulanır.');
  }
  function status(code, result, title, evidence, remedy = '') { return { code, status: result, title, evidence, remedy }; }
  function compactDeviceCheck(input) {
    if (!input || input.source !== 'USER_REPORTED' || !Number.isFinite(input.at)) return null;
    const responses = {}, observations = {};
    for (const key of DEVICE_FIELDS) {
      responses[key] = DEVICE_ANSWERS.has(input.responses?.[key]) ? input.responses[key] : 'NOT_TRIED';
      const observed = input.observations?.[key];
      if (observed && Number.isFinite(observed.at)) observations[key] = {
        answer:responses[key],at:observed.at,sessionEpoch:Number.isFinite(observed.sessionEpoch)?observed.sessionEpoch:null
      };
    }
    return {source:'USER_REPORTED',at:input.at,build:token(input.build),responses,observations,
      sessionEpoch:Number.isFinite(input.sessionEpoch)?input.sessionEpoch:null,scope:'reported-at-submission-not-an-automated-session-test'};
  }
  function recordDeviceCheck(responses) {
    // Field timestamps retain the scope of earlier guided reports. A new guide
    // never promotes an automatic result or erases other guide responses.
    const at=now(), merged={...(deviceCheck?.responses || {})}, observations={...(deviceCheck?.observations || {})};
    for (const key of DEVICE_FIELDS) if (Object.hasOwn(responses || {},key)) {
      merged[key]=DEVICE_ANSWERS.has(responses[key])?responses[key]:'NOT_TRIED';
      observations[key]={answer:merged[key],at,sessionEpoch:session?.epoch??null};
    }
    deviceCheck=compactDeviceCheck({source:'USER_REPORTED',at,build,responses:merged,observations,sessionEpoch:session?.epoch});
    record('user-device-check',{source:'USER_REPORTED',at});persist('user-device-check');return read();
  }
  function compactModelCheck(input) {
    if (!input || input.type !== 'matrix') return null;
    const total=finite(input.total), pass=finite(input.pass), fail=finite(input.fail);
    if (![total,pass,fail].every(n=>Number.isInteger(n)&&n>=0&&n<=48) || pass+fail!==total) return null;
    return {source:'ISOLATED_MODEL',at:finite(input.at),total,pass,fail,durationMs:finite(input.durationMs),
      status:fail>0?'FAIL':total===48?'PASS':'NOT_MEASURED',scope:'existing-isolated-r649-rules-not-physical-playback'};
  }
  function runModel() {
    if (modelPromise) return modelPromise;
    modelPromise=Promise.resolve().then(async()=>{
      const lab=window.SukunRegressionSoakLab;
      if (typeof lab?.runMatrix!=='function'||safe(()=>lab.snapshot()?.active)) throw new Error('MODEL_UNAVAILABLE_OR_BUSY');
      const span=safe(()=>window.SukunDiagnosticWork?.begin?.('health-model'));
      try {
        modelCheck=compactModelCheck(await lab.runMatrix());
        if (!modelCheck) throw new Error('MODEL_INCOMPLETE');
        persist('isolated-model');render();return read();
      } finally {safe(()=>window.SukunDiagnosticWork?.end?.(span,500));}
    }).finally(()=>{modelPromise=null;});return modelPromise;
  }
  function currentChecks(cachedInput={},voiceExpectation=null,recordingPreparation=null) {
    const inputTap=cachedInput.taps??taps, inputLatency=cachedInput.latency??latency;
    const out = [status('BUILD', /^r\d+$/.test(build) ? 'PASS' : 'WARN', 'Uygulama sürümü', { build }),
      status('SW_IDENTITY', !sw?.hasController ? 'NOT_MEASURED' : !sw.controller ? 'NOT_MEASURED' : sw.controller === build ? 'PASS' : 'FAIL',
        'Sayfa / Service Worker eşleşmesi', sw || { controlled: !!navigator.serviceWorker?.controller }, 'Farklıysa aktif sesi durdurduktan sonra uygulamanın Güncelle düğmesini kullanın; kayıtları silmeyin.'),
      status('SW_CACHE_COMPLETE', sw?.complete === true ? 'PASS' : sw?.complete === false ? 'FAIL' : 'NOT_MEASURED', 'SW çekirdek dosyaları', { complete: sw?.complete ?? null }),
      status('SESSION_OBSERVATION', session ? 'PASS' : 'NOT_MEASURED', 'Pasif oturum durumu', session || { reason: 'Henüz oturum olayı alınmadı' }),
      status('TEMPO_RANGE', tempo?.value == null ? 'NOT_MEASURED' : tempo.value >= .6 && tempo.value <= 6 ? 'PASS' : 'FAIL', 'Tempo yetkisi', tempo || {}),
      audioConsistency(voiceExpectation),
      status('DEVICE_AUDIO', 'NOT_MEASURED', 'Fiziksel hoparlör ve ekran kilidi doğrulaması', { reason: 'Tarayıcı olayları işitilebilir sesi veya işletim sistemi süreç sonlandırmasını ispatlamaz' }),
      status('PERSISTENCE', storageError ? 'WARN' : lastSaved ? 'PASS' : 'NOT_MEASURED', 'Son durum kaydı', { lastSaved, error: storageError, trimmedRecords:checkpointTrimmed })];
    if(sw)out.push(status('SW_OPERATION',sw.error || sw.phase==='error'?'WARN':'OBSERVED','Çevrimdışı motorun son işlemi',sw,
      sw.error || sw.phase==='error'?'Çevrimdışı motorun bir işlemi tamamlanamadı. Sayfa ve çalışan sürüm eşleşiyorsa ve temel dosyalar tamamsa bu, mevcut önbelleğin bozuk olduğunu göstermez. Bağlantı uygun olduğunda güncelleme denetimini yeniden deneyin; kayıtlarınızı silmeyin.':''));
    if(recordingPreparation)out.push(status('AUDIO_PREPARATION',recordingPreparation.audio?.decodeBlocked?'WARN':'OBSERVED','Kendi kayıt hazırlığı',recordingPreparation,
      'Hazırlık aşaması ve bekleyen ses çözümlemesi gözlenir. Ekran açıkken efekt hazırlığı uzarsa özgün kayıt kullanılır; bu rapor duyulan sesi ölçmez.'));
    const presentation=presentationSnapshot();
    if(presentation)out.push(status('PRESENTATION',presentation.state==='attention'?'WARN':'OBSERVED','Ekrana dönüş gözlemi',presentation,
      'Bu gözlem DOM görünürlüğü ve çizim çağrısı içindir; ekrandaki gerçek pikselleri ölçmez. Siyah ekran sürerse raporu saklayın.'));
    const memory = safe(() => window.SukunSessionMemory?.diagnostics?.());
    if (memory) out.push(status('SESSION_MEMORY', memory.error ? 'WARN' : memory.bootPending ? 'OBSERVED' : memory.writes > 0 ? 'PASS' : 'NOT_MEASURED',
      'Zikir ilerleme kaydı', { version:token(memory.version),bootPending:bool(memory.bootPending),bootCancelled:bool(memory.bootCancelled),writePending:bool(memory.writePending),writes:finite(memory.writes),lastWriteAt:finite(memory.lastWriteAt),error:token(memory.error) },
      'Başarılı yazım işletim sistemi kapanmasını önlemez. Kayıt hatası varsa ilerlemenin kalıcılığı garanti edilmez; kişisel sesleri silmeden yedek alın.'));
    if (background) out.push(status('BACKGROUND_HANDOFF',background.outcome === 'failed' ? 'WARN' : 'OBSERVED',
      'Son arka plan ses aktarımı',{...background,scope:'last-attempt-not-current-audibility'},
      'Bu sonuç son arka plan aktarımı içindir. Ekrana dönünce sesin devam etmesi arka plan sorununun çözüldüğünü kanıtlamaz. Raporu kaydedin; kullanıcı kayıtlarını silmeyin.'));
    if (inputTap) out.push(status('INPUT_DELIVERY','OBSERVED','Tıklama / kaydırma kanıtı',inputTap,'scroll-or-gesture normal kaydırmadır. no-click-observed, target-detached, hit-target-changed ve unresolved-cancel kayıtlarını hedef/zaman ile inceleyin; her iptal hata değildir.'));
    if (tts) out.push(status('TTS_CAPABILITY', !tts.supported || tts.voices === 0 ? 'NOT_MEASURED' : 'OBSERVED', 'Cihaz konuşma motoru', tts, 'Sıfır ses, cihaz/tarayıcı özelliği veya henüz yüklenmemiş ses listesidir; tek başına uygulama hatası değildir. Kendi kayıtlarınız bu motordan bağımsızdır.'));
    if (probe) {
      out.push(status('EARLY_RUNTIME_ERRORS',probe.earlyErrors.length ? 'FAIL' : 'PASS','Hata kaydı başlamadan önceki JavaScript hataları',{errors:probe.earlyErrors},'Kaynak dosya ve satır başlangıç yüklemesi sırasında hata verdi; ham hata metni gizlilik için alınmaz.'));
      out.push(status('AUDIO_CONTEXTS', 'OBSERVED', 'Ses motorları', { contexts: probe.contexts }));
      out.push(status('HEAP', probe.heapRatio != null && probe.heapRatio > .85 ? 'WARN' : probe.heapRatio == null ? 'NOT_MEASURED' : 'OBSERVED',
        'Bellek göstergesi', { heapBytes: probe.heapBytes, heapLimit: probe.heapLimit, ratio: probe.heapRatio }, 'Bu tarayıcı ölçümüdür; tek örnek bellek sızıntısını kanıtlamaz.'));
      out.push(status('LONG_TASKS', !probe.longTaskSupported ? 'NOT_MEASURED' : probe.longTaskWindow.count ? 'WARN' : probe.longTaskWindow.windowComplete === true ? 'PASS' : 'NOT_MEASURED', 'Son iki dakika ana iş parçacığı', { supported:probe.longTaskSupported, ...probe.longTaskWindow, tasks: probe.recentLongTasks }, 'Tanılama işlemleri bu listeden çıkarılır. Liste son 12 örnektir; sayı ve en uzun süre eldeki pencerenin tamamından hesaplanır. Tampon dolmuşsa sayı alt sınırdır. Bu ölçüm dokunma gecikmesi veya INP değildir.'));
    }
    if (inputLatency) out.push(status('LATENCY_ATTRIBUTION', inputLatency.interactions.length || inputLatency.frames.length ? 'OBSERVED' : 'NOT_MEASURED', 'Etkileşim gecikmesi ve kaynak gözlemi', inputLatency,
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
  function compactFlowObservation() {
    const raw = safe(() => window.SukunCadenceUI?.observation?.());
    if (!raw || typeof raw !== 'object') return null;
    const statuses = new Set(['RUNNING','OBSERVED','WARN','NOT_MEASURED']);
    const reasons = new Set(['complete','idle','hidden','cancelled','closed','owner-changed','session-stopped','not-run']);
    const boundedNumber = (key, max) => typeof raw[key] === 'number' && Number.isFinite(raw[key]) && raw[key] >= 0 ? Math.min(max,Math.round(raw[key])) : null;
    return {version:'r981',status:statuses.has(raw.status)?raw.status:'NOT_MEASURED',reason:reasons.has(raw.reason)?raw.reason:'not-run',
      durationMs:boundedNumber('durationMs',3600000),samples:boundedNumber('samples',1000),verifiedMediaPairs:boundedNumber('verifiedMediaPairs',1000),
      observedMediaAdvanceMs:boundedNumber('observedMediaAdvanceMs',3600000),observedCountAdvance:boundedNumber('observedCountAdvance',1000000),
      maxCallbackDelayMs:boundedNumber('maxCallbackDelayMs',3600000),audibleSound:'NOT_MEASURED',screenLock:'NOT_MEASURED',network:'NOT_USED'};
  }
  function read() {
    // Both snapshot APIs return existing bounded buffers; this does not start
    // observers, collect a new timing sample, scan layout, or change playback.
    const cachedInput={taps:cachedTapSnapshot(),latency:cachedLatencySnapshot()}, voiceExpectation=voiceExpectationSnapshot(),recordingPreparation=recordingPreparationSnapshot();
    const result = currentChecks(cachedInput,voiceExpectation,recordingPreparation);
    return { schema: SCHEMA, version: VERSION, build, generatedAt: new Date().toISOString(), boot,
      coverage: { since: born, events: events.length, discardedEvents: droppedEvents, incidentLimit: MAX_ISSUES,
        discardedIncidents: droppedIncidents, hiddenSampling: 'event-only-no-poll', physicalLockScreenTest: deviceCheck && deviceCheck.responses.lockedSound !== 'NOT_TRIED' ? 'USER_REPORTED' : 'NOT_RUN',
        privacy: 'metadata-only-no-recording-no-text-no-url-query', previousScope },
      summary: { currentFailures: result.filter(x => x.status === 'FAIL').length, currentWarnings: result.filter(x => x.status === 'WARN').length,
        unmeasured: result.filter(x => x.status === 'NOT_MEASURED').length, recordedIncidents: incidents.length },
      current: copy(evidenceContext(voiceExpectation,recordingPreparation)), checks: copy(result), deviceCheck:copy(deviceCheck), modelCheck:copy(modelCheck),
      flowObservation:compactFlowObservation(),
      incidents: copy(incidents), timeline: copy(events), previous: copy(previous), lastRun: copy(lastRun) };
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
  async function responseBytes(response,maxBytes) {
    if (!response.ok) throw new Error('HTTP_' + response.status);
    const size = Number(response.headers.get('content-length'));
    if (size > maxBytes) throw new Error('SIZE_LIMIT');
    if (!response.body?.getReader) { const bytes = new Uint8Array(await response.arrayBuffer()); if (bytes.length > maxBytes) throw new Error('SIZE_LIMIT'); return bytes; }
    const reader = response.body.getReader(), chunks = []; let total = 0;
    try { while (true) { const part = await reader.read(); if (part.done) break; total += part.value.length; if (total > maxBytes) { await reader.cancel(); throw new Error('SIZE_LIMIT'); } chunks.push(part.value); } }
    finally { reader.releaseLock(); }
    const bytes = new Uint8Array(total); let offset = 0; for (const part of chunks) { bytes.set(part, offset); offset += part.length; } return bytes;
  }
  async function fetchBytes(url,maxBytes,controller) { return responseBytes(await fetch(url,{cache:'no-store',credentials:'same-origin',signal:controller.signal}),maxBytes); }
  function integrityResult(files,expected,bytes,extra={}) {
    const matched=files.filter(x=>x.status==='MATCH').length, mismatched=files.filter(x=>x.status==='HASH_MISMATCH').length;
    const configurationErrors=files.filter(x=>x.status==='INVALID_ENTRY').length;
    const unverified=Math.max(0,expected-matched-mismatched), complete=expected>0&&matched===expected;
    return status('RUNTIME_INTEGRITY',mismatched||configurationErrors?'FAIL':complete?'PASS':'NOT_MEASURED',
      'Çekirdek dosya SHA-256 doğrulaması',{files,bytes,expected,matched,mismatched,unverified,configurationErrors,complete,checkedAt:now(),scope:'served-through-current-service-worker',...extra},
      mismatched?'İçerik farkı doğrulandı. Tam sürüm paketini birlikte yükleyin; kayıtlarınızı silmeyin.':configurationErrors?'Sürümdeki dosya listesi geçersiz. Raporu saklayın; kayıtlarınızı silmeyin.':'Erişilemeyen dosya bozuk sayılmaz. Bağlantı veya önbellek erişimi uygun olduğunda yeniden deneyin.');
  }
  async function integrityCheck() {
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
    const result=[];let total=0,reserved=0,expected=0;
    const byteBudget=8388608,waiters=new Set();
    function wakeBudget(){for(const wake of [...waiters])wake();}
    function waitForBudget(){return new Promise((resolve,reject)=>{
      let done=false;
      const finish=error=>{if(done)return;done=true;waiters.delete(wake);controller.signal.removeEventListener('abort',abort);error?reject(error):resolve();};
      const wake=()=>finish(),abort=()=>finish(new DOMException('Aborted','AbortError'));
      waiters.add(wake);controller.signal.addEventListener('abort',abort,{once:true});if(controller.signal.aborted)abort();
    });}
    async function reserveBytes(maxBytes){
      while(true){
        if(controller.signal.aborted)throw new DOMException('Aborted','AbortError');
        const available=byteBudget-total-reserved;
        // A temporary reservation is not exhausted capacity. Await its actual
        // byte count before deciding how much the next file may download.
        if(reserved>0&&available<maxBytes){await waitForBudget();continue;}
        const allowance=Math.min(maxBytes,available);
        if(allowance<=0)throw new Error('TOTAL_SIZE_LIMIT');
        reserved+=allowance;return allowance;
      }
    }
    function settleBytes(allowance,actual=0){reserved-=allowance;total+=actual;wakeBudget();}
    try {
      const markerURL=new URL('./sukun-build-'+build+'.json',location.href);
      const bytes=await fetchBytes(markerURL.href,32768,controller);
      let marker;try {marker=JSON.parse(new TextDecoder().decode(bytes));} catch(_) {
        return status('RUNTIME_INTEGRITY','FAIL','Sürüm dosya listesi geçersiz',{reason:'MARKER_INVALID_JSON',checkedAt:now(),scope:'served-through-current-service-worker',configurationErrors:1},'İndirilen sürüm listesi okunamadı. Tam sürüm paketini birlikte yükleyin.');
      }
      if (marker.build!==build||!Array.isArray(marker.runtime)||marker.runtime.length>64)
        return status('RUNTIME_INTEGRITY','FAIL','Sürüm dosya listesi geçersiz',{reason:'MARKER_INVALID',checkedAt:now(),scope:'served-through-current-service-worker',configurationErrors:1},'İndirilen dosya listesi bu sürümün yapısına uymuyor. Raporu saklayın.');
      expected=marker.runtime.length;
      if (!crypto?.subtle) return integrityResult([],expected,0,{reason:'CRYPTO_UNAVAILABLE'});
      const entries=marker.runtime.slice();let cursor=0;
      async function worker() {
        while (cursor<entries.length) {
          const entry=entries[cursor++];let url;
          try {url=new URL(entry?.url,location.href);}catch(_) {result.push({path:'[invalid]',status:'INVALID_ENTRY'});continue;}
          const runtime=/\/assets\/runtime\/[A-Za-z0-9_.-]+$/.test(url.pathname);
          const navigationArt=/\/assets\/wheel-navigation-r964\/(?:gold|copper|silver|dark|crystal)\.png$/.test(url.pathname);
          if (url.origin!==location.origin||!(runtime||navigationArt)||!/^[a-f0-9]{64}$/.test(entry?.sha256||'')) {
            result.push({path:path(url.href),status:'INVALID_ENTRY'});continue;
          }
          const maxFileBytes=navigationArt?2097152:524288;let allowance=0;
          try {
            allowance=await reserveBytes(maxFileBytes);
            let data;
            try{data=await fetchBytes(url.href,allowance,controller);}
            catch(error){if(allowance<maxFileBytes&&error?.message==='SIZE_LIMIT')throw new Error('TOTAL_SIZE_LIMIT');throw error;}
            // Release the pessimistic reservation immediately. Retaining it
            // through SHA digest would count accepted data twice and incorrectly
            // reject later files even when the whole manifest fits the budget.
            settleBytes(allowance,data.length);allowance=0;
            const digest=await crypto.subtle.digest('SHA-256',data);
            const actual=[...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
            result.push({path:path(url.href),status:actual===entry.sha256?'MATCH':'HASH_MISMATCH',expected:entry.sha256,actual});
          } catch(error) {result.push({path:path(url.href),status:token(error?.name==='AbortError'?'TIMEOUT':error?.message||error?.name||'FETCH_ERROR')});}
          finally {if(allowance)settleBytes(allowance);}

        }
      }
      await Promise.all([worker(),worker()]);return integrityResult(result,expected,total);
    } catch(error) {return integrityResult(result,expected,total,{reason:token(error?.message||error?.name||'FETCH_ERROR')});}
    finally {clearTimeout(timer);}
  }
  async function serverVersionCheck() {
    if (navigator.onLine===false) return status('SERVER_VERSION','NOT_MEASURED','Sunucudaki güncelleme bilgisi',{reason:'OFFLINE'},'İnternet bağlantısı gerekir; yerel kontrol kullanılabilir.');
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),6000);
    try {
      const url=new URL('./sukun-latest.json',location.href);
      url.searchParams.set('health',now().toString(36)+'-'+Math.random().toString(36).slice(2,10));
      const response=await fetch(url.href,{cache:'no-store',credentials:'same-origin',signal:controller.signal});
      if (!response.ok) throw new Error('HTTP_'+response.status);
      // This SW can fall back to a cached latest marker. Only the unique probe
      // response URL distinguishes an actual fetch from an earlier cached URL.
      const fresh=response.url===url.href;
      const text=new TextDecoder().decode(await responseBytes(response,32768));
      let data;try{data=JSON.parse(text);}catch(_){throw new Error('MARKER_UNREADABLE');}
      const latest=token(data.latest||data.build||data.v);if(!/^r\d+$/.test(latest))throw new Error('MARKER_UNREADABLE');
      return status('SERVER_VERSION',!fresh?'OBSERVED':latest===build?'PASS':'WARN','Sunucudaki güncelleme bilgisi',
        {latest,build,fresh,checkedAt:now(),scope:fresh?'unique-network-probe':'possibly-cached'},
        !fresh?'Önbellekteki bilgiye erişilmiş olabilir; sunucunun güncel sürümü doğrulanmadı.':latest!==build?'Sunucuda farklı sürüm var. Uygulamanın güncelleme denetimini aktif sesi durdurduktan sonra kullanın.':'Bu istekte sunucu sürümü açık sayfayla eşleşti.');
    } catch(error) {return status('SERVER_VERSION','NOT_MEASURED','Sunucudaki güncelleme bilgisi',{reason:token(error?.name==='AbortError'?'TIMEOUT':error?.message||error?.name),checkedAt:now()},'Sunucuya erişim doğrulanamadı. Yerel sonuçlar kullanılabilir.');}
    finally{clearTimeout(timer);}
  }
  function sampleExplicit() {
    sampleTempo();
    tts = { supported: !!window.speechSynthesis, voices: safe(() => window.speechSynthesis.getVoices().length, 0) };
    taps=cachedTapSnapshot();
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
    latency=cachedLatencySnapshot();
    sampleLock();
    const bridge = safe(() => window.SukunNativeEchoBridge?.snapshot?.());
    if (bridge) fx = { version: token(bridge.effectsVersion), ...numeric(bridge,['cacheBytes','cache','rendering','pending','active','attached','renderBudgetBytes','sourceBudgetBytes']),
      fallbackActive: (bridge.items || []).some(x => x.active && x.mainPlaying && !x.baked), bakedActive: (bridge.items || []).filter(x => x.active && x.baked).length };
  }
  function run(options = {}) {
    if (runPromise) return runPromise;
    const started = now(), deep = options.deep === true, online = deep && options.online === true;
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
        if (online) checks.push(await serverVersionCheck());
        lastRun = { at: started, durationMs: now() - started, deep,online,offline:navigator.onLine===false }; persist('health-run');
        render(); return read();
      } catch (error) {
        checks.push(status('HEALTH_COLLECTION','WARN','Bir tanı ölçümü tamamlanamadı',{name:token(error?.name),frames:frames(error)},'Mevcut olay kaydını JSON olarak paylaşın; eksik ölçüm başarılı sayılmaz.'));
        lastRun = {at:started,durationMs:now()-started,deep,online,incomplete:true}; render(); return read();
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
  function mark(type='') {
    const issueType=['audio','screen','counter','flow','other'].includes(type)?type:'unspecified';
    if(issueType==='unspecified') {
      const markerSeq=record('user-problem-marker',{context:evidenceContext(),issueType});
      pendingMarker={seq:markerSeq,at:now()};
    } else if(pendingMarker) {
      const original=events.find(row=>row.seq===pendingMarker.seq&&row.kind==='user-problem-marker');
      if(original)original.evidence.issueType=issueType;
      else record('user-problem-type',{markerSeq:pendingMarker.seq,at:pendingMarker.at,issueType});
      pendingMarker=null;
    } else record('user-problem-marker',{context:evidenceContext(),issueType});
    persist('user-problem-marker');render();return read();
  }
  const local=(tr,en)=>window.I18N?.lang==='en'?en:tr;
  function refreshLabels() {
    const title=document.getElementById('r940HealthTitle'),exit=document.getElementById('r940HealthClose'),tool=document.getElementById('r940HealthOpen');
    if(title)title.textContent=local('Sistem kontrolü','System check');if(exit)exit.textContent=local('Kapat','Close');if(tool)tool.textContent=local('Sistem kontrolü','System check');
  }
  function mount(host) {
    if (!host || dialog?.open && host !== dialog) return;
    const existing = document.getElementById('r940Health');
    if (existing) { if (!host.contains(existing)) host.append(existing); mounted=existing; render(); return; }
    const panel = document.createElement('details'); panel.id = 'r940Health'; panel.open = true;
    const visual = safe(() => window.SukunHealthViewR943?.mount?.(panel,{
      read,run,exportReport,recordDeviceCheck,runModel,close,
      mark
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
      const title = document.createElement('h2'); title.id='r940HealthTitle'; title.textContent=local('Sistem kontrolü','System check');title.setAttribute('data-i18n-owned','health-r975'); title.style.margin='0';
      const exit = document.createElement('button'); exit.type='button';exit.id='r940HealthClose';exit.setAttribute('data-i18n-owned','health-r975');exit.textContent=local('Kapat','Close'); exit.addEventListener('click',close);
      header.append(title,exit); dialog.append(header); document.body.append(dialog); mount(dialog);
    } else { mount(dialog); }
    if (!dialog.open) dialog.showModal();
    return true;
  }
  function mountTools() {
    const grid = document.querySelector('#r616ToolsSheet .r616ToolGrid');
    if (!grid || document.getElementById('r940HealthOpen')) return !!grid;
    const button = document.createElement('button'); button.type='button'; button.className='r616Tool'; button.id='r940HealthOpen';
    button.setAttribute('data-i18n-owned','health-r975');button.textContent=local('Sistem kontrolü','System check'); button.addEventListener('click',open); grid.append(button); return true;
  }
  function discoverTools() {
    if (mountTools()) return;
    // Existing UI builds asynchronously; bounded retries replace a permanent observer.
    [250,1000,3000].forEach(delay => setTimeout(mountTools,delay));
  }
  window.SukunHealthR940 = Object.freeze({ version: VERSION, read, run, exportReport, mount, render, open, close, mountTools,recordDeviceCheck,runModel,integrityResult,
    mark });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', discoverTools, {once:true}); else discoverTools();
  window.addEventListener('sukun:languagechange',refreshLabels,{passive:true});
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
  window.addEventListener('sukun:presentationrecovery', () => {
    const presentation=presentationSnapshot();if(!presentation)return;
    record('presentation',presentation);
    if(['attention','recovered'].includes(presentation.state) && now()-lastPresentationSave>=15000) {
      lastPresentationSave=now();persist('presentation');
    }
  }, {passive:true});
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
  window.addEventListener('sukun:recordingstartup', e => {
    const d=e.detail||{};record('recording-startup',{phase:token(d.phase),code:token(d.code),stage:token(d.stage),hidden:document.hidden});
  }, {passive:true});
  window.addEventListener('sukun:audio-preparation', e => {
    const d=e.detail||{};record('audio-preparation',{code:token(d.code),purpose:token(d.purpose),at:finite(d.at),hidden:document.hidden});
  }, {passive:true});
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
