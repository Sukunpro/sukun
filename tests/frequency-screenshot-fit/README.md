# Frequency card and Berhetiyye material repair

The seven supplied screen photographs show content over the inward-painted
nine-slice bevels on breathing and library cards and native selects. Guided
session cards, frequency shortcuts and saved routines also lacked the active
Berhetiyye material. The repair keeps all audio, breathing timing, frequency
values and routine playback owners unchanged.

- Cards use fixed 14px/34px bevels and larger 20px/38px text gutters, centered
  content, natural height and a container-sized responsive grid.
- Native model/quality values are concise; their label and complete explanatory
  notes retain the meaning. Signal options, option values and change handlers
  remain intact. Neutral wrappers preserve the original non-Berhet layout.
- Missing controls use existing sapphire/emerald artwork, with system-color
  fallbacks. Guided cards gain Enter/Space activation and focus return.
- No reference photo or generated screenshot is part of the deployment graph.

## Run

- `node tests/frequency-screenshot-fit/contract.cjs`
- `CHROMIUM_PATH=/path/to/chromium node tests/frequency-screenshot-fit/browser.cjs "$PWD" /absolute/output/report.json`
- `python3 tests/r1213/run-current-checks.py --scope node --output /absolute/fresh/output`
- Before release: full current gate plus immediate-previous upgrade/offline/
  rollback. The new source and native suites are registered in that gate.

The browser suite defines 148 checks for Turkish/English, normal/forced colors,
320/393/720/1280 widths, repeated guided-card open/close, breath selection,
waveform/FFT hidden state, native selected-value text width, long routine names
and separate 44px delete targets, then a return to Esma. It fails on missing
checks, page errors, SRI errors or source drift. It is not physical Android,
screen-reader, enlarged-text or acoustic acceptance.

## Local acceptance boundary

Source contracts pass. Chromium cannot launch in this executor because its
Unix socket creation returns EPERM, including the approved escalation attempt.
The native suite produced zero executed checks and a launch-failure report;
there is no rendered visual pass. Native waveform-label fit at 320px is an
explicit pending check, not a claimed fix beyond the supplied default view.

This work starts from c825233b45b955dc259e53755df84d879469a106 (r1237) in an
isolated local branch. Regenerated r1237 hashes are only for local source
validation. They must NOT be published as another r1237. Integrate source
changes on the final r1238 successor, assign its fresh build/cache identity,
regenerate metadata/SRI and repeat all release gates. No merge or deployment
is authorized by this candidate.
