# Studio read-only long-inspection regression

Run `node tests/r1099/studio-regression.mjs` from the project root. Requires Node 18+ and ffmpeg with libopus. This suite executes the shipped modules in a Node VM with controlled decode callbacks and real typed PCM. It generates temporary real Opus/WebM media and checks the existing packaged `dua:ak` and `koruma:4` media. No audio asset, user recording, or storage revision is modified.

The r1098 snapshots in `fixtures/` are intentional test inputs to reproduce the old 60-second rejection. Current runtime tests cover the separate 180-second read-only admission, original 60-second/8 MiB/32 MiB decoded processing bounds, metadata cache isolation, unchanged source hashes, no fabricated sample statistics, exact short-clip processing, cancellation and queue ownership. WebM's conservative one-second margin is tested: a generated 178.8-second Opus source fits; 179/180/181-second sources exceed the verified 180-second ceiling.

`inspectBytes` remains a raw pure parser for offline audit callers, rather than the final admission authority. Its legacy WAV branch may report durations over 60 seconds. Tests verify final permission through `inspect` and `run`; raw format facts cannot grant decode or edit permission.

`node-results.json` is produced by the executed tests. These VM tests do not prove native browser decoding, physical Android lock-screen behavior, or the full Klasik/Feyz UI. Native browser tests require an installed Chromium executable; the Playwright library alone does not provide one.

Run `node tests/r1099/native-browser.mjs` for the optional real Chromium AudioContext/Worker suite. Set `SUKUN_CHROMIUM` to an existing browser executable if it is outside the usual Playwright/system paths. It writes `native-browser-results.json` and explicitly reports a skip when Chromium is absent. It never downloads a browser.

The same-key recording-catalog regression also checks completed analysis invalidation: changed source revisions clear old measurements without an implicit decode; unchanged and unrelated sources preserve valid results. The native Chromium suites now ran successfully (5 runtime checks, 6 Klasik/Feyz UI checks); see their result JSON for exact source hashes. Run `node tests/r1099/ui-browser.mjs` for the UI suite. It uses an isolated browser profile and synthetic/public fixture audio only.
