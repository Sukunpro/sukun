# r1126: Delâil TTS lifecycle continuity

The release keeps all 28 required r1125 acceptance groups and adds the required
`delail-tts-lifecycle` and `delail-screen-browser` groups. No inherited browser, audio, navigation, private
access, update, offline or rollback gate is optional or removed.

Run from an exact candidate Git checkout with Python, Node and Playwright:

```bash
CHROMIUM_PATH=/path/to/chromium python3 tests/r1126/run-release-checks.py --baseline /path/to/r1120-checkout --upgrade-baseline /path/to/r1125-checkout --output /path/to/fresh-evidence
```

The immutable regression reference remains r1120
`7b25996c9d545a3732d758136342da893bba6ed4`. The real service-worker
upgrade/offline/rollback reference advances to released r1125
`1ead4017fd3d8159a7224cf749d42cffd2ac21da`. The upgrade suite retains all
eight assertions and requires the existing Berhetiyye consistency stylesheet to
load offline. The source-owned activation deadline contract is copied into this
release folder with only the candidate reply/build identity advanced to r1126.

`delail-screen-browser.cjs` loads the complete application in Classic/Feyz at
393 CSS pixels and uses real Ambiyans/Zikir clicks while both legacy and modern
Delâil readers own a live utterance. Its eight fixed checks cover the Classic active-reading reveal through hidden
ancestors without changing audio; they also require exactly
one next sentence after a controlled native completion and no restart after
explicit Stop. Device speech is the existing labelled synthetic fixture;
application navigation and reader code are unchanged.

`delail-tts-lifecycle.cjs` executes the shipped legacy Delâil reader and modern
reading-audio code in controlled VM fixtures. Its 22 fixed checks cover lifecycle interruptions
and protects explicit Pause/Stop and superseding reader ownership. The fixture
supplies native speech events and lifecycle delivery; it cannot establish
physical Android speech-engine behavior or uninterrupted background speech.

The runner requires exactly 30 unique groups, nonzero completed case counts,
matching passed/total counts, no fatal error and no rejected `allPassed` field.
The inherited fixed case counts remain unchanged. Independent groups execute
with up to three workers by default (`--jobs 1` selects sequential execution).
Every group has a unique output path and disposable browser profile/origin;
results are collected in declared order and no assertion is skipped or retried. Production, test, helper and
workflow inputs are hashed before execution and checked unchanged afterward;
commit/tree identity and evidence hashes are retained. Stored previous reports
are never accepted as a new run.

The GitHub workflow supports r1126 and requires both new Delâil suites and the
inherited private-access suite to exist. It checks out the exact candidate and
immutable references, installs the pinned Playwright dependency, then runs every
required group. Only synthetic JSON evidence is uploaded.

Headless Linux Chromium and controlled speech fixtures do not validate physical
Samsung/Android rendering, real OS screen lock, Bluetooth/headset audio focus,
audible quality or acoustic safety. Those checks remain device acceptance work.
