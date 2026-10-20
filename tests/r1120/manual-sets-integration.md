# r1120 manual frequency sets: implemented integration

Files owned by this change:

- assets/runtime/frequency-sets-r1120.js
- assets/runtime/frequency-sets-r1120.css
- tests/r1120/manual-sets-contract.cjs
- tests/r1120/manual-sets-results.json
- tests/r1120/manual-sets-integration.md

## Implemented host integration

- Both `index.html` and `nero.html` include the versioned CSS in the head with SRI. The asset is included in the release runtime inventory.
- The persistent `<div id="manualFrequencySetsR1120"></div>` is immediately before `#r1107PresetsBox`, outside both `#presets` and its disclosure. Legacy preset rerenders therefore do not destroy the editor, and closing the ready-preset disclosure does not hide it.
- The regular `frequency-workbench-r1120.js` script defines the audio bridge before the regular `frequency-sets-r1120.js` script loads. Both use versioned URLs and SRI. The sets module mounts when the document is ready; repeated `mount()` calls are idempotent.
- `syncFreqUI()` calls `SukunFrequencyR1120.sync()`, whose final synchronization calls `SukunFrequencySetsR1120.refreshSelection()`. The workbench also emits `sukun:frequencychange`. The sets module retains its input/change/click fallback after existing handlers and does not replace those handlers.

## Audio bridge owned by the engine

`window.SukunFrequencyR1120.capture()` returns exactly these settings, never audio nodes or playback state:

- c: number 20..18000
- b: number 0.5..40
- mode: bin / mono / iso / mix
- vol: number 0..1
- pink: boolean
- harmonik: integer 0..4
- harmSeri: dogal / tek / oktav
- uzam: boolean
- uzamHiz: number 6..60
- wave: sine / square / sawtooth / triangle
- balL, balR: numbers 0..1
- noise: off / white / pink / brown
- noiseVol: number 0..1
- filterOn: boolean
- lpf: number 200..8000
- hpf: number 20..2000
- levelProfile: legacy / balanced
- secondary: { on: boolean, c: number 20..18000, b: number 0.5..40 }

`window.SukunFrequencyR1120.apply(settings, { play: false | true })` is the shared application route. It returns `{ ok: true, playing: boolean, paused: boolean }` on success or an error result on failure; the sets module also handles thrown errors or asynchronous results. The engine is solely responsible for replacing live graphs, synchronizing UI and preserving the global pause gate. `play:false` applies settings without starting stopped/paused audio. `play:true` requests playback without clearing global pause. The module never invokes microphone, AudioContext or engine start/stop functions directly.

## Storage and behavior

The new local key is `sukun.frequencySets.v2`, with envelope `{version:2,sets:[...]}`. Maximum 100. Records contain stable id, name, optional description, all settings, and creation/update timestamps. It does not read, migrate or modify `sukun.myfreq`, microphone pitch state, journeys, export or cloud sync.

No storage write occurs at startup. Malformed/newer/over-limit data is preserved, readable records remain available, and writes are disabled rather than dropping unknown records or fields. Writes compare the last observed raw string, then read back the result. A rejected write preserves the prior data and keeps the draft; an unverifiable result is reported as uncertain rather than saved.

These are optimistic storage checks, not an atomic transaction or cross-tab lock. Observed conflicts and changes to an edited record are rejected, but two simultaneous writers can both pass the comparison and race. Read-back verification does not remove that race. The visible TR/EN introduction explicitly warns users not to edit sets in multiple tabs at the same time. The controlled fixtures verify detected conflicts, not simultaneous-writer exclusion.

Duplicate opens a separate draft only after confirmation. Delete confirms the exact set. Cancel and Save do not apply playback settings. Name/description limits validate rather than silently truncating pasted content.

The view uses native DOM elements/textContent only; no names or descriptions are interpreted as HTML. All controls are native labeled form controls. Status and selected/modified text are live regions. Responsive styling includes single-column small-screen forms, wrapping actions, and 44 px button targets. The `sukun:languagechange` listener retains draft content while translating labels.

## Verification

Run `node tests/r1120/manual-sets-contract.cjs`. The controlled suite contains 19 checks and uses an independent source/VM DOM/storage/audio-bridge fixture. It does not establish browser rendering, acoustic, physical-device or screen-reader acceptance. The current release run is recorded in `evidence/manual-sets-contract.json`; the module-local result is `manual-sets-results.json`. See `README.md` for the separate native-browser suites and remaining device tests.
