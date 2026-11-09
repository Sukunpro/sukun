# Journey controls native acceptance

Run `CHROMIUM_PATH=/path/to/chromium node tests/seyir-controls/browser.cjs "$PWD" /tmp/seyir-native/report.json`.

The fixed report contract requires **31 distinct passing cases**:
- The original 20 cases remain: both modes, four responsive widths, direct actions without obsolete controls, hover/focus, disclosure focus, and original restart cancel/accept behavior.
- Eight added cases cover both Turkish and English in both modes. Each checks all four controls: play, whole-journey restart, finish and easy-controls disclosure. Native pointer hover and real Shift+Tab/Tab/Escape input must show the full correct explanation and leave the session untouched. Visible labels and accessible names are checked against explicit localized expectations.
- Two added lifecycle cases use generated personal WAV recordings with the real moved Start/Pause/Continue/Finish buttons. A native count correction seeds seven completed repetitions; each action must preserve that progress, emit exactly one session command, retain one foreground owner through pause/resume, and keep exactly one audible native media element while playing. This uses no mocked transport or media clock.
- One mandatory evidence case checks exact production and test/fixture hashes, verifies that required runtime files were served, validates all served-file hashes, and rejects page exceptions, SRI/digest errors and failed runtime requests.

The report includes `browserExecuted`, `sourceUnchanged`, `testUnchanged`, `servedHashesValid`, `sources`, `testSources`, `browserEvidence`, named results and any fatal error. Its `allPassed` is false for missing/duplicate cases, malformed or missing hashes, unavailable browser evidence, errors, or changes during execution. `contract.cjs` exercises this fail-closed logic with synthetic evidence only; it does not claim browser execution.

This revision has source/syntax validation in the current workspace. Native execution remains unverified here: the local Chromium launcher exits with `socket() failed: Operation not permitted`. CI or another authorized native executor must run all 31 cases before browser acceptance. It is not physical-device, screen-reader, offline-upgrade or acoustic validation.

On a localized hover/keyboard failure, the failed result includes the exact control, failing stage, expected strings, completed control observations, and a passive DOM/session snapshot. It records both rendered and source text, accessible labels, tooltip text, visibility, focus, and the live/cached phase. This adds diagnosis only: all 31 cases, exact equality assertions and existing timeouts remain unchanged. A timeout without this evidence does not establish a product-label defect.

The Finish control's exact visible labels are `■ Bitir` (TR) and `■ End` (EN), supplied by the existing `r390-unified-playback` owner and the full-label I18N dictionary entry. The accessible names remain `Zikri bitir` / `End dhikr`. The source contract executes those production owners to distinguish the retained stop glyph from a product regression; native expectations remain exact, without stripping symbols or accepting alternate labels.
