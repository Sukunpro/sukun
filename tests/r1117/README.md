# r1117 release-transfer verification

The production update transfers the exact 17 differing files from the existing r1117 full-release archive onto r1113. The original root tree is retained, including earlier tests, documentation and assets. No package file is removed merely because the release archive excludes it.

Fresh checks for this transfer:

- `node tools/release-integrity.cjs <release-root>`: 1,529/1,529 identity, SHA-256, byte-size, SRI, syntax, active CSS-resource and version checks.
- `node tests/r1112/library-playback.cjs <release-root> <output>`: 37/37 controlled production-controller regressions.
- `node tests/r1113/library-notice.cjs <release-root> <output>`: 8/8 controlled notice-ownership regressions.
- `SUKUN_R1101_PROFILE=390-tr SUKUN_R1101_CASE='Trusted common Play|Native library selection|Hard Stop|Global Pause' node tests/r1101/frequency-hub-browser.cjs <release-root> <output>`: 6/6 native Chromium regressions, including the mandatory cold-initialization and resource-integrity checks.
- `node tests/r1117/release-mode-smoke.cjs <release-root> <output>`: 7/7 native Chromium checks for pending mode-start Stop, Pause/Resume, held-then-Stop cancellation, idle mode selection, fixed-set ramp retirement, journey pause continuity and production-resource integrity.

Browser scripts use the existing disposable fixture in `tests/r1064/browser-fixture.cjs`. Set `NODE_PATH` to the installed Playwright module root and `CHROMIUM_PATH` if its executable is not `/tmp/sukun-browser/chromium`. Race commands use the actual production DOM handler and public session APIs within one browser task; native AudioContext, oscillator and timer methods are unchanged. The speech fixture and external-network/service-worker blocking are explicit test seams.

The evidence directory contains results generated from the exact transferred production bytes. These runs do not claim physical Android, audible output, operating-system audio-focus, screen-lock or service-worker-upgrade acceptance. Earlier r1114-r1117 test results mentioned in historical release notes were not reconstructed as fresh results for this transfer.
