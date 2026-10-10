# r1035 fresh intro audio clock

Run from the repository root:

```sh
node tests/r1035/startup-intro-fresh-clock.cjs .
node tests/r1027/startup-intro.cjs .
node tests/r1029/transparent-intro.cjs .
node tests/r1031/startup-intro-async.cjs .
node tests/r1032/startup-intro-readiness.cjs .
node tests/r1033/startup-intro-diagnostics.cjs .
node tests/r1034/intro-health-diagnostic.cjs .
```

The new regression suite executes the production runtime with wall and audio
clocks that advance separately during graph creation and the final safety
reads. It checks that the graph stays muted and unscheduled until admission,
then verifies all three sine partials, each exact envelope, shared onset,
650-ms duration and unchanged 0.243 amplitude upper bound.

The onset uses a fresh AudioContext currentTime plus 20 ms. The whole 650-ms
hit and its lead must fit strictly inside the 2400-ms visual run, so admission
must occur before 1730 ms of that run. The original cold 2779/43-ms arrival
therefore remains silent; the near-deadline 2759/43-ms case tests the remaining
14-ms admission allowance. Slow graph or safety reads cannot restore it.

Duplicate notifications, interrupted contexts, invalid audio times, trusted
input and physical/tick recording transitions are checked without changing
recordings, ownership or app audio. Production-source fixtures use synthetic
WebAudio endpoints. They establish scheduling and guards, not audible output,
Android browser autoplay eligibility or physical device routing.

The shared fixture retains its default constant 10-second audio clock. Tests
can provide audioCurrentTime as a number or a function of wall time/context,
onReadAudioTime, onCreateGain and onCreateOscillator hooks. currentTimeReads
captures each sample and the graph size at that moment.
