/* r1074: shared decoration follows SceneEngine's canonical selection.
 * Navigation and ambient ownership never choose a second theme.
 * Presentation only: no transport, selection, counter or storage writes. */
(() => {
  'use strict';
  if (window.SukunBerhetTheme?.version === 'r1074') return;
  const root = document.documentElement;
  const read = (fn, fallback = null) => { try { return fn() ?? fallback; } catch (_) { return fallback; } };
  let frame = 0;
  let state = Object.freeze({ version: 'r1074', dock: false, reason: 'boot', mode: '', family: 'base' });
  function sync() {
    frame = 0;
    const selection = read(() => window.SukunSceneEngine?.snapshot()?.selectionTheme);
    const permitted = !!read(() => window.SukunSecretPolicy?.unlocked(), false);
    const dock = permitted && selection?.family === 'berhet';
    const value = dock ? '1' : '0';
    if (root.getAttribute('data-r933-berhet-dock') !== value)
      root.setAttribute('data-r933-berhet-dock', value);
    state = Object.freeze({ version: 'r1074', dock, reason: !permitted ? 'locked' : dock ? 'berhet-selection' : 'other-selection',
      mode: selection?.mode || '', family: !permitted && selection?.family === 'berhet' ? 'base' : selection?.family || 'base' });
  }
  function schedule() {
    if (frame || document.hidden) return;
    frame = requestAnimationFrame(sync);
  }
  function changed() {
    // Access revocation clears decoration even while the document is hidden.
    if (frame) cancelAnimationFrame(frame);
    sync();
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    } else schedule();
  }, { passive: true });
  ['sukun:scenechange', 'sukun:sessionchange', 'sukun:currentzikirchange',
    'sukun:zikirselectionchange', 'sukun:tabchange', 'pageshow'].forEach(event =>
    window.addEventListener(event, schedule, { passive: true }));
  ['sukun:secretaccesschange', 'sukun:selectionthemechange'].forEach(event =>
    window.addEventListener(event, changed, { passive: true }));
  window.SukunBerhetTheme = Object.freeze({ version: 'r1074', refresh: schedule, snapshot: () => state });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', schedule, { once: true });
  else schedule();
})();
