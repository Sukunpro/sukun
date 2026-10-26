# r1127: Delâil TTS background recovery

Run the focused lifecycle checks against the candidate source:

```bash
node tests/r1127/delail-tts-lifecycle.cjs . /tmp/r1127-delail-lifecycle.json
```

The 38 checks execute the shipped legacy Delâil reader, central TTS wrappers,
continuity manager and modern reading runtime in controlled VM fixtures. They
cover media-anchor startup ordering, proactive resume with a false native pause
flag, screen navigation, hidden same-sentence recovery, Page Lifecycle resume,
bounded platform failures, explicit Pause/Stop, stale callbacks and competing
ownership. Fresh legacy starts after an older global Stop/Pause are covered, and automatic
chapter handoffs cannot clear a later global pause. The r1126 suite is retained
unchanged as historical evidence.

Native speech, media-anchor acceptance, lifecycle delivery and time are simulated.
These checks cannot establish that an Android or Samsung speech engine keeps
audible output running under real screen lock, that the operating system grants
background execution, or that Bluetooth audio remains uninterrupted. Real-device
acceptance remains necessary; this folder is not a full release acceptance run.

The inherited full acceptance runner retains all 30 required groups, with r1120
as the immutable regression reference and published r1126 commit
`559b7eefcfcd9f8e318acf15fe41a198b77c1323` as the upgrade/rollback reference.
Only the focused lifecycle checks are run during this fix; preparing the runner
and workflow does not constitute a completed 30-group acceptance run.
