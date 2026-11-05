# r1225 audit corrections

Source base: bade067d8827cf2bd645af189e5f56f822983ab4 (r1224).

Fixes F01–F07 from the 2026-11-05 audit. Shared microphone ownership includes pending permissions, late streams, stop/errors, and stale callbacks. Custom repetitions accept integers 1–9999; verified legacy journals migrate only formerly accepted out-of-range custom settings, preserving counters. Vird dismissal shares cleanup. Delail speech failures halt chaining and preserve the failed paragraph for retry. Hybrid uses the common modal authority. Five helper dialogs have labelled headings.

## Checks

- Run `python3 tests/r1213/run-current-checks.py --scope node --output /tmp/new-empty-evidence` for source, media lifecycle and release integrity checks. Local final candidate: 39/39 groups passed with unchanged source hashes.
- New controlled checks: 45 microphone races, 59 input/target checks, 39 legacy journal upgrade checks, 10 Delail errors/indicator checks, plus modal closure/label contracts.
- `node tests/r1225/modal-browser.cjs` runs the real Chromium modal keyboard acceptance. Added to the existing usability CI workflow.
- Existing full-release workflow retains native upgrade/offline acceptance. CI success must be checked for the exact published commit.

Local Chromium launch was blocked by the cloud executor's socket restriction, including after reviewed escalation. No local browser acceptance is claimed. CI results are separate from these local source results. Physical Samsung S25/Android 17, TalkBack, background microphone indicators, acoustic quality, Bluetooth/lock-screen sessions and device flight-mode acceptance remain untested.

G01 is not filled with unverified religious text/audio. Original Vikaye content still needs a verified source and suitable rights. R01–R04 remain measurement or device-test candidates, not demonstrated fixes in this release.
