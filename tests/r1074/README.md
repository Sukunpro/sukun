# r1074 selected-theme and pause checks

The canonical selected dhikr family controls the background, menu and shared
player theme across tabs. Ambience ownership and navigation do not choose a
second family. Esma restores its saved scene; Berhetiyye remains selected after
local Pause and Finish.

Run from the repository root:

```sh
node tests/r1074/session-holds.cjs .
node tests/r1074/selection-theme-browser.cjs . /tmp/sukun-r1074-selection.json
node tests/r1074/ambience-local-browser.cjs . /tmp/sukun-r1074-ambience.json
python3 tests/r1049/run-regressions.py --output-dir /tmp/sukun-r1074-regressions
python3 tests/r1049/run-regressions.py --static-only --output-dir /tmp/sukun-r1074-static
```

Final candidate verification: 20/20 source-level pause checks; 27/27 native
Chromium selection/global-pause checks; 12/12 native Chromium local-pause and
actual Serce ambience checks; 1,270/1,270 release-integrity assertions.
The existing historical intro-cache test also passes after correcting the
release marker's predecessor to r1072. The test was not weakened.

The browser fixtures use isolated Classic/Feyz profiles and generated personal
WAV input, actual HTML media clocks and the production Web Audio frequency or
ambience providers. They verify exact served bytes and absence of JS/SRI or
missing-file failures. Device speech is controlled and must not replace the
personal input. Service workers are blocked in these browser fixtures; current
and historical cache behavior is checked separately by source fixtures.
Physical Android screen locking and audible output are outside these checks.
