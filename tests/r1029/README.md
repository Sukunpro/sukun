# r1029 release regression tests

Run with Node.js from the repository root; an optional final argument selects a different source root.

```sh
node tests/r1029/transparent-intro.cjs
node tests/r1029/recovery-deliberate.cjs
node tests/r1029/ui-surface-contract.cjs
node tests/r1029/cinematic-containment-regression.cjs
```

The tests use production source with synthetic DOM, timers and state. The transparent-logo check decodes both original and derived PNGs using Node built-ins, verifies the approved alpha extraction, and compares all opaque foreground RGB pixels. No microphone, real recording store or personal-data mutation is used.

Also run the baseline suites in `tests/README.md`, the r1016/r1017/r1021 groups, the r1027 release checks, and the r1028 artwork/layout/CSS contracts. On final r1029: 13 baseline groups pass 430/430 checks; 16 targeted groups pass 1491/1491, including 833 static integrity/syntax assertions. The 73 active-reader cases reuse the existing scenario intents. Test totals are not counts of independent physical-device behaviors.

`tests/r1027/full-release-export.cjs` exercises the shipped full-site exporter against all local deployment bytes with one synthetic personal-data fixture. It is a separate controlled export check, not a live personal-data export.

The rotor clip contains the art/control plane. External neon is preserved; decorative main motion pauses while Tekke is visible. Physical Android whole-screen rescaling is not established as resolved. The external orbit/wave neon remains an unclipped sibling on the main screen. Browser rendering, actual hit-testing, audible bass, microphone capture, lock-screen/background behavior and real-device recording durability require separate testing. The optional real-browser fixture was not executed where Chromium/socket or URL policy prevented startup/preview.

No history rewrite, force push, cache clearing, storage reset or personal-data migration is part of r1029.
