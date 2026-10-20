# Remaining physical-device acceptance

Status: **NOT RUN**. Linux Chromium evidence cannot close these gates. Run only
on the exact reviewed build with the device owner's permission. Do not install
this unpublished candidate over a personal PWA or change live production merely
to complete this checklist. Existing recordings must not be overwritten, moved,
exported, deleted or restored during acceptance.

## Record the environment

- Exact build and shell hash; device model, Android version, browser/PWA version.
- Browser tab versus installed PWA, speaker/headphones/Bluetooth route.
- Microphone and notification permission state. Do not silently grant new access.
- Record the observed outcome for each case, not only that a control was tapped.

## Bounded cases

1. Open recording/backup, visible scene/Name explanations and ambience group
   information. Check Turkish/English, normal/large system text and keyboard or
   accessibility focus where supported. Preserve the known inherited translation
   limitations; do not confuse a hidden retired panel with exercised UI.
2. Start a known public bundled recording. Open/close disclosures, change tabs,
   pause/resume and Stop. Listen for clipping, duplicate playback, unintended
   restarts or loss of the selected source. Repeat while the mic-note preference
   is changed and reloaded. No microphone request should occur for these actions.
3. During public bundled playback, lock/unlock and background/foreground the app;
   record continuity or the documented paused state, elapsed time, counter and
   actual owner after return. Repeat with an explicit Stop before backgrounding
   and confirm no delayed restart. Keep a normal safe listening level.
4. Connect/disconnect an already authorized Bluetooth route and observe media
   controls and focus when another ordinary audio app takes/releases playback.
   Do not change system security settings or create new device access merely
   for this test. Record route, audible result and whether Stop remains final.
5. Only after explicit microphone permission, create a clearly tagged disposable
   test recording in an agreed isolated test profile. Verify record/stop/play and
   its priority over TTS without altering existing recordings. If no isolated
   profile is available, leave this case pending rather than risk personal data.

## Closeout

For each case record PASS / FAIL / NOT RUN, exact steps, expected and observed
behavior, repeat count and any screenshot or non-sensitive diagnostic. Failures
need reproduction before changing unrelated application logic. A completed
checklist does not authorize publication; exact-commit CI/Pages and live-byte
validation are separate release gates. The final G8 completion decision must
state the accepted bounded scope, not a fabricated percentage of all inline code.
