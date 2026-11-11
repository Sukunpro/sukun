# r1247 — Background journey interruption recovery

A background native-media pause in r1246 was followed by an audio error, a fabricated Complete intent, and a Stop. This release preserves the unfinished journey and its repetition count, grants the existing native owner one bounded recovery after an observed loop-boundary seek, and prevents older recovery controllers from opening a competing caller while that owner is interrupted.

The journey watchdog also samples the actual media cursor when `timeupdate` is delayed. A moving cursor can retain the same recording; an unchanged cursor still expires. The probe never credits repetitions. If a whole number of native loops returns the cursor to the same position, a matching active loop receives one short follow-up observation before timeout; an unchanged cursor then expires. Native loop events remain the stronger progress evidence. Repeated same-phase observations under complete OS timer/event throttling cannot reliably distinguish playback from a stall. Explicit Pause, Stop, source replacement and tab ownership changes retain priority.

An eligible loop-boundary pause retains its exact evidence for up to eight seconds of delayed callback delivery. Live source, caller, visibility and user-intent checks still run immediately before replay; a second pause or source change invalidates the pending evidence. The short lock-transition window remains unchanged.

Health history now retains native interruptions and source-error transitions after the session becomes idle, without retaining recording contents or media URLs.

Run the non-browser `*.cjs` files in this directory with Node. Browser suites require the pinned Playwright/Chromium environment declared by the workflow. The workflow additionally runs existing lock-transition, recording-authority, journey-lifecycle and release-integrity suites, followed by the full app's Chromium native-media regression suite.

These tests do not establish physical Samsung screen-lock, Bluetooth routing or subjective audibility. The original report did not identify the first native pause's hardware/OS cause; it did demonstrate the later interruption-to-idle failure. No personal recordings or uploaded device report are included in this repository change.
