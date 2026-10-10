# Native recording recovery authority

Run from the repository root, or pass the root as the first argument:

    node tests/r1044/native-recovery-authority.cjs [source-root]
    node tests/r1043/background-interruption.cjs
    node tests/r1043/recording-attack.cjs

The new suite executes the actual native recording caller, VoiceAttempt capture,
SES pause/stop/removal paths, and V2 lock transport against controlled media
objects and timers. It includes browser-like queued pause events, caller and
selection invalidation, orphaned SES membership, same-source/new attempts,
stale cleanup, rejected holds, explicit intents, microphone/foreground holds,
real accepted recovery, and V2 same-lease handoff. Single native audio remains
outside SES; Tekke keeps its existing pause/release contract. An old 28/99 Stop
cannot suppress unrelated newly accepted terkip, intention, or temporary solo
recovery. Only new foreground observations block recovery.

The owner preserves its one-attempt 1500 ms transition window, 120 ms delay,
source checks and rejection holds. Journey recovery additionally requires the
live caller/preference/selection guard, active attempt, original finish handler,
and membership in SES. Cancellation retires recovery before pausing. Reclaiming
the same lease without a new caller preserves the caller guard; canceled hidden
attempts cannot reopen a spent start lease.

These fixtures do not run the full app in a browser and cannot verify physical
Android locking, audio focus or audible output. The final assembled release
still requires its hash/integrity/export checks after metadata regeneration.

Additional release regressions:

    node tests/r1044/recording-volume-intent.cjs [source-root]
    node tests/r1044/intro-version-cache.cjs [source-root]

The volume suite exercises actual playRecording/setZVol through pending native
play, timer and hide events, with current zero/new volume, current reading and
implicit step levels, explicit step options and normalization. The cache suite
runs the exact SW runtimeResponse against a synthetic verified current cache
without historical caches, plus rejected missing and accepted verified older
version cases. It does not weaken the old-version integrity gate.
