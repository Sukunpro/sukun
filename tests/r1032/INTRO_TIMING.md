# r1032 synchronized optional intro

The approved artwork, dimensions, running keyframes and 1300-ms animation are
unchanged. A short background-only readiness state pauses the mark/light at
its initial frame. The waiting state has its own independent 1-second CSS
exit; it never blocks pointer events. Root-only important exit declarations
preserve this fail-open behavior under the app-wide reduced-motion reset,
without enabling mark/light motion in reduced-motion mode.

The inline bootstrap records parser insertion time for diagnostics, but starts
the 1000-ms readiness budget at the first rendering opportunity. When the
required safety APIs are ready and known idle, one handshake starts the
approved animation and audio eligibility window together. A single blocked
parse before the first rendering opportunity therefore need not consume the
visible hold. Missing owner/registry APIs, as well as the four original audio
safety APIs, are unknown rather than idle. Missing APIs may become ready only
within the bounded hold; unsafe or throwing state ends the attempt silently.

A separate no-frame cleanup watchdog is armed from the first available
zero-delay event-loop task, then allows 1000 ms for the first frame. This
bounds timers/listeners if rAF never arrives without charging a single long
parse before any event-loop task. Its elapsed deadline is checked even if
its expiry callback is stalled. Hidden pages, input and pagehide cancel
terminally. The visible waiting CSS is also checked before the handshake:
an already-hidden/zero-opacity/ended waiting layer is never restarted.

Bounded tradeoff: a forced style calculation can start the CSS waiting clock
before a final paint. If that independent CSS deadline has already ended,
the intro stays silent/hidden even when the first recorded rAF is late. This
patch does not promise audio on every slow load or relax the fail-open limit.
A normal visible hold lasts less than 1000 ms; a successful running animation
then lasts 1300 ms. Its full 650-ms hit must start before 650 ms into that run.

There remains exactly one isolated automatic resume request. The existing
frequencies, gains, envelope, ownership/recording checks and stop behavior
are retained. A visible native/custom DOM dialog also cancels; hidden
ancestors and display/visibility/opacity-hidden dialog nodes do not count as
visible. Reduced-motion selection permanently disables audio for that intro,
including a later preference change or module arrival. No storage writes,
ownership acquisition, autoplay bypass or later user-gesture unlock occurs.

Ephemeral DOM diagnostics:
- bootStarted: parser insertion time, for measuring load delay only
- firstFrameAgeMs and waitStarted: first rendering opportunity and hold origin
- audioModuleAgeMs / audioReadyAgeMs: module arrival / readiness age from boot
- started: the single shared visual/audio running-window origin
- audioOutcome: load_expired (module/CSS/visible-hold already too late),
  readiness_timeout (APIs/ready frame did not arrive within visible hold),
  frame_timeout (no first frame by armed watchdog), resume_timeout (attempt
  could not schedule inside its running-window allowance), blocked (resume
  rejected/threw), scheduled, or a specific safety/cancellation reason
- scheduled proves graph scheduling, not sound at a physical speaker

Run:
```
node tests/r1027/startup-intro.cjs
node tests/r1031/startup-intro-async.cjs
node tests/r1032/startup-intro-readiness.cjs
node tests/r1029/transparent-intro.cjs
node tests/r1028/media-artwork.cjs
node tests/r1029/cinematic-containment-regression.cjs
```

The fixtures execute production source with controlled rendering callbacks,
promises, computed styles, clocks and safety endpoints. They are not physical
Android, real-compositor, browser-autoplay-permission, microphone capture or
speaker tests. The release assembler must refresh SRI and inventories before
publishing. No publication is performed by this focused patch.
