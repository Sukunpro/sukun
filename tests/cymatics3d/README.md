# Cymatics signal response

This is an illustrative, audio-reactive model, not a calibrated physical Chladni experiment. There is no universal salt pattern for a frequency without plate dimensions, shape, material, mounting and excitation conditions. Both languages now state this explicitly.

## Changes

- Measure every floating-point time sample instead of every eighth 8-bit sample. At some frequency/sample-rate/phase combinations, the previous decimation could sample only zero crossings; byte quantization also hid quiet signals.
- Use a passive two-channel analysis tap and average channel powers for motion. Opposite-phase stereo no longer cancels the motion drive. The existing FFT/waveform remains explicitly mono and unchanged.
- Drive motion from measured app audio rather than the separate tone-active marker. Existing live sources can initialize their passive analysis tap without starting an oscillator. Rendered native-background audio remains unmeasured and retains the visible partial-analysis warning.
- Replace the arbitrary Hz modulo mapping with ordered illustrative modal scales and continuous blending. The scale is deliberately described as illustrative, not a real plate calibration. 2D and 3D use the same coefficients from 20 to 18000 Hz.
- Use repeatable particle seeding and diffusion. Modest visual gain makes quiet measured input easier to see without changing audio output. Silence, suspended contexts and reduced motion do not animate particles.

The supplied 715 Hz screenshot says Ready and no input signal. A selected frequency is not evidence that audio was playing. This patch does not invent motion for that state.

## Checks

- `node tests/cymatics3d/response.cjs`: 95 controlled checks of production RMS, modal interpolation, seed determinism and passive graph wiring. Includes 17 frequencies (including 438 and 715 Hz) at 44.1/48 kHz, quiet input, stereo cancellation, silence and suspension.
- `node tests/cymatics3d/geometry.mjs`: 17 deterministic geometry checks.
- `node tests/cymatics3d/bridge.cjs`: 32 navigation/import/visibility/reduced-motion/lifecycle checks and all 351 inline/lazy scripts parsed.
- `node tests/cymatics3d/scene-lifecycle.cjs`: 12 controlled renderer/lifecycle checks.
- `node tests/visualizer/contract.cjs` and its retained duplicate `tests/cymatics3d/visualizer-contract.cjs`: 39 checks each. Their previous tone-marker gating assertions are replaced by measured-input and reduced-motion assertions.
- `node tests/cymatics3d/response-browser.cjs "$PWD" /tmp/cymatics-signal-native.json`: 38 native Web Audio checks covering 17 quiet stereo tones (including 438 and 715 Hz), gain, stop, suspend/resume and mono cancellation. Writes JSON even on failure, with source/test hash guards and an exact expected count.
- `node tests/cymatics3d/full-app-browser.cjs "$PWD" /tmp/cymatics-full-app-native.json`: 14 required full-application checks. Trusted UI starts 438 Hz, retunes 715 Hz, changes gain, repeatedly switches 2D/3D, stops/restarts, toggles OS reduced motion, and leaves/returns without revival. Both canvas pixels and real signal/phase state are observed. The actual 15-minute timer keeps the existing foreground live route; no media/audio/renderer function is replaced. The shared fixture has an opt-in software WebGL launch mode, preserving its existing defaults. Exact served bytes, trusted controls, errors, state and fail-closed JSON evidence are retained.
- Both native suites are in the mandatory full release gate. Missing JSON, fewer than 38/14 completed passes, a fatal error, missing browser execution or changed source/test hashes fail the gate. Syntax/source checks passed locally; native execution remains pending. The known socket EPERM is not bypassed or retried.
- `node tests/cymatics3d/browser.cjs`: attempted locally but Chromium failed before browser creation with socket EPERM. No native WebGL, full-app browser or physical-device acceptance is claimed.

Development base: main c825233b45b955dc259e53755df84d879469a106 (r1237), isolated from the ongoing r1238 dashboard candidate. The development Node gate passed 64/68 suites; four release-integrity suites reject the intentionally unchanged predecessor shell/runtime hashes. The integrator must regenerate release/SRI/cache metadata after combining changes, rerun the complete Node gate and required native tests, and verify the exact final commit before publication. This patch does not merge, deploy or claim a new release.
