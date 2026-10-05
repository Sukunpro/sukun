# r1016 — recording update guard and local diagnostics

## Changes

- An explicitly requested update waits while protected recording import or data maintenance is active. Success, failure, and cancellation release the guard; canceling the queued update prevents a later automatic reload
- Before the approved update reload and after the next supported boot, record only clip count, aggregate Blob size, build identities, timestamps, an ephemeral pairing token, and allowlisted storage error codes on the device
- Recording inspection uses a read-only transaction. Missing storage is not created; inaccessible storage is distinct from a successfully read zero-record store
- The existing health report displays the cached measurement. It does not scan when opened and does not include this diagnostic in AI summaries or their derived aggregate counts
- One sanitized local receipt is retained, bounded to 2,048 characters and a 24-hour comparison window. No recording names, keys, voice contents, URLs, error messages, or stacks are retained or sent

## Interpretation and limits

The first r1016 installation establishes a baseline; r1015 did not collect a before-update receipt. Later updates using this instrumented path can provide paired measurements. A historical measurement is not current live inventory. Equal totals do not verify identical content; a difference does not establish deletion, its cause, or successful recovery.

This release does not restore, import, delete, reset, or migrate recordings. It does not change recording database names/schema, audio timing, counters, tempo, or static artwork. The update guard covers existing protected import/data-maintenance operations, not every microphone-save lifecycle. The reported Android disappearance after an update remains unexplained.

## Verification

- 705 existing controlled source scenarios passed
- 130 new scenarios passed: 61 local receipt/privacy/storage cases, 13 actual update-manager integration cases, 56 health-report/privacy cases
- 84 r1015 regression cases and 9 additional import-maintenance lifecycle cases passed on the final source
- 153 release checks passed; 46 runtime hashes and 40 HTML SRI references match; 280 active JavaScript bodies parse; both HTML aliases are identical
- Independent final review found no blocker

Synthetic cloud Chromium previously retained one 4,044-byte recording through a same-version r1015 reload and tab reopening. That historical result is not an r1015-to-r1016 upgrade test or physical Android acceptance. No current record-bearing browser-upgrade result is claimed. All automated tests use synthetic data and controlled events; they do not establish real-device quota, eviction, microphone, audible playback, or recovery behavior.

See `tests/r1016/README.md` for reproducible focused tests.
