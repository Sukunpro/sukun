# r1122: bounded frequency-onset corrections

Based on immutable released r1121 commit `1e4f28d3fcb24ba362a026e4f3308ea20b4121f3`. The changes prevent live/native admission overlap, preserve the live route during pending resumed admission, and initialize the spatial panner at its existing orbit radius before connection. Sustained volume, limiter, EQ, compression and spatial orbit settings are not increased or redesigned.

## Required acceptance

Run from a real Git checkout with Python, Node, and Playwright 1.57.0 installed:

```
python3 tests/r1122/run-release-checks.py --baseline /path/to/r1120-git-checkout --upgrade-baseline /path/to/r1121-git-checkout --output /path/to/new-evidence
```

The regression baseline must be commit `7b25996c9d545a3732d758136342da893bba6ed4`; the actual service-worker upgrade/rollback baseline must be commit `1e4f28d3fcb24ba362a026e4f3308ea20b4121f3`. The runner checks both identities and the current r1122 identity, then requires all twenty fresh groups. No optional suite discovery or version-based success skip exists in the new r1122 workflow. The old r1121 workflow remains historical and is not accepted as r1122 evidence.

The prior eighteen group categories are retained. `release-upgrade-browser.cjs` advances only shell/worker identities from r1120→r1121 to r1121→r1122 and records baseline hashes; immutable frequency-workbench/sets r1120 filenames remain unchanged. `activation-deadline-contract.cjs` changes only the expected current build identity in a separate copy; historical source is retained. New `frequency-onset-contract.cjs` and `frequency-onset-browser.cjs` are mandatory groups.

All production and test/helper bytes are hashed before execution, checked unchanged afterward, and bound to the exact candidate commit/tree. Nonzero child exit, missing/empty result, incomplete pass count or fatal result fails acceptance. Uploaded evidence is synthetic JSON only, with no screenshots, credentials, personal recordings or private logs.

## Scope and limits

The native onset suite uses default Chromium autoplay policy, trusted test-button clicks, real HTMLMediaElement clock progress, and unchanged production controller bytes with synthetic PCM at a declared renderer seam. Rejected/deferred play promises are deliberate fault injection. Spatial construction is inspected using native PannerNode in the full application. This is not measured speaker loudness, sample-accurate acoustic crossover, or a claim to reproduce the user's physical device issue.

Physical Android/iOS, actual screen locking/background eviction, Bluetooth and telephone/audio-focus behavior remain untested. Simulated visibility is not actual phone locking. Prior historical exclusions remain explicit: four superseded handoff assertions are not passes, and one unavailable older baseline comparison is skipped. Overlapping suite counts must not be added.

The unchanged 60-second/three-download shell preparation policy and non-atomic cross-tab saved-set writes retain their documented limitations. No cache reset, user storage migration, permission expansion or credential change is part of this release.
