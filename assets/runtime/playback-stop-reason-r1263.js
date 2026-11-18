/* Observe committed transport actions and owned media interruptions. This
   presenter never controls audio. Only the last receipt is kept, in this tab. */
(() => {
  'use strict';
  if (window.SukunPlaybackStopReason) return;

  const key = 'sukun.playback-stop.r1263';
  const codes = new Set(['sleep-timer', 'user-paused', 'user-stopped', 'media-paused',
    'media-stopped', 'watchdog', 'media-error', 'unknown', 'completed']);
  const scopes = new Set(['all', 'zikir', 'background', 'frequency', 'ambience', 'reading', 'journey', 'recording']);
  const activePhases = new Set(['PLAYING', 'PREPARING', 'INTERRUPTED', 'RECOVERING']);
  const intentional = new Set(['retired-caller', 'user-or-owner-hold', 'user-pause', 'app-pause', 'pagehide-hold']);
  let latest = null, pendingCommand = null, playingLease = 0;

  function valid(code, scope, at) {
    return codes.has(code) && scopes.has(scope) && Number.isSafeInteger(at) && at > 0 && at <= Date.now();
  }
  try {
    const previous = JSON.parse(sessionStorage.getItem(key));
    if (previous && valid(previous.code, previous.scope, previous.at)) {
      latest = Object.freeze({code: previous.code, scope: previous.scope, at: previous.at});
    }
  } catch (_) { /* Storage may be unavailable. */ }

  function record(code, scope, at = Date.now()) {
    if (!valid(code, scope, at) || latest && latest.at > at) return;
    if (latest?.at === at && (latest.code === code && latest.scope === scope ||
        code === 'unknown' || latest.scope === 'all' && scope !== 'all')) return;
    latest = Object.freeze({code, scope, at});
    try { sessionStorage.setItem(key, JSON.stringify(latest)); } catch (_) {}
    window.dispatchEvent(new CustomEvent('sukun:playbackstopreason', {detail: latest}));
  }
  function listen(type, handler) {
    window.addEventListener('sukun:' + type, e => handler(e.detail || {}), {passive: true});
  }

  // Peek is the owner's cached pre-command state, and has no transport effects.
  listen('sessioncommand', d => {
    pendingCommand = null;
    if (!['pause', 'stop'].includes(d.action) || !Number.isInteger(d.requestId) || !Number.isInteger(d.epoch)) return;
    const phase = window.SukunSessionState?.peek?.()?.phase;
    if (activePhases.has(phase) || d.action === 'stop' && phase === 'PAUSED') {
      pendingCommand = {action: d.action, requestId: d.requestId, epoch: d.epoch, at: Date.now()};
    }
  });
  listen('sessioncommandresult', d => {
    const p = pendingCommand;
    if (!p || d.requestId !== p.requestId || d.action !== p.action || d.epoch !== p.epoch) return;
    pendingCommand = null;
    if (d.accepted === true && d.stale === false && d.outcome === 'accepted') {
      record(d.action === 'pause' ? 'user-paused' : 'user-stopped', 'zikir', p.at);
    }
  });
  listen('playbackstopped', d => record(d.code, d.scope, d.at));
  listen('journey-watchdog-timeout', d => {
    if (d.reason !== 'resolver-timeout' || !['journey28','journey99'].includes(d.owner)) return;
    if (Number.isInteger(d.index) && d.index >= 0 && d.index < (d.owner === 'journey28' ? 28 : 99)) {
      record('watchdog', 'journey');
    }
  });
  listen('journey-complete', d => {
    if (['28', '99'].includes(d.kind) && d.totalItems === Number(d.kind)) record('completed', 'journey');
  });

  listen('backgroundownerchange', d => {
    if (!d.active || !Number.isSafeInteger(d.lease) || d.lease < 1 || !['single', 'journey'].includes(d.owner)) {
      playingLease = 0;
      return;
    }
    if (d.phase === 'PLAYING' && d.playing === true) {
      playingLease = d.lease;
      return;
    }
    if (d.reason === 'claim' || d.phase === 'ENDED' || d.phase === 'PAUSED' || intentional.has(d.lockRecoveryReason)) {
      playingLease = 0;
      return;
    }
    if (playingLease !== d.lease) return;
    if (d.phase === 'BLOCKED' && d.reason === 'error' && d.error === 'MediaError') {
      playingLease = 0;
      record('media-error', 'recording');
      return;
    }
    const paused = d.reason === 'pause' && d.phase === 'INTERRUPTED' && d.lockRecoveryReason === 'pause-outside-lock-window';
    const recoveryFailed = /^(lock-transition|loop-boundary)-recovery-(rejected|incomplete)$/.test(d.reason);
    if ((paused || recoveryFailed) && d.paused === true && !d.ended && !d.lockRecoveryPending) {
      playingLease = 0;
      record('unknown', 'recording');
    }
  });
  listen('r696-media-interruption', d => {
    // A background lease owns lock/loop recovery; its transient pause alone
    // cannot establish a terminal interruption. Ignore recording IDs entirely.
    if (typeof d.hidden !== 'boolean' || !Number.isFinite(d.currentTime) || d.currentTime < 0 ||
        !valid('unknown', 'recording', d.at) || window.SukunBackgroundAudioOwner?.snapshot?.()?.active) return;
    record('unknown', 'recording', d.at);
  });
  window.SukunPlaybackStopReason = Object.freeze({snapshot: () => latest});
})();
