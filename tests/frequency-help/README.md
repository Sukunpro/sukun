# Frequency explanation and localization audit

Source-only candidate based on r1239 / 51a2977. Not published or approved for release.

## Inventory

- Mode, carrier, beat, beat-band and solfeggio chips: existing bilingual Q_HINTS retained. Native question buttons now have localized accessible names, expanded state, live language switching and Escape/focus return. The beat slider no longer creates a duplicate question button.
- Frequency volume and start/stop: existing tooltip retained; volume also references the level-profile explanation.
- Waveform and FM/AM/RM/PWM: existing bilingual inline explanations retained, not copied.
- Left/right levels: new shared explanation of channel attenuation, zero, binaural separation and which independent sources bypass the controls.
- Additional noise and noise level: new explanation of white/pink/brown textures, the necessary nonzero level and playback, and distinction from the separate pink cushion.
- Frequency filter switch, low-pass and high-pass: new explanation of cutoff direction, gradual attenuation, 80/2000 Hz example, quiet/reversed ranges, bypass and exact signal scope.
- Level profile: new explanation of opt-in gain, at most 2× amplitude, dense-mix headroom and the difference between gain and perceived loudness.
- Octave up/down: new explanation of half/double carrier, unchanged beat, supported limits and cancellation of an ongoing journey/sweep without starting stopped audio.
- Harmonic count and natural/odd/octave series: new explanation with the actual 2/3/4/5, 3/5/7/9 and 2/4/8/16 ratios and out-of-range muting. Existing overview retained.
- Spatial rotation and turn duration: existing overview and slider tooltip retained; no duplicated explanation.
- Pink cushion: existing help corrected. Pink noise has approximately equal energy per octave, not decreasing energy per octave. The independent pink cushion is not beat-modulated by this code; the unqualified speaker/beat-clarity claim was removed from its label and tooltip. TR/EN agree.
- Steady light and intensity: existing safety explanation retained; missing English translation for the steady-light tooltip added.
- Manual frequency sets and draft editor: existing save/load/play/no-microphone explanations retained. Relevant editor inputs reference existing tool-help paragraphs rather than duplicating panels or moving the main controls.
- Ready-made presets: existing bilingual explanation retained, including fixed Astral preset effects and preserved volume.
- Journey editor: existing bilingual overview and add/start tips retained.
- Second layer: existing bilingual overview retained.
- Ledün Lab: existing bilingual microphone/pitch-estimation explanation retained.
- Signal spectrum/waveform: existing measurement limitations retained; new explanation of FFT vs time view and 5/20/50 ms window.
- Suggestions: new explanation of local preset matching, settings-only vs already-playing behavior and no diagnosis/guaranteed outcome.
- Frequency timer: existing ownership/pause/lock note retained; new fade-duration, stopped-playback, Cancel vs Stop explanation.
- Sweep: new explanation of carrier range, duration, linear/log scale, unchanged beat, loop and stop behavior.
- Library: existing bilingual tap/play/pause behavior note retained.
- Cymatics: existing bilingual model, measurement limitations, quality, silence and reduced-motion descriptions retained. No duplicate help added.
- Breathing: existing rhythm-card descriptions retained; new control/voice guide and comfort caution.
- Guided session: existing script descriptions retained; new playback, step, pause/restart, exit, voice, rate and visual-style explanation. This does not translate or replace the spoken script itself.

All 12 new help topics have explicit Turkish and English text and use one shared native details/summary implementation. Existing wave/effect/binaural topics remain single instances. New help controls are at least 44px high, wrap at narrow widths, use focus outlines and forced-color system colors. Opening help does not change sound settings or storage.

## Checks

Run from repository root:

    node tests/frequency-help/contract.cjs
    CHROMIUM_PATH=/usr/bin/chromium node tests/frequency-help/browser.cjs . /tmp/frequency-help.json
    python3 tests/r1213/run-current-checks.py --scope source --output /tmp/frequency-help-source

The source test expects exactly 21 checks. A connected-tree DOM fixture also executes the real production mount, verifies all 13 expected description relationships and row placement, and checks repeated mount/language changes. Detached IDs are invisible to document lookup, so the original mount-order bug fails this regression. The native test expects exactly 56 checks across Berhetiyye and Esmâ, TR and EN, 320/393/1280px, forced colors, Enter/Space/Escape, repeated navigation, a native touch profile and draft description references. It fails on a missing browser, changed source or test bytes, missing checks, SRI/page errors or any assertion. It is included in the current release gate.

Local native execution is blocked by this environment's socket restriction before Chromium can launch. An escalation attempt encountered the same runtime restriction. The test is prepared but has **not passed** here. A browser file-URL preview is also unsupported. Run the mandatory CI browser gate before release, then inspect the screenshots/layout. No physical Android, screen-reader or audible-audio result is claimed.

Metadata must be regenerated for the integration release; source edits invalidate the old build marker and manifest hashes. This source patch does not publish, merge or deploy anything.
