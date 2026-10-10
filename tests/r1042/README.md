# Foreground rendering recovery

Long native-recorded dhikr keeps publishing progress while the browser suspends
animation frames on the lock screen. Several legacy UI listeners scheduled a
fresh callback for every publication. They now retain at most one invalidation,
cancel queued frames when hidden, and render the latest state on return.

The presentation observer also called the full practice renderer even when the
surface was already visible. It now repairs only an unobserved or invisible
surface after rechecking small opening/tab fixes. Duplicate foreground lifecycle
notifications share one existing reconciliation timer.

The health validator accepts the four exact recovery/opening assets already in
the release inventory. Same-origin, SHA-256, file size and total byte limits
remain enforced.

Run from the repository root:

```sh
node tests/r1042/presentation-resume.cjs
node tests/r1042/foreground-sync.cjs
node tests/r1042/hidden-render-queue.cjs
node tests/r1042/hidden-render-legacy.cjs
node tests/r1042/hidden-render-audio-ui.cjs
node tests/r1042/graphics-rest.cjs
node tests/r1042/performance-descriptions.cjs
node tests/r1016/recovered/health_ui_audit.cjs
node tests/r1027/release-integrity.cjs
node tests/r1027/full-release-export.cjs
```

These execute production source in controlled DOM/events/timer/RAF fixtures.
Hidden publication bursts, 30–120 minute virtual locks, stale frame cancellation,
final selection and count, user pause and native transport ownership are covered.
The full exporter test uses final deployment bytes and synthetic personal data.
Actual phone lock screens, screen pixels and audible playback are not measured.

Direct canvas/decorative paint entries also respect hidden/frozen rest. Their
visual models retain current data so returning redraws the latest count. Audio
sweep timers and Tekke count/audio callbacks continue independently. Existing
Full/Balanced/Battery preferences are never replaced by the temporary rest state;
the performance help describes all three choices in Turkish and English.

With Git history available, pass `--compare-base=1042620` to either hidden-render
suite to reproduce the r1041 callback backlog alongside the fixed behavior.
