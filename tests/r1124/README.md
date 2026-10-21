# r1124: media resume and global-pause feedback

Based on immutable released r1123 `5869f46eace0d7445d42e82d6d8d9f1e61d5a2c5`. The narrow change avoids a redundant Play after successful mix Resume and exposes the existing global-pause hold in local wheel controls. It does not silently release unrelated captured audio. The optional isolated-dock draft is excluded.

## Required source-bound acceptance

From a real Git checkout with Python, Node and Playwright 1.57.0:

```bash
python3 tests/r1124/run-release-checks.py --baseline /path/to/r1120-checkout --upgrade-baseline /path/to/r1123-checkout --output /path/to/fresh-evidence
```

Regression baseline remains immutable r1120 `7b25996c9d545a3732d758136342da893bba6ed4`. Real service-worker upgrade/offline/rollback uses immutable r1123 `5869f46eace0d7445d42e82d6d8d9f1e61d5a2c5`.

The supported-release selector in `.github/workflows/r1122-release.yml` now requires the r1124 runner. Unsupported builds or missing suites fail; historical r1121 workflow success is not current-release acceptance. The collector requires exactly 26 unique groups: all 22 r1123 categories, plus global-pause-feedback (10), media-resume-recording (2), media-fallback-contract (6), and media-wheel-native-browser (12). Browser completeness is mandatory, not optional discovery. A separately labelled immutable r1123 native diagnostic runs before candidate acceptance, preserving native expectations and omitting only new-label expectations. Its outcome is retained separately and is not a replacement for the candidate gate. The job deadline is 50 minutes to accommodate the added diagnostic and native group; individual group timeouts and assertions are not relaxed.

Production, test, helper and workflow bytes are hashed before execution and checked unchanged afterward. Exact Git commit/tree identity and all result hashes are retained. Failure, missing JSON, zero checks, partial expected counts or a fatal/allPassed rejection fails acceptance. Uploaded artifacts contain synthetic JSON only, not private logs, personal recordings, screenshots or secrets. Tests are run freshly; stored old results are not acceptance.

## Scope and limits

Controlled tests extract shipped JavaScript and declare their synthetic seams. A separate native-browser suite is required; its fixture controls, MediaSession handler capture and generated recording bytes are described in its own report. Programmatically invoking captured media handlers is not a physical headset or Bluetooth event.

Physical Android/iOS, actual headset buttons, Bluetooth, actual OS screen lock, background eviction, telephone/audio-focus interruption, subjective listening and acoustic/hearing-safety acceptance are NOT RUN here. Simulated visibility is not physical screen lock. Do not claim the user's specific device bug is conclusively reproduced or fixed.

No data reset, schema migration, credential change or permission expansion. Independent media/scope ownership stays protected. Existing unrelated reading-r1064 continuity is not promised. The historical headroom startup-dismissal fixture race, slow-network shell-download budget and non-atomic cross-tab saved-set limits remain unchanged. Historical counts overlap and must not be added; superseded assertions and unavailable historical baselines are not new passes.
