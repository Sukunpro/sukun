# r1079 protective sequence accordion

The protective form now uses one full-width heading button. Each contemplation entry folds it into a compact strip; explicit reopening is allowed in contemplation. The normal-screen choice is stored separately and restored on exit. Form nodes, draft values and the prepared queue remain in place.

`protective-plan-accordion-browser.cjs` covers 30 cases in Classic/Feyz at 320 and 390 CSS pixels, in Turkish and English. Trusted clicks exercise the whole heading, title and edge; keyboard Space and Enter exercise the same accessible button. Actual contemplation controls cover entry, exit and repeated entry. A separately labelled focus-class fixture covers the legacy focus-only presentation policy. Tests compare the prepared draft and transport before and after presentation changes, and check persistence across reload.

`protective-plan-playing-browser.cjs` separately exercises the accordion while the existing smart player is playing shipped native Ayat al-Kursi audio. It observes the real media clock and source without replacing native playback behavior.

```sh
node tests/r1079/protective-plan-accordion-browser.cjs . /tmp/r1079-accordion.json
node tests/r1079/protective-plan-playing-browser.cjs . /tmp/r1079-playing.json
node tests/r1078/protective-plan-browser.cjs . /tmp/r1079-prior-plan.json
python3 tests/r1049/run-regressions.py --static-only --output-dir /tmp/r1079-static
python3 tests/r1049/run-regressions.py --output-dir /tmp/r1079-regressions
```

All browser runs use isolated profiles and exact served production bytes. No physical Android locking, Samsung/Firefox/Safari execution or audible-output judgement is claimed. The two r1079 browser suites are run separately from source-only regressions. See verification.json for the final build results.
