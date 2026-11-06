# r1227: balanced controls, framed screensaver and silent remaining entry and current timing

Builds on r1226 candidate 7e153664, retaining mobile navigation and current-version regression coverage. Presentation changes include a 24px information face inside its original 44px touch target, removal of duplicate inactive-player bottom reserve, and both-theme screensaver frames/return-control paint.

Run source validation with `python3 tests/r1213/run-current-checks.py --scope node --output /tmp/fresh-r1227-node`. New visual checks are `node tests/r1227/info-footer.cjs "$PWD" /tmp/r1227-info-footer` and `node tests/r1227/saver-frames.cjs "$PWD" /tmp/r1227-saver`, with Playwright and `CHROMIUM_PATH` installed. Both record source hashes, real computed geometry, screenshots and explicit expected checks. Run `node tests/r1227/direct-count.cjs` for the native correction-owner contract and `node tests/r1227/direct-count-browser.cjs "$PWD" /tmp/r1227-direct-count` for real UI, persistence and audio-request checks.

Silent remaining entry uses the native correction and journey owners, not synthetic repeats or audio feedback. The existing Kalan value opens the editor. Remaining converts to current count without changing the target. The editor closes after Save/Cancel; transient Undo is snapshot-bound and hides with easy controls. Invalid, stale, or unsafe active-session edits are rejected.

Other mandatory workflows retain current native upgrade/offline, navigation, atlas, settings, keyboard and audio lifecycle acceptance.

Local native Chromium cannot launch because this environment rejects its process-singleton socket. CI runs the native browser checks against the exact published candidate SHA. Physical phone, TalkBack, Bluetooth, microphone acoustics and lock-screen acceptance are not claimed.

Current timing uses only native source matches: Esmâ hour/day/vakit and Berhetiyye fixed calendar ranges. There is no new weekly or full-month assignment. The seal is stable, caption appears for four seconds per minute while visible, and hover/focus/touch reveals actual matches immediately. Run `node tests/r1227/current-timing.cjs` and `node tests/r1227/current-timing-browser.cjs "$PWD" /tmp/r1227-current-timing`.

`tests/r1227/completion-haptics.cjs` checks existing optional vibration preferences and verified manual-voice target completion, without extra tick sound. Device vibration is simulated, not physically verified. Reduced-motion changes reconcile immediately; `tests/r1215/cinematic.cjs` includes a lost queued-frame regression.
