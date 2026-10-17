# r1082 session experience

The focused suites exercise the production engine and shared editor. The browser
fixtures use isolated profiles and generated two-second PCM tones solely to test
transport completion. They do not contain or validate recitation content.

| Suite | Scope |
| --- | --- |
| `engine-logic.cjs` | Extracted production engine functions, explicit clock and resolver leaves: failure fences, identity, edits, conditional progress, budgets and zero configured waits. |
| `engine-journal.cjs` | Production journal schema, durable checkpoints, legacy identities, strict validation and recovery. |
| `engine-projection.cjs` | Canonical fixed/conditional targets, real completed counts and timer projections. |
| `ui-template-contracts.cjs` | Shared-editor routing, protection-template migration and source/mode controls. |
| `session-engine-browser.js` | Native media: exact seven reads, tagged and ordinary queues, pause/edit, completed counts, timed pause, zero stored gap, retry/skip and stable step identity. |
| `session-polish-browser.js` | Exact final shell: single-line TR/EN stage names at 320 pixels, in-flight native duration countdown, one active contemplation strip and direct-mode compatibility. |
| `session-ui-browser.js` | Classic/Feyz at 320×740, 390×844 and 430×900; TR/EN labels, templates, modes, input stability, accepted source, glow, reduced motion and contemplation. Includes an explicit editor-only 200% computed-font-size fixture at 390 pixels. |

```sh
NODE_PATH=/path/to/node_modules CHROMIUM_PATH=/path/to/official/headless_shell \
  node tests/r1082/session-engine-browser.js . /tmp/r1082-engine.json
NODE_PATH=/path/to/node_modules CHROMIUM_PATH=/path/to/official/headless_shell \
  node tests/r1082/session-ui-browser.js . /tmp/r1082-ui.json
```

Browser suites serve `nero.html` and its referenced production files unchanged.
Final verification must have no temporary module/style injection, missing local
asset, JavaScript exception or shell/module integrity mismatch. Every result JSON
includes case evidence and source hashes; use the actual report and process exit
status for the result of a given build.

Native end-to-next-play intervals include source resolution, decoding and browser
scheduling. The native gap case proves that the user's zero choice remains zero
and its reads complete; the extracted engine suite checks that zero never falls
back to an artificial 600 ms wait. No gapless-audio guarantee is claimed.

Physical Samsung Internet, Android screen locking, audible output quality,
real-device autoplay constraints and browser default-font settings are outside
these suites. The 200% fixture deliberately doubles computed font sizes in the
editor and does not pretend to be an Android text-scale measurement.
