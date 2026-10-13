# r1056 audio source and daily controls

Run the current production behavior checks from the repository root:

```sh
node tests/r1056/audio-source-model.cjs
node tests/r1056/ui-source-and-controls.cjs
node tests/r1054/automatic-touch-continuity.cjs
```

The source model keeps existing playback enums and resolves personal, generic,
device and legacy local/reader provenance separately. Checks cover preparation,
failure, native-origin authority, paused/background continuity and TR/EN labels.

The UI fixture executes the production practice summary, quick delegate,
transport branches, layout reparenting and mini source display. It checks one
command per action, local source disclosure with no audio/count command,
disabled gates, stable focused controls, late summary hydration, durable
restoration, tefekkur visibility preference and exact cadence/gap semantics.

Existing manual mini-turn and held automatic-motion tests remain part of the
full source regression runner. Tests use controlled DOM, storage and media
endpoints; they do not establish physical Android rendering or audible output.
