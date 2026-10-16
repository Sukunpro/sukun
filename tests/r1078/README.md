# r1078 protective readings

These suites exercise the existing reading, dhikr and smart-session owners. Case counts describe coverage; use each generated report and exit status for the result of a particular build.

| Suite | Cases | Scope |
| --- | ---: | --- |
| `protective-plan-browser.cjs` | 34 | Classic/Feyz at 320 and 390 CSS pixels; Turkish/English form, one-time entry offer, stable focused inputs, validation, requested order/counts, optional inclusion, explicit Start, and cancellation of an active reader during Prepare. |
| `protective-smart-progress-browser.cjs` | 5 | A two-step protective smart queue with three-second generated recordings; finite target projection, actual native completion credit, easy-control Pause/Resume, next-step reset, and Finish without revival. |
| `protective-plan-persistence.cjs` | 6 | Production journal round trip, confirmed-count restoration, scoped plan marker and step identity, legacy identity compatibility, and rejection of invalid progress. |
| `manual-reading-loop-browser.cjs` | 12 | Native manual reading ownership, matching wheel controls, target-driven finite/unlimited loops, selection cancellation, unrelated-audio preservation, and delayed cleanup. |
| `reader-resume-permit.cjs` | 21 | Production authority closures: exact paused-reader renewal and explicit native-lease retirement, with rejection of stale or unrelated attempts. |

Run from the repository root. Browser suites share `tests/r1064/browser-fixture.cjs`; make Playwright available to Node and set `CHROMIUM_PATH` when the default fixture executable is unavailable.

```sh
node tests/r1078/protective-plan-browser.cjs . /tmp/r1078-protective-plan.json
node tests/r1078/protective-smart-progress-browser.cjs . /tmp/r1078-protective-smart-progress.json
node tests/r1078/protective-plan-persistence.cjs . > /tmp/r1078-protective-plan-persistence.json
node tests/r1078/manual-reading-loop-browser.cjs . /tmp/r1078-manual-reading-loop.json
node tests/r1078/reader-resume-permit.cjs . > /tmp/r1078-reader-resume-permit.json
```

Browser tests use disposable local profiles and serve production files. The plan suite reports whether it temporarily injected an unlinked runtime for development; release verification must report `temporaryRuntimeInjection: false`. Generated short WAVs are transport fixtures, never substitutes claimed to contain a recitation. The smart-progress fixture leaves enough source time for trusted UI clicks, then holds Pause and Finish longer than a complete source duration. Native playback events and clocks remain real; device TTS is controlled by the shared fixture. Persistence/authority suites use the actual production code with isolated storage or bounded external leaves, so they do not prove native playback.

Physical Android locking, audible output, real-device gesture permissions, and Samsung/Firefox/Safari behavior are outside these suites. See [audio-README.md](audio-README.md) for manual-audio ownership and authority details.
