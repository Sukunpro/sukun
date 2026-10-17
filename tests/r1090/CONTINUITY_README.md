# r1090 — deferred navigation and restart ownership

The timeline's jump and smart-step restart use the existing Player continuation
receipt. Its token, queue, step reference/index and selected category/index/form
must still match after cleanup and source preparation. Pause, Stop and queue
replacement retire the receipt. A read-only `hasPendingContinuation()` lets the
existing session command boundary reach that same owner during the short idle
handoff; it neither emits events nor derives another snapshot.

Direct restart uses the existing direct navigation generation, command request,
AudioLife intent and selection guards. Stale exits retire only their own receipt.
A canonical terminal/selection/start command also retires a direct continuation
when its scheduler is already idle inside cleanup. Rapid valid navigation keeps
its continuation; manual count correction does not change selection identity.
When the prior physical tab lock is still closing, the existing bounded
TabOwner admission is awaited with that same receipt. A queued defer(false)
cannot be reported as a failed restart while it later starts native audio.

## Controlled source tests

```sh
node tests/r1090/deferred-continuation.cjs .
node tests/r1090/direct-restart.cjs .
node tests/r1089/navigation-races.cjs .
node tests/r1072/retired-single-pause.cjs .
node tests/r1062/dhikr-pause-scope.cjs .
```

The first two contain 50 smart continuation and 40 direct restart checks.
They execute production function bodies with controlled timer/source
readiness delivery. They cover terminal commands, queue/selection/form changes,
rapid navigation, stale callbacks, delayed admission and canonical route
acceptance. The retained suites protect previous navigation and local/global
sound scope behavior. These are engineering endpoint tests, not device tests.

## Native Chromium companions

```sh
NODE_PATH=/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules \
CHROMIUM_PATH=/tmp/sukun-browser/chromium \
SUKUN_QA_SOURCE_SHA256=<frozen-HTML-SHA256> \
node tests/r1090/deferred-continuation-browser.js . /absolute/qa/smart.json

NODE_PATH=/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules \
CHROMIUM_PATH=/tmp/sukun-browser/chromium \
SUKUN_QA_SOURCE_SHA256=<frozen-HTML-SHA256> \
node tests/r1090/direct-restart-browser.js . /absolute/qa/direct.json
```

Both fixtures serve unchanged application bytes and use a disposable profile in
Classic/Feyz. Generated PCM recordings occupy only fixture-owned personal keys;
media play/pause/currentTime/ended and AudioContext clocks stay native. Race
commands deliberately share a browser task through actual production handler or
command APIs. Canonical cases assert `accepted: true` separately from direct
Player cases. Source-preparation cases hold a real reads-only readwrite transaction in the
disposable recording database and observe pending application reads after source
admission; they never synthesize a successful reading. Exact r422 pre-admission
receipt timing is covered separately by the controlled source cases and native
immediate-handoff command cases. Mixed cases retain the
actual rain and two frequency graphs through local commands.

The native companions contain 26 smart-continuation and 7 direct-restart groups.
The final frozen r1090 candidate passed both in full with exit code 0. Each run's
completion receipt records its own source/test hashes, completed group count and
awaited browser/context/server cleanup. Earlier fixture attempts are retained as
superseded evidence rather than included in those final totals.

No physical Samsung/Android, OS lock-screen/audio focus, perceptual recitation
quality, microphone or real user profile is measured. Service workers are blocked
in these audio companions; the separate offline suite covers update/offline state.
