# r1088 saved-session continuity native QA

Run only after the production candidate is frozen and its HTML/SRI references are finalized:

```sh
NODE_PATH=/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules \
CHROMIUM_PATH=/tmp/sukun-browser/chromium \
node tests/r1088/session-continuity-browser.js . /absolute/qa-r1088/session-continuity-browser.json
```

The `.js` suffix intentionally keeps this native suite outside the controlled `.cjs` regression runner. Optional `SUKUN_QA_CASES=storage`, `continuity`, or `bundled` selects a labelled subset for diagnosis.

The suite opens real Save, favorite, saved-template, built-in-template and Start controls in disposable Classic/Feyz Chromium profiles. It checks stable same-name upsert, idempotent identical-duplicate migration, favorite-id remapping, preservation of distinct legacy content under distinct names, one saved/favorite presentation, retained paused step identity/progress, no automatic resume on reopen, reload continuity and repeated Start admission.

Transport tests use generated .7-second WAV tones in disposable personal keys and unchanged browser clocks/end events. A separate native-original scenario uses the exact shipped Felâk and Nâs MP3s without device speech: it waits for the entire 38.74-second Felâk file, observes automatic entry into Nâs, then samples real Pause/Resume and Stop. It does not claim a full Nâs reading, complete seven-repeat sequence, actual audible recitation quality or physical Samsung lock-screen testing.

All served source bytes are checked against disk; sources must remain frozen throughout the run. Reports belong outside the git repository. No screenshots or private user recording data are persisted by this suite.
