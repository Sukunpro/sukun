# r1227: balanced controls, framed screensaver and silent count entry

Builds on r1226 candidate 7e153664, retaining mobile navigation and current-version regression coverage. Presentation changes include a 24px information face inside its original 44px touch target, removal of duplicate inactive-player bottom reserve, and both-theme screensaver frames/return-control paint.

Run source validation with `python3 tests/r1213/run-current-checks.py --scope node --output /tmp/fresh-r1227-node`. New visual checks are `node tests/r1227/info-footer.cjs "$PWD" /tmp/r1227-info-footer` and `node tests/r1227/saver-frames.cjs "$PWD" /tmp/r1227-saver`, with Playwright and `CHROMIUM_PATH` installed. Both record source hashes, real computed geometry, screenshots and explicit expected checks. Run `node tests/r1227/direct-count.cjs` for the native correction-owner contract and `node tests/r1227/direct-count-browser.cjs "$PWD" /tmp/r1227-direct-count` for real UI, persistence and audio-request checks.

Silent count entry uses the native correction and journey owners, not synthetic repeats or audio feedback. The compact editor closes after Save/Cancel and hides with easy controls. Invalid, stale, or unsafe active-session edits are rejected.

Other mandatory workflows retain current native upgrade/offline, navigation, atlas, settings, keyboard and audio lifecycle acceptance.

Local native Chromium cannot launch because this environment rejects its process-singleton socket. CI runs the native browser checks against the exact published candidate SHA. Physical phone, TalkBack, Bluetooth, microphone acoustics and lock-screen acceptance are not claimed.
