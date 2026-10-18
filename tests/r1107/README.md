# r1107 verification

The shipped native disclosure controller, startup closer, preset rendering,
filter/category handlers and help delegate run in controlled DOM/EventTarget
fixtures: 30/30 checks. The adapted r1106 microphone lifecycle fixture retains
20/20 checks against the current nested heading and original microphone nodes.

The new storage metadata suite runs the shipped core and actual generic-bank
owner in controlled IndexedDB fixtures: 30/30 checks for real Blob sizes, empty
versus missing/unavailable stores, hidden recovery copies, privacy epochs,
bounded reads, cancellation and forbidden write/content/decode operations.
The presenter has 27/27 checks for explicit-only scans, stale results, lifecycle,
language, unknown versus zero and single mounting.

```sh
node tests/r1107/presets-disclosure.cjs .
node tests/r1107/storage-snapshot.cjs .
node tests/r1107/storage-snapshot-ui.cjs .
node tests/r1106/ambience-layout.cjs . tests/r1107/evidence/ambience-layout-regression.json
node tools/release-integrity.cjs .
```

The full isolated Node runner passed 176/176 groups; exact release identity,
JavaScript syntax, SRI and deployment bytes passed 1483/1483 checks. Sources and
reports are fingerprinted in verification.json. These are pre-publication
controlled fixtures, not browser geometry, native recording or physical Android
acceptance. Cloud browser UI smoke is performed separately after publication.
