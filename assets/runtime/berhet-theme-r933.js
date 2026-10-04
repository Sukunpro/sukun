/* r933: a presentation-only Berhetiyye gate for the shared flow dock.
 * Reads existing session/foreground owners; never starts or changes a session.
 * An idle selection themes Practice itself, not an unrelated ambient player.
 */
(() => {
  'use strict';
  if (window.SukunBerhetTheme?.version === 'r933') return;
  const root = document.documentElement;
  const read = (fn, fallback = null) => { try { return fn() ?? fallback; } catch (_) { return fallback; } };
  const clean = value => String(value ?? '').trim();
  const zikirOwner = /^(auto-zikir|journey28|journey99|smart-session)$/;
  const berhetOwner = /^(auto-zikir|journey28|smart-session)$/;
  let frame = 0;
  let state = Object.freeze({ version: 'r933', dock: false, reason: 'boot', mode: '', owner: '', phase: 'IDLE' });

  function paint(next) {
    const value = next.dock ? '1' : '0';
    if (root.getAttribute('data-r933-berhet-dock') !== value)
      root.setAttribute('data-r933-berhet-dock', value);
    state = Object.freeze({ version: 'r933', ...next });
  }

  function sync() {
    frame = 0;
    const session = read(() => window.SukunSessionState?.snapshot());
    const permitted = !!read(() => window.SukunSecretPolicy?.unlocked(), false);
    const foreground = read(() => window.SukunForegroundArbiter?.snapshot()?.owner);
    const mode = clean(session?.activeMode);
    const owner = clean(foreground?.type || session?.owner);
    const phase = clean(session?.phase || 'IDLE');
    // Same owned-zikir test used by dock-r920's visible name. A provider such
    // as "mix" can contain real Berhetiyye plus ambience, so it is not a gate.
    const owned = !!session && !!(session.journey?.active || session.playing ||
      session.paused || session.preparing || zikirOwner.test(clean(session.owner)));
    // A live other foreground owner takes precedence over a retained selection
    // or old paused presentation. In particular, Esma99 is never Berhetiyye.
    const otherOwner = !!owner && !berhetOwner.test(owner);
    const dock = permitted && mode === 'berhet' && owned && !otherOwner;
    const reason = !permitted ? 'locked' : mode !== 'berhet' ? 'other-mode' :
      otherOwner ? 'other-owner' : !owned ? 'idle-selection' : 'berhet-owner';
    paint({ dock, reason, mode, owner, phase });
  }

  function schedule() {
    if (frame || document.hidden) return;
    frame = requestAnimationFrame(sync);
  }

  function accessChanged() {
    // Access revocation clears decoration even while the document is hidden.
    if (!read(() => window.SukunSecretPolicy?.unlocked(), false))
      paint({ ...state, dock: false, reason: 'locked' });
    schedule();
  }

  function visibilityChanged() {
    if (document.hidden) {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    } else schedule();
  }

  ['sukun:sessionchange', 'sukun:currentflowchange', 'sukun:foregroundqueuechange',
    'sukun:tabchange', 'sukun:r616viewchange', 'pageshow'].forEach(event =>
    window.addEventListener(event, schedule, { passive: true }));
  window.addEventListener('sukun:secretaccesschange', accessChanged, { passive: true });
  document.addEventListener('visibilitychange', visibilityChanged, { passive: true });
  window.SukunBerhetTheme = Object.freeze({ version: 'r933', refresh: schedule, snapshot: () => state });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', schedule, { once: true });
  else schedule();
})();
