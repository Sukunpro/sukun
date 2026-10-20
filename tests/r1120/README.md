# r1120 verification scope

Run commands from the repository root. Preserve the frozen r1119 baseline separately; the browser commands below use `$BASELINE` for its absolute path. These commands regenerate evidence, not production assets.

## Controlled and source checks

```sh
node tests/r1120/manual-sets-contract.cjs . tests/r1120/evidence/manual-sets-contract.json
node tests/r1120/audio-frequency-contract.cjs . tests/r1120/evidence/audio-frequency-contract.json
node tests/r1120/harmonic-automation-contract.cjs . tests/r1120/evidence/harmonic-automation-contract.json
python tests/r1120/run-controlled-regressions.py
python tests/r1120/run-source-checks.py
python tests/r1120/run-release-integrity.py
node tests/r1120/health-marker-bytes.cjs
```

- Manual sets: 19 source/VM DOM/storage/bridge checks. Covers create/edit/cancel/load/play intentions, complete settings, confirmation, validation, corruption, storage failure, detected conflicts, localization and text-only rendering. It does not establish real browser behavior, simultaneous-writer exclusion, layout or audio.
- Digital gain contracts: extracted production functions run in a VM with explicit AudioParam scheduling logs. These verify gain formulas and timer-fade schedules, not rendered or audible sound.
- Controlled aggregate: the documented historical range through r1048 with its explicit exclusions. Later source/map suites and browser suites are separate evidence, not an implicit extension of that aggregate.
- Release integrity/source checks: entrypoint parity, runtime/SRI/inventory and bounded source/map contracts. Passing these is not browser or deployment acceptance.

## Native browser acceptance

Requires the existing Playwright/Chromium test environment and a frozen r1119 checkout:

```sh
node tests/r1117/release-mode-smoke.cjs . tests/r1120/evidence/native-mode-smoke.json
SUKUN_R1101_PROFILE=390-tr SUKUN_R1101_CASE='Trusted common Play|Native library selection|Hard Stop|Global Pause' node tests/r1101/frequency-hub-browser.cjs . tests/r1120/evidence/frequency-hub.json
SUKUN_AMB_PROFILE=390-tr node tests/r1102/ambience-compact-browser.cjs . tests/r1120/evidence/ambience-native-interaction.json
node tests/r1120/audio-frequency-browser.cjs . "$BASELINE" tests/r1120/evidence/audio-frequency-browser.json
node tests/r1120/headroom-matrix-browser.cjs . tests/r1120/evidence/headroom-matrix-browser.json
node tests/r1120/release-upgrade-browser.cjs . "$BASELINE" tests/r1120/evidence/service-worker-upgrade-native.json
python tests/r1120/build-verification.py
```

The release gate also requires fresh, source-bound native mode, frequency-hub and ambience interaction evidence. `build-verification.py` fails closed for missing, partial, stale or failed required evidence. `verification.json` and `evidence/verification-gate.json` are the acceptance records; this README is not a claim that every browser check has finished or that production is published.

The audio browser suite uses disposable Linux Chromium, native AudioContext/AudioParams and time-domain analyser taps against served release bytes. It deliberately rejects only background-media admission during live-DSP checks so that the live graph remains observable; a separate test restores normal media admission and checks the rendered-loop/timer handoff. Initial controls use browser interactions; deterministic DSP, pause/journey and shortened timer edge cases also call production APIs/state directly. This is not an all-unmodified-runtime end-to-end audio claim. The shared fixture controls speech, blocks external traffic and disables service workers.

The separate upgrade suite uses native ServiceWorker, CacheStorage and IndexedDB, with server-enforced offline behavior and synthetic personal data. It tests worker upgrade/offline/rollback protocol, not physical device continuity or full recovery-UI click acceptance.

The final native acceptance contains 23 frequency checks, 17 stereo headroom checks and 29 mode/hub/ambience/upgrade checks. The stereo headroom matrix covers 15 explicit configurations and checks both channels; it does not exhaust every continuous control combination or establish acoustic safety. Failed and aborted diagnostic attempts remain in the evidence folders and are excluded from these counts.

## Shipped behavior and remaining limits

- Existing users retain the `legacy` frequency level. `balanced` is opt-in, with gradual transitions and layer-aware headroom. The controlled gain factor is at most 2× the corresponding legacy target, not a guarantee of twice the perceived loudness. Digital RMS/sample peaks and the limiter are not calibrated acoustic measurements, true-peak coverage or hearing-safety certification.
- Timed frequency, journeys and sweeps use the live audio route rather than a fixed rendered loop. Timer ownership and scheduled fades have controlled/browser checks, but lock/background continuity still depends on the device and OS.
- Light feedback is steady, independent of frequency and off by default. It is not the old rapid flash. A saved set/settings restore does not auto-enable the light; explicit user activation is required.
- Manual sets use optimistic same-browser storage checks. Detected conflicts are rejected; two simultaneous writers can still race. The UI warns users to edit sets in one tab at a time. See `manual-sets-integration.md`.
- Still pending physical-device acceptance: Android/PWA audible output on speaker and headphones, calibrated acoustic assessment, screen lock/background transitions, Bluetooth connect/disconnect/routing, interruptions and OS audio focus. Linux Chromium results do not substitute for these tests. No claim of physical Android continuity or acoustic safety is made.
