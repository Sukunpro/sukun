# r1077 protective audio and browser contrast

Automatic protective dhikr now resolves the same immutable bundled Arabic
recording as the reading player. An unknown preliminary duration is verified
against the persistent native player's actual metadata before a counter is
admitted. An accepted original is reused across Pause/Resume while its source
identity, preferences, revision and effects signature remain current. Kalem
has no invented bundled mapping; explicit source modes retain their policy.

The first contrast stylesheet paints the brand with solid glyph colours and
adds bounded dark scrims to explanatory text. It declares the app's existing
dark scheme before rendering, supports reduced transparency and keeps the
operating system's forced-colour palette. It does not try to detect or disable
Samsung's proprietary Force Dark mode.

Final release checks: 121/121 source regression groups; 1,277/1,277 release
integrity assertions; 7/7 native protective cases; 28/28 contrast and native
interaction checks; 28/28 selected-theme checks; 44/44 compact-frame checks.
The contrast suite includes raster glyph evidence, 320/390 px light/dark
preferences, conservative local scrim-over-white contrast (6.12:1), Chromium
auto-dark emulation and OS forced-colours. See `verification.json` and
`audio-README.md` for scope and limitations.

Run from the repository root:

```sh
node tests/r1077/protective-bundle-priority.cjs .
node tests/r1077/protective-native-metadata-browser.cjs . /tmp/r1077-audio.json
node tests/r1077/browser-contrast.cjs . /tmp/r1077-contrast.json
node tests/r1074/selection-theme-browser.cjs . /tmp/r1077-theme.json
node tests/r1075/reading-summary-browser.cjs . /tmp/r1077-frames.json
python3 tests/r1049/run-regressions.py --output-dir /tmp/r1077-regressions
python3 tests/r1049/run-regressions.py --static-only --output-dir /tmp/r1077-static
```

Browser checks use isolated native Linux Chromium and production files served
byte-for-byte. Physical Android locks, audible output, native user-gesture
restrictions, Samsung Internet, Firefox and Safari are outside this environment.
