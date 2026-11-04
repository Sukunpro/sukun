# Current acceptance contract

`run-current-checks.py` reads `version.txt` and tests the exact candidate's files.
The runner is retained across future versions; there is no release-number list
that silently skips a new release. Missing files, process failures, timeouts,
partial native-browser evidence and source changes during a run fail acceptance.

## Required scenarios

| Scenario | Executed evidence | Scope |
| --- | --- | --- |
| Locked private checkpoint restore | `r1211/practice-owner.cjs`, `r1211/session-access.cjs` | Old presentation stays retired; counter retained; public recovery remains available. |
| Esmâ / Berhetiyye access change | `r1211/session-access.cjs`, `r1191/journey-permissions.cjs` | Real read model, access event, owner and command guards. |
| Ebced / free target and restored progress | `r1191/ebced-journey-contract.cjs`, `r1194/target-intent.cjs`, `r1213/practice-flow.cjs` | All 127 source values, saved mode, deferred controls, authoritative target label and cancel-safe restart. |
| Contemplation entry / exit | `r1211/practice-owner.cjs` plus browser inspection | Source suite covers focus, retained presentation and reachable exit. Actual rendered entry/exit must also be inspected at mobile and desktop widths. |
| Saver content / theme | `r1194/saver-state.cjs`, `r1193/card-actions.cjs`, `r1213/saver-content.cjs` plus browser inspection | Calendar, access, selection, content persistence and independence from quality/session. Pixel layout/theme materials require browser inspection. |
| Update, optional audio and offline recovery | `r1213/update-offline.cjs`, `r1213/release-upgrade-browser.cjs` | Controlled failure/retry/integrity/audio package tests; then real ServiceWorker/CacheStorage/IndexedDB upgrade, offline shell, rollback and synthetic recording preservation. |

The source gate also retains six current transport/audio contracts, restart
states, lock animation state, safe door audio and dock restoration. The r1149
visual suites remain available as historical tests; they are no longer labelled
current acceptance because they target former layouts. Their earlier physical
device and audio limitations have not disappeared.

## Run

Use a new evidence directory outside the checkout for every invocation:

```sh
python3 tests/r1213/run-current-checks.py --scope source --output /tmp/sukun-source-new
python3 tests/r1213/run-current-checks.py --scope node --output /tmp/sukun-node-new
```

`source` tests functions without final release metadata. `node` additionally
requires finalized identity, hashes, SRI and health-marker verification. Both
explicitly report `completeAcceptance: false`; neither substitutes for a browser.

GitHub Actions uses `--scope full`, a pinned Chromium dependency and immutable
r1212 commit `8bcbe4c0d902967dc9e6f60d3cfe3a4b4298e755` as the pre-migration
reference. The native eight-case upgrade test serves full unchanged old and new
release bytes. A synthetic counter and WAV blob must survive upgrade, offline
reload, rollback and restoration of current. Optional audio is not required to
install the new core. That baseline intentionally remains a migration regression
until a later change explicitly revises it.

The native browser suite is for CI. Local managed-browser QA uses the approved
browser surface; do not install or launch an alternate local browser to run it.

## Visual release checklist

- 390 px and desktop width: Esmâ and unlocked Berhetiyye; no horizontal overflow.
- Target mode remains visible beside the number; counts survive theme/navigation.
- Contemplation entry/exit keeps controls reachable and old panel hidden.
- Wheel, target/remaining, primary action, finish and sound summary order.
- Restart disclosure shows destination/progress; cancelling preserves state.
- Saver Sade/Bilgili, both themes, gold setting frame, long detail, no clipping.
- Update error has a retry action; readiness reflects the verified worker.
- Audio package progress, offline-ready status and an actionable retry failure.

Record observed results separately. A passed Node check does not certify a
physical phone, accessible contrast, visual geometry, real speaker sound or
operating-system screen lock behavior.
