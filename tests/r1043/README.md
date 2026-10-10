# r1043 screen-lock audio transition

The native recording owner previously suppressed every hidden replay after an
unexpected pause. A previously confirmed, audible, unchanged source can now
make one resume attempt within 1.5 seconds of a screen-lock transition, after a
120 ms delay. It does not seek, switch sources, change tempo or create counts.
Later OS interruptions, rejected playback, explicit pause/stop, lost ownership,
mute, freeze and page departure retain their existing holds. No heartbeat or
repeated recovery loop is added.

The raw recording volume attack previously depended on RAF, which may not be
delivered on a hidden page. Its 18 ms onset now uses bounded audio timers and
applies the intended volume on hide. Hidden native startup requests that level
before play. Attempt-owned cleanup removes pending work on pause, completion,
stop and pooled-element replacement; zero volume remains zero.

Run from the repository root:

```sh
node tests/r1043/background-interruption.cjs
node tests/r1043/recording-attack.cjs
node tests/r1042/graphics-rest.cjs
node tests/r1042/foreground-sync.cjs
node tests/r1042/hidden-render-audio-ui.cjs
node tests/r1027/release-integrity.cjs
node tests/r1027/full-release-export.cjs
```

Tests execute production code with controlled media events, timers, DOM and
synthetic recordings. They do not establish the cause of the user's physical
Android interruption or verify audible output. The supplied r1042 health file
was exported while IDLE and did not capture an active lock transition.

Device verification: update to r1043, start the selected own recording, lock for
one minute and listen throughout, then unlock and check the current count.
Repeat with Pause/Stop and confirm they remain stopped. If interruption persists,
export the health report in the same tab immediately after returning, before
refreshing it. No recording storage reset is part of this fix.
