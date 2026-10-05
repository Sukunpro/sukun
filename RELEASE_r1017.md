# r1017 — pause manual rescan and inspect recording storage safely

## Changes

- Temporarily disable the exact **Kayıtları yeniden tara** button. Its installed click handler and truthy manual calls to `SUKUN_REC_RESCAN` return without scanning or reinitializing recording controls
- Add a separate **Kayıt deposunu kontrol et** action. It only observes the current `sukunRec/clips` store through a read-only transaction; it does not create a missing database/store or read voice payloads, names, or recording keys
- Show observation time, app build, count and aggregate Blob size, or an explicit missing/unsupported/blocked/unavailable/timed-out/cancelled result. Unknown totals are never represented as successful zero
- Keep the latest observation and last successful observation in one bounded local metadata record. A previous success is explicitly historical when a newer observation fails or is pending
- Provide cancellation, an eight-second limit, same-request coalescing, and generation checks against late completions. New controls use scoped 44px touch targets and wrapping text
- Include the cached observation in the local health/technical report without triggering another scan. The inspection and all its derived aggregate effects are excluded from AI payloads and previews

The existing automatic startup/post-import rescan paths are unchanged. Existing update deferral and historical update receipts remain unchanged. This narrow precaution does not identify why the phone's recordings disappeared, restore missing recordings, or guarantee future storage retention.

## Using the observation

Open **Araçlar → Kayıtlarım & Yedekleme — başka cihaza taşı** and select **Kayıt deposunu kontrol et**. The old manual rescan button is disabled. Read the new observation's timestamp and build before interpreting its count or error. The observation does not refresh the existing recording catalog.

For the current cached observation in a local report, use **Araçlar → Sistem kontrolü → Raporu hazırla → Teknik rapor indir**. No additional health test is required. The separate r1016 update observation remains historical and is not replaced by this explicit current-store inspection.

## Verification

- 705 existing controlled source scenarios passed
- 160 new scenarios passed: 73 reader/storage/privacy, 40 actual UI/handler, and 47 health/report/privacy cases
- The 130 r1016 and 84 r1015 focused regression cases passed on the final source
- 156 release checks passed: 47 runtime hashes, 41 HTML SRI references, 281 parsed JavaScript bodies, and identical index/nero aliases
- Independent review covers cancellation, late connections/upgrades, manual no-op behavior, unchanged automatic behavior, privacy, and AI-payload invariance

The former catalog test for unavailable rescans now invokes the unchanged automatic `false` path; all its assertions are retained. New tests separately require the manual path to do nothing. New runtime admission and release-cardinality assertions were updated without removing prior scenario coverage.

All tests use synthetic data and controlled endpoints. No browser rendering, record-bearing real-browser rescan, or physical Android acceptance is claimed. The reported total recording loss remains unresolved. No personal recordings, phone reports, or backups are included in this release.
