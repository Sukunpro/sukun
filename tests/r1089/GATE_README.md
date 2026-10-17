# r1089 gate state regressions

`gate-state.cjs` is a Node-only production function fixture. It checks independent reader preparation/playback admission, retained smart/physical observations, the invitation source identity fence, current failure reporting, external revocation, pending verification admission, and the gate-owned lock event. The normal controlled regression runner includes it.

`gate-state-controlled.js` uses the exact production portal in native Chromium DOM with labelled access/audio Promise doubles and a controlled clock. Its 15 groups verify complete portal callbacks around repeated narration, close/reopen/hidden, independent preparing/playing/paused reading, revocation during ready/verification/opening/entry, and gate-owned lock completion. It is deliberately outside the Node-only `.cjs` runner.

```sh
node tests/r1089/gate-state.cjs .
CHROMIUM_PATH=/tmp/sukun-browser/chromium node tests/r1089/gate-state-controlled.js . /absolute/qa-r1089/gate/controlled.json
NODE_PATH=/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules CHROMIUM_PATH=/tmp/sukun-browser/chromium node tests/r1089/gate-state-browser.js . /absolute/qa-r1089/gate/native.json
```

Run `gate-state-browser.js` only after the full application source is frozen and shell SRI is finalized. It uses the actual invitation and Yasin MP3s with native playback clocks. Only the labelled entitlement adapter and deliberate network hold for the Yasin preparation seam are controlled. It verifies that preparation stops only owned gate narration, source ownership/settings remain unchanged, and external access revocation retires only the ready gate presentation. It does not claim a complete Yasin recitation, perceptual loudness, physical Samsung locking, microphone capture, or remote paid entitlement testing.

Reports belong outside the repository. The gate retains default-on effects, remembered explicit mute, its separate attenuated effects bus, and existing access authority. No microphone policy was added in this patch.
