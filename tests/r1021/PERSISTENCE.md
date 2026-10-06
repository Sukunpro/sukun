# Actual-browser recording persistence

`persistence-browser.cjs` is a loopback-only Playwright test of the complete shipped application, using a fresh persistent Chromium profile and three generated WAV fixtures. It never opens the production website, uses user recordings, requests microphone access, or overrides the single-owner/busy/single-client safety guards.

Run with an installed Chromium and Playwright:

```sh
node tests/r1021/persistence-browser.cjs --root /path/to/coherent-release
```

For a complete release-update cycle, give a separate coherent newer release tree. The static server changes roots while retaining the origin, browser profile, IndexedDB and caches. The shipped update manager performs verification, activation and reload:

```sh
node tests/r1021/persistence-browser.cjs \
  --root /path/to/older-coherent-release \
  --update-root /path/to/newer-coherent-release \
  --report-dir /tmp/sukun-persistence-new-run
```

The report directory must be new and outside the checkout. `--chromium /path/to/chromium` overrides `/usr/bin/chromium`. The synthetic profile and JSON report are retained there for diagnosis.

The test first records startup errors and requires the real recording, ownership, recovery and Finish APIs, plus an independently verified service worker with the same release identity as the HTML. It then checks:

- An existing recording created through the production JSON import API
- Two missing recordings imported without replacing a conflicting same-key original
- Fresh IndexedDB connection, completed read transaction, exact count, native Blob length/type and SHA-256 after import
- Idempotent repeated import
- Malformed JSON, empty input, empty recording map and invalid audio rejected without changing recordings
- A second live application client blocks import without data loss
- The actual Finish action, page reload and complete Chromium process/context restart retain exact recordings
- With `--update-root`, a coherent service-worker update and second Chromium restart retain exact recordings

Finish is tested while idle; this does not prove active microphone or audible-session behavior. No phone, Android lifecycle, OS eviction, or recovery of missing private recordings is claimed. Without an update tree, the result explicitly says `PASS_WITH_UPDATE_NOT_RUN`, never a full update pass.

## Execution evidence in this repair workspace

The script passes `node --check`. Real browser tests have **not run** here. Local Chromium aborts before navigation at `chrome/browser/process_singleton_posix.cc:297` because `socket()` returns `Operation not permitted`, including after an allowed scoped escalation. Its machine-readable result is `BLOCKED_BROWSER_LAUNCH` with zero passed checks. The supported cloud-browser route also returned `net::ERR_BLOCKED_BY_CLIENT` opening the loopback URL. Neither result establishes an application startup error or recording persistence. No restriction was bypassed and no remote SÜKÛN origin was opened.

## Controlled fallback suite

```sh
node tests/r1021/persistence-model.cjs
```

This executes the shipped importer, REC_DB, ownership runtime, single-client check, Finish function and SW activation-handler branch in Node VM contexts. A shared synthetic IndexedDB model stages writes until transaction completion and retains committed records across reconstructed contexts. The model verifies 14 cases, including exact count/Blob lengths/types/SHA-256, transaction completion, idempotence, malformed/empty data, abort retention, and active/competing/pending-operation safety gates.

On the final r1021 source, 14/14 controlled cases pass. VM reconstruction is not a browser/context restart. Finish cleanup endpoints are modeled; complete application startup, actual sound/microphone behavior, real IndexedDB durability, CacheStorage release-integrity verification, SW lifecycle and an actual r1020→r1021 browser update remain unverified. The update-handler check supplies modeled readiness/activation endpoints and only proves that the shipped branch gates activation and does not alter the shared recording model.
