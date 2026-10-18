# r1105 verification scope

The Studio baseline reproduces r1104's metadata-only result above 60 seconds.
The new VM suite exercises the shipped service, preparation queue and sample
generator with controlled decoder callbacks and real typed PCM. The supplemental
suite decodes two hash-verified shipped WebM recordings with native FFmpeg and
compares the shipped analysis against independently measured peak, RMS and all
512 min/max bins. Neither suite claims browser decoding or rendered canvas proof.

The readability suite checks the shipped stylesheet, first important-layer
order, target coverage, conservative contrast bounds and retained state rules.
It is a static cascade audit; it does not replace screenshot inspection.

Run from the repository root:

```sh
node tests/r1105/studio-waveform-regression.mjs .
node tests/r1105/studio-waveform-real-audio.mjs .
node tests/r1105/readability-static.cjs .
node tools/release-integrity.cjs .
```

`studio-waveform-browser.cjs` provides 13 native full-app checks, including gold
canvas pixels, real AudioContext decoding, unchanged IndexedDB revisions and
playback state. It was **not run** in this release environment: no Chromium
binary remained and the official download was blocked by network policy.
Physical Android, microphone, screen-lock and audible-output acceptance were
also not run. Do not promote the Node/FFmpeg/static evidence into those claims.

The generic runner keeps native browser suites separate from short Node
fixtures. The first broad run exposed missing release-note translations and
an existing health allowlist gap for mandatory root CSS/JS files; these were
corrected before final verification. Exact final results and source hashes
are recorded in `verification.json` and `evidence/`.
