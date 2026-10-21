# r1121 frequency audit

## Reproduced and corrected

- A chakra journey started during a frequency sweep retained both owners. The sweep's later update could overwrite the journey target and remove its ramp. All `startJourney` callers now retire the sweep before scheduling the journey.
- On the AudioParam fallback without `cancelAndHoldAtTime`, harmonic retuning read the frequency after cancelling the old ramp endpoint. A controlled 360 → 1000 Hz ramp at its 680 Hz midpoint incorrectly restarted from 360 Hz. The moving value is now captured before cancellation.
- An already accepted native loop retained obsolete frequency volume/trim/pink/secondary/noise levels during asynchronous replacement preparation. Attenuation now retires that loop and restores the current live mix while preparing, retaining the ambience selection and respecting Pause.
- Deliberately muting both main stereo trims was classified as a failed silent render. Silence classification now follows the main trims and independently audible pink/secondary branches.

The external fixes replace the two existing dependencies with `background-mix-r1121.js` and `background-mix-render-r1121.js`. Historical r1059 files remain unchanged. There is no extra audio engine or runtime dependency.

## Controlled verification

Run from the candidate root, after its final entrypoint references are wired:

```sh
node tests/r1121/frequency-engine-contract.cjs . /tmp/frequency-engine.json
node tests/r1121/frequency-handoff-contract.cjs . /tmp/frequency-handoff.json
node tests/r1121/frequency-handoff-regressions.cjs . /tmp/frequency-history.json
```

The engine contract executes unchanged production functions and the hub with recording AudioParams and deterministic audio/wall clocks. Its nine scenarios cover repeated start/stop, queued mode restarts, pause/resume, 108 carrier/beat/mode/sample-rate combinations, journeys, timers, linear/log sweeps, rebuilds and the two core regressions. The exact r1120 baseline fails only the two new regression scenarios (7/9); the patched candidate passes 9/9. These results do not establish browser interpolation or audible output.

The handoff contract loads referenced production runtime bytes. Media events, render completion and PCM are controlled seams; zero-output renderer cases test silence classification, not sound synthesis. The historical wrapper freshly reruns prior controller/lock scenarios against those same bytes. Four old expectations that a disabled secondary layer should continue playing pending replacement are explicitly superseded by the immediate-attenuation requirement, not reported as passes. Equivalent non-attenuating pitch-change cases preserve coverage of stale-render authority. The archived r1058 comparison is a separately disclosed exclusion when no r1058 baseline is supplied.

Fresh checks also passed for the r1120 gain (4), harmonic automation (11), manual saved-set (19), and r1047 frequency registry/transport (44) contracts. These counts describe distinct controlled suites, not full native acceptance.

## Required native CI verification

```sh
node tests/r1121/frequency-engine-browser.cjs . /tmp/frequency-native.json
node tests/r1121/frequency-renderer-browser.cjs . /tmp/frequency-renderer-native.json
```

The first checks native oscillator ownership, fallback cancellation, timer pause/resume, pending-render attenuation and intentional channel mute. The second reruns historical real OfflineAudioContext rendering scenarios against the renderer actually referenced by the candidate. It adapts dependency resolution and the renderer path only. Both bind reports to tested source bytes.

No native browser execution was possible in the audit workspace because browser/socket access was denied. CI execution is required; syntax checks are not execution. Physical Android/PWA speaker/headphone output, actual screen lock, Bluetooth, interruptions and OS audio focus remain unverified. Simulated visibility or frozen JavaScript clocks do not constitute physical-device acceptance or acoustic-safety evidence.
