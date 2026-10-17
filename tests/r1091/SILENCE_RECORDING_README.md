# Sükût announcement recording regression

The r1090 exact application allowed a second announcement Record tap while
microphone permission was still pending. Two controlled permission resolutions
created two live recorders and streams; Finish only stopped the latest one, and
pagehide left the earlier capture alive. Baseline evidence is retained outside the
repository in the task QA directory. This was not a physical microphone test.

The r1091 change gives this existing recorder one cancellable attempt, takes the
existing tab-owner maintenance lease before requesting microphone permission, and
holds it through capture and the guarded recording commit. Late permission,
pagehide, freeze and changed lease callbacks cannot save or revive an abandoned
attempt. Permission and stop waiting have bounded timeouts. Existing announcement
controls refresh after commit; failed storage reads keep their last-known state
and older refresh results cannot override newer results.

Run the controlled lifecycle suite:

```sh
node tests/r1091/silence-recording.cjs
```

This extracts the unchanged production lifecycle and control-refresh functions.
Permission, MediaRecorder callbacks, owner admission, write completion and the two
timeout seams are controlled explicitly. It verifies cancellation, exact single
commit, lease lifetime, stream cleanup, local competing recording admission,
late callback isolation and unavailable/stale UI reads. It does not measure actual
microphone recording quality, audible output or physical OS screen locking.

Run the native integration after all application bytes and metadata are frozen:

```sh
node tests/r1091/silence-recording-browser.js /absolute/repository/path /tmp/silence-recording-browser.json
```

The integration serves the exact production application at Classic/Feyz in a
disposable Chromium origin. Microphone permission and MediaRecorder remain
labelled doubles, emitting test bytes that are stored and inspected without being
played. Web Locks, shared IndexedDB admission, actual storage transactions, public
record buttons and existing DOM updates are real. It verifies pending-tap
cancellation, successful save controls without a rerender, preservation of prior
bytes on pagehide, blocked cross-tab permission, and an explicit retry after the
other native owner releases. Both pages' JavaScript errors and every served file's
SHA-256 are checked against the frozen source. No real user profile or recordings
are loaded.
