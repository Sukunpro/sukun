# r1052 native recording block and media clock regression checks

Run from the repository root:

```sh
node tests/r1052/native-repeat-block.cjs
node tests/r1052/media-clock-authority.cjs
node tests/r1052/health-media-evidence.cjs
```

The fixtures execute the production PCM packer, observed-media accumulator and
target authority. Separate media position and wall clocks cover delayed hidden
samples, duplicate settlement, loops, waiting, pause/resume, source replacement,
intentional/missed seeks, target surplus and terminal Stop. Byte comparisons
verify that the baked stereo effects are preserved across packed repetitions.
The passive health collector check retains zero volume, mute and finite native
clock metadata while excluding unknown values, user text and recording URLs.
It also verifies that those allowed fields survive a local checkpoint round trip.

These are controlled production-source checks. They do not demonstrate physical
Android lock playback, audible effects or uninterrupted playback through a
browser/operating-system audio-focus interruption. A minute-long native block
reduces short-loop scheduling dependence; wholly unobserved block loops remain
unknown and are never inferred from wall time.
