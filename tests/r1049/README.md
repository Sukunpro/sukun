# r1049 regression fixtures

Run with Python 3 and Node.js from any working directory:

```sh
python3 tests/r1049/run-regressions.py --output-dir /tmp/sukun-r1049-regressions
python3 tests/r1049/run-regressions.py --static-only --output-dir /tmp/sukun-r1049-integrity
```

To test an exported deployment directory that contains no test files, keep this
test tree alongside its runner and pass the deployment source explicitly:

```sh
python3 tests/r1049/run-regressions.py --source-root /path/to/release --output-dir /tmp/sukun-r1049-release-check
```

The runner discovers supported earlier source fixtures plus the r1048 and r1049
contracts. Fixture companions resolve beside their test files, while production
HTML, runtime and worker bytes come from `--source-root`. A copied test workspace
isolates older fixture output files from repository files. Results, timing,
individual outputs and the exclusion reasons are saved in the selected output
directory. Release version, file sizes, hashes, JavaScript syntax and HTML SRI
are counted separately by `--static-only`; full-site export remains an explicit
regression group rather than an actual download.

The new r1049 source contracts are:

- `audio-pause-resume.cjs`: direct recording pause/resume, pending storage reads,
  short onset behavior and level intent in controlled media and timer endpoints.
- `audio-global-intent.cjs`: actual aggregate transport, recording caller and
  user-intent seams for global pause/resume, pending reads and current ownership.
- `audio-registry-resume.cjs`: the registry command's intent fence with an accepted
  raw or native recording, preserving the same source and position on Resume.
- `backup-quarantine.cjs`: actual missing-voice planner and transactional
  `REC_DB.mergeMissing`, isolating the selected quarantine job from prior jobs and
  checking staged-byte integrity, lease cancellation and existing-clip retention.
- `layout-keyboard.cjs`: the actual layout-controller script, requested API mode,
  modal Tab/Shift+Tab boundaries, Escape/button/scrim focus return, delayed focus
  cancellation, stored mode and existing Feyz preference retention. DOM focus
  and idle audio registry endpoints are modeled; the layout is not rasterized.
- `ui-notice-focus.cjs`: actual presentation-notice focus behavior for dismissal,
  successful redisplay, disconnected saved controls, page hiding and focus that
  the user has already moved elsewhere.
- `offline-refresh-integrity.cjs`: the shipped worker and complete release bytes,
  staged graph admission, refresh integrity, cache preservation and lifecycle
  messages with isolated in-memory CacheStorage, network and clients.

Run one contract directly when investigating a failure:

```sh
node tests/r1049/layout-keyboard.cjs /path/to/release
node tests/r1049/offline-refresh-integrity.cjs /path/to/release
```

The runner retains the earlier explicit compatibility boundaries. Six historical
intro contracts target the superseded synthesized oscillator rather than the
shipped WAV graph. The historical waveform measurement, hardcoded r1021
integrity manifest, archived r1017 reader/schema comparisons and browser-only
fixtures are excluded with reasons; they are not counted as passed. Current
WAV/lifecycle/cache diagnostics, storage continuity, active/history readers,
health, current integrity and supported rendering suites remain selected.

These fixtures execute production-source handlers with synthetic audio bytes,
IndexedDB transactions, DOM/media endpoints and clocks. They do not establish
physical Android screen-lock sound, audible quality, actual browser compositor
hit-testing, end-to-end native pointer delivery or real-user storage durability.
The release's live Klasik + Feyz smoke check and physical device observations must
be reported separately from these controlled assertions. An automation timeout
or a delayed UI action alone is not an application defect.
