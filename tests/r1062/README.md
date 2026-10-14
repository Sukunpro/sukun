# Scoped dhikr Pause regressions

Run against the shipped source root:

```sh
node tests/r1062/dhikr-pause-scope.cjs .
node tests/r1062/direct-native-pause.cjs .
```

`dhikr-pause-scope.cjs` executes the actual session command boundary, wheel and
easy-control click handlers, r698 transport authority, registry, dock and
MediaSession bindings. The actual ambience channel lifecycle, primary and
secondary frequency lifecycle, native background controller and production
binding run together. It proves that local Pause/Resume retain the same graphs,
accepted native URL and preparation, while global controls still act globally.
It covers single Esma/Berhetiyye, 28/99 journeys, hidden commands, 10 ambiences,
earlier global/local pauses, pending starts and cleanup barriers, global Stop,
and a later explicit Start after a terminal Stop.

`direct-native-pause.cjs` executes the actual direct Pause/Resume/Stop, retained
native Pause/Resume methods, voice-abort and preparation cancellation. It also
executes the actual native media-clock accumulator and target settlement
authority: long paused wall time and late callbacks give no credit, Resume gives
no immediate credit, and one subsequently observed media unit gives exactly one
count and total credit. Personal/generic recordings, TTS, stale selections,
pending preparation, foreground reservation and deferred Resume are covered.

The current suites contain 63 command-scope cases and 30 direct-native cases.
Paused +1/-1 corrections execute the actual correction owner and retain the
local Pause revision. A native 28/99 Stop and same-kind restart retire that
revision, so a subsequent global Pause/Resume captures the new journey normally.
Retained native admission is also fenced by the accepted source, native lease,
voice epoch, FX/tempo signature, recording lookup and personal recording
revision. A changed preference or recording enters the existing preparation
path without replaying the obsolete recording or giving an immediate credit.

The spoken-owner endpoints in the scope suite, PCM renderer, WebAudio nodes,
native media, time and recording storage are controlled seams. Neither suite
proves physical Android locking, speaker audibility or browser audio focus.
The complete application has a separate integration check.

The r1054 automatic-touch fixture now models scoped owner Pause independently of
the aggregate gate. Its assertions still require one real owner/media Pause and
prove that touching the wheel cannot resume that owner or alter the counter.
