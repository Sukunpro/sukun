# r1015 recording and terminal-input regression tests

Run from the repository root with Node.js:

```sh
node tests/recording-storage.cjs
node tests/interaction_gate_lifecycle.cjs
node tests/tekke_finish_lifecycle.cjs
node tests/owner-stop-storage.cjs
node tests/recording_unavailable_contract.cjs
```

The tests extract shipped production functions. They use synthetic recording bytes, controlled IndexedDB/Web Lock events, DOM/media endpoints and clocks. They never load personal recordings. The owner fixture is in `tests/helpers/tab-owner-origin.cjs`.

## Confirmed regressions

- One shared, bounded recording database open; an unexpectedly closed handle is invalidated. A read retries once only if transaction creation throws `InvalidStateError`; no write is replayed
- Ownership storage reconnects under the same atomic claim rules. Security failures and active peer reservations remain blocking
- Finish cancels pending starts and stops the current scene without opening ownership storage. A real checkpoint is discarded once, only while already owned; an unowned checkpoint is retained
- Dismissed/canceled/duplicate asynchronous errors cannot reopen a stale warning. A fresh explicit attempt can show its current result
- Recording read failure is unavailable/unknown, never proof of zero clips. Tekke retains known rows and stops a failed set load before TTS, audio, or progress credit; confirmed absence retains the existing fallback
- Window focus loss releases abandoned input contacts while uninterrupted gestures continue to defer layout

## Final verification

- New regressions: 84/84 across the five scripts above
- Existing release-package aggregate: 705/705 controlled scenarios
- Release checks: 150/150; 45 runtime hashes and HTML integrity tags agree; 279 active JavaScript bodies parse
- `index.html` and `nero.html` are identical
- Original static art, database names/schema, stored recording bytes, audio timing, tempo and counters are preserved
- r1015 HTML, manifest, latest/build markers, service worker cache identity and required runtime hashes are consistent

The existing package's legacy read harness was adapted to load the shared read helper and model transaction completion. Release assertions use the declared build identity. Scenario intents were retained.

These are controlled source-level checks, not physical Android, browser compositor, microphone, audible playback or actual-phone recording-recovery tests. The intermittent entry zoom issue was not reproduced and is not claimed fixed. The patch does not restore or import any recording data.
