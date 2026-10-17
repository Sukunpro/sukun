# Berhetiyye audio sequencing

The reported flow is the real Berhetiyye 28-name Smart Session preset, one
round with one reading per name. A completed media clock alone did not prove
an audible opening: native playback could advance while the main thread kept
the output gain at zero until its delayed `playing` callback.

`intention-onset.cjs` exercises the shipping recording transport with delayed
native-start callbacks. It checks prearmed raw and graph output, zero volume,
normalisation and step level, short session names, cancellation and the
unchanged ordinary-reader path. `intention-completion.cjs` checks accepted TTS
start/end, cancellation and timeout ownership. `smart-intention-gate.cjs`
checks the actual step-level gate, failure/Retry and fresh-run/resume rules.

`smart-cadence.cjs` checks 27 configured boundaries in a 28-by-one session,
zero gaps, explicit waits, pauses, edits, timed-step budget boundaries,
confirmed-reading ticks and a single owned TTS rhythm onset.

Run controlled production-source fixtures with:

```sh
node tests/r1085/intention-onset.cjs .
node tests/r1085/intention-completion.cjs .
node tests/r1085/smart-intention-gate.cjs .
node tests/r1085/smart-cadence.cjs .
```

`berhet-session-browser.cjs` runs separately against the finalised release. It
uses generated personal PCM recordings in disposable Chromium profiles,
actual preset buttons and unmodified native play/ended/media clocks. It also
offers `--onset-delay` to put an explicitly labelled 800 ms workload after
native `play()` and before its normal callbacks. This tests the audio-clock
and output gains under UI contention rather than speeding or seeking media.

```sh
node tests/r1085/berhet-session-browser.cjs . /absolute/path/report.json
node tests/r1085/berhet-session-browser.cjs . /absolute/path/onset.json --onset-delay
```

The baseline and candidate use the same fixtures. Generated tones establish
ordering, output routing and completion; they do not assess the pronunciation
or audible quality of the user's private recording. Physical Samsung, Android
lock-screen policy and actual device voices are not measured by Linux
Chromium. The released artwork, sparkle and animated menus are retained.
