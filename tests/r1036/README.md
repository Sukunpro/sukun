# r1036 moderate intro timbre

Run from repository root:

    node tests/r1036/startup-intro-timbre.cjs .
    node tests/r1036/measure-waveform.cjs .

The approved visual remains 1s preparation +2.4s exit, with1.9s mark/light.
Audio still uses one automatic attempt, a fresh clock plus20ms lead, a strict
1730ms admission boundary and an overall650ms source window.

Six sine sources form one dry hit and one12%-level reflection120ms later.
Ratios1/2/3 retain the86→48Hz glide over130ms. Main peaks are.30/.14/.07,
master.75. Each envelope attacks in16ms, decays exponentially to.0001×layer
level at490ms, then reaches exact zero at520ms relative to that layer.
The last echo is zero by640ms; every source stops at650ms.

There is no feedback, DelayNode, vibration API, limiter or normalization.
Absolute amplitude bound is.4284 (7.36dB below full scale). The deterministic
waveform model is checked at22.05/44.1/48/96/192kHz. At48kHz it yields peak
.271148 and650ms RMS.042105, +3.64dB peak/+2.20dB RMS versus the r1035 model.
These are digital synthesis measurements, not device loudness measurements.

The existing intro/clock/health suites remain required. Their timbre assertions
now use tests/helpers/intro-hit-contract.cjs. The r1035 suite retains all fresh
clock, expiry and cancellation cases with six-source graph completion hooks.
No user recording, preference, recovery or layout data is changed.
