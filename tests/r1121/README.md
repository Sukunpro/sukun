# r1121 release candidate: navigation and lifecycle fixes

Rebuilt from immutable r1120 commit `7b25996c9d545a3732d758136342da893bba6ed4`, tree `e03a5bb390f65c4dd1a07a665e6f26f0ae6557d4`. This is not a recovered prior r1121 package. No prior r1121 success counts are imported.

## Candidate scope

- Classic navigation labels wrap inside their buttons without a font-size reduction. Public-live r1120 reproduction used an effective 297 CSS-pixel viewport; 320 was not claimed.
- Both 28/99 journeys reject retired watchdogs and delayed wake callbacks, make repeated Resume idempotent, and let the visible Pause state pause rather than restart.
- Frequency journeys retire sweeps; harmonic fallback cancellation holds the actual moving pitch.
- Pending background-loop replacement respects attenuation immediately; intentional stereo mute is distinguished from render failure.

## Evidence and release gate

`evidence/` contains fresh controlled/static execution on the finalized candidate. Baseline negative controls are explicitly labelled and are not passing release results. `frequency-engine-before.json` and `frequency-engine-results.json` are earlier controlled core snapshots, before final shell identity; final core results are in `evidence/frequency-engine-contract.json`.

Run `python3 tests/r1121/run-release-checks.py --baseline /path/to/immutable-r1120 --output /path/to/new-evidence` with Node, Python and Playwright 1.57.0 available. The runner binds the exact Git commit/tree, all deployment bytes and test/helper bytes, requires fresh nonempty JSON results, and rejects source mutation. The CI workflow uses the exact PR head, read-only repository permissions, no persisted credentials, a 35-minute limit, and synthetic JSON artifacts only.

**Native browser CI has not yet run at this initial draft commit. Do not merge until it passes and independent review confirms the exact tested source.** Required suites include geometry, native audio/mode/timer, headroom, renderer, dhikr/ambience/frequency lifecycle, source regression and native service-worker upgrade/offline/rollback tests.

Counts from overlapping suites must not be added. In particular the 105 applicable historical handoff checks include the standalone 29. Four historical keep-disabled-secondary-audible assertions are explicitly superseded, not passes; one unavailable older baseline comparison remains an explicit skip.

## Limits

Controlled providers, timers and simulated document visibility are not actual phone lockscreen evidence. Physical Android/iOS, actual OS locking/background eviction, Bluetooth, phone interruptions, audible output and acoustic/hearing safety remain unverified. Real-device acceptance is separate. No private recordings, credentials, screenshots or personal logs are added.
