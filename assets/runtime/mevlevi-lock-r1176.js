/* SÜKÛN r1176 — Mevleviye/Berhetiyye switch using the existing access boundary.
 * No independent theme, credential, counter or transport owner is introduced. */
(() => {
  'use strict';
  if (window.SukunMevleviLock) return;
  const read = (fn, fallback = null) => { try { return fn() ?? fallback; } catch (_) { return fallback; } };
  const grids = '#sukunDiscovery .discoveryGrid, #tk .r1158TekkeDiscoveryGrid';
  let locking = false, awaitingEntry = false, lastEsmaIndex = null, lockAborter = null;
  let soundContext = null, soundTimer = 0, soundGeneration = 0, soundOutput = null, soundReady = null;
  const english = () => read(() => window.I18N.lang, document.documentElement.lang) === 'en';
  const access = () => window.SukunBerhetGateAccess;
  const session = () => read(() => window.SukunSessionState.snapshot(), {});
  const inBerhet = () => session().activeMode === 'berhet';
  const microphoneBusy = () => !!read(() => window.SukunSilenceSession.snapshot().recording, false) ||
    !!read(() => window.SukunPhysicalRecordingBusyR696(), false);
  function soundSettings() {
    const saved = read(() => JSON.parse(localStorage.getItem('sukun.berhetGate.presentation.v1') || '{}'), {});
    return {enabled: saved.effects !== false, volume: Number.isFinite(saved.volume) ? Math.min(1, Math.max(0, saved.volume)) : .35};
  }
  function stopSound(close = true) {
    soundGeneration++; clearTimeout(soundTimer); soundTimer = 0; soundReady = null;
    if (soundOutput) { try { soundOutput.disconnect(); } catch (_) {} soundOutput = null; }
    if (close && soundContext) { const context = soundContext; soundContext = null; try { context.close()?.catch?.(() => {}); } catch (_) {} }
  }
  function prepareSound() {
    const options = soundSettings();
    if (!options.enabled || !options.volume || document.hidden || microphoneBusy()) return null;
    try {
      const Context = window.AudioContext || window.webkitAudioContext;
      if (!Context) return null;
      if (!soundContext || soundContext.state === 'closed') soundContext = new Context();
      soundReady = Promise.resolve(soundContext.resume());
      soundReady.catch(() => {});
      return soundContext;
    } catch (_) { return null; }
  }
  async function cue(kind) {
    const context = soundContext, generationBeforeResume = soundGeneration;
    if (context && context.state !== 'running' && soundReady) {
      try { await soundReady; } catch (_) {}
    }
    // A hidden page, a later interaction or cancellation must not play a delayed cue.
    if (generationBeforeResume !== soundGeneration || context !== soundContext) return;
    const options = soundSettings();
    if (!context || context.state !== 'running' || !options.enabled || !options.volume || document.hidden || microphoneBusy()) { stopSound(); return; }
    stopSound(false);
    const generation = soundGeneration, start = context.currentTime + .025;
    const output = context.createGain(); soundOutput = output;
    const busy = session().playing || read(() => window.speechSynthesis.speaking, false);
    output.gain.value = options.volume * (busy ? .28 : .65); output.connect(context.destination);
    function tone(frequency, offset, duration, gain, type = 'sine') {
      const oscillator = context.createOscillator(), envelope = context.createGain();
      oscillator.type = type; oscillator.frequency.setValueAtTime(frequency, start + offset);
      envelope.gain.setValueAtTime(.0001, start + offset);
      envelope.gain.exponentialRampToValueAtTime(gain, start + offset + .012);
      envelope.gain.exponentialRampToValueAtTime(.0001, start + offset + duration);
      oscillator.connect(envelope); envelope.connect(output);
      oscillator.start(start + offset); oscillator.stop(start + offset + duration + .02);
    }
    function breath(offset, duration, gain, cutoff) {
      const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * duration), context.sampleRate);
      const values = buffer.getChannelData(0); for (let i = 0; i < values.length; i++) values[i] = Math.random() * 2 - 1;
      const source = context.createBufferSource(), filter = context.createBiquadFilter(), envelope = context.createGain();
      source.buffer = buffer; filter.type = 'bandpass'; filter.frequency.value = cutoff; filter.Q.value = 1.2;
      envelope.gain.setValueAtTime(.0001, start + offset);
      envelope.gain.exponentialRampToValueAtTime(gain, start + offset + .045);
      envelope.gain.exponentialRampToValueAtTime(.0001, start + offset + duration);
      source.connect(filter); filter.connect(envelope); envelope.connect(output); source.start(start + offset);
    }
    if (kind === 'lock') {
      // An original synthesized Hû: aspiration, then a low rounded /u:/ vowel.
      // It does not touch the application's spoken-dhikr queue.
      breath(0, .32, .13, 1050);
      [1, 2, 3, 5, 6].forEach((harmonic, index) => tone(122 * harmonic, .11, .76, [.14, .075, .04, .014, .009][index]));
      // Mechanical contact begins only after the Hû has faded.
      breath(1.02, .065, .12, 1800);
      tone(560, 1.02, .10, .11, 'triangle'); tone(190, 1.055, .14, .10, 'triangle');
    } else {
      // A small releasing click, followed by two clear rising bell notes.
      breath(0, .055, .065, 2200);
      tone(880, .055, .44, .09); tone(1320, .17, .55, .065);
    }
    soundTimer = setTimeout(() => { if (generation === soundGeneration) stopSound(); }, kind === 'lock' ? 1500 : 1000);
  }
  function announce(tr, en, grid = null) {
    const value = english() ? en : tr;
    const status = grid?.parentElement?.querySelector('[data-mevlevi-lock-status]') || document.getElementById('sukunDiscoveryStatus');
    if (status) status.textContent = value;
  }
  const beadPositions = [[29,19],[21,29],[16,41],[14,54],[15,68],[20,81],[29,92],[41,99],[55,100],[68,95],[78,86],[84,73],[86,59],[84,45],[79,32],[70,22]];
  function picture() {
    return '<svg class="r1176LockArt" viewBox="0 0 100 126" aria-hidden="true" focusable="false">' +
      '<path class="r1176TasbihCord" d="M45 13C-3 14 1 99 47 103S108 23 56 14"/>' +
      beadPositions.map(([x,y]) => '<circle class="r1176TasbihBead" cx="'+x+'" cy="'+y+'" r="5.1"/>').join('') +
      '<path class="r1176LockShackle" d="M35 55V42a15 15 0 0 1 30 0v13"/>' +
      '<rect class="r1176LockBody" x="27" y="51" width="46" height="39" rx="10"/>' +
      '<path class="r1176LockEtching" d="M33 59h34M33 82h34M35 63l-3 8 3 7M65 63l3 8-3 7"/>' +
      '<path class="r1176LockKey" d="M54 68a4 4 0 1 0-8 0c0 1.5.7 2.6 2 3.4L47 78h6l-1-6.6c1.3-.8 2-1.9 2-3.4Z"/>' +
      '<path class="r1176TasbihCord" d="M47 104v8m0-1-5 11m5-11v12m0-12 5 11"/><circle class="r1176TasbihBead" cx="47" cy="107" r="4.5"/></svg>';
  }
  function refresh() {
    const state = session(), active = state.activeMode === 'berhet';
    if (!locking && !awaitingEntry && state.activeMode === 'esma' && Number.isInteger(state.activeIndex)) lastEsmaIndex = state.activeIndex;
    document.querySelectorAll('[data-mevlevi-lock]').forEach(button => {
      button.dataset.lockMode = active ? 'berhet' : 'mevlevi';
      button.setAttribute('aria-pressed', String(active)); button.disabled = locking;
      button.setAttribute('aria-busy', String(locking));
      const name = english() ? 'Mevleviye lock' : 'Mevleviye kilidi';
      const action = active ? (english() ? 'Return to Mevleviye' : 'Mevleviye’ye dön') : (english() ? 'Open Berhetiyye' : 'Berhetiyye’ye geç');
      button.querySelector('[data-lock-title]').textContent = name;
      button.querySelector('[data-lock-action]').textContent = locking ? (english() ? 'Locking…' : 'Kilitleniyor…') : action;
      button.setAttribute('aria-label', name + ' · ' + action);
      button.title = active ? (english() ? 'Lock Berhetiyye and return to Mevleviye' : 'Berhetiyye’yi kilitle ve Mevleviye’ye dön') :
        (english() ? 'Enter Berhetiyye through the private gate' : 'Şifreli kapıdan Berhetiyye’ye geç');
    });
  }
  function mount() {
    document.querySelectorAll(grids).forEach(grid => {
      if (grid.querySelector('[data-mevlevi-lock]') || !grid.querySelector('[data-discovery="berhet"]')) return;
      const button = document.createElement('button'); button.type = 'button';
      button.className = 'r1176MevleviLock'; button.setAttribute('data-mevlevi-lock', '');
      button.innerHTML = picture() + '<span data-lock-title></span><small data-lock-action></small>';
      grid.append(button); grid.setAttribute('data-mevlevi-switch', '');
      if (!grid.closest('#sukunDiscovery')) {
        const status = document.createElement('p'); status.setAttribute('data-mevlevi-lock-status', '');
        status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite'); grid.after(status);
      }
    });
    refresh();
  }
  function abortable(operation, signal) {
    return new Promise((resolve, reject) => {
      const aborted = () => { const error = new Error('Lock operation cancelled'); error.name = 'AbortError'; reject(error); };
      if (signal.aborted) { aborted(); return; }
      signal.addEventListener('abort', aborted, {once:true});
      Promise.resolve(operation).then(value => { signal.removeEventListener('abort', aborted); resolve(value); }, error => {
        signal.removeEventListener('abort', aborted); reject(error);
      });
    });
  }
  async function activate(button) {
    if (locking || awaitingEntry) return;
    const grid = button.closest('[data-mevlevi-switch]');
    announce('', '', grid); prepareSound();
    if (!inBerhet()) {
      const gate = window.SukunBerhetGate;
      if (!gate || typeof gate.open !== 'function') { stopSound(); announce('Geçiş henüz hazır değil. Lütfen yeniden dene.', 'The gate is not ready. Please try again.', grid); return; }
      awaitingEntry = true;
      try { gate.open({trigger:button}); }
      catch (_) { awaitingEntry = false; stopSound(); announce('Kapı açılamadı. Lütfen yeniden dene.', 'The gate could not open. Please try again.', grid); }
      return;
    }
    locking = true; refresh();
    const destination = lastEsmaIndex;
    const controller = new AbortController(); lockAborter = controller;
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      if (typeof access()?.endSession !== 'function') throw new Error('access-unavailable');
      // This boundary parks concealed queue steps and cancels their real owner.
      // Never invoke the destructive legacy lock directly.
      const closed = await abortable(access().endSession({signal:controller.signal}), controller.signal);
      // An adapter that ignores its signal may finish later. Its late result
      // cannot select a mode or play a success sound after this intent expires.
      if (controller.signal.aborted || lockAborter !== controller) throw new Error('lock-cancelled');
      clearTimeout(timeout);
      if (closed === false || closed?.ok === false) throw new Error('lock-incomplete');
      if (access().isUnlocked()) throw new Error('lock-incomplete');
      const options = {mode:'esma', journeyKind:'single'};
      if (Number.isInteger(destination) && destination >= 0 && destination < 99) options.index = destination;
      const result = await window.SukunSessionState.command('select', options);
      if (result === false || result?.accepted === false || inBerhet()) throw new Error('selection-incomplete');
      cue('lock');
      announce('Berhetiyye kilitlendi. Mevleviye açık.', 'Berhetiyye locked. Mevleviye is open.', grid);
    } catch (_) {
      stopSound();
      announce('Geçiş tamamlanamadı. Mevcut görünümü kontrol edip yeniden dene.', 'The switch did not complete. Check the current view and try again.', grid);
    } finally {
      clearTimeout(timeout);
      if (lockAborter === controller) lockAborter = null;
      locking = false; refresh();
    }
  }
  document.addEventListener('click', event => {
    const button = event.target.closest?.('[data-mevlevi-lock]');
    if (button) void activate(button);
  });
  document.addEventListener('sukun:berhet-gate-state', event => {
    if (awaitingEntry && event.detail?.open === false) {
      awaitingEntry = false;
      if (inBerhet() && access()?.isUnlocked?.()) cue('unlock'); else stopSound();
    }
    refresh();
  });
  ['sukun:domhydrate', 'sukun:tabchange', 'pageshow'].forEach(name => window.addEventListener(name, mount));
  ['sukun:sessionchange', 'sukun:secretaccesschange', 'sukun:languagechange', 'sukun:selectionthemechange'].forEach(name => window.addEventListener(name, refresh));
  ['sukun:mediaactivitychange', 'sukun:itemrecordingchange'].forEach(name => window.addEventListener(name, () => { if (microphoneBusy()) stopSound(); }));
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopSound(); });
  window.addEventListener('pagehide', () => { awaitingEntry = false; lockAborter?.abort(); stopSound(); });
  window.SukunMevleviLock = Object.freeze({version:'r1176', refresh:mount,
    snapshot:() => ({mode:inBerhet()?'berhet':'mevlevi', locking, awaitingEntry})});
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, {once:true}); else mount();
})();
