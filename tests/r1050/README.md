# r1050 recording evidence and dock progress regressions

Run from the repository root:

```sh
node tests/r1050/audio-cadence-evidence.cjs
node tests/r1050/dock-progress-invalidation.cjs
python3 tests/r1049/run-regressions.py --output-dir /tmp/sukun-r1050
python3 tests/r1049/run-regressions.py --static-only --output-dir /tmp/sukun-r1050-integrity
```

The audio fixture executes shipped preparation, WAV packing, cadence and session
read models with controlled metadata/decode/media endpoints. It checks decoded
duration retention, missing metadata, read rates, cache reuse, matching native
source identity and rejected stale or unrelated sources. It does not change
playback timing or measure speaker output.

The dock fixture executes the shipped authority publisher and dock script with
controlled RAF/state/document endpoints. At r1049, 3,600 count-only publications
scheduled 3,600 geometry frames. At r1050 they schedule none. Real view, name,
target, pause, skin and visibility transitions retain reconciliation. This is
an invalidation-count regression, not a physical Android performance benchmark.

Historical fixtures retain real pointer/keyboard, audio and storage assertions.
The mini-logo fixture normalizes only the pinned, separately tested r1050 event
filter before comparing the original dock-owner hash. The startup fixture
checks current HTML SRI instead of an obsolete frozen whole-session hash.
The persistence fixture waits for the held transaction within five seconds;
it still rejects success or visible data before transaction completion.

Final controlled suite: 75/75 groups. Separate release integrity: 837/837.
Physical Android lock-screen playback, audible echo and real-device frame
durations need separate observation.
