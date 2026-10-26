# r1128: recorded Arabic Delâil and guarded TTS recovery

The required release runner preserves all 30 inherited acceptance groups and
adds the recorded Delâil provider contract as the 31st required group. It uses
immutable r1120 commit `7b25996c9d545a3732d758136342da893bba6ed4`
as the regression reference and published r1127 commit
`a220cdf4353fb919e218ebd86240054a74b3f833` as the upgrade/rollback reference.
Missing suites, nonzero exits, incomplete evidence, changed production bytes or
changed test inputs fail acceptance. Preparing this runner and workflow is not
evidence of a completed 31-group release run.

Focused provider and inherited speech-lifecycle checks can be run separately:

```bash
node tests/r1128/delail-recorded-contract.cjs . /tmp/r1128-delail-recorded.json
node tests/r1128/delail-tts-lifecycle.cjs . /tmp/r1128-delail-lifecycle.json
```

The recorded Arabic bank contains nine unchanged original MP3s credited to
Qari Muhammad Ismail Giles: the opening Hissar and eight hizbs. Publisher
permission is conditional: distribution without payment and without altering
the files. This is not an unrestricted commercial-use or public-domain grant.
No separate closing prayer recording has been verified. The bank does not
claim an exact match to Sükûn's existing text edition or paragraph timing.

The inherited 38 speech-lifecycle checks execute the actual legacy Delâil
reader, central speech wrappers, continuity manager and modern reading runtime
with controlled native speech, clock, ownership, media-anchor and lifecycle
fixtures. They cover bounded same-sentence recovery, startup ordering, explicit
Pause/Stop and stale callbacks. Their counts and assertions remain required.

Neither provider contracts nor simulated speech fixtures establish physical
Android/Samsung lock-screen playback, uninterrupted Bluetooth output, acoustic
quality or operating-system background execution. Physical phone acceptance
has not been completed. Original MP3 playback avoids relying on Web Speech
for this optional recorded Arabic source; it does not change those limits.
