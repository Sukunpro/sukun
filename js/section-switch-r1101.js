/* r1101: one section switch delegates to the existing selection boundary.
 * It owns no audio, count, journey progress, access grant or theme attributes.
 */
(() => {
  'use strict';
  const w = window;
  if (w.SukunSectionSwitchR1101) return;
  const $ = id => document.getElementById(id);
  const safe = (fn, fallback = null) => { try { return fn() ?? fallback; } catch (_) { return fallback; } };
  const allowed = () => safe(() => w.SukunSecretPolicy?.unlocked?.(), false) === true;
  const english = () => w.I18N?.lang === 'en';
  const families = new Set(['esma', 'berhet']);
  const remembered = { esma: null, berhet: null };
  let button = null, label = null, raf = 0, subscribed = null;
  let busy = false, generation = 0, lastResult = null;
  const model = () => safe(() => w.SukunSessionState?.peek?.()) || safe(() => w.SukunSessionState?.snapshot?.());
  function selected(state = model()) {
    const mode = state?.canonical?.mode || state?.activeMode || '';
    const raw = state?.canonical?.mode ? state.canonical.index : state?.activeIndex;
    const index = Number.isInteger(Number(raw)) && Number(raw) >= 0 ? Number(raw) : 0;
    return { mode, index };
  }
  function attribute(node, name, value) {
    if (node && node.getAttribute(name) !== String(value)) node.setAttribute(name, String(value));
  }
  function remember(state) {
    if (!state || busy) return;
    const current = selected(state);
    if (!families.has(current.mode) || current.mode === 'berhet' && !allowed()) return;
    const wanted = current.mode === 'berhet' ? '28' : '99';
    const journeyKind = !state.smartSession && state.activeMode === current.mode && state.journeyKind === wanted ? wanted : 'single';
    const next = { index: current.index, journeyKind };
    const previous = remembered[current.mode];
    if (!previous || previous.index !== next.index || previous.journeyKind !== next.journeyKind) remembered[current.mode] = next;
  }
  function mount() {
    const summary = $('r920ViewOptions')?.querySelector(':scope > summary');
    if (!summary) return false;
    if (!button) {
      button = document.createElement('button');
      button.id = 'r1101ModeSwitch';
      button.type = 'button';
      button.hidden = true;
      button.setAttribute('role', 'switch');
      button.setAttribute('data-noi18n', '');
      button.setAttribute('aria-checked', 'false');
      button.innerHTML = '<span id="r1101ModeLabel">Mevlevî</span><span class="r1101ModeTrack" aria-hidden="true"><span class="r1101ModeThumb"></span></span>';
      label = button.querySelector('#r1101ModeLabel');
      button.addEventListener('click', event => {
        // Activating the nested switch must not also open/close its details.
        event.preventDefault();
        event.stopPropagation();
        toggle(true);
      });
      button.addEventListener('keydown', event => {
        // Native button activation supplies Enter/Space clicks. Keep a parent
        // summary's key handlers from treating those keys as disclosure input.
        if (event.key === 'Enter' || event.key === ' ') event.stopPropagation();
      });
    }
    if (button.parentElement !== summary) summary.append(button);
    attribute(summary, 'data-r1101-switch', '1');
    return true;
  }
  function render() {
    raf = 0;
    connect();
    if (!mount()) return;
    const permitted = allowed(), current = selected(), on = current.mode === 'esma';
    button.hidden = !permitted;
    button.disabled = busy || !permitted;
    attribute(button, 'aria-checked', on);
    attribute(button, 'aria-busy', busy);
    attribute(button, 'data-mode', families.has(current.mode) ? current.mode : 'other');
    attribute(button, 'aria-label', english() ? 'Mevlevi / Esma section' : 'Mevlevî / Esmâ bölümü');
    const destination = current.mode === 'berhet' ? (english() ? 'Return to Esma and the Mevlevi scene.' : 'Esmâ bölümüne ve Mevlevî görünümüne dön.') : (english() ? 'Return to Berhetiyye.' : 'Berhetiyye bölümüne dön.');
    attribute(button, 'title', destination + (english() ? ' The current dhikr finishes; ambience and frequencies keep their own state.' : ' Çalan zikir bitirilir; ambiyans ve frekansların durumu korunur.'));
    const text = english() ? 'Mevlevi' : 'Mevlevî';
    if (label.textContent !== text) label.textContent = text;
  }
  function schedule() {
    if (!raf) raf = requestAnimationFrame(render);
  }
  function connect() {
    const api = w.SukunSessionState;
    if (!api || api === subscribed) return;
    subscribed = api;
    api.subscribe(state => { remember(state); schedule(); });
  }
  function announceFailure() {
    const text = english() ? 'The section could not change. Please try again.' : 'Bölüm değiştirilemedi. Yeniden deneyebilirsin.';
    safe(() => typeof w.toast === 'function' ? w.toast(text) : undefined);
  }
  async function toggle(restoreFocus = false) {
    const api = w.SukunSessionState;
    if (busy) return { accepted: false, reason: 'pending' };
    if (!allowed()) return { accepted: false, reason: 'locked' };
    if (typeof api?.command !== 'function') return { accepted: false, reason: 'selection-unavailable' };
    const before = safe(() => api.snapshot());
    remember(before);
    const current = selected(before), destination = current.mode === 'berhet' ? 'esma' : 'berhet';
    const saved = remembered[destination];
    const journeyKind = saved?.journeyKind === (destination === 'berhet' ? '28' : '99') ? saved.journeyKind : 'single';
    const options = { mode: destination, journeyKind };
    // A stopped journey already saves its native index AND repeat count.
    // Omitting index reopens that saved position; jumpTo(index) would reset rep.
    if (journeyKind === 'single') options.index = saved?.index ?? 0;
    const ticket = ++generation;
    busy = true;
    if (button) button.disabled = true;
    schedule();
    let result;
    try {
      result = await api.command('select', options);
      const state = safe(() => api.snapshot());
      const accepted = result?.accepted === true && result?.stale !== true && ticket === generation && allowed() && selected(state).mode === destination;
      if (accepted && destination === 'esma') {
        // This is the explicitly requested Mevlevi destination, so choose its
        // canonical scene through the existing scene API after selection wins.
        safe(() => w.SukunSceneEngine?.setEsmaScene?.('classic'));
      }
      lastResult = { accepted, destination, reason: accepted ? 'accepted' : result?.stale || ticket !== generation ? 'superseded-command' : !allowed() ? 'locked' : 'selection-unavailable' };
      if (!accepted && allowed() && ticket === generation) announceFailure();
      return { ...result, ...lastResult };
    } catch (_) {
      lastResult = { accepted: false, destination, reason: 'command-error' };
      if (allowed() && ticket === generation) announceFailure();
      return { ...lastResult };
    } finally {
      busy = false;
      remember(safe(() => api.snapshot()));
      render();
      if (restoreFocus && allowed() && button?.isConnected && !button.hidden) safe(() => button.focus({ preventScroll: true }));
    }
  }
  function accessChanged() {
    if (!allowed()) {
      // Revocation retires any callback's permission to restore a private view.
      generation++;
      remembered.berhet = null;
      if (button) { button.hidden = true; button.disabled = true; }
    }
    schedule();
  }
  for (const event of ['DOMContentLoaded', 'pageshow', 'sukun:domhydrate', 'sukun:languagechange', 'sukun:tabchange', 'sukun:tefekkurchange']) w.addEventListener(event, schedule, { passive: true });
  for (const event of ['sukun:secretaccesschange', 'sukun:secretpolicyready']) w.addEventListener(event, accessChanged, { passive: true });
  document.addEventListener('visibilitychange', schedule, { passive: true });
  w.SukunSectionSwitchR1101 = Object.freeze({
    version: 'r1101', toggle: () => toggle(), refresh: schedule,
    snapshot: () => ({ version: 'r1101', permitted: allowed(), mode: selected().mode, busy,
      remembered: { esma: remembered.esma && { ...remembered.esma }, berhet: allowed() && remembered.berhet ? { ...remembered.berhet } : null },
      lastResult: lastResult && { ...lastResult } })
  });
  connect();
  schedule();
})();
