/* r919: a read model and command boundary for existing session owners.
 * This module never increments a counter, starts a scheduler, or owns media.
 * Async preparation/cancellation remains with the r698 transport/registry.
 */
(() => {
  'use strict';
  /* r1056: shared presentation text; no storage, transport or audio mutation.
   * Preserve the historic audioSource enum for cadence/registry consumers;
   * explicit origin describes whose recorded voice is actually selected. */
  window.SukunAudioSourceText = Object.freeze((() => {
    const clean = value => String(value ?? '').replace(/\s+/g, ' ').trim();
    const language = value => value === 'en' || value == null && window.I18N?.lang === 'en' ? 'en' : 'tr';
    const kinds = value => clean(value).toUpperCase().replace(/-/g, '_');
    function origin(value = {}) {
      const kind = kinds(value.audioSource || value.kind || value.sourceMetadata?.kind || 'NONE');
      if (['SILENCE','SILENT','NONE','IDLE','PREPARING'].includes(kind)) return 'none';
      if (/^(TTS|SPEECH|SES)/.test(kind)) return 'device';
      const explicit = value.recordingOrigin || value.sourceOrigin || value.sourceMetadata?.origin;
      if (['personal','generic','device','none','error','other'].includes(explicit)) return explicit;
      // Compatibility for existing producers. Native explicit origin always
      // wins over a stale resolver label or a differently translated reason.
      const recorded = /RECORD|LOCAL|FILE|SAMPLE|READER/.test(kind);
      const failure = /ERROR|FAIL/.test(kind);
      const generic = value.generic === true || /jenerik|generic|genel ses arşivi|general voice archive/i.test(clean(value.sourceLabel || value.label) + ' ' + clean(value.reason));
      if (recorded || failure) {
        if (generic) return 'generic';
        if (failure) return /kendi kay|your recording|own recording/i.test(clean(value.sourceLabel || value.label)) ? 'personal' : 'error';
        if (/LOCAL|FILE|SAMPLE|READER/.test(kind)) return 'other';
        return 'personal';
      }
      return 'other';
    }
    function label(value = {}, lang) {
      const english = language(lang) === 'en', from = origin(value);
      const failed = /ERROR|FAIL/.test(kinds(value.audioSource || value.kind)) || value.phase === 'ERROR';
      if (!failed && (value.phase === 'PREPARING' || kinds(value.audioSource || value.kind) === 'PREPARING')) {
        const preparing = {personal:['Kendi kaydın hazırlanıyor','Preparing your recording'],generic:['Jenerik kayıt hazırlanıyor','Preparing generic recording'],device:['Cihaz sesi hazırlanıyor','Preparing device voice'],none:['Ses hazırlanıyor','Preparing audio'],error:['Ses hazırlanıyor','Preparing audio'],other:['Ses hazırlanıyor','Preparing audio']};
        return preparing[from][english ? 1 : 0];
      }
      const labels = failed ? {personal:['Kendi kaydın açılamadı','Your recording is unavailable'],generic:['Jenerik kayıt açılamadı','Generic recording is unavailable'],device:['Cihaz sesi açılamadı','Device voice is unavailable'],none:['Ses açılamadı','Audio is unavailable'],error:['Ses açılamadı','Audio is unavailable'],other:['Ses açılamadı','Audio is unavailable']} :
        {personal:['Kendi kaydın','Your recording'],generic:['Jenerik kayıt','Generic recording'],device:['Cihaz sesi','Device voice'],none:['Ses kapalı','Audio off'],error:['Ses açılamadı','Audio is unavailable'],other:['Diğer ses','Other audio']};
      if (!failed && from === 'other') {
        const kind = kinds(value.audioSource || value.kind);
        if (/READER/.test(kind)) return english ? 'Recorded reader' : 'Kayıtlı okuyucu';
        if (/LOCAL|FILE|SAMPLE/.test(kind)) return english ? 'Local recording' : 'Yerel kayıt';
      }
      return labels[from][english ? 1 : 0];
    }
    const chain = lang => language(lang) === 'en' ? 'Your recording → enabled generic archive → device voice' : 'Kendi kaydın → etkin jenerik arşiv → cihaz sesi';
    function modeNote(mode = 'auto', lang) {
      const english = language(lang) === 'en';
      const meaning = window.SukunVoiceSettings?.getContent?.() === 'meaning';
      if (mode === 'personal') return english ? 'Only your recording for the selected content is used. Missing or unclassified audio is reported; another source is not substituted.' : 'Yalnız seçilen içeriğe ait kendi kaydın kullanılır. Eksik veya içeriği belirsiz ses belirtilir; başka kaynak kendiliğinden çalmaz.';
      if (mode === 'generic') return english ? 'Only a matching enabled generic recording is used. Your recordings and device voices are not substituted.' : 'Yalnız eşleşen etkin jenerik kayıt kullanılır. Kendi kayıtların veya cihaz sesi kendiliğinden onun yerine çalmaz.';
      if (mode === 'arabic') return english ? 'Arabic text is read with your selected Arabic device voice.' : 'Arapça metin, seçtiğin Arapça cihaz sesiyle okunur.';
      if (mode === 'turkish' && meaning) return english ? 'The Turkish meaning is read with your selected Turkish device voice.' : 'Türkçe anlam, seçtiğin Türkçe cihaz sesiyle okunur.';
      if (mode === 'turkish') return english ? 'The Turkish recitation is read with your selected Turkish device voice.' : 'Türkçe okunuş, seçtiğin Türkçe cihaz sesiyle okunur.';
      return english ? 'Your recording plays first. Otherwise an enabled generic recording is used, then a suitable device voice.' : 'Kendi kaydın varsa önce o çalar; yoksa etkin jenerik kayıt, o da yoksa uygun cihaz sesi kullanılır.';
    }
    function explanation(value = {}, lang) {
      const english = language(lang) === 'en', from = origin(value);
      if (value.phase === 'ERROR' || /ERROR|FAIL/.test(kinds(value.audioSource || value.kind))) return english ? 'Audio could not complete. Your count is kept; use the existing Retry control.' : 'Ses tamamlanamadı. Sayacın korunur; mevcut Yeniden dene düğmesini kullanabilirsin.';
      if (from === 'personal') return window.SukunVoiceSettings?.getMode?.() === 'personal' ? modeNote('personal',lang) : english ? 'Your own recording has priority over the archive and device voice.' : 'Kendi kaydın, arşivden ve cihaz sesinden önce kullanılır.';
      if (from === 'generic') return window.SukunVoiceSettings?.getMode?.() === 'generic' ? modeNote('generic',lang) : english ? 'No own recording was found for this name; the enabled archive recording is used.' : 'Bu isim için kendi kaydın bulunmadı; etkin arşivdeki kayıt kullanılıyor.';
      if (from === 'device') return modeNote(value.voiceMode || window.SukunVoiceSettings?.getMode?.() || 'auto', lang);
      return english ? 'The source is shown when a recitation is prepared; no audio is started by this indicator.' : 'Okuyuş hazırlandığında kaynak burada gösterilir; bu gösterge sesi başlatmaz.';
    }
    return {version:'r1056',revision:'r1064',origin,label,chain,modeNote,explanation};
  })());
  if (window.SukunSessionState?.version === 'r919') return;
  const read = (fn, fallback = null) => { try { return fn() ?? fallback; } catch (_) { return fallback; } };
  const clean = value => String(value ?? '').replace(/\s+/g, ' ').trim();
  const number = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  const freeze = Object.freeze;
  const listeners = new Set();
  const errors = [], commands = [], missingAssets = new Set();
  const bootId = Date.now().toString(36);
  let epoch = 0, requestId = 0, revision = 0, state = null, identity = '', signature = '';
  let pendingStart = null, refreshQueued = false, collecting = false, commandFailure = null;
  let completion = null, lastReason = 'boot', establishedEpoch = -1;
  let voiceCycle = Object.freeze({phase:'IDLE',revision:0}), voiceSignature = '';

  function journeys() {
    const selected = clean(read(() => window.SukunJourneyController?.target(), 'single'));
    const candidates = [['28', window.SukunBerhetiyyeSeyir], ['99', window.SukunEsma99Seyir]]
      .map(([kind, api]) => ({ kind, api, state: read(() => api?.state(), {}), display: read(() => api?.display()) }));
    const owner = clean(read(() => window.SukunForegroundArbiter?.snapshot()?.owner?.type, ''));
    const active = candidates.find(j => owner === 'journey' + j.kind && (j.state.run || j.state.paused || j.state.systemHold)) ||
      candidates.find(j => j.state.run || j.state.paused || j.state.systemHold);
    const preview = candidates.find(j => j.kind === selected && j.display);
    const direct = read(() => window.currentZikirState?.snapshot(), {});
    const directPlaying = direct.auto || direct.paused || direct.session?.active;
    return { active, selected, view: active || (!directPlaying && preview) || null };
  }

  function derive(reason) {
    const flow = read(() => window.currentFlowState?.snapshot(), {});
    const z = read(() => window.currentZikirState?.snapshot(), flow.zikir || {});
    const np = read(() => window.SukunNowPlayingStore?.get(), {});
    const truth = read(() => window.SukunAudioTruth?.snapshot(), {});
    const arb = read(() => window.SukunForegroundArbiter?.snapshot(), {});
    const registry = read(() => window.SukunAudioSessionRegistry?.aggregateSnapshot(), {});
    const transport = read(() => window.SukunR698Transport?.presentation(), {});
    const transportState = read(() => window.SukunR698Transport?.snapshot(), {});
    const source = read(() => window.SukunVoiceSource?.snapshot(), flow.voice || {});
    const scene = read(() => window.SukunSceneEngine?.snapshot(), read(() => window.SukunR918Visual?.snapshot(), {}));
    const life = read(() => window.AudioLife?.snapshot(), {});
    const j = journeys(), jd = j.view?.display, js = j.active?.state;
    const selectedMode = jd ? (j.view.kind === '28' ? 'berhet' : 'esma') : clean(z.cat || 'esma');
    const mode = j.active ? (j.active.kind === '28' ? 'berhet' : 'esma') : selectedMode;
    const index = jd ? number(jd.index, -1) : number(z.idx, -1);
    const name = clean(jd?.name || z.name || np.sectionTitle || '');
    const count = Math.max(0, number(jd?.count ?? z.count));
    const target = Math.max(0, number(jd?.target ?? z.target));
    const owner = clean(arb.owner?.type || truth.owner?.type || '');
    const failure = read(() => window.SukunRecordingFailure?.get());
    const matchingFailure = failure && failure.active !== false && (!failure.cat || failure.cat === mode) &&
      (failure.index == null || Number(failure.index) === index) ? failure : null;
    const hasZikirOwner = !!(js || z.auto || z.paused || z.session?.active || transportState.direct?.auto || transportState.direct?.paused ||
      transportState.direct?.starting || transportState.pendingStart ||
      /^(auto-zikir|journey28|journey99|smart-session)$/.test(clean(arb.owner?.type || truth.owner?.type)) ||
      read(() => typeof MINI !== 'undefined' && MINI.wasAuto, false));
    const paused = !!(js?.paused || js?.systemHold || z.paused || z.session?.paused || transportState.direct?.paused ||
      hasZikirOwner && (registry.paused || transport.paused || truth.paused));
    const preparing = !!(pendingStart?.waitingStop && pendingStart.epoch === epoch || transportState.pendingStart || transportState.direct?.starting ||
      hasZikirOwner && (transport.preparing || truth.pendingPhysical));
    // Ambient music is not proof that the selected zikr counter is playing.
    const playing = !paused && !!(js?.run || transportState.direct?.auto || z.auto || z.session?.playing);
    const route = j.active ? 'journey' + j.active.kind : owner || flow.playback?.id || 'zikir';
    const nextIdentity = [mode, index, j.view?.kind || 'single'].join(':');
    if (identity && identity !== nextIdentity) { epoch++; completion = null; commandFailure = null; }
    identity = nextIdentity;
    const failed = !!(matchingFailure || transport.failed || commandFailure);
    const bg = read(() => window.SukunBackgroundAudioOwner?.snapshot());
    // The accepted single-loop media remains authoritative between words and
    // while paused. A stale resolver badge cannot relabel that same source as
    // silence/TTS. Only a live owner with the current canonical key qualifies;
    // a primed zero carrier or an old/different recording never supplies proof.
    const single = read(() => window.SukunLockAudio?.snapshot());
    const singleKey = clean(read(() => window.SukunLockAudio?.anahtar(), ''));
    const expectedSingleKey = clean(read(() => window.SukunLockAudio?.beklenenAnahtar(), ''));
    const matchingSingleRecording = !j.view && hasZikirOwner && bg?.active && bg.owner === 'single' &&
      single?.active && single.path === 'single-recording' && ['baked','recording'].includes(single.sourceKind) &&
      singleKey && singleKey === expectedSingleKey;
    const singleSource = read(() => window.SukunSourceState);
    const observedSource = matchingSingleRecording ? {kind:'recording',
      recordingOrigin: ['personal','generic'].includes(single.recordingOrigin) ? single.recordingOrigin : null,
      label:singleSource?.kind === 'recording' && clean(singleSource.reason) || 'Kendi kayıt'} : source;
    const interrupted = !!(hasZikirOwner && bg?.active && (bg.blocked || bg.phase === 'INTERRUPTED'));
    if(playing && !preparing && !interrupted && !failed) establishedEpoch = epoch;
    const cyclePhase = failed ? 'ERROR' : paused ? 'PAUSED' : interrupted ? 'INTERRUPTED' : preparing ? 'PREPARING' : playing ? 'PLAYING' : 'ENDED';
    const cycleSig = [epoch,cyclePhase,observedSource.kind || 'idle'].join('|');
    if(cycleSig !== voiceSignature){voiceSignature=cycleSig;voiceCycle=freeze({phase:cyclePhase,revision:voiceCycle.revision+1,epoch,at:Date.now()});const detail=voiceCycle;queueMicrotask(()=>window.dispatchEvent(new CustomEvent('sukun:voicecyclechange',{detail})));}
    let phase = failed ? 'ERROR' : paused ? 'PAUSED' : interrupted ? 'INTERRUPTED' : playing && establishedEpoch === epoch ? 'PLAYING' : preparing ? 'PREPARING' :
      playing ? 'PLAYING' : hasZikirOwner && ['interrupted', 'recovering'].includes(life.state) ? 'INTERRUPTED' :
      (jd?.complete || completion?.identity === identity) ? 'COMPLETED' : 'IDLE';
    const rawKind = clean(observedSource.kind && observedSource.kind !== 'idle' ? observedSource.kind : flow.source?.kind || np.sourceKind || 'none').toLowerCase().replace(/_/g, '-');
    let audioSource = /error|fail/.test(rawKind) ? 'ERROR' :
      /local|file|sample/.test(rawKind) ? 'LOCAL_RECORDING' :
      /tts|speech/.test(rawKind) || rawKind === 'ses' ? 'TTS' :
      /^reader/.test(rawKind) ? 'READER_RECORDING' :
      /^(recording|user-recording|own-recording|user-record)$/.test(rawKind) ? 'USER_RECORDING' :
      /^(silent|silence|none|idle)$/.test(rawKind) ? 'SILENCE' : rawKind.toUpperCase();
    // An idle per-word source during a running session is not a new source selection.
    const retainedSource = phase === 'PLAYING' && establishedEpoch === epoch && state?.epoch === epoch && ['SILENCE','PREPARING'].includes(audioSource) && state.audioSource !== 'SILENCE';
    if(retainedSource) audioSource=state.audioSource;
    const originInput = retainedSource ? state : {audioSource,
      recordingOrigin: observedSource.recordingOrigin,
      sourceLabel: observedSource.label || flow.source?.label || '',
      reason: observedSource.reason || observedSource.detail || ''};
    const sourceOrigin = window.SukunAudioSourceText.origin(originInput);
    const recordingOrigin = ['personal','generic'].includes(sourceOrigin) ? sourceOrigin : null;
    const sourceMetadata = freeze({kind:audioSource,origin:sourceOrigin,recorded:recordingOrigin !== null,
      provenance:retainedSource ? 'retained' : matchingSingleRecording ? 'native-single' : 'resolver'});
    const activeName = name;
    const total = j.view ? Number(j.view.kind) : Math.max(0, number(z.length));
    return {
      version: 'r919', build: clean(window.SUKUN_BUILD || document.querySelector('meta[name="sukun-build"]')?.content || ''),
      revision: revision + 1, reason, sessionId: bootId + ':' + epoch, epoch, requestId,
      activeMode: mode, activeName, activeIndex: index, arabic: clean(z.cat === mode && z.idx === index ? z.arabic : ''),
      // The display may preview a saved idle journey. Scenes and voice continue
      // to use the existing canonical selection, never that preview.
      canonical: freeze({ mode: clean(z.cat || ''), index: number(z.idx, -1), name: clean(z.name || ''),
        count: Math.max(0, number(z.count)), target: Math.max(0, number(z.target)) }),
      count, countRaw: Math.max(0, number(jd?.count ?? z.countRaw ?? z.count)), target,
      remaining: target > 0 ? Math.max(0, target - count) : null,
      progress: target > 0 ? Math.max(0, Math.min(1, count / target)) : null,
      journeyIndex: j.view ? index : null,
      journeyKind: j.view?.kind || 'single', journeyRunning: !!(js?.run && !js?.paused),
      journeyPaused: !!(js?.paused || js?.systemHold), journeyComplete: !!jd?.complete,
      presentationOnly: !!(j.view && !j.active),
      journey: freeze({ kind: j.view?.kind || null, active: !!j.active, selected: j.selected,
        total, index: j.view ? index : null, complete: !!jd?.complete, paused: !!js?.paused }),
      owner, provider: clean(np.id || flow.playback?.id || ''),
      phase, playbackState: phase.toLowerCase(), playing: phase === 'PLAYING', paused: phase === 'PAUSED',
      preparing: phase === 'PREPARING', audioSource, sourceOrigin, recordingOrigin, sourceMetadata,
      recordingSource: matchingFailure ? 'USER_RECORDING_FAILED' : audioSource === 'USER_RECORDING' ? 'USER_RECORDING' : null,
      sourceLabel: clean(observedSource.label || flow.source?.label || (phase === 'PLAYING' && state?.epoch === epoch ? state?.sourceLabel : '') || ''),
      sceneId: scene.activeSceneId || scene.sceneId || null,
      resolvedSceneId: scene.resolvedSceneId || null,
      backgroundState: scene.sceneLoad || scene.backgroundState || 'unknown',
      isForeground: document.visibilityState === 'visible',
      isTefekkur: !!document.body?.classList.contains('sukun-tefekkur-mode'),
      error: matchingFailure ? clean(matchingFailure.reason || matchingFailure.message || 'Kayıt açılamadı') :
        commandFailure || (transport.failed ? 'Ses başlatılamadı' : null),
      consistency: freeze({ dualJourney: !!(read(() => window.SukunBerhetiyyeSeyir.state().run, false) &&
        read(() => window.SukunEsma99Seyir.state().run, false)), audioIssues: freeze([...(truth.issues || [])]) })
    };
  }

  function refresh(reason = 'refresh') {
    if (collecting) return state;
    collecting = true;
    try {
      const next = derive(reason);
      const comparable = { ...next }; delete comparable.reason; delete comparable.revision;
      const sig = JSON.stringify(comparable);
      if (!state || sig !== signature) {
        signature = sig; state = freeze({ ...next, revision: ++revision });
        for (const fn of listeners) { try { fn(state); } catch (error) { logError('subscriber', error); } }
        window.dispatchEvent(new CustomEvent('sukun:sessionchange', { detail: state }));
      }
      return state;
    } finally { collecting = false; }
  }
  function schedule(reason = 'event') {
    lastReason = reason;
    if (refreshQueued) return;
    refreshQueued = true;
    queueMicrotask(() => { refreshQueued = false; refresh(lastReason); });
  }
  function snapshot() { return refresh('snapshot'); }
  function subscribe(fn, options = {}) {
    if (typeof fn !== 'function') return () => {};
    const initial = snapshot();
    listeners.add(fn);
    if (options.immediate !== false) { try { fn(initial); } catch (e) { logError('subscriber', e); } }
    return () => listeners.delete(fn);
  }

  function route(action, before) {
    const j = journeys(), active = j.active, choice = active || j.view;
    const pc = window.PlaybackController, registry = window.SukunAudioSessionRegistry;
    const direct = window.SukunR698Transport;
    if (action === 'stop') {
      // Wheel and local Finish end only dhikr. Global dock Stop owns stopAll.
      if (direct?.stopDhikr) return direct.stopDhikr('r919-command');
      if (active?.api?.stop) return active.api.stop();
      const local = window.SukunDirectZikirTransportR698;
      return typeof local?.stop === 'function' ? local.stop() !== false : false;
    }
    if (action === 'pause') {
      if (before.phase === 'IDLE' || before.phase === 'COMPLETED') return true;
      // Wheel/easy/local controls hold only their dhikr owner. Ambient and
      // frequency media keep their own scheduler and aggregate state.
      if (direct?.pauseDhikr) return direct.pauseDhikr('r919-command');
      read(() => window.SukunJourneyAudioMachine?.intent?.('pause', 'local:r919-command'));
      if (active?.api.pause) return active.api.pause();
      return window.SukunDirectZikirTransportR698?.pause?.() ?? false;
    }
    if (action === 'play' || action === 'start' || action === 'resume') {
      if (window.SukunVoiceSettings?.checkReady?.() === false) return false;
      if (before.playing || before.preparing) return true;
      if (before.recordingSource === 'USER_RECORDING_FAILED') return false;
      if (choice && !read(() => window.SukunSecretPolicy?.unlocked(), false)) return false;
      // This command is an explicit Start/Resume. Release its matching pause
      // intent before entering the provider; lifecycle recovery never uses it.
      // A global Pause remains authoritative. Local Resume never replays its
      // captured ambient/frequency providers or clears their global hold.
      if (read(() => registry?.aggregateSnapshot()?.paused, false) || window.AudioLife?.userPaused && !window.AudioLife?._terminalIntent) return false;
      if (direct?.resumeDhikr && !before.presentationOnly) return direct.resumeDhikr('r919-command');
      read(() => window.SukunJourneyAudioMachine?.intent?.('play', 'local:r919-command'));
      if (choice) {
        if (!read(() => window.SukunSecretPolicy?.unlocked(), false)) return false;
        return choice.state.paused ? choice.api.resume({ system: false, reason: 'r919-command' }) : choice.api.play();
      }
      if (direct?.playPause && read(() => !!ZIKIR[before.activeMode]?.items, false)) return direct.playPause('r919-command');
      return pc?.play?.(before.provider || undefined);
    }
    if (action === 'retry') {
      const failed = read(() => window.SukunRecordingFailure?.get());
      if (!failed || failed.cat !== before.activeMode || Number(failed.index) !== before.activeIndex) return false;
      window.SukunRecordingFailure?.clearForRetry?.();
      // Clearing the held error is not playback. Exactly one existing owner resumes.
      return route('resume', { ...before, recordingSource: null, phase: 'PAUSED', paused: true });
    }
    if (choice) {
      if (!read(() => window.SukunSecretPolicy?.unlocked(), false)) return false;
      if (action === 'next') return choice.api.next();
      if (action === 'previous') return choice.api.previous();
      if (action === 'restart') return choice.api.jumpTo(Math.max(0, number(choice.state.i)));
    }
    const nav = window.SukunFlowNavigation;
    if (action === 'next') return nav?.nextContext?.({ surface: 'r919' });
    if (action === 'previous') return nav?.previousContext?.({ surface: 'r919' });
    if (action === 'restart') return nav?.restartContext?.({ surface: 'r919' });
    return false;
  }

  async function select(options, token, commandId) {
    const mode = clean(options.mode), kind = clean(options.journeyKind || 'single');
    if (!read(() => !!ZIKIR[mode]?.items, false) || !['single', '99', '28'].includes(kind)) return false;
    if ((mode === 'berhet' || kind !== 'single') && !read(() => window.SukunSecretPolicy?.unlocked(), false)) return false;
    if (kind === '28' && mode !== 'berhet' || kind === '99' && mode !== 'esma') return false;
    const index = options.index == null ? null : Number(options.index), max = read(() => ZIKIR[mode].items.length, 0);
    if (index != null && (!Number.isInteger(index) || index < 0 || index >= max)) return false;
    const category = document.querySelector('#zCats [data-c="' + mode + '"]');
    if (!category) return false;
    // Cancel the native owner's queued Start as well as this boundary's token.
    // A selected name must not inherit the preceding owner's delayed start.
    read(() => window.SukunOpening?.cancel?.());
    read(() => window.SukunR698Transport?.cancelPending?.('r919-selection'));
    const current = snapshot(), oldJourney = journeys().active;
    if (current.playing || current.preparing || current.paused || oldJourney) {
      // A paused old journey remains an active owner in the legacy engines.
      // Retire just that foreground owner; stop() saves i/rep without resetting.
      let retired;
      if (oldJourney) retired = oldJourney.api.stop();
      else if (read(() => !!ZIKIR[current.activeMode]?.items, false))
        retired = window.SukunDirectZikirTransportR698?.stop?.();
      else retired = window.PlaybackController?.stop?.(current.provider || undefined);
      if (retired && typeof retired.then === 'function') {
        retired = await retired;
        if (token !== epoch || commandId !== requestId) return false;
      }
      if (retired === false) return false;
      // Drop captured old foreground resume latches without fabricating Play.
      read(() => window.SukunAudioSessionRegistry?.reconcilePauseGate?.('r919-selection'));
    }
    // Native handlers are selection authority. No independent Z/count writes.
    category.click();
    const journeyApi = kind === '28' ? window.SukunBerhetiyyeSeyir : kind === '99' ? window.SukunEsma99Seyir : null;
    const displayIndex = index ?? (journeyApi ? number(read(() => journeyApi.display()?.index), 0) : null);
    if (displayIndex != null) {
      const item = document.querySelector('#zList [data-i="' + displayIndex + '"]');
      if (!item) return false;
      item.click();
      // Merely opening a saved journey must not erase its stored repeat count.
      if (index != null && journeyApi?.jumpTo?.(index) === false) return false;
    }
    if (window.SukunJourneyController?.select?.(kind) === false) return false;
    read(() => window.currentZikirState?.refresh?.('r919-select', true));
    read(() => window.currentFlowState?.refresh?.('r919-select', true));
    schedule('selection'); return true;
  }

  function command(action, options = {}) {
    action = clean(action).toLowerCase();
    if (!['start', 'play', 'pause', 'resume', 'stop', 'next', 'previous', 'restart', 'retry', 'select', 'adjust'].includes(action))
      return Promise.resolve({ accepted: false, reason: 'unsupported-action', snapshot: snapshot() });
    const before = snapshot();
    if (options.epoch != null && Number(options.epoch) !== epoch)
      return Promise.resolve({ accepted: false, stale: true, reason: 'stale-session', epoch, requestId, snapshot: before });
    if(action==='adjust'){
      // A correction cannot supersede a queued Start or manufacture a new audio epoch.
      const value=window.SukunCountCorrection?.adjust?.(options.delta);
      return Promise.resolve(freeze({accepted:value===true,epoch,requestId,snapshot:refresh('manual-correction')}));
    }
    const isStart = ['start', 'play', 'resume', 'retry'].includes(action);
    if (isStart && pendingStart?.epoch === epoch) return pendingStart.promise;
    // Pause supersedes a queued Start. An immediate Resume must get a fresh
    // request, while both requests still wait for the native stop barrier.
    if (action === 'pause' && pendingStart) {
      pendingStart = null;
      read(() => window.SukunR698Transport?.cancelPending?.('r973-pause-pending-start'));
    }
    if (action === 'stop' || action === 'next' || action === 'previous' || action === 'restart' || action === 'select') {
      epoch++; pendingStart = null; completion = null;
    }
    const id = ++requestId, token = epoch;
    commandFailure = null;
    commands.push({ at: Date.now(), action, requestId: id, epoch: token });
    if (commands.length > 40) commands.shift();
    window.dispatchEvent(new CustomEvent('sukun:sessioncommand', { detail: freeze({ action, requestId: id, epoch: token }) }));
    // Invoke within the user's gesture, before Promise scheduling (audio unlock).
    let result, waitingStop = false;
    try {
      waitingStop = isStart && !!journeys().view && !!read(() => window.SukunR698Transport?.snapshot()?.pendingStop, false);
      if (waitingStop) {
        // The native Stop owns its asynchronous cleanup. Starting a new journey
        // before this barrier settles lets old cleanup terminate the new voice.
        read(() => window.SukunDirectZikirTransportR698?.primeGesture?.());
        if (!read(() => window.SukunAudioSessionRegistry?.aggregateSnapshot()?.paused, false) && !(window.AudioLife?.userPaused && !window.AudioLife?._terminalIntent))
          read(() => window.AudioLife?.markUserPlay?.('local:r919-pending-start'));
        const barrier = window.SukunR698Transport?.whenStopped?.();
        const nativeEpoch = read(() => window.SukunR698Transport?.snapshot()?.intentEpoch, null);
        result = barrier ? Promise.resolve(barrier).then(ok => {
          if (ok === false || token !== epoch || id !== requestId || nativeEpoch !== read(() => window.SukunR698Transport?.snapshot()?.intentEpoch, null) || read(() => window.SukunAudioSessionRegistry?.aggregateSnapshot()?.paused, false) || window.AudioLife?.userPaused || window.AudioLife?._terminalIntent) return false;
          return route(action, before);
        }) : false;
      } else result = action === 'select' ? select(options, token, id) : route(action, before);
    }
    catch (error) { result = Promise.reject(error); }
    const promise = Promise.resolve(result).then(value => {
      const after = refresh('command:' + action);
      return freeze({ accepted: value !== false && value !== undefined, stale: id !== requestId,
        requestId: id, epoch: token, snapshot: after });
    }, error => {
      logError('command:' + action, error);
      if (token === epoch) commandFailure = clean(error?.message || 'İşlem tamamlanamadı');
      return freeze({ accepted: false, stale: token !== epoch, requestId: id, epoch: token, snapshot: refresh('command-error') });
    }).finally(() => { if (pendingStart?.id === id) { pendingStart = null; schedule('command-settled'); } });
    if (isStart) pendingStart = { id, epoch: token, promise, waitingStop };
    schedule('command-pending');
    return promise;
  }

  function logError(kind, error) {
    errors.push({ at: Date.now(), kind, message: clean(error?.message || error).slice(0, 300) });
    if (errors.length > 50) errors.shift();
  }
  async function health() {
    if (window.SukunHealthR940) return window.SukunHealthR940.read();
    const s = snapshot(), controller = navigator.serviceWorker?.controller;
    let registration = null, cacheNames = null;
    try { registration = await navigator.serviceWorker?.getRegistration(); } catch (_) {}
    try { cacheNames = await caches.keys(); } catch (_) {}
    const truth = read(() => window.SukunAudioTruth?.snapshot(), {});
    return {
      schema: 'sukun-health-r919', generatedAt: new Date().toISOString(), session: s,
      measured: {
        build: s.build, serviceWorker: controller ? 'CONTROLLED' : registration?.active ? 'ACTIVE_UNCONTROLLED' : 'NOT_CONTROLLED',
        workerScript: controller?.scriptURL?.split('/').pop() || null,
        cacheNames, cacheReadStatus: cacheNames ? 'READ' : 'UNAVAILABLE',
        audioEngine: window.PlaybackController ? 'API_PRESENT' : 'UNAVAILABLE',
        audible: truth.tangible === true ? 'PHYSICAL_ACTIVITY_OBSERVED' : 'NOT_CONFIRMED',
        wakeLock: 'NOT_MEASURED', droppedAudio: null,
        missingAssetsObservedSinceMonitorStart: [...missingAssets],
        jsErrorsObservedSinceMonitorStart: errors.length,
        assetsFullAudit: 'NOT_RUN', backgroundHardwareTest: 'NOT_RUN'
      },
      errors: errors.map(x => ({ ...x })), commands: commands.map(x => ({ ...x })),
      scene: read(() => window.SukunSceneEngine?.snapshot(), read(() => window.SukunR918Visual?.snapshot(), null))
    };
  }
  async function exportHealth() {
    if (window.SukunHealthR940) return window.SukunHealthR940.exportReport();
    const report = await health();
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = 'sukun-health-' + (report.session.build || 'r919') + '-' + Date.now() + '.json';
    a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); return report;
  }
  function mountHealth() {
    if (new URLSearchParams(location.search).get('diag') !== '1' || document.getElementById('r919Health')) return;
    const box = document.createElement('details'); box.id = 'r919Health';
    box.innerHTML = '<summary>SÜKÛN Health · Tanılama</summary><pre aria-live="polite">Ölçümler bekleniyor.</pre><button type="button" data-health="refresh">Yenile</button><button type="button" data-health="export">Tanılama Raporunu Dışa Aktar</button>';
    box.addEventListener('click', async event => {
      const action = event.target.closest('[data-health]')?.dataset.health;
      if (!action) return;
      const report = action === 'export' ? await exportHealth() : await health();
      box.querySelector('pre').textContent = JSON.stringify(report, null, 2);
    });
    document.body.append(box);
  }
  window.SukunVoiceCycle = freeze({version:'r949',snapshot:()=>voiceCycle});
  window.SukunSessionState = freeze({ version: 'r919', snapshot, peek: () => state, refresh, subscribe, command, health, exportHealth,
    token: () => freeze({ sessionId: snapshot().sessionId, epoch }), isCurrent: token => token?.epoch === snapshot().epoch });
  if (!window.SessionState) window.SessionState = window.SukunSessionState;
  const events = ['sukun:backgroundownerchange', 'sukun:currentzikirchange', 'sukun:currentflowchange', 'sukun:nowplayingchange', 'sukun:playbackchange',
    'sukun:audioaggregatechange', 'sukun:audiotruthchange', 'sukun:voicesource', 'sukun:voicesettingschange', 'sukun:foregroundqueuechange',
    'sukun:journey-advance', 'sukun:tefekkurchange', 'sukun:recordingerror', 'sukun:recordingretry',
    'sukun:scenechange', 'sukun:scenestate', 'sukun:recordingrecovered', 'sukun:tabchange', 'sukun:zikirtransportgate', 'sukun:languagechange'];
  events.forEach(event => window.addEventListener(event, () => schedule(event), { passive: true }));
  window.addEventListener('sukun:journey-complete', () => { completion = { identity }; schedule('complete'); }, { passive: true });
  document.addEventListener('visibilitychange', () => schedule('visibility'), { passive: true });
  window.addEventListener('pageshow', () => schedule('pageshow'), { passive: true });
  window.addEventListener('error', event => {
    if (event.target !== window && event.target?.tagName) {
      const path = event.target.getAttribute?.('src') || event.target.getAttribute?.('href');
      if (path && !path.startsWith('blob:') && !path.startsWith('data:')) missingAssets.add(path.split('?')[0]);
    } else logError('javascript', event.error || event.message);
  }, true);
  window.addEventListener('unhandledrejection', event => logError('promise', event.reason));
  read(() => window.SukunLifecycleHub?.onBodyClass?.(() => schedule('body-class'), { immediate: false }));
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountHealth, { once: true }); else mountHealth();
  refresh('boot');
})();
