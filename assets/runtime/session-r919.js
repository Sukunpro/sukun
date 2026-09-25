/* r919: a read model and command boundary for existing session owners.
 * This module never increments a counter, starts a scheduler, or owns media.
 * Async preparation/cancellation remains with the r698 transport/registry.
 */
(() => {
  'use strict';
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
  let completion = null, lastReason = 'boot';

  function journeys() {
    const selected = clean(read(() => window.SukunJourneyController?.target(), 'single'));
    const candidates = [['28', window.SukunBerhetiyyeSeyir], ['99', window.SukunEsma99Seyir]]
      .map(([kind, api]) => ({ kind, api, state: read(() => api?.state(), {}), display: read(() => api?.display()) }));
    const owner = clean(read(() => window.SukunForegroundArbiter?.snapshot()?.owner?.type, ''));
    const active = candidates.find(j => owner === 'journey' + j.kind && (j.state.run || j.state.paused || j.state.systemHold)) ||
      candidates.find(j => j.state.run || j.state.paused || j.state.systemHold);
    const preview = candidates.find(j => j.kind === selected && j.display);
    const direct = read(() => window.currentZikirState?.snapshot(), {});
    const directPlaying = direct.auto || direct.session?.active;
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
    const hasZikirOwner = !!(js || z.auto || z.session?.active || transportState.direct?.auto ||
      transportState.direct?.starting || transportState.pendingStart ||
      /^(auto-zikir|journey28|journey99|smart-session)$/.test(clean(arb.owner?.type || truth.owner?.type)) ||
      read(() => typeof MINI !== 'undefined' && MINI.wasAuto, false));
    const paused = !!(js?.paused || js?.systemHold || z.session?.paused ||
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
    let phase = failed ? 'ERROR' : paused ? 'PAUSED' : preparing ? 'PREPARING' :
      playing ? 'PLAYING' : hasZikirOwner && ['interrupted', 'recovering'].includes(life.state) ? 'INTERRUPTED' :
      (jd?.complete || completion?.identity === identity) ? 'COMPLETED' : 'IDLE';
    const rawKind = clean(source.kind && source.kind !== 'idle' ? source.kind : flow.source?.kind || np.sourceKind || 'none').toLowerCase().replace(/_/g, '-');
    const audioSource = /error|fail/.test(rawKind) ? 'ERROR' :
      /local|file|sample/.test(rawKind) ? 'LOCAL_RECORDING' :
      /tts|speech/.test(rawKind) || rawKind === 'ses' ? 'TTS' :
      /^reader/.test(rawKind) ? 'READER_RECORDING' :
      /^(recording|user-recording|own-recording|user-record)$/.test(rawKind) ? 'USER_RECORDING' :
      /^(silent|silence|none|idle)$/.test(rawKind) ? 'SILENCE' : rawKind.toUpperCase();
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
      preparing: phase === 'PREPARING', audioSource,
      recordingSource: matchingFailure ? 'USER_RECORDING_FAILED' : audioSource === 'USER_RECORDING' ? 'USER_RECORDING' : null,
      sourceLabel: clean(source.label || flow.source?.label || ''),
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
    if (action === 'stop') return direct?.stop ? direct.stop('r919-command') : pc?.stopAll?.();
    if (action === 'pause') {
      if (before.paused || before.phase === 'IDLE' || before.phase === 'COMPLETED') return true;
      return registry?.pauseAll ? registry.pauseAll('ui:r919-command') : active?.api.pause ? active.api.pause() : pc?.pause?.(before.provider || undefined);
    }
    if (action === 'play' || action === 'start' || action === 'resume') {
      if (window.SukunVoiceSettings?.checkReady?.() === false) return false;
      if (before.playing || before.preparing) return true;
      if (before.recordingSource === 'USER_RECORDING_FAILED') return false;
      if (before.paused && read(() => registry?.aggregateSnapshot()?.paused, false) && registry?.resumeAll) return registry.resumeAll();
      if (choice) {
        if (!read(() => window.SukunSecretPolicy?.unlocked(), false)) return false;
        return choice.state.paused ? choice.api.resume({ system: false, reason: 'r919-command' }) : choice.api.play();
      }
      if (direct?.playPause && ['esma', 'berhet', 'tevhid', 'dua', 'salavat', 'fav'].includes(before.activeMode)) return direct.playPause('r919-command');
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
    if (!['esma', 'berhet'].includes(mode) || !['single', '99', '28'].includes(kind)) return false;
    if ((mode === 'berhet' || kind !== 'single') && !read(() => window.SukunSecretPolicy?.unlocked(), false)) return false;
    if (kind === '28' && mode !== 'berhet' || kind === '99' && mode !== 'esma') return false;
    const index = options.index == null ? null : Number(options.index), max = mode === 'berhet' ? 28 : 99;
    if (index != null && (!Number.isInteger(index) || index < 0 || index >= max)) return false;
    const category = document.querySelector('#zCats [data-c="' + mode + '"]');
    if (!category) return false;
    // Cancel the native owner's queued Start as well as this boundary's token.
    // A selected name must not inherit the preceding owner's delayed start.
    read(() => window.SukunR698Transport?.cancelPending?.('r919-selection'));
    const current = snapshot(), oldJourney = journeys().active;
    if (current.playing || current.preparing || current.paused || oldJourney) {
      // A paused old journey remains an active owner in the legacy engines.
      // Retire just that foreground owner; stop() saves i/rep without resetting.
      let retired;
      if (oldJourney) retired = oldJourney.api.stop();
      else if (['esma', 'berhet', 'tevhid', 'dua', 'salavat', 'fav'].includes(current.activeMode))
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
    if (!['start', 'play', 'pause', 'resume', 'stop', 'next', 'previous', 'restart', 'retry', 'select'].includes(action))
      return Promise.resolve({ accepted: false, reason: 'unsupported-action', snapshot: snapshot() });
    const before = snapshot();
    if (options.epoch != null && Number(options.epoch) !== epoch)
      return Promise.resolve({ accepted: false, stale: true, reason: 'stale-session', epoch, requestId, snapshot: before });
    const isStart = ['start', 'play', 'resume', 'retry'].includes(action);
    if (isStart && pendingStart?.epoch === epoch) return pendingStart.promise;
    if (action === 'stop' || action === 'next' || action === 'previous' || action === 'restart' || action === 'select') {
      epoch++; pendingStart = null; completion = null;
    }
    const id = ++requestId, token = epoch;
    commandFailure = null;
    commands.push({ at: Date.now(), action, requestId: id, epoch: token });
    if (commands.length > 40) commands.shift();
    // Invoke within the user's gesture, before Promise scheduling (audio unlock).
    let result, waitingStop = false;
    try {
      waitingStop = isStart && !!journeys().view && !!read(() => window.SukunR698Transport?.snapshot()?.pendingStop, false);
      if (waitingStop) {
        // The native Stop owns its asynchronous cleanup. Starting a new journey
        // before this barrier settles lets old cleanup terminate the new voice.
        read(() => window.SukunDirectZikirTransportR698?.primeGesture?.());
        const barrier = window.SukunR698Transport?.whenStopped?.();
        result = barrier ? Promise.resolve(barrier).then(ok => {
          if (ok === false || token !== epoch || id !== requestId) return false;
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
  window.SukunSessionState = freeze({ version: 'r919', snapshot, refresh, subscribe, command, health, exportHealth,
    token: () => freeze({ sessionId: snapshot().sessionId, epoch }), isCurrent: token => token?.epoch === snapshot().epoch });
  if (!window.SessionState) window.SessionState = window.SukunSessionState;
  const events = ['sukun:currentzikirchange', 'sukun:currentflowchange', 'sukun:nowplayingchange', 'sukun:playbackchange',
    'sukun:audioaggregatechange', 'sukun:audiotruthchange', 'sukun:voicesource', 'sukun:voicesettingschange', 'sukun:foregroundqueuechange',
    'sukun:journey-advance', 'sukun:tefekkurchange', 'sukun:recordingerror', 'sukun:recordingretry',
    'sukun:scenechange', 'sukun:scenestate', 'sukun:recordingrecovered', 'sukun:tabchange', 'sukun:zikirtransportgate'];
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
