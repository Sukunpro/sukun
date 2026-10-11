# r1048 report-driven regression tests

Run from any directory with Python 3 and Node.js. The runner finds the repository
relative to this file; there are no machine-specific source paths.

```sh
python3 tests/r1048/run-regressions.py --output-dir /tmp/sukun-r1048-regressions
python3 tests/r1048/run-regressions.py --static-only --output-dir /tmp/sukun-r1048-integrity
```

The normal run includes supported earlier fixtures and all r1048 contracts.
Static version, syntax, SRI and deployment hash checks are a separate command.
The full-site exporter remains a separate result within the normal report: it
uses final actual deployment bytes plus synthetic personal JSON, without starting
a download. Reports and copied-fixture writes stay in the chosen output directory.
Use `--source-root /path/to/release` to test another coherent release.

The r1048 scripts can also be run separately, with the source root as their first
argument:

- `audio-volume-preview.cjs`: real recording preview callbacks, late read
  cancellation, visible and detail volume controls, raw/native pending playback,
  zero volume, step/normalization and current onset fraction.
- `audio-single-volume.cjs`: actual hidden single-loop recording and both volume
  controls, without changing playback or recovery authority.
- `backup-integrity.cjs`: native full-JSON integrity before planning or merging,
  valid supported transfers and transactional preservation of existing clips.
- `presentation-notice.cjs`: actual notice layout/dismissal in modeled geometry,
  with existing recovery action and no audio/count dependencies.
- `offline-recovery.cjs`: real SW messages, complete release bytes, in-memory
  CacheStorage and serialized recovery UI, including corrupt status and explicit
  verified-current recovery.

The runner excludes helpers, browser-only fixtures and superseded contracts. Six
intro suites target the earlier synthesized oscillator graph: r1027 startup,
r1031 async, r1032 readiness, r1033 diagnostics, r1035 fresh-clock and r1036 timbre.
They are not counted as passed. Current WAV/cache/lifecycle/diagnostic tests from
r1037 onward remain selected. The historical waveform measurement and hardcoded
r1021 integrity manifest are also excluded.

The archived r1017 recording-inspection reader and its whole-object health
comparison expect a removed filename and an earlier schema. Current r1027
active/history reader contracts and health continuity/UI tests remain selected.
This is a fixture compatibility boundary, not evidence of recording loss.

Supported older fixtures were updated for the current code dependencies: prayer
and native-recovery tests load the actual new preview helper; the volume fixture
loads the shared calculator and expects positive edits to retain the short onset
fraction while zero and latest-level/step/normalization checks remain. The r1037
frozen diagnostic allowlist includes the added `audioRejectedMedia` field.
Background/attack fixtures accept an explicit source root. The r1030 navigation
fixture models the newly referenced render scheduling endpoints, while the real
rendering lifecycle remains covered by the r1042 rendering suites.

These are controlled production-source tests with synthetic bytes, DOM/media
endpoints and clocks. They do not establish physical Android lock-screen sound,
audible quality, browser compositor hit-testing or real-user storage durability.
