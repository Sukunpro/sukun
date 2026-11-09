# Remove Cymatics, retain frequency tools

The requested 2D salt/particle and 3D sphere feature is removed from the lazy
NeuroSync template, the integrated Frequency tools navigation, graphics
lifecycle, translations/help and passive stereo-only analysis branch.
The shared preset toggle is named `toggleFrequency`, retaining its existing
behavior for the other frequency controls. Main audio, settings and recording
owners are unchanged. FFT/waveform and guided mandala/breathing remain.

The renderer and its sole Three.js dependency are removed. Historical release
notes/manifests and prior test evidence remain historical, not current acceptance.
No localStorage/IndexedDB deletion, migration, cache clearing or recovery action
is added. The unused Three.js-only health path and 700 KiB exception are retired;
ordinary runtime limits remain unchanged and the old vendor path is rejected
before any fetch (16 health-marker checks retained).

## Current acceptance

- `node tests/cymatics-removal/contract.cjs`: removal shape, current navigation,
  passive tap preservation, parse checks and the real shared frequency controller
  with controlled graph/clock seams (14 groups).
- `node tests/cymatics-removal/finalizer.cjs`: real finalizer subprocesses prove
  explicit file retirement, retained historical bytes, no source-file deletion,
  early rejection of path traversal/absolute/glob/query/directory/unknown/protected
  paths, active dependencies, add/remove conflicts and package-only changes (12).
- `node tests/cymatics-removal/browser.cjs --check-source`: native suite syntax
  and exact expected count only. Does not claim browser execution.
- `CHROMIUM_PATH=/path/to/chromium node tests/cymatics-removal/browser.cjs "$PWD" /tmp/cymatics-removal-native.json`:
  18 required full-app native checks. Exact files, trusted navigation/play/retune,
  waveform/FFT, preserved guided canvas, breathing, collapse/reopen, keyboard,
  reduced motion, reload, synthetic localStorage/IndexedDB preservation and no
  retired asset fetch. Source/test/served hashes and exact counts fail closed.

The old four Cymatics source and three native feature suites are retired from
`tests/r1213/run-current-checks.py`, explicitly replaced by the above three source
and one native removal suites. Existing waveform, audio engine/handoff/onset,
settings and DSP gates remain mandatory. The waveform contract's removed
particle assertions were solely about the removed feature; all 29 current
waveform/FFT and route-disclosure checks remain. No physical/acoustic or mobile
acceptance is claimed by these suites.

## Integration

Regenerate release identity/SRI/build/SW/inventory with the normal finalizer and
these exact additional arguments (only the new deployment graph changes):

```
--remove assets/runtime/cymatics-3d.js
--remove assets/vendor/three-r170/three.module.min.js
--remove assets/vendor/three-r170/package.json
--remove assets/vendor/three-r170/PROVENANCE.json
--remove assets/vendor/three-r170/LICENSE
```

The finalizer never deletes these files itself or rewrites old manifests. A
listed file must exist in the predecessor inventory; active HTML/CSS dependencies
and identity files cannot be removed. Missing unlisted files still fail.
After integration, rerun current source/node/full gates and the existing
immediate-predecessor upgrade/offline/rollback suite on the final exact bytes.

## Local verification limits

The focused removal controller/source contract passed 14/14, explicit-retirement
finalizer checks passed 12/12, and existing CSS finalizer preflight passed 22/22.
The historical CSS preflight fixture was brought up to the current worker schema
by declaring its empty optional-audio list; no assertions were removed.

Native Chromium was attempted once and stopped before creating a browser:
`process_singleton_posix.cc: socket() failed: Operation not permitted`.
The 18 native checks therefore remain **not run**, not passed. They are required
in the full release gate, alongside the unchanged waveform, DSP and predecessor
upgrade/offline/rollback suites. Source syntax/count checking is not a substitute.

The final local Node gate passed **73/73 suites**, with source bytes unchanged
through the run, after local regeneration of SRI/build/SW/inventory. Its report
explicitly sets `completeAcceptance: false` because native checks are pending.
Generated release metadata is intentionally excluded from this source patch;
the integrator must finalize the combined candidate and repeat the required gates.
