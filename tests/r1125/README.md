# r1125: Berhetiyye frame layout and theme consistency

Based on immutable released r1124 `34668e0a8f829630b5ff60e7a9aed0770d38310e`. The change corrects transcription/source-card text placement inside their original ornate frames and makes shared reading, journey, atlas, category and dock surfaces follow the canonical active theme. Locked access must clear private decoration. Native content, Arabic direction, control behavior and stored data retain their existing owners.

## Required source-bound acceptance

From a real Git checkout with Python, Node and Playwright:

```bash
CHROMIUM_PATH=/path/to/chromium python3 tests/r1125/run-release-checks.py --baseline /path/to/r1120-checkout --upgrade-baseline /path/to/r1124-checkout --output /path/to/fresh-evidence
```

Regression baseline remains immutable r1120 `7b25996c9d545a3732d758136342da893bba6ed4`. Real service-worker upgrade/offline/rollback uses immutable released r1124 `34668e0a8f829630b5ff60e7a9aed0770d38310e`.

The supported-release selector in `.github/workflows/r1122-release.yml` requires the r1125 runner and private-access suite. Unsupported builds or missing suites fail. The collector requires exactly 28 unique groups: all 26 r1124 categories, plus `berhet-theme-browser` with exactly 15 checks and `atlas-private-access` with exactly 7 checks. Existing media case counts stay fixed at 10 global-pause-feedback, 2 media-resume-recording, 6 media-fallback-contract and 12 media-wheel-native-browser checks. No inherited gate is removed or converted to an optional probe.

The new theme suite checks narrow mobile widths of 360, 393 and 412 CSS pixels, lock cleanup, active material coverage, source text/RTL/wrapping and theme transitions. Its report documents the controlled fixture and exact checks. The real upgrade suite additionally requires the new consistency stylesheet to be loaded and available offline. The existing eight service-worker activation, data preservation, offline reload and rollback assertions remain required.

The private-access suite saves a real unlocked Berhetiyye selection through the persistence owner, sets only the persisted access-lock bit to false, then reloads. It requires the stale selection to remain locked with an invisible source atlas throughout sampled mutation and animation-frame boundaries, and verifies subsequent unlock and relock without changing progress. The same test reproduces visible locked source cards on immutable r1124; normal theme transitions alone do not reproduce this stale-state defect. This is an application access-lock test, not an operating-system screen-lock test.

`berhet-theme-layout.cjs` is an optional 36-check supplement covering comparison-card text clearance and native Tefekkür reading-dialog behavior at 360, 393 and 412 CSS pixels. It is not part of the required 28-group count. Both r1124 and r1125 pass this supplemental geometry coverage; it does not establish reproduction of the stale access-lock defect.

Production, test, helper and workflow bytes are hashed before execution and checked unchanged afterward. Git commit/tree identity and all result hashes are retained. Failure, missing JSON, zero checks, partial expected counts or fatal/allPassed rejection fails acceptance. Uploaded CI artifacts contain synthetic JSON only. Tests are run freshly; stored old results are not current acceptance.

## Scope and limits

Controlled tests extract shipped JavaScript and declare their synthetic seams. Native browser execution is required. Headless Linux Chromium at mobile viewport dimensions is not a physical Samsung/Android compositor, actual OS lock, Bluetooth/headset or audio-focus acceptance test. Theme access lock and emulated viewport width must not be described as physical screen-lock testing.

The stylesheet remains scoped to canonical active theme/access state. No data reset, schema migration, stored recording rewrite, credential change or permission expansion is part of this change. Historical counts overlap and must not be added; superseded assertions and unavailable historical baselines are not new passes.
