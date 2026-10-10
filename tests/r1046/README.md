# Owned silent-anchor selection regression

    node tests/r1046/silent-anchor-selection.cjs [source-root]

Runs the shipped ac/SesCapa/AudioLife/hooks/session functions in the existing
controlled intro fixture. The old predicate is injected to reproduce the
1992 ms cancellation; the candidate remains scheduled through the fixture's
3020 ms onended event. This is a deterministic integration test, not native
browser sound output. Native completion is a separate live check.

Only the exact private SesCapa element with its immutable digital-zero WAV,
dedicated flag and null srcObject may use the new currentSrc-empty / readyState0 /
networkState3 branch. Other states, wrong types, missing/throwing getters,
reassigned sources, clone objects, real external media, recordings, microphone,
owner and AudioLife activity remain rejected. The lock carrier is unchanged.

Dependencies: tests/r1039/silent-anchor-init.cjs and tests/r1037/intro-fixture.cjs.
The suite verifies the silent WAV bytes, immutable assignment, selected-source
path, constructor, lock classifier, generic admission and visual/audio runtime
preservation, with only the release URL query normalized.

The live diagnosis is an after-rejection observation, not an atomic predicate
trace. No physical Android or audibility result is implied by these tests.
